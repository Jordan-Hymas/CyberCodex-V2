import { Avatar, Button } from "@/components/ui";
import { Mascot } from "@/components/brand";

interface UserStats {
  xp: number;
  level: number;
  coursesCompleted: number;
  badgesEarned: number;
  streak: number;
}

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  stats: UserStats;
}

export function DashboardSidebar({ user, stats }: DashboardSidebarProps) {
  const tiles = [
    { label: "XP", value: stats.xp.toLocaleString(), color: "text-cyber-warning" },
    { label: "Day streak", value: stats.streak, color: "text-cyber-orange" },
    { label: "Courses", value: stats.coursesCompleted, color: "text-cyber-primary" },
    { label: "Badges", value: stats.badgesEarned, color: "text-cyber-accent" },
  ];

  return (
    <div className="space-y-6">
      {/* Character sheet */}
      <section className="pixel-panel p-5">
        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <Avatar src={user.image} alt={user.name} size="xl" showBorder />
            <span className="absolute -bottom-2 -right-2 border-2 border-cyber-ink bg-cyber-warning px-1 font-label text-[0.65rem] text-cyber-ink">
              LV{stats.level}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-ui text-lg text-cyber-text-primary">{user.name}</p>
            <p className="truncate text-sm text-cyber-text-muted">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="border-2 border-cyber-ink bg-cyber-ink p-3 text-center">
              <dd className={`font-pixel text-base ${tile.color}`}>{tile.value}</dd>
              <dt className="pixel-label mt-1 text-cyber-text-muted">{tile.label}</dt>
            </div>
          ))}
        </dl>

        <Button href="/profile" variant="secondary" fullWidth className="mt-5">
          View profile
        </Button>
      </section>

      {/* Upgrade */}
      <section className="border-[3px] border-cyber-ink bg-cyber-warning p-5 text-cyber-ink shadow-[6px_6px_0_0_var(--color-cyber-ink)]">
        <div className="mb-3 flex items-center gap-3">
          <Mascot mood="smart" width={56} />
          <h2 className="text-xl text-cyber-ink" style={{ fontFamily: "var(--font-ui)", fontSize: "1.25rem", fontWeight: 600 }}>
            Go Elite
          </h2>
        </div>
        <p className="mb-4 text-sm">Unlock every chapter, advanced labs and certificates.</p>
        <Button href="/pricing" variant="secondary" fullWidth>
          See plans
        </Button>
      </section>
    </div>
  );
}
