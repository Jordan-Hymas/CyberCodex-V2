/** Shared policy; no credentials are returned to the browser. */
export type OAuthProviderId = "google" | "github";
export function configuredOAuthProviders(env: Record<string, string | undefined> = process.env): OAuthProviderId[] {
  const configured = (value?: string) => !!value?.trim() && !/^(your-|replace|placeholder)/i.test(value);
  return (["google", "github"] as const).filter(provider => {
    const prefix = `AUTH_${provider.toUpperCase()}`;
    return configured(env[`${prefix}_ID`]) && configured(env[`${prefix}_SECRET`]);
  });
}
export function safeAuthRedirect(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/dashboard";
  const base = "https://cybercodex.invalid";
  try {
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/dashboard";
  } catch { return "/dashboard"; }
}
export function verifiedOAuthEmail(provider: string, profile?: Record<string, unknown>): string | null {
  if (!profile || typeof profile.email !== "string" || !profile.email.includes("@")) return null;
  if (provider === "google" && profile.email_verified !== true) return null;
  if (provider === "github" && profile.email_verified !== true) return null;
  if (provider !== "google" && provider !== "github") return null;
  return profile.email.trim().toLowerCase();
}
export function selectGitHubEmail(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const verified = value.filter(item => item && item.verified === true && typeof item.email === "string" && item.email.includes("@"));
  const selected = verified.find(item => item.primary === true) ?? verified[0];
  return selected ? selected.email.trim().toLowerCase() : null;
}
