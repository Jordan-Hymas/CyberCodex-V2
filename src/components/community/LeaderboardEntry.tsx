import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface LeaderboardUser {
  id: string;
  name: string;
  username?: string;
  image?: string | null;
  xp: number;
  isVerified?: boolean;
}

export interface LeaderboardEntryProps {
  user: LeaderboardUser;
  rank: number;
  /** @deprecated no longer used (entries don't stagger in) */
  index?: number;
}

// Gold, silver, bronze tiles for the podium
const podium: Record<number, string> = {
  1: "bg-cyber-warning text-cyber-ink",
  2: "bg-cyber-text-secondary text-cyber-ink",
  3: "bg-cyber-orange text-cyber-ink",
};

export function LeaderboardEntry({ user, rank }: LeaderboardEntryProps) {
  const isTopThree = rank <= 3;

  return (
    <li className={cn("flex items-center gap-4 px-4 py-3", isTopThree && "bg-cyber-dark-tertiary/60")}>
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center border-2 border-cyber-ink font-pixel text-xs",
          podium[rank] ?? "bg-cyber-ink text-cyber-text-muted",
          isTopThree && "shadow-[3px_3px_0_0_var(--color-cyber-ink)]"
        )}
        aria-label={`Rank ${rank}`}
      >
        {rank}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={user.image} alt={user.name} fallback={user.name} size="lg" showBorder={isTopThree} />
        <div className="min-w-0">
          <p className={cn("flex items-center gap-2 truncate font-ui", isTopThree ? "text-cyber-text-primary" : "text-cyber-text-secondary")}>
            {user.name}
            {user.isVerified && (
              <span className="border border-cyber-ink bg-cyber-secondary px-1 text-[0.6rem] text-cyber-ink" title="Verified">
                ✓
              </span>
            )}
          </p>
          {user.username && <p className="truncate text-sm text-cyber-text-muted">@{user.username}</p>}
        </div>
      </div>

      <span className={cn("shrink-0 whitespace-nowrap font-ui", isTopThree ? "text-cyber-warning" : "text-cyber-text-secondary")}>
        {user.xp.toLocaleString()} XP
      </span>
    </li>
  );
}
