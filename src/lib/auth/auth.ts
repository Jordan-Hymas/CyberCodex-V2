import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/db/prisma";
import authConfig from "./auth.config";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "./password";
import { devAdminLogin } from "./dev-admin";

/** Standard email + Argon2 password check. Returns null on any failure. */
async function findVerifiedUser(credentials: unknown) {
  const validatedFields = loginSchema.safeParse(credentials);
  if (!validatedFields.success) return null;

  const { email, password } = validatedFields.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Generic failure to prevent user enumeration
  if (!user || !user.password) return null;

  // Verify password using Argon2 (Node.js only)
  const isValid = await verifyPassword(user.password, password);
  return isValid ? user : null;
}

/**
 * Main Auth.js configuration with Prisma adapter
 * Includes Credentials provider (requires Node.js runtime for Argon2)
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt", // Use JWT for credentials provider (edge-compatible)
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [
    // Add Credentials provider here (requires Node.js runtime)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TEMPORARY: dev-only admin/admin shortcut. Remove before launch.
        const devAdmin = await devAdminLogin(credentials?.email, credentials?.password);

        const user = devAdmin ?? (await findVerifiedUser(credentials));
        if (!user) return null;

        // Return user object with all fields (will be available in session)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          emailVerified: user.emailVerified,
          level: user.level,
          xp: user.xp,
          totalXp: user.totalXp,
          streak: user.streak,
          rank: user.rank,
          subscriptionTier: user.subscriptionTier,
        };
      },
    }),
    // OAuth providers from authConfig (edge-compatible)
    ...authConfig.providers,
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - add custom fields to token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.emailVerified = user.emailVerified;
        token.level = user.level;
        token.xp = user.xp;
        token.totalXp = user.totalXp;
        token.streak = user.streak;
        token.rank = user.rank;
        token.subscriptionTier = user.subscriptionTier;
      }

      // JWT subject is the signed identity; never trust a client-supplied id.
      if (token.sub) token.id = token.sub;

      // Handle session updates
      if (trigger === "update" && session) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (fresh) {
          token.username = fresh.username;
          token.emailVerified = fresh.emailVerified;
          token.level = fresh.level;
          token.xp = fresh.xp;
          token.totalXp = fresh.totalXp;
          token.streak = fresh.streak;
          token.rank = fresh.rank;
          token.subscriptionTier = fresh.subscriptionTier;
          token.name = fresh.name;
          token.picture = fresh.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add custom fields from token to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.level = token.level as number;
        session.user.xp = token.xp as number;
        session.user.totalXp = token.totalXp as number;
        session.user.streak = token.streak as number;
        session.user.rank = token.rank as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Initialize new user with default gamification values
      await prisma.user.update({
        where: { id: user.id },
        data: {
          level: 1,
          xp: 0,
          totalXp: 0,
          streak: 0,
          rank: "Novice",
          subscriptionTier: "free",
        },
      });
    },
    async signIn({ user, isNewUser }) {
      // Update last active on every sign in
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      // Check and update streak
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { lastActive: true, streak: true },
      });

      if (userData) {
        const now = new Date();
        const lastActive = new Date(userData.lastActive);
        const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          // Same day, no streak change
        } else if (hoursDiff < 48) {
          // Next day, increment streak
          await prisma.user.update({
            where: { id: user.id },
            data: { streak: userData.streak + 1 },
          });
        } else {
          // Streak broken, reset to 1
          await prisma.user.update({
            where: { id: user.id },
            data: { streak: 1 },
          });
        }
      }
    },
  },
});
