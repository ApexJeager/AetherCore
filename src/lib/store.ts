import { create } from 'zustand';

export type Issue = {
  description: string;
  severity: "low" | "medium" | "critical";
  lineNumbers: number[];
  solutionCode: string;
};

export type FixerJudgment = {
  issues: Issue[];
  performanceScore: number;
  summary: string;
  reasoningContent?: string;
  latencyMs?: number;
};

interface AppState {
  codeString: string;
  setCodeString: (code: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (status: boolean) => void;
  judgment: FixerJudgment | null;
  setJudgment: (judgment: FixerJudgment | null) => void;
  hasCriticalVulnerability: boolean;
  activeIssueIndex: number | null;
  setActiveIssueIndex: (index: number | null) => void;
  nimApiKey: string;
  setNimApiKey: (key: string) => void;
  mode: 'idle' | 'builder' | 'fixer';
  setMode: (mode: 'idle' | 'builder' | 'fixer') => void;
}

export const useStore = create<AppState>((set) => ({
  codeString: `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\nconsole.log(fibonacci(40));`,
  setCodeString: (codeString) => set({ codeString }),
  isAnalyzing: false,
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  judgment: null,
  setJudgment: (judgment) => set({ 
    judgment, 
    hasCriticalVulnerability: judgment?.issues.some(i => i.severity === 'critical') || false,
    activeIssueIndex: judgment?.issues.length ? 0 : null,
    mode: judgment?.summary.toLowerCase().includes('build') ? 'builder' : 'fixer'
  }),
  hasCriticalVulnerability: false,
  activeIssueIndex: null,
  setActiveIssueIndex: (activeIssueIndex) => set({ activeIssueIndex }),
  nimApiKey: "",
  setNimApiKey: (nimApiKey) => set({ nimApiKey }),
  mode: 'idle',
  setMode: (mode) => set({ mode }),
}));

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type SchemaNode = {
  id: string;
  label: string;
  position: [number, number, number];
};

export type SchemaLink = {
  source: [number, number, number];
  target: [number, number, number];
};

export type StructuralSchema = {
  nodes: SchemaNode[];
  links: SchemaLink[];
};

interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  latestSchema: StructuralSchema;
  setLatestSchema: (schema: StructuralSchema) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  clearMessages: () => set({ messages: [] }),
  latestSchema: { nodes: [], links: [] },
  setLatestSchema: (latestSchema) => set({ latestSchema }),
}));
