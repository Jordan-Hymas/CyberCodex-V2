import { LeaderboardEntry, LeaderboardUser } from "./LeaderboardEntry";
import { MascotSays } from "@/components/brand";

export interface LeaderboardTableProps {
  users: LeaderboardUser[];
}

export function LeaderboardTable({ users }: LeaderboardTableProps) {
  if (!users || users.length === 0) {
    return (
      <div className="pixel-panel flex justify-center p-10">
        <MascotSays mood="looking">Nobody&apos;s on the board yet. Earn some XP and claim first place!</MascotSays>
      </div>
    );
  }

  return (
    <ol className="pixel-panel divide-y-2 divide-dashed divide-cyber-border">
      {users.map((user, index) => (
        <LeaderboardEntry key={user.id} user={user} rank={index + 1} />
      ))}
    </ol>
  );
}
