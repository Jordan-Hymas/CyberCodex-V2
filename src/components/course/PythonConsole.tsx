"use client";

import { useEffect, useRef } from "react";
import { TestResult } from "@/lib/python/runtime";
import { WindowBar } from "@/components/ui/WindowBar";
import { cn } from "@/lib/utils";

export interface PythonConsoleProps {
  output: string;
  error?: string;
  testResults?: TestResult[];
  isRunning?: boolean;
}

export function PythonConsole({ output, error, testResults = [], isRunning = false }: PythonConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, error, testResults]);

  const isEmpty = !output && !error && testResults.length === 0;
  const passed = testResults.filter((t) => t.passed).length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-cyber-ink">
      <WindowBar
        title="console"
        accent="bg-cyber-dark-tertiary"
        textClassName="text-cyber-text-primary"
        right={isRunning ? <span className="text-cyber-warning">running…</span> : undefined}
      />

      <div
        ref={consoleRef}
        className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed scrollbar-cyber"
        aria-live="polite"
      >
        {isEmpty && (
          <p className="text-cyber-text-muted">
            <span className="text-cyber-pink">$</span> Press <span className="text-cyber-primary">Run</span> to see your output here.
          </p>
        )}

        {output && <pre className="!m-0 !bg-transparent !p-0 whitespace-pre-wrap text-cyber-text-primary">{output}</pre>}

        {error && (
          <div className="mt-2 border-l-4 border-cyber-danger bg-cyber-danger/10 px-3 py-2">
            <span className="font-ui text-cyber-danger">Error</span>
            <pre className="!m-0 !bg-transparent !p-0 whitespace-pre-wrap text-cyber-danger">{error}</pre>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="font-ui text-cyber-text-secondary">
              Tests: <span className={passed === testResults.length ? "text-cyber-primary" : "text-cyber-warning"}>{passed}/{testResults.length} passed</span>
            </p>
            {testResults.map((test, index) => (
              <div
                key={index}
                className={cn(
                  "border-l-4 px-3 py-2",
                  test.passed ? "border-cyber-primary bg-cyber-primary/10" : "border-cyber-danger bg-cyber-danger/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("font-ui", test.passed ? "text-cyber-primary" : "text-cyber-danger")}>
                    {test.passed ? "✓" : "✗"}
                  </span>
                  <span className="text-cyber-text-primary">{test.description}</span>
                </div>
                {!test.passed && (
                  <div className="mt-1 space-y-0.5 pl-5">
                    {test.expected && (
                      <div>
                        <span className="text-cyber-text-muted">expected:</span> <span className="text-cyber-secondary">{test.expected}</span>
                      </div>
                    )}
                    {test.actual && (
                      <div>
                        <span className="text-cyber-text-muted">actual:</span> <span className="text-cyber-danger">{test.actual}</span>
                      </div>
                    )}
                    {test.error && <div className="text-cyber-danger">{test.error}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
