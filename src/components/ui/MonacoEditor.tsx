import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  theme = 'vs-dark'
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Custom editor configurations
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly: false,
      automaticLayout: true,
      padding: { top: 16, bottom: 16 }
    });
  };

  return (
    <div className="w-full h-full overflow-hidden rounded-b-xl bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={value}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          padding: { top: 16, bottom: 16 }
        }}
      />
    </div>
  );
};
