import React, { useEffect, useRef, useState } from 'react';
import { Scene } from './components/canvas/Scene';
import { CommandInput } from './components/ui/CommandInput';
import { BentoCard } from './components/ui/BentoCard';
import { useStore } from './lib/store';
import { ShieldAlert, ShieldCheck, Cpu, Code2, Layers, Copy, Check, Download, RefreshCw, Loader2, Settings, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-tomorrow.css'; // Add a basic dark theme
import { jsPDF } from 'jspdf';

const DownloadButton = ({ text, filename = 'solution.ts' }: { text: string, filename?: string }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
      className="p-1.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff20] text-text-muted hover:text-white transition-colors flex items-center justify-center cursor-pointer pointer-events-auto"
      title="Download Code"
    >
      <Download size={14} />
    </button>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff20] text-text-muted hover:text-white transition-colors flex items-center justify-center cursor-pointer pointer-events-auto"
      title="Copy Code"
    >
      {copied ? <Check size={14} className="text-[#aaffaa]" /> : <Copy size={14} />}
    </button>
  );
};

const ExportPdfButton = ({ judgment }: { judgment: any }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const maxLineWidth = pageWidth - margin * 2;
      
      const addText = (text: string, fontSize: number, isBold = false) => {
        const safeText = text || '';
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(safeText, maxLineWidth);
        
        if (yPos + (lines.length * fontSize * 0.4) > doc.internal.pageSize.height - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.text(lines, margin, yPos);
        yPos += (lines.length * fontSize * 0.5) + 5;
      };

      addText("Agent Reasoning Engine - Audit Report", 18, true);
      yPos += 5;
      addText(`Performance Score: ${judgment.performanceScore}%`, 14);
      addText(`Summary: ${judgment.summary}`, 12);
      yPos += 10;
      
      if (judgment.reasoningContent) {
        addText("Agent Reasoning:", 14, true);
        addText(judgment.reasoningContent, 10);
        yPos += 10;
      }
      
      addText("Identified Issues:", 14, true);
      
      judgment.issues.forEach((issue: any, idx: number) => {
        addText(`${idx + 1}. [${issue.severity.toUpperCase()}] Lines: ${issue.lineNumbers.join(', ')}`, 12, true);
        addText(`Description: ${issue.description}`, 10);
        addText(`Solution:`, 10, true);
        addText(issue.solutionCode, 10);
        yPos += 5;
      });

      doc.save('audit-report.pdf');
    } catch (err) {
      console.error(err);
    }
    setIsExporting(false);
  };

  return (
    <button 
      onClick={exportPDF} 
      disabled={isExporting}
      className="p-1.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff20] transition-colors border border-glass-border/50 text-text-muted hover:text-white"
      title="Export Full Report as PDF"
    >
      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
    </button>
  );
};

export default function App() {
  const state = useStore((state) => state);
  const { codeString, setCodeString, judgment, hasCriticalVulnerability, isAnalyzing, activeIssueIndex, setActiveIssueIndex, setIsAnalyzing, setJudgment, nimApiKey, setNimApiKey, mode } = state;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleReaudit = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/nim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeString, query: 'Perform a full technical audit on the provided code.', nimKey: nimApiKey })
      });
      
      if (!response.ok) {
        throw new Error("Failed to reach Agent engine.");
      }
      
      const data = await response.json();
      setJudgment(data);
    } catch (err) {
      console.error(err);
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
    <div className="relative min-h-screen bg-[#000000] text-white overflow-hidden font-sans selection:bg-accent-blue/30">
      {/* 3D Render Layer - Strictly isolated for 60FPS */}
      <Scene />

      {/* DOM Layer - Spatial UI */}
      <main className="relative z-10 w-full h-screen p-8 flex flex-col pointer-events-none">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pointer-events-auto shrink-0 border-b border-glass-border/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="font-mono font-bold tracking-tighter text-2xl flex items-center gap-2">
              <div className="w-6 h-6 bg-accent-blue rounded-sm" />
              PROJECT_NEXUS
            </div>
            <div className="text-xs text-text-muted mt-1 px-2 py-0.5 border border-glass-border rounded-sm bg-[#ffffff05]">
              v2.4.0-stable
            </div>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-sm">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff20] transition-colors border border-glass-border/50 text-text-muted hover:text-white flex items-center justify-center pointer-events-auto"
              title="Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={handleReaudit}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff20] transition-colors border border-glass-border/50 text-text-muted hover:text-white disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              RE-AUDIT
            </button>
            <div className={`flex items-center gap-2 ${hasCriticalVulnerability ? 'text-accent-red' : 'text-accent-blue'}`}>
              <div className={`w-2 h-2 rounded-full ${hasCriticalVulnerability ? 'bg-accent-red animate-pulse' : 'bg-accent-blue'}`} />
              {hasCriticalVulnerability ? 'SYSTEM_COMPROMISED' : 'SYSTEM_NOMINAL'}
            </div>
          </div>
        </header>

        {/* 3D Bento Grid Layout */}
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 relative">
          
          {/* Left Column: Code Input */}
          <motion.div 
            layout
            className={`h-full pointer-events-auto flex flex-col gap-6 ${mode === 'builder' ? 'col-span-3' : 'col-span-4'}`}
          >
            <BentoCard className="flex-1 flex flex-col !p-0">
              <div className="p-4 border-b border-glass-border bg-[#00000050] flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-sm text-text-muted">
                  <Code2 size={16} /> source_target.ts
                </div>
                {isAnalyzing && (
                  <div className="text-xs text-accent-blue animate-pulse">INGESTING...</div>
                )}
              </div>
              <div 
                className="flex-1 overflow-auto custom-scrollbar relative flex cursor-text"
                onClick={(e) => {
                  const textarea = e.currentTarget.querySelector('textarea');
                  if (textarea) textarea.focus();
                }}
              >
                <Editor
                  value={codeString}
                  onValueChange={(code) => setCodeString(code)}
                  highlight={(code) => Prism.highlight(code, Prism.languages.typescript, 'typescript')}
                  padding={16}
                  className="w-full min-h-full"
                  style={{
                    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                    fontSize: 14,
                    backgroundColor: 'transparent',
                    color: '#e2e8f0',
                  }}
                  textareaClassName="focus:outline-none w-full min-h-full"
                />
              </div>
            </BentoCard>
          </motion.div>

          {/* Right Column: Predictive UI Reorganization & Agent Judgment */}
          <motion.div 
            layout
            className={`h-full pointer-events-auto relative perspective-[1000px] ${mode === 'builder' ? 'col-span-9' : 'col-span-8'}`}
          >
            <AnimatePresence mode="popLayout">
              {!judgment && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-4"
                >
                  <Cpu size={48} className="text-glass-border" />
                  <p className="font-mono text-sm">Awaiting instructions...</p>
                </motion.div>
              )}

              {judgment && mode === 'builder' && (
                <motion.div
                  key="builder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  className="flex flex-col gap-6 h-full"
                >
                  <BentoCard
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                    className="shrink-0 flex items-center gap-6 border-l-4" 
                    focused={true}
                  >
                    <Layers size={48} className="text-[#00ff88]" />
                    <div className="flex-1">
                      <h2 className="font-mono text-lg font-bold">BUILDER'S BLUEPRINT</h2>
                      <p className="text-text-muted text-sm">{judgment.summary}</p>
                    </div>
                  </BentoCard>

                  <div className="flex-1 min-h-0 flex gap-6">
                     {judgment.reasoningContent && (
                        <BentoCard
                          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
                          className="w-1/3 h-full flex flex-col gap-4 !p-0 overflow-hidden shrink-0 bg-[#00000060]"
                        >
                           <div className="p-4 border-b border-glass-border bg-[#ffffff05] font-mono text-xs flex gap-2 items-center text-[#00ff88]">
                             <Cpu size={14} /> ARCHITECTURE_THOUGHTS
                           </div>
                           <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                             <div className="font-mono text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
                               {judgment.reasoningContent}
                             </div>
                           </div>
                        </BentoCard>
                      )}

                    <BentoCard 
                      focused={true} 
                      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
                      className="flex-1 flex flex-col !p-0 overflow-hidden min-h-0"
                    >
                          <div className="p-4 border-b border-glass-border bg-[#ffffff05] font-mono text-xs flex gap-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Code2 size={14} /> GENERATED_CODE
                            </div>
                            <div className="flex items-center gap-2">
                              <CopyButton text={judgment.issues[0]?.solutionCode || ''} />
                            </div>
                          </div>
                          <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                            <pre className="font-mono text-sm text-[#00ff88] bg-[#00150a] min-h-full p-4 rounded-lg shadow-inner overflow-x-auto whitespace-pre-wrap">
                              {judgment.issues[0]?.solutionCode}
                            </pre>
                          </div>
                    </BentoCard>
                  </div>
                </motion.div>
              )}

              {judgment && mode === 'fixer' && (
                <motion.div
                  key="judgment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  className="grid grid-cols-3 gap-6 h-full"
                >
                  {/* Summary Metric */}
                  <BentoCard
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                    className="col-span-3 shrink-0 flex items-center gap-6 border-l-4" 
                    critical={hasCriticalVulnerability}
                  >
                    {hasCriticalVulnerability ? (
                      <ShieldAlert size={48} className="text-accent-red" />
                    ) : (
                      <ShieldCheck size={48} className="text-accent-blue" />
                    )}
                    <div className="flex-1">
                      <h2 className="font-mono text-lg font-bold">FIXER'S JUDGMENT</h2>
                      <p className="text-text-muted text-sm">{judgment.summary}</p>
                    </div>
                    <div className="font-mono text-4xl font-bold tracking-tighter">
                      {judgment.performanceScore}%
                    </div>
                  </BentoCard>

                  {/* Issues List */}
                  <div className="col-span-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {judgment.issues.map((issue, idx) => (
                      <motion.div
                        key={idx}
                        layoutId={"issue-" + idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1, type: "spring", stiffness: 300, damping: 30 }}
                        onClick={() => setActiveIssueIndex(idx)}
                        className={`p-4 rounded-xl cursor-pointer border transition-colors ${
                          activeIssueIndex === idx 
                          ? 'bg-[#ffffff15] border-accent-blue/50' 
                          : 'bg-[#00000040] border-glass-border hover:bg-[#ffffff0a]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                            issue.severity === 'critical' ? 'bg-accent-red/20 text-accent-red' :
                            issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-accent-blue/20 text-accent-blue'
                          }`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-text-muted">Lines: {issue.lineNumbers.join(', ')}</span>
                        </div>
                        <p className="text-sm">{issue.description}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Reasoning Space */}
                  <div className="col-span-1 h-full">
                    {judgment.reasoningContent && (
                      <BentoCard
                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
                        className="h-full flex flex-col gap-4 !p-0 overflow-hidden shrink-0 bg-[#00000060]"
                      >
                         <div className="p-4 border-b border-glass-border bg-[#ffffff05] font-mono text-xs flex gap-2 items-center text-accent-blue">
                           <Cpu size={14} /> AGENT_REASONING
                         </div>
                         <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                           <div className="font-mono text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
                             {judgment.reasoningContent}
                           </div>
                         </div>
                      </BentoCard>
                    )}
                  </div>

                  {/* Focused Solution Space */}
                  <div className="col-span-1 h-full">
                    {activeIssueIndex !== null && judgment.issues[activeIssueIndex] && (
                      <BentoCard 
                        focused={true} 
                        critical={judgment.issues[activeIssueIndex].severity === 'critical'}
                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.4 }}
                        className="h-full flex flex-col gap-4 !p-0 overflow-hidden shrink-0"
                      >
                        <div className="p-4 border-b border-glass-border bg-[#ffffff05] font-mono text-xs flex gap-2 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers size={14} /> SOLUTION_MATRIX
                          </div>
                          <div className="flex items-center gap-2">
                            <ExportPdfButton judgment={judgment} />
                            <DownloadButton text={judgment.issues[activeIssueIndex].solutionCode} />
                            <CopyButton text={judgment.issues[activeIssueIndex].solutionCode} />
                          </div>
                        </div>
                        <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                          <pre className="font-mono text-sm text-[#aaffaa] bg-[#001100] p-4 rounded-lg shadow-inner overflow-x-auto whitespace-pre-wrap">
                            {judgment.issues[activeIssueIndex].solutionCode}
                          </pre>
                        </div>
                      </BentoCard>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Input Layer */}
        <div className="shrink-0 pointer-events-auto">
          <CommandInput />
        </div>

      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f11] border border-glass-border/50 p-6 rounded-lg shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-lg font-bold flex items-center gap-2">
                  <Settings size={18} className="text-accent-blue" />
                  CONFIGURATION
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-text-muted hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-text-muted mb-2">
                    NVIDIA NIM API KEY
                  </label>
                  <input
                    type="password"
                    value={nimApiKey}
                    onChange={(e) => setNimApiKey(e.target.value)}
                    placeholder="nvapi-..."
                    className="w-full bg-[#1a1a1e] border border-glass-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  <p className="text-xs text-text-muted mt-2">
                    Stored locally in your browser session. Required for the reasoning engine.
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 font-mono text-sm bg-accent-blue text-black font-bold rounded-md hover:bg-opacity-90 transition-opacity"
                  >
                    SAVE & CLOSE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Make Prism Code editor background transparent */
        pre[class*="language-"], code[class*="language-"] {
          background: transparent !important;
          margin: 0 !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
