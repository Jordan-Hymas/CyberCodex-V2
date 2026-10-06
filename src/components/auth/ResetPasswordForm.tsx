"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, PasswordStrengthMeter, Alert } from "@/components/ui";
import { cn } from "@/lib/utils";
import { validatePasswordStrength } from "@/lib/utils/password-validation";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Client-side validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setIsLoading(false);
      return;
    }

    const { isValid, errors } = validatePasswordStrength(passwords.newPassword);
    if (!isValid) {
      setMessage({ type: "error", text: errors[0] });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setMessage({
        type: "success",
        text: "Password reset successfully! Redirecting to login...",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="New Password"
        type="password"
        value={passwords.newPassword}
        onChange={(e) =>
          setPasswords({ ...passwords, newPassword: e.target.value })
        }
        placeholder="Enter your new password (min 12 characters)"
        required
        fullWidth
      />

      <PasswordStrengthMeter password={passwords.newPassword} />

      <Input
        label="Confirm New Password"
        type="password"
        value={passwords.confirmPassword}
        onChange={(e) =>
          setPasswords({ ...passwords, confirmPassword: e.target.value })
        }
        placeholder="Confirm your new password"
        required
        fullWidth
      />

      {/* Password Requirements */}
      <div className="border-2 border-dashed border-cyber-border p-4">
        <p className="text-sm text-cyber-text-secondary mb-2">Password requirements:</p>
        <ul className="text-xs text-cyber-text-muted space-y-1">
          <li>• At least 12 characters long</li>
          <li>• Mix of uppercase and lowercase letters</li>
          <li>• At least one number</li>
          <li>• At least one special character</li>
        </ul>
      </div>

      {message && (
        <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>
      )}

      <Button type="submit" isLoading={isLoading} fullWidth>
        Reset Password
      </Button>
    </form>
  );
}
