import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { courseCategories, difficultyLevels } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types";

// Static class strings so Tailwind can see them
const categoryAccent: Record<string, string> = {
  networking: "text-cyber-secondary",
  linux: "text-cyber-primary",
  "web-security": "text-cyber-pink",
  "network-security": "text-cyber-secondary",
  cryptography: "text-cyber-accent",
  "penetration-testing": "text-cyber-danger",
  "malware-analysis": "text-cyber-orange",
  "cloud-security": "text-cyber-warning",
  programming: "text-cyber-primary",
};

export interface CourseCardProps {
  course: CourseSummary;
  className?: string;
  priority?: boolean;
}

export function CourseCard({ course, className, priority }: CourseCardProps) {
  const category = courseCategories.find((c) => c.id === course.category);
  const difficulty = difficultyLevels[course.difficulty];

  return (
    <Link href={`/courses/${course.slug}`} className={cn("card group !p-0 h-full", className)}>
      {/* Banner art */}
      <div className="relative h-40 overflow-hidden border-b-[3px] border-cyber-ink bg-cyber-dark-tertiary">
        {category?.iconGif ? (
          <Image
            src={category.iconGif}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            className="object-cover"
            unoptimized // keep GIFs animated
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-5xl" aria-hidden="true">
            📚
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={difficulty.color}>{difficulty.label}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {category && (
          <span className={cn("pixel-label mb-2", categoryAccent[category.id] ?? "text-cyber-text-muted")}>
            {category.name}
          </span>
        )}
        <h3
          className="mb-2 text-cyber-text-primary transition-colors duration-100 group-hover:text-cyber-primary"
          style={{ fontSize: "var(--font-size-card-title)" }}
        >
          {course.title}
        </h3>
        <p className="mb-5 line-clamp-2 text-[0.95rem] leading-relaxed text-cyber-text-secondary">
          {course.description}
        </p>

        {/* Stats row */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed border-cyber-border pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-ui text-sm text-cyber-text-muted">
            <span>{course.duration}</span>
            {course.chapterCount ? <span>{course.chapterCount} chapters</span> : null}
            {course.totalXp ? <span className="text-cyber-warning">+{course.totalXp} XP</span> : null}
          </div>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center border-2 border-cyber-ink bg-cyber-dark-tertiary font-ui font-bold text-cyber-text-primary transition-colors duration-100 group-hover:bg-cyber-primary group-hover:text-cyber-ink"
            aria-hidden="true"
          >
            ▶
          </span>
        </div>
      </div>
    </Link>
  );
}
