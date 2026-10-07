"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Alert, Button, Input } from "@/components/ui";

import { OAuthButtons } from "./OAuthButtons";
import { safeAuthRedirect, type OAuthProviderId } from "@/lib/auth/oauth";

const statusMessages: Record<string, string> = {
  OAuthAccountNotLinked: "An account already uses this email. Sign in with your original sign-in method. Accounts are not merged automatically.",
  VerifiedEmailRequired: "Please verify an email address with Google or GitHub, then try again.",
  OAuthCallbackError: "The provider could not finish signing you in. Please try again.",
  OAuthSignin: "This sign-in provider is unavailable. Please try another method.",
  Configuration: "Sign-in is temporarily unavailable. Please try again later.",
  AccessDenied: "Sign-in was not approved. Please try again or use another method.",
  invalid_token: "That verification link is invalid. Request a new one below.",
  token_expired: "That verification link has expired. Request a new one below.",
  user_not_found: "We couldn't find an account for that link.",
  verification_failed: "Email verification failed. Please try again.",
};

export interface LoginFormProps {
  callbackUrl?: string;
  providers: OAuthProviderId[];
  verified?: boolean;
  errorCode?: string;
}

export function LoginForm({ callbackUrl, verified, errorCode, providers }: LoginFormProps) {
  const redirectTo = safeAuthRedirect(callbackUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorCode ? statusMessages[errorCode] ?? "Sign in failed. Please try again." : null
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      window.location.href = redirectTo;
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {verified && !error && (
        <Alert variant="success" className="mb-6">
          Email verified! You can sign in now.
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <OAuthButtons providers={providers} callbackUrl={redirectTo} disabled={isLoading} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email or username"
          type="text"
          autoComplete="username"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          required
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••••••"
          required
          disabled={isLoading}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="font-ui text-sm text-cyber-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

    </div>
  );
}
