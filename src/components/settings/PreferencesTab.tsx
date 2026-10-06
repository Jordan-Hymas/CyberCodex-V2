"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Alert } from "@/components/ui";

interface PreferencesTabProps {
  user: any;
}

export function PreferencesTab({ user }: PreferencesTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    courseUpdates: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update preferences");
      }

      setMessage({ type: "success", text: "Preferences updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what emails you want to receive from CyberCodex
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email Notification Toggles */}
            <ToggleItem
              label="Email Notifications"
              description="Receive email notifications for important updates"
              checked={preferences.emailNotifications}
              onChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
            />

            <ToggleItem
              label="Course Updates"
              description="Get notified when new courses or content is available"
              checked={preferences.courseUpdates}
              onChange={(checked) =>
                setPreferences({ ...preferences, courseUpdates: checked })
              }
            />

            <ToggleItem
              label="Weekly Digest"
              description="Receive a weekly summary of your progress and achievements"
              checked={preferences.weeklyDigest}
              onChange={(checked) =>
                setPreferences({ ...preferences, weeklyDigest: checked })
              }
            />

            <ToggleItem
              label="Marketing Emails"
              description="Receive promotional emails and special offers"
              checked={preferences.marketingEmails}
              onChange={(checked) =>
                setPreferences({ ...preferences, marketingEmails: checked })
              }
            />
          </div>

          {/* Message */}
          {message && (
            <Alert className="mt-6" variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} isLoading={isLoading}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences (Future) */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how CyberCodex looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 border-cyber-ink bg-cyber-ink">
              <div>
                <p className="font-medium text-cyber-text-primary">Theme</p>
                <p className="text-sm text-cyber-text-muted">Currently: Dark Mode</p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-cyber-ink bg-cyber-ink">
              <div>
                <p className="font-medium text-cyber-text-primary">Language</p>
                <p className="text-sm text-cyber-text-muted">Currently: English (US)</p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Toggle Item Component
interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleItem({ label, description, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border-2 border-cyber-ink bg-cyber-ink">
      <div className="flex-1">
        <p className="font-medium text-cyber-text-primary">{label}</p>
        <p className="text-sm text-cyber-text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center border-2 border-cyber-ink transition-colors duration-100",
          checked ? "bg-cyber-primary" : "bg-cyber-dark-tertiary"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 border-2 border-cyber-ink bg-cyber-text-primary transition-transform duration-100",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

