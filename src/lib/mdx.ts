import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import rehypePrism from "rehype-prism-plus";
import type { Course, CourseFrontmatter, CourseSummary } from "@/types";

const coursesDirectory = path.join(process.cwd(), "content/courses");

/**
 * Get all course slugs
 */
export function getAllCourseSlugs(): string[] {
  try {
    const fileNames = fs.readdirSync(coursesDirectory);
    return fileNames
      .filter((fileName) => fileName.endsWith(".mdx"))
      .map((fileName) => fileName.replace(/\.mdx$/, ""));
  } catch (error) {
    // Directory doesn't exist yet or is empty
    return [];
  }
}

/**
 * Get course by slug
 */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const fullPath = path.join(coursesDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      content,
      ...(data as CourseFrontmatter),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Read chapter/exercise/XP totals from a course's curriculum.json, if it has one.
 */
function getCurriculumStats(slug: string): Pick<CourseSummary, "chapterCount" | "exerciseCount" | "totalXp"> {
  try {
    const raw = fs.readFileSync(path.join(coursesDirectory, slug, "curriculum.json"), "utf8");
    const curriculum = JSON.parse(raw) as {
      chapters?: { exercises?: unknown[] }[];
      progress?: { totalXp?: number };
    };
    const chapters = curriculum.chapters ?? [];
    return {
      chapterCount: chapters.length,
      exerciseCount: chapters.reduce((sum, c) => sum + (c.exercises?.length ?? 0), 0),
      totalXp: curriculum.progress?.totalXp,
    };
  } catch {
    return {};
  }
}

/**
 * Get all courses (summary without full content)
 */
export function getAllCourses(): CourseSummary[] {
  const slugs = getAllCourseSlugs();
  const courses = slugs
    .map((slug) => {
      try {
        const fullPath = path.join(coursesDirectory, `${slug}.mdx`);
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        // Estimate reading time (average 200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        return {
          slug,
          readingTime,
          ...getCurriculumStats(slug),
          ...(data as CourseFrontmatter),
        } as CourseSummary;
      } catch (error) {
        return null;
      }
    })
    .filter((course): course is CourseSummary => course !== null);

  // Sort by publishedAt date (newest first)
  return courses.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * Get courses by category
 */
export function getCoursesByCategory(category: string): CourseSummary[] {
  const allCourses = getAllCourses();
  return allCourses.filter((course) => course.category === category);
}

/**
 * Get courses by difficulty
 */
export function getCoursesByDifficulty(difficulty: string): CourseSummary[] {
  const allCourses = getAllCourses();
  return allCourses.filter((course) => course.difficulty === difficulty);
}

/**
 * Serialize MDX content
 */
export async function serializeMDX(source: string) {
  return await serialize(source, {
    mdxOptions: {
      rehypePlugins: [rehypePrism],
    },
  });
}
