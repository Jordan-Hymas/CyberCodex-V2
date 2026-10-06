"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Modal, Input } from "@/components/ui";

interface AccountTabProps {
  user: any;
}

export function AccountTab({ user }: AccountTabProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const handleExportData = async () => {
    setIsExportLoading(true);
    try {
      const response = await fetch("/api/user/export-data");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to export data");
      }

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybercodex-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert("Failed to export data: " + error.message);
    } finally {
      setIsExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }

    setIsDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: "/" });
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and membership status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <InfoRow label="Account Type" value="Free" />
            <InfoRow label="Member Since" value={new Date(user.createdAt || Date.now()).toLocaleDateString()} />
            <InfoRow label="User ID" value={user.id} />
            <InfoRow label="Email" value={user.email} />
          </div>

          <div className="mt-6 p-4 border-2 border-cyber-ink bg-cyber-ink">
            <h4 className="font-medium text-cyber-text-primary mb-2">Upgrade to Pro</h4>
            <p className="text-sm text-cyber-text-secondary mb-4">
              Get access to premium courses, advanced labs, and exclusive content
            </p>
            <Button variant="primary" size="sm">
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download a copy of your account data, progress, and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyber-text-secondary text-sm">
                We'll prepare a JSON file with all your data that you can download
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleExportData}
              isLoading={isExportLoading}
            >
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Delete Account */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle className="text-cyber-danger">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-l-[6px] border-cyber-ink border-l-cyber-danger bg-cyber-ink p-4">
            <h4 className="text-cyber-danger font-medium mb-2">Delete Account</h4>
            <p className="text-sm text-cyber-text-secondary mb-4">
              Once you delete your account, there is no going back. All your progress,
              achievements, and data will be permanently deleted.
            </p>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setConfirmText("");
          setDeleteError("");
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-cyber-text-secondary">
            This action cannot be undone. This will permanently delete your account
            and remove all your data from our servers.
          </p>

          <div className="border-2 border-l-[6px] border-cyber-ink border-l-cyber-danger bg-cyber-ink p-4">
            <p className="text-sm text-cyber-danger font-medium mb-2">
              ⚠️ Warning: This is irreversible
            </p>
            <ul className="text-sm text-cyber-text-secondary space-y-1">
              <li>• All your course progress will be lost</li>
              <li>• All your achievements and badges will be deleted</li>
              <li>• Your username will be available for others to use</li>
              <li>• You will be immediately signed out</li>
            </ul>
          </div>

          <Input
            label='Type "DELETE" to confirm'
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            fullWidth
            error={deleteError}
          />

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setConfirmText("");
                setDeleteError("");
              }}
              fullWidth
              disabled={isDeleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={isDeleteLoading}
              disabled={confirmText !== "DELETE"}
              fullWidth
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between p-3 border-2 border-cyber-ink bg-cyber-ink">
      <span className="text-sm text-cyber-text-muted">{label}</span>
      <span className="text-sm font-medium text-cyber-text-primary">{value}</span>
    </div>
  );
}
