"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button, Alert } from "@/components/ui";
import { safeAuthRedirect, type OAuthProviderId } from "@/lib/auth/oauth";

export function OAuthButtons({ providers, callbackUrl, disabled = false }: { providers: OAuthProviderId[]; callbackUrl?: string; disabled?: boolean }) {
  const [pending, setPending] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function login(provider: OAuthProviderId) {
    setError(null);
    setPending(provider);
    try { await signIn(provider, { redirectTo: safeAuthRedirect(callbackUrl) }); }
    catch { setError("Could not connect. Please try again."); setPending(null); }
  }
  return <div className="mb-6 space-y-3">
    {error && <Alert variant="error">{error}</Alert>}
    <div className="grid gap-3 sm:grid-cols-2">
      {(["google", "github"] as const).map(provider => <Button key={provider} type="button" variant="secondary" fullWidth
        disabled={disabled || !!pending || !providers.includes(provider)} onClick={() => login(provider)}>
        {pending === provider ? "Connecting…" : `Continue with ${provider === "google" ? "Google" : "GitHub"}`}
      </Button>)}
    </div>
    {providers.length < 2 && <p className="text-sm text-cyber-text-secondary">Some sign-in options are temporarily unavailable. You can continue with email below.</p>}
    <p className="text-center text-sm text-cyber-text-muted">or continue with email</p>
  </div>;
}
