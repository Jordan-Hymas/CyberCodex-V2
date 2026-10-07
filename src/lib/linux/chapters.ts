/**
 * Course orientation and per-chapter briefings for the Linux courses.
 * Each course's chapters (with their summary + skills) live in its curriculum.json;
 * this module stitches the three together so any mission can find its chapter.
 */
import fundamentals from '../../../content/courses/linux-fundamentals/curriculum.json';
import intermediate from '../../../content/courses/linux-intermediate/curriculum.json';
import advanced from '../../../content/courses/linux-advanced/curriculum.json';
import { linuxCourses, type LinuxCourse } from './challenges';

type RawChapter = { number: number; title: string; summary?: string; skills?: string[]; exercises: { id: string }[] };
const curricula: Record<LinuxCourse, { chapters: RawChapter[] }> = {
  'linux-fundamentals': fundamentals as { chapters: RawChapter[] },
  'linux-intermediate': intermediate as { chapters: RawChapter[] },
  'linux-advanced': advanced as { chapters: RawChapter[] },
};

export interface ChapterBriefing {
  course: LinuxCourse;
  number: number;
  title: string;
  summary: string;
  skills: string[];
  missionIds: string[];
}

export const chapterBriefings: ChapterBriefing[] = linuxCourses.flatMap((course) =>
  curricula[course].chapters.map((chapter) => ({
    course,
    number: chapter.number,
    title: chapter.title,
    summary: chapter.summary ?? '',
    skills: chapter.skills ?? [],
    missionIds: chapter.exercises.map((e) => e.id),
  })),
);

export function chapterForMission(missionId: string) {
  return chapterBriefings.find((c) => c.missionIds.includes(missionId));
}

/** Course orientation shown before the first mission of Linux Fundamentals. */
export const orientation = {
  title: 'Orientation: how the Linux courses work',
  intro:
    'Almost every server, cloud system, security tool and hacking lab runs Linux, and you control it through the command line. These courses teach that command line by having you use it: every mission drops you into your own Linux environment with one small job to do.',
  why: [
    'Security work happens in terminals. Reading logs, finding files, checking permissions and chaining tools are daily tasks for defenders and penetration testers.',
    'Typing the commands yourself builds muscle memory that reading alone never will.',
    'Each mission is small, so you always know exactly what you just learned.',
  ],
  steps: [
    { title: 'Read the lesson', body: 'The left side of each mission is a full written lesson with worked examples you can follow along with.' },
    { title: 'Work in your terminal', body: 'The terminal on the right is your own private Linux environment. It saves automatically. Experiment freely: wrong commands never fail a mission.' },
    { title: 'Capture the flag', body: 'Somewhere in your environment is a flag that looks like CYBER{3f9a...}. Completing the task is how you find it. Highlight it with your mouse to copy it.' },
    { title: 'Submit and level up', body: 'Paste the flag into the box under the terminal. A correct flag earns XP, unlocks the next mission and moves you up the leaderboard.' },
  ],
  tips: [
    'Press Tab to autocomplete commands and file names. Press it twice to see the options.',
    'Use the up arrow to bring back a previous command.',
    'Type help to list commands, or man ls to read the manual for one.',
    'Stuck? Every mission has hints, and Reset gives you a fresh environment.',
    'Flags are unique to you and to each mission, so copying someone else\'s won\'t work.',
  ],
  structure:
    'Linux is taught across three courses. Linux Fundamentals (this one) is free and covers the basics. Intermediate Linux adds searching, pipes, redirection and permissions (its first chapter is free). Advanced Linux goes deep into composition, scripting and the root-owned Operator tier. Each course is a sequence of missions, and each mission unlocks the next.',
};
