"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, PasswordStrengthMeter } from "@/components/ui";

import { OAuthButtons } from "./OAuthButtons";
import { safeAuthRedirect, type OAuthProviderId } from "@/lib/auth/oauth";

export function SignupForm({ providers, callbackUrl }: { providers: OAuthProviderId[]; callbackUrl?: string }) {
  const redirectTo = safeAuthRedirect(callbackUrl);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Create account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Auto sign in after successful signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but failed to sign in. Please log in manually.");
        setIsLoading(false);
        router.push("/login");
        return;
      }

      // Redirect to dashboard
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div role="alert" className="mb-6 border-2 border-l-[6px] border-cyber-ink border-l-cyber-danger bg-cyber-ink px-4 py-3 font-ui text-cyber-danger">
          {error}
        </div>
      )}

      <OAuthButtons providers={providers} callbackUrl={redirectTo} disabled={isLoading} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
          required
          disabled={isLoading}
        />

        <Input
          label="Username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="johndoe123"
          required
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          required
          disabled={isLoading}
        />

        <div>
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••••••"
            required
            disabled={isLoading}
          />

          <PasswordStrengthMeter password={formData.password} />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-cyber-text-secondary">
        By creating an account, you agree to our{" "}
        <a href="/terms" className="text-cyber-primary hover:text-cyber-secondary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-cyber-primary hover:text-cyber-secondary">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
