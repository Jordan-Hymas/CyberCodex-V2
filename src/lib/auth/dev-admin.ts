import prisma from "@/lib/db/prisma";

/**
 * TEMPORARY dev-only admin login: "admin" / "admin".
 * Skips password hashing/verification entirely. Disabled in production.
 * Delete this file and its call in auth.ts before launch.
 */
const DEV_ADMIN_EMAIL = "admin@cybercodex.io";

/** True only for the dev admin account, and never in production. */
export function isDevAdmin(email: string | null | undefined) {
  return process.env.NODE_ENV !== "production" && email === DEV_ADMIN_EMAIL;
}

/** Flip the dev admin between paid ("pro"/active) and free, for testing gated content. */
export async function setDevAdminPro(enabled: boolean) {
  if (process.env.NODE_ENV === "production") return null;
  return prisma.user.update({
    where: { email: DEV_ADMIN_EMAIL },
    data: enabled
      ? { subscriptionTier: "pro", subscriptionStatus: "active", subscriptionEndsAt: null }
      : { subscriptionTier: "free", subscriptionStatus: null, subscriptionEndsAt: null },
  });
}

export async function devAdminLogin(identifier: unknown, password: unknown) {
  if (process.env.NODE_ENV === "production") return null;
  if (identifier !== "admin" && identifier !== DEV_ADMIN_EMAIL) return null;
  if (password !== "admin") return null;

  // Upsert a real row so progress, badges etc. have a user to attach to.
  return prisma.user.upsert({
    where: { email: DEV_ADMIN_EMAIL },
    update: {},
    create: {
      email: DEV_ADMIN_EMAIL,
      username: "admin",
      name: "Admin User",
      emailVerified: new Date(),
      rank: "Admin",
      subscriptionTier: "pro",
      subscriptionStatus: "active",
    },
  });
}
