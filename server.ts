import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  if (!process.env.NVIDIA_NIM_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: Missing required API keys. Please provide NVIDIA_NIM_API_KEY or GEMINI_API_KEY in your .env file.");
    process.exit(1);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for NIM (NVIDIA Inference Microservices) or fallback to Gemini
  app.post('/api/nim', async (req, res) => {
    try {
      const { code, query, nimKey: clientNimKey, history = [] } = req.body;
      const prompt = `You are a sophisticated AI agent capable of BOTH building new applications from scratch AND auditing/fixing existing code. 
      
      User request: "${query}"
      
      If the user wants a new application built, output the complete foundational code as the 'solutionCode' in a single issue, with a description of what you built.
      If the user wants to audit or fix existing code, analyze the provided code and provide specific issues with line numbers and refactoring solutions.
      
      Output a strict JSON Judgment block.
      JSON structure: { "type": "build" | "fix", "issues": [{ "description": string, "severity": "low"|"medium"|"critical", "lineNumbers": number[], "solutionCode": string }], "performanceScore": number, "summary": string }

      Current Code context:
      ${code}
      `;

      // Use either the client-provided key or the environment variable
      const nimKey = clientNimKey || process.env.NVIDIA_NIM_API_KEY;
      let nimSuccess = false;
      
      if (nimKey) {
        // Use NVIDIA NIM with the nemotron-3-ultra model
        try {
          const openai = new OpenAI({
            baseURL: "https://integrate.api.nvidia.com/v1",
            apiKey: nimKey
          });

          const completion = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-ultra-550b-a55b",
            messages: [
              ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
              { role: "user", content: prompt }
            ],
            temperature: 0.2, // lowered from 1 for more deterministic JSON
            top_p: 0.95,
            max_tokens: 4096, // lowered from 16384 for faster JSON layout
            // @ts-ignore - OpenAI type might not have extra_body mapping perfectly for nemotron
            extra_body: {
              chat_template_kwargs: { enable_thinking: true },
              reasoning_budget: 2048
            }
          });

          const content = completion.choices[0]?.message?.content || '{}';
          const reasoningContent = (completion.choices[0]?.message as any)?.reasoning_content || '';
          
          let parsedStr = content.trim();
          if (parsedStr.includes("```json")) {
            parsedStr = parsedStr.split("```json")[1].split("```")[0];
          } else if (parsedStr.includes("```")) {
            parsedStr = parsedStr.split("```")[1].split("```")[0];
          }

          const parsedData = JSON.parse(parsedStr.trim());
          if (reasoningContent) {
            parsedData.reasoningContent = reasoningContent;
          }

          nimSuccess = true;
          return res.json(parsedData);
        } catch (e: any) {
          console.error("NIM fetch error, falling back to Gemini: ", e);
        }
      }
      
      if (!nimSuccess) {
        // Fallback to Gemini
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          return res.status(500).json({ error: 'Missing both NVIDIA_NIM_API_KEY and GEMINI_API_KEY environment variables.' });
        }
        
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-pro',
          contents: [
            ...history.map((msg: any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: prompt }] }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });
        return res.json(JSON.parse(response.text || '{}'));
      }
    } catch (err: any) {
      console.error("Agent Engine Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
