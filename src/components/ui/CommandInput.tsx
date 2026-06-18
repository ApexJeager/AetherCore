import React, { useState } from 'react';
import { useStore, useChatStore } from '../../lib/store';
import { motion } from 'motion/react';
import { Terminal, Send, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const CommandInput = () => {
  const [query, setQuery] = useState('');
  const state = useStore((state) => state);
  const { messages, addMessage, setLatestSchema } = useChatStore((state) => state);
  const { codeString, setIsAnalyzing, setJudgment, isAnalyzing, nimApiKey } = state;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    const startTime = Date.now();

    // Add user message to history
    addMessage({ role: 'user', content: query });

    try {
      const response = await fetch('/api/nim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeString,
          query,
          nimKey: nimApiKey,
          history: [...messages, { role: 'user', content: query }]
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to reach Agent engine.");
      }
      
      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      setJudgment({ ...data, latencyMs });

      if (data.structuralSchema) {
        setLatestSchema(data.structuralSchema);
      }

      // Add assistant summary to history
      if (data.summary) {
        addMessage({ role: 'assistant', content: data.summary });
      }

      setQuery('');
    } catch (err) {
      console.error(err);
      // Fallback judgment for demo if API fails
      setJudgment({
        issues: [{
          description: "API Connection Failed. Please check the backend configuration or API keys.",
          severity: "critical",
          lineNumbers: [0],
          solutionCode: "// Error connecting to Agent Reasoning Engine"
        }],
        performanceScore: 0,
        summary: "Execution halted."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-10 bottom-8 mt-12">
      <form onSubmit={handleAnalyze} className="relative flex items-center">
        <div className="absolute left-4 text-accent-blue/70">
          <Terminal size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Command the Nexus (e.g. 'Build a modern expense tracker' or 'Audit this for memory leaks')"
          className={cn(
            "w-full bg-[#ffffff05] border border-glass-border rounded-full py-4 pl-12 pr-16",
            "text-text-main placeholder-text-muted focus:outline-none focus:border-accent-blue/50",
            "transition-all duration-300 font-mono text-sm shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
            "backdrop-blur-md"
          )}
          disabled={isAnalyzing}
        />
        <button
          type="submit"
          disabled={isAnalyzing || !query.trim()}
          className="absolute right-2 p-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded-full transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};
