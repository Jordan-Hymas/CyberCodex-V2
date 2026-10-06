import { Button, ProgressBar, Avatar } from "@/components/ui";
import type { UserProfile, CourseProgress, Badge } from "@/types/curriculum";
import { cn } from "@/lib/utils";

export interface CourseSidebarProps {
  user: UserProfile;
  progress: CourseProgress;
  badges: Badge[];
  className?: string;
}

export function CourseSidebar({ user, progress, badges, className }: CourseSidebarProps) {
  const avatarUrl = user.avatar && /^(https?:)?\//.test(user.avatar) ? user.avatar : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Player card */}
      <section className="pixel-panel p-5">
        <div className="mb-4 flex items-center gap-4">
          <Avatar src={avatarUrl} alt={user.name} size="xl" showBorder />
          <div className="min-w-0">
            <p className="truncate font-ui text-lg text-cyber-text-primary">{user.name}</p>
            <p className="font-ui text-sm text-cyber-warning">LV {user.level}</p>
          </div>
        </div>
        {user.isGuest ? (
          <>
            <p className="mb-4 text-sm text-cyber-text-secondary">Sign up to save progress and earn XP as you go.</p>
            <Button href="/signup" fullWidth>
              Create free account
            </Button>
          </>
        ) : (
          <Button href="/profile" variant="secondary" fullWidth>
            View profile
          </Button>
        )}
      </section>

      {/* Progress */}
      <section className="pixel-panel space-y-4 p-5">
        <h2 className="font-ui text-lg" style={{ fontFamily: "var(--font-ui)", fontSize: "1.1rem" }}>
          Course progress
        </h2>
        <ProgressBar label="Exercises" current={progress.exercisesCompleted} total={progress.totalExercises} />
        {progress.totalProjects > 0 && (
          <ProgressBar
            label="Projects"
            current={progress.projectsCompleted}
            total={progress.totalProjects}
            variant="accent"
          />
        )}
        <ProgressBar label="XP" current={progress.xpEarned} total={progress.totalXp} variant="warning" />
      </section>

      {/* Badges */}
      {badges.length > 0 && (
        <section className="pixel-panel p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 style={{ fontFamily: "var(--font-ui)", fontSize: "1.1rem" }}>Badges</h2>
            <span className="font-ui text-sm text-cyber-text-muted">
              {progress.badgesEarned}/{progress.totalBadges}
            </span>
          </div>
          <p className="mb-4 text-sm text-cyber-text-secondary">Finish chapters to unlock them.</p>
          <ul className="grid grid-cols-4 gap-2.5">
            {badges.map((badge) => (
              <li
                key={badge.id}
                className={cn(
                  "grid aspect-square place-items-center border-2 border-cyber-ink text-2xl",
                  badge.isUnlocked
                    ? "bg-cyber-warning shadow-[3px_3px_0_0_var(--color-cyber-ink)]"
                    : "bg-cyber-ink text-cyber-text-muted"
                )}
                title={badge.isUnlocked ? badge.name : `Locked: ${badge.description}`}
              >
                <span className={cn(!badge.isUnlocked && "opacity-30 grayscale")}>{badge.icon}</span>
                <span className="sr-only">{badge.isUnlocked ? badge.name : `Locked: ${badge.description}`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
