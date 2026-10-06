/**
 * Course orientation and per-chapter briefings for Linux Fundamentals.
 * Chapter membership comes from content/courses/linux-fundamentals/curriculum.json.
 */
import curriculum from '../../../content/courses/linux-fundamentals/curriculum.json';

export interface ChapterBriefing {
  number: number;
  title: string;
  /** One or two sentences: why this chapter matters */
  summary: string;
  /** What the learner will be able to do afterwards */
  skills: string[];
  missionIds: string[];
}

const briefings: Record<number, { summary: string; skills: string[] }> = {
  1: {
    summary: 'Get comfortable typing commands. You will read files, ask the system who you are, and work out where you are standing in the filesystem.',
    skills: ['Run a command and read its output', 'Read files with cat', 'Check your identity with whoami and id', 'Find your location with pwd and list files with ls (including hidden ones)'],
  },
  2: {
    summary: 'Move around the filesystem with confidence. Paths are how every Linux tool finds things, so this chapter makes absolute and relative paths second nature.',
    skills: ['Change directories with cd (and jump back with cd -)', 'Read files anywhere using absolute paths', 'Use the built-in manual with man and help', 'Navigate with relative paths like ../'],
  },
  3: {
    summary: 'Change things, not just read them. You will handle awkward filenames, copy and rename files, then prove it all in the beginner checkpoint.',
    skills: ['Quote filenames that contain spaces', 'Copy files with cp and rename them with mv', 'Combine everything to solve a multi-step checkpoint'],
  },
  4: {
    summary: 'Real systems have thousands of files and huge logs. Learn to find the one line or file that matters.',
    skills: ['Search text with grep', 'Locate files with find', 'Match many files at once with wildcards (globs)', 'Show just the start or end of a file with head and tail'],
  },
  5: {
    summary: 'Connect commands together. Pipes and redirection are what make the shell powerful: small tools chained into exactly the output you want.',
    skills: ['Send one command\'s output into another with |', 'Write output to files with > and append with >>', 'Count and filter duplicates with sort and uniq'],
  },
  6: {
    summary: 'Pull data apart and deal with locked files. Security work constantly involves extracting fields, decoding data and fixing permissions.',
    skills: ['Extract columns with cut', 'Decode base64 data', 'Read and change permissions with stat and chmod', 'Solve the intermediate checkpoint'],
  },
  7: {
    summary: 'Compose tools like a professional: feed files in as input, keep copies of evidence while you work, and spot what changed between versions.',
    skills: ['Use input redirection with <', 'Save output while viewing it with tee', 'Compare files with diff', 'Transform text with rev'],
  },
  8: {
    summary: 'Make the shell remember things and recover from problems. Variables, directory permissions and conditional commands appear in every real script.',
    skills: ['Set and use variables with export and $NAME', 'Understand directory permissions', 'Run commands conditionally with && and ||', 'Count records with wc'],
  },
  9: {
    summary: 'Put it all together. These checkpoints chain several skills into one task, the way real investigations and automation work.',
    skills: ['Normalize text with tr', 'Sort numbers correctly with sort -n', 'Clean up a workspace safely', 'Complete the final advanced relay'],
  },
};

export const chapterBriefings: ChapterBriefing[] = curriculum.chapters.map((chapter) => ({
  number: chapter.number,
  title: chapter.title,
  missionIds: chapter.exercises.map((e) => e.id),
  ...(briefings[chapter.number] ?? { summary: chapter.description ?? '', skills: [] }),
}));

export function chapterForMission(missionId: string) {
  return chapterBriefings.find((c) => c.missionIds.includes(missionId));
}

/** Course orientation shown before the first mission. */
export const orientation = {
  title: 'Orientation: how Linux Fundamentals works',
  intro:
    'Almost every server, cloud system, security tool and hacking lab runs Linux, and you control it through the command line. This course teaches that command line by having you use it: every mission drops you into your own Linux environment with one small job to do.',
  why: [
    'Security work happens in terminals. Reading logs, finding files, checking permissions and chaining tools are daily tasks for defenders and penetration testers.',
    'Typing the commands yourself builds muscle memory that reading alone never will.',
    'Each mission is small, so you always know exactly what you just learned.',
  ],
  steps: [
    { title: 'Read the briefing', body: 'The left side of each mission explains one idea, shows an example and tells you exactly what to do.' },
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
    'There are nine chapters in three tiers. Beginner chapters (1–3) are free. Intermediate (4–6) and Advanced (7–9) are part of Elite. Each tier ends with a checkpoint mission that combines everything from that tier.',
};
