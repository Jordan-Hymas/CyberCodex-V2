"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { PythonCodeEditor } from "./PythonCodeEditor";
import { PythonConsole } from "./PythonConsole";
import { pythonRuntime, TestCase } from "@/lib/python/runtime";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/brand";
import { ExerciseHeader } from "./ExerciseHeader";
import { Play, RotateCcw, Eye } from "lucide-react";

export interface InteractivePythonLayoutProps {
  title: string;
  description?: string;
  mdxContent: MDXRemoteSerializeResult;
  starterCode: string;
  solution?: string;
  tests?: TestCase[];
  hints?: string[];
  courseSlug?: string;
  exerciseId?: string;
  chapterId?: string;
  xpReward?: number;
  nextExerciseId?: string;
  previousExerciseId?: string;
  courseTitle?: string;
  chapterLabel?: string;
}

export function InteractivePythonLayout({
  title,
  description,
  mdxContent,
  starterCode,
  solution,
  tests = [],
  hints = [],
  courseSlug,
  exerciseId,
  chapterId,
  xpReward = 0,
  nextExerciseId,
  previousExerciseId,
  courseTitle,
  chapterLabel,
}: InteractivePythonLayoutProps) {
  const { data: session, update: updateSession } = useSession({
    required: false,
  });
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [awardingXp, setAwardingXp] = useState(false);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setOutput("");
    setError(undefined);
    setTestResults([]);

    try {
      if (tests.length > 0) {
        // Run with test validation
        const result = await pythonRuntime.executeWithTests(code, tests);
        setOutput(result.output);
        setError(result.error);
        setTestResults(result.testResults || []);
      } else {
        // Just run the code
        const result = await pythonRuntime.executeCode(code);
        setOutput(result.output);
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsRunning(false);
    }
  }, [code, tests]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setOutput("");
    setError(undefined);
    setTestResults([]);
    setShowSolution(false);
  }, [starterCode]);

  const handleShowSolution = useCallback(() => {
    if (solution) {
      setCode(solution);
      setShowSolution(true);
    }
  }, [solution]);

  const handleRevealHint = useCallback(() => {
    if (hintsRevealed < hints.length) {
      setHintsRevealed(hintsRevealed + 1);
    }
  }, [hintsRevealed, hints.length]);

  const allTestsPassed =
    testResults.length > 0 && testResults.every((t) => t.passed);

  // Automatically award XP when all tests pass
  useEffect(() => {
    async function awardXP() {
      if (!allTestsPassed || xpAwarded || awardingXp || !session?.user || !courseSlug || !exerciseId) {
        return;
      }

      setAwardingXp(true);

      try {
        const response = await fetch("/api/progress/complete-exercise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: courseSlug,
            exerciseId,
            chapterId,
            xpReward,
            usedSolution: showSolution, // Track if user used "Show Solution"
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setXpAwarded(true);
          // Refresh session to update user's XP in navbar
          if (updateSession) {
            await updateSession();
          }
        } else {
          console.error("Failed to award XP:", data.error);
        }
      } catch (error) {
        console.error("Error awarding XP:", error);
      } finally {
        setAwardingXp(false);
      }
    }

    awardXP();
  }, [allTestsPassed, xpAwarded, awardingXp, session, courseSlug, exerciseId, chapterId, xpReward, updateSession, showSolution]);

  return (
    <main className="flex flex-col pt-16 lg:h-dvh">
      <ExerciseHeader
        title={title}
        courseSlug={courseSlug ?? ""}
        courseTitle={courseTitle ?? "Course"}
        chapterLabel={chapterLabel}
        xpReward={xpReward}
        previousExerciseId={previousExerciseId}
        nextExerciseId={nextExerciseId}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        {/* Instructions */}
        <section className="min-h-0 overflow-y-auto border-b-[3px] border-cyber-ink p-6 scrollbar-cyber md:p-8 lg:border-b-0 lg:border-r-[3px]">
          <article className="prose-cyber max-w-none">
            <MDXRemote {...mdxContent} />
          </article>

          {(hints.length > 0 || solution) && (
            <div className="mt-8 space-y-4 border-t-2 border-dashed border-cyber-border pt-6">
              {hintsRevealed > 0 && (
                <ol className="space-y-3">
                  {hints.slice(0, hintsRevealed).map((hint, index) => (
                    <li key={index} className="border-2 border-cyber-ink border-l-[6px] border-l-cyber-warning bg-cyber-dark-secondary p-3">
                      <span className="pixel-label mb-1 block text-cyber-warning">Hint {index + 1}</span>
                      <p className="text-cyber-text-primary">{hint}</p>
                    </li>
                  ))}
                </ol>
              )}
              <div className="flex flex-wrap gap-3">
                {hints.length > 0 && hintsRevealed < hints.length && (
                  <Button variant="secondary" size="sm" onClick={handleRevealHint}>
                    💡 Hint ({hintsRevealed}/{hints.length})
                  </Button>
                )}
                {solution && !showSolution && (
                  <Button variant="ghost" size="sm" onClick={handleShowSolution}>
                    <Eye size={16} />
                    Show solution (half XP)
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Editor + console */}
        <section className="flex min-h-0 flex-col">
          {allTestsPassed && (
            <div className="flex shrink-0 items-center gap-4 border-b-[3px] border-cyber-ink bg-cyber-primary px-4 py-2 text-cyber-ink animate-slide-down">
              <Mascot mood="cheers" width={48} />
              <div>
                <p className="font-ui text-lg">All tests passed!</p>
                <p className="text-sm">
                  {xpAwarded && xpReward > 0
                    ? `+${showSolution ? Math.floor(xpReward / 2) : xpReward} XP earned${showSolution ? " (half XP for using the solution)" : ""}.`
                    : session?.user
                      ? "Saving your progress…"
                      : "Sign in to save your progress and earn XP."}
                </p>
              </div>
              {nextExerciseId && courseSlug && (
                <Button href={`/courses/${courseSlug}/${nextExerciseId}`} variant="secondary" size="sm" className="ml-auto">
                  Next ▶
                </Button>
              )}
            </div>
          )}

          <div className="min-h-[360px] flex-1">
            <PythonCodeEditor value={code} onChange={setCode} minHeight="360px" />
          </div>

          <div className="flex shrink-0 items-center gap-3 border-y-[3px] border-cyber-ink bg-cyber-dark-secondary px-4 py-3">
            <Button onClick={handleRunCode} disabled={isRunning}>
              <Play size={16} />
              {isRunning ? "Running…" : "Run"}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset
            </Button>
            <span className="ml-auto hidden font-ui text-sm text-cyber-text-muted sm:inline">
              {tests.length > 0 ? `${tests.length} ${tests.length === 1 ? "test" : "tests"}` : "Free run"}
            </span>
          </div>

          <div className="h-56 shrink-0 lg:h-60">
            <PythonConsole output={output} error={error} testResults={testResults} isRunning={isRunning} />
          </div>
        </section>
      </div>
    </main>
  );
}
