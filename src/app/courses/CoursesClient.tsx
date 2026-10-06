"use client";

import { useState, useMemo } from "react";
import { PageBanner } from "@/components/layout/PageBanner";
import { CourseCard } from "@/components/course/CourseCard";
import { MascotSays } from "@/components/brand";
import { Button } from "@/components/ui";
import { courseCategories, difficultyLevels } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types";

interface CoursesClientProps {
  courses: CourseSummary[];
}

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 border-2 border-cyber-ink px-3 py-1.5 font-ui text-sm transition-[transform,background-color] duration-100",
        active
          ? "translate-x-[2px] translate-y-[2px] bg-cyber-primary text-cyber-ink"
          : "bg-cyber-dark-tertiary text-cyber-text-primary shadow-[3px_3px_0_0_var(--color-cyber-ink)] hover:bg-[#424984]"
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("text-xs", active ? "text-cyber-ink/70" : "text-cyber-text-muted")}>{count}</span>
      )}
    </button>
  );
}

export function CoursesClient({ courses }: CoursesClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Only offer categories that actually have courses
  const categories = useMemo(
    () =>
      courseCategories
        .map((category) => ({ ...category, count: courses.filter((c) => c.category === category.id).length }))
        .filter((category) => category.count > 0),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty;
      const matchesSearch =
        query === "" ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.tags?.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [courses, selectedCategory, selectedDifficulty, searchQuery]);

  const hasFilters = selectedCategory !== "all" || selectedDifficulty !== "all" || searchQuery !== "";
  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSearchQuery("");
  };

  return (
    <main className="min-h-screen pb-24">
      <PageBanner
        image="/images/banners/computerGuy.gif"
        imagePosition="center 40%"
        eyebrow="Course catalog"
        title="Choose your next quest"
        description="Start with the fundamentals, then branch into web, cloud, crypto and malware. Every course is broken into short chapters you can finish in one sitting."
      />

      <div className="container-custom pt-12">
        {/* Search + filters */}
        <div className="pixel-panel mb-10 space-y-6 p-5 md:p-6">
          <div className="relative max-w-xl">
            <label htmlFor="course-search" className="sr-only">
              Search courses
            </label>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-ui text-cyber-primary" aria-hidden="true">
              &gt;
            </span>
            <input
              id="course-search"
              type="search"
              placeholder="Search by title, topic or tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pixel-input w-full py-3 pl-10 pr-4"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-x-6">
            <h2 className="pixel-label pt-2 text-cyber-text-muted" style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem" }}>
              Category
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <FilterChip active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} count={courses.length}>
                All
              </FilterChip>
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  active={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  count={category.count}
                >
                  {category.name}
                </FilterChip>
              ))}
            </div>

            <h2 className="pixel-label pt-2 text-cyber-text-muted" style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem" }}>
              Level
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <FilterChip active={selectedDifficulty === "all"} onClick={() => setSelectedDifficulty("all")}>
                All levels
              </FilterChip>
              {Object.entries(difficultyLevels).map(([key, { label }]) => (
                <FilterChip key={key} active={selectedDifficulty === key} onClick={() => setSelectedDifficulty(key)}>
                  {label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="font-ui text-cyber-text-secondary" aria-live="polite">
            <span className="text-cyber-primary">{filteredCourses.length}</span>{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, i) => (
              <CourseCard key={course.slug} course={course} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-16">
            <MascotSays mood="really">Nothing matches that. Try a different search or clear the filters.</MascotSays>
            <Button variant="secondary" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
