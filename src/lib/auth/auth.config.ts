import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible Auth.js configuration
 * This config is used in middleware (edge runtime)
 *
 * IMPORTANT: Only OAuth providers here. No Credentials provider.
 * Credentials provider requires Node.js runtime (Argon2 password hashing)
 * and is added in auth.ts instead.
 */
export default {
  providers: [
    // OAuth Providers (Edge-compatible)
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking OAuth to existing email
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
