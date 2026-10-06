"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from "@/components/ui";

interface SecurityTabProps {
  user: any;
}

export function SecurityTab({ user }: SecurityTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 12) {
      setMessage({ type: "error", text: "Password must be at least 12 characters long" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              placeholder="Enter your current password"
              fullWidth
              required
            />

            <Input
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              placeholder="Enter your new password (min 12 characters)"
              fullWidth
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              placeholder="Confirm your new password"
              fullWidth
              required
            />

            {/* Password Requirements */}
            <div className="p-4 border-2 border-cyber-ink bg-cyber-ink">
              <p className="text-sm text-cyber-text-secondary mb-2">Password requirements:</p>
              <ul className="text-xs text-cyber-text-muted space-y-1">
                <li>• At least 12 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• At least one number</li>
                <li>• At least one special character</li>
              </ul>
            </div>

            {/* Message */}
            {message && (
              <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>
            )}

            <div className="flex justify-end">
              <Button type="submit" isLoading={isLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Manage your email address and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 border-cyber-ink bg-cyber-ink">
              <div>
                <p className="text-cyber-text-primary font-medium">{user.email}</p>
                <p className="text-sm text-cyber-text-muted">
                  {user.emailVerified ? (
                    <span className="text-cyber-primary">✓ Verified</span>
                  ) : (
                    <span className="text-cyber-warning">⚠ Not verified</span>
                  )}
                </p>
              </div>
              {!user.emailVerified && (
                <Button variant="secondary" size="sm">
                  Verify Email
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions (Future Enhancement) */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices and locations where you're currently signed in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-cyber-text-secondary text-sm">
            Session management feature coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

