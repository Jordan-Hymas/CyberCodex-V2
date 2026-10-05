import { CourseCategory, DifficultyLevel } from "@/lib/config";

/**
 * Course Frontmatter
 * Metadata extracted from MDX files
 */
export interface CourseFrontmatter {
  title: string;
  description: string;
  category: CourseCategory;
  difficulty: DifficultyLevel;
  duration: string; // e.g., "2 hours", "30 minutes"
  author?: string;
  publishedAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  tags?: string[];
  prerequisites?: string[];
  learningObjectives?: string[];
}

/**
 * Course with content
 * Full course data including MDX content
 */
export interface Course extends CourseFrontmatter {
  slug: string;
  content: string; // Raw MDX content
}

/**
 * Course summary
 * Used for course listings without full content
 */
export interface CourseSummary extends CourseFrontmatter {
  slug: string;
  readingTime?: number; // Estimated reading time in minutes
  chapterCount?: number; // From curriculum.json
  exerciseCount?: number;
  totalXp?: number;
}
