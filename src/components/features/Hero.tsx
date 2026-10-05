import Image from "next/image";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/brand";

export interface HeroProps {
  stats: { label: string; value: number }[];
}

// Each line types in after the previous one (pure CSS, see animation-delay)
const terminalLines: { text: string; kind: "cmd" | "out" | "ok" }[] = [
  { text: "whoami", kind: "cmd" },
  { text: "guest", kind: "out" },
  { text: "cat mission.txt", kind: "cmd" },
  { text: "Learn how attacks work so you can stop them.", kind: "out" },
  { text: "./start --course linux-fundamentals", kind: "cmd" },
  { text: "[■■■■■■■■■■] lesson 1 loaded · +25 XP", kind: "ok" },
];

export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-cyber-ink">
      {/* Pixel-art city backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/banners/future.gif"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-dark via-cyber-dark/85 to-cyber-dark/30" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cyber-dark to-transparent" />
      </div>

      <div className="container-custom relative grid items-center gap-12 pt-32 pb-20 md:pt-40 md:pb-28 lg:grid-cols-[1.1fr_1fr]">
        {/* Copy */}
        <div className="animate-slide-up">
          <p className="pixel-label mb-5 inline-block border-2 border-cyber-ink bg-cyber-warning px-2 py-1 text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)]">
            Ethical hacking academy
          </p>
          <h1 className="text-display-1 mb-6">
            Learn to hack.
            <br />
            <span className="gradient-text">Legally.</span>
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-cyber-text-secondary md:text-xl">
            Bite-size lessons, a real terminal in your browser, and XP for every exercise you crack.
            Start with Linux, Python and networking, then work up to web exploitation.
          </p>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/courses" size="lg">
              Start learning ▶
            </Button>
            <Button href="#how-it-works" variant="secondary" size="lg">
              How it works
            </Button>
          </div>

          {/* Real numbers from the course catalog */}
          <dl className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline gap-2 border-2 border-cyber-ink bg-cyber-dark-secondary/90 px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-cyber-ink)]"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-pixel text-sm text-cyber-primary">{stat.value}</dd>
                <span className="font-ui text-sm text-cyber-text-secondary" aria-hidden="true">
                  {stat.label}
                </span>
              </div>
            ))}
          </dl>
        </div>

        {/* Terminal window + mascot */}
        <div className="relative mx-auto w-full max-w-lg lg:mr-0">
          <div className="pixel-panel !shadow-[10px_10px_0_0_var(--color-cyber-ink)]">
            <div className="flex items-center gap-2 border-b-[3px] border-cyber-ink bg-cyber-accent px-3 py-2">
              <span className="h-3 w-3 border-2 border-cyber-ink bg-cyber-danger" />
              <span className="h-3 w-3 border-2 border-cyber-ink bg-cyber-warning" />
              <span className="h-3 w-3 border-2 border-cyber-ink bg-cyber-primary" />
              <span className="ml-2 font-ui text-sm font-semibold text-cyber-ink">guest@cybercodex: ~</span>
            </div>
            <div className="min-h-[15rem] bg-cyber-ink p-5 font-mono text-sm leading-7 sm:text-[0.95rem]">
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.4 + i * 0.55}s` }}
                >
                  {line.kind === "cmd" ? (
                    <>
                      <span className="text-cyber-pink">$ </span>
                      <span className="text-cyber-text-primary">{line.text}</span>
                    </>
                  ) : (
                    <span className={line.kind === "ok" ? "text-cyber-primary" : "text-cyber-text-muted"}>
                      {line.text}
                    </span>
                  )}
                </div>
              ))}
              <div className="animate-fade-in" style={{ animationDelay: `${0.4 + terminalLines.length * 0.55}s` }}>
                <span className="text-cyber-pink">$ </span>
                <span className="inline-block h-4 w-2.5 translate-y-0.5 bg-cyber-primary animate-blink" />
              </div>
            </div>
          </div>
          <Mascot
            mood="hacker"
            width={190}
            priority
            className="absolute -bottom-14 -right-4 hidden drop-shadow-[4px_4px_0_var(--color-cyber-ink)] sm:block lg:-right-10"
          />
        </div>
      </div>
    </section>
  );
}
