import { Button } from "@/components/ui";
import { Mascot } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="container-custom flex min-h-screen flex-col items-center justify-center gap-6 pt-24 pb-16 text-center">
      <Mascot mood="notHappy" width={150} priority />
      <p className="pixel-label border-2 border-cyber-ink bg-cyber-danger px-2 py-1 text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)]">
        Error 404
      </p>
      <h1 className="text-display-2">Level not found</h1>
      <p className="max-w-md text-lg text-cyber-text-secondary">
        This page doesn&apos;t exist (yet). It may still be under construction.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button href="/" size="lg">
          Back to start
        </Button>
        <Button href="/courses" variant="secondary" size="lg">
          Browse courses
        </Button>
      </div>
    </main>
  );
}
