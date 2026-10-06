import { missions, type Mission } from './challenges';
export type Learner = { subscriptionTier: string; subscriptionStatus: string | null; subscriptionEndsAt: Date | null };
export function hasLinuxPro(user: Learner, now = new Date()) {
  return user.subscriptionTier === 'pro' && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'canceled' && !!user.subscriptionEndsAt && user.subscriptionEndsAt > now);
}
export function prerequisite(m: Mission) { const i = missions.findIndex(item => item.id === m.id); return i > 0 ? missions[i - 1].id : undefined; }
export function accessError(m: Mission, user: Learner, completed: string[]) {
  if (m.level !== 'beginner' && !hasLinuxPro(user)) return 'Intermediate and advanced Linux missions require an active paid subscription.';
  const previous = prerequisite(m);
  if (previous && !completed.includes(previous)) return 'Capture the flag in the preceding mission before starting this one.';
  return null;
}
