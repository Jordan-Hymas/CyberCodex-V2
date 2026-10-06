"use client";

import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { WindowBar } from "@/components/ui/WindowBar";

export interface PythonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
}

export function PythonCodeEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = "300px",
  maxHeight,
}: PythonCodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <div className="code-editor-wrapper flex h-full min-h-0 flex-col bg-cyber-ink">
      <WindowBar title="script.py" accent="bg-cyber-secondary" />
      <CodeMirror
        value={value}
        height="100%"
        minHeight={minHeight}
        maxHeight={maxHeight}
        extensions={[python(), EditorView.lineWrapping]}
        onChange={handleChange}
        readOnly={readOnly}
        theme="dark"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        className="code-editor min-h-0 flex-1 overflow-auto"
      />

      <style jsx global>{`
        .code-editor {
          font-family: var(--font-mono);
          font-size: 14px;
        }
        .code-editor .cm-editor {
          height: 100%;
          background: var(--color-cyber-ink) !important;
          color: var(--color-cyber-text-primary) !important;
        }
        .code-editor .cm-gutters {
          background: #181a38 !important;
          color: var(--color-cyber-text-muted) !important;
          border-right: 2px solid var(--color-cyber-dark-tertiary) !important;
        }
        .code-editor .cm-activeLineGutter {
          background: var(--color-cyber-dark-tertiary) !important;
          color: var(--color-cyber-warning) !important;
        }
        .code-editor .cm-activeLine {
          background: rgb(52 58 108 / 0.45) !important;
        }
        .code-editor .cm-selectionBackground,
        .code-editor .cm-focused .cm-selectionBackground {
          background: rgb(255 95 162 / 0.35) !important;
        }
        .code-editor .cm-cursor {
          border-left: 2px solid var(--color-cyber-primary) !important;
        }
        .code-editor .cm-line {
          padding-left: 0.5rem;
        }
        .code-editor .cm-focused {
          outline: none !important;
        }
      `}</style>
    </div>
  );
}
