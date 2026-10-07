import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { configuredOAuthProviders, selectGitHubEmail } from "./oauth";

const enabled = configuredOAuthProviders();
export default {
  providers: [
    ...(enabled.includes("github") ? [GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // Never silently merge identities just because their email addresses match.
      allowDangerousEmailAccountLinking: false,
      userinfo: {
        url: "https://api.github.com/user",
        async request({ tokens }: { tokens: { access_token?: string } }) {
          const headers = { Authorization: `Bearer ${tokens.access_token}`, "User-Agent": "CyberCodex", Accept: "application/vnd.github+json" };
          const [profileResponse, emailsResponse] = await Promise.all([
            fetch("https://api.github.com/user", { headers, signal: AbortSignal.timeout(10000) }),
            fetch("https://api.github.com/user/emails", { headers, signal: AbortSignal.timeout(10000) }),
          ]);
          if (!profileResponse.ok || !emailsResponse.ok) throw new Error("GitHub identity verification failed");
          const profile = await profileResponse.json();
          const email = selectGitHubEmail(await emailsResponse.json());
          return { ...profile, email, email_verified: !!email };
        },
      },
    })] : []),
    ...(enabled.includes("google") ? [Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
      authorization: { params: { scope: "openid email profile" } },
      profile(profile) {
        return {
          id: profile.sub, name: profile.name, email: profile.email?.trim().toLowerCase(), image: profile.picture,
          username: null, emailVerified: null, level: 1, xp: 0, totalXp: 0, streak: 0, rank: "Novice", subscriptionTier: "free",
        };
      },
    })] : []),
  ],
  pages: { signIn: "/login", signOut: "/login", error: "/login" },
} satisfies NextAuthConfig;
