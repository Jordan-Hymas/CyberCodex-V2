import { missionsForCourse, courseOf, type Mission } from './challenges';
import { isDevAdmin } from '@/lib/auth/dev-admin';
export type Learner = { email?: string | null; subscriptionTier: string; subscriptionStatus: string | null; subscriptionEndsAt: Date | null };
export function hasLinuxPro(user: Learner, now = new Date()) {
  return user.subscriptionTier === 'pro' && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'canceled' && !!user.subscriptionEndsAt && user.subscriptionEndsAt > now);
}
/** The mission immediately before this one *within the same course* (undefined for a course's first mission). */
export function prerequisite(m: Mission) {
  const course = missionsForCourse(courseOf(m));
  const i = course.findIndex(item => item.id === m.id);
  return i > 0 ? course[i - 1].id : undefined;
}
export function accessError(m: Mission, user: Learner, completed: string[]) {
  // `paid` is set per mission in missions.json: free beginner course, free first intermediate chapter, everything else Elite.
  if (m.paid && !hasLinuxPro(user)) return 'This Linux mission is part of CyberCodex Elite. Upgrade to unlock it.';
  // TEMPORARY: dev admin with pro toggled on can open any mission out of order
  if (isDevAdmin(user.email) && hasLinuxPro(user)) return null;
  const previous = prerequisite(m);
  if (previous && !completed.includes(previous)) return 'Capture the flag in the preceding mission before starting this one.';
  return null;
}
