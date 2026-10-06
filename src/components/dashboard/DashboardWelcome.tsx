import { Mascot } from "@/components/brand";

interface DashboardWelcomeProps {
  userName: string;
}

export function DashboardWelcome({ userName }: DashboardWelcomeProps) {
  // A time-of-day greeting rendered on the server and again in the browser
  // caused hydration mismatches, so keep it time-independent.
  return (
    <div className="flex items-end gap-5">
      <Mascot mood="hi" width={96} priority className="hidden shrink-0 sm:block" />
      <div>
        <p className="pixel-label mb-2 text-cyber-pink">Player select</p>
        <h1 className="text-display-2 mb-2">
          Welcome back, <span className="gradient-text">{userName}</span>
        </h1>
        <p className="text-lg text-cyber-text-secondary">Ready to level up?</p>
      </div>
    </div>
  );
}
