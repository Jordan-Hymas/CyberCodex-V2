"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Input } from "@/components/ui";
import { Upload } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

export function EditProfileModal({ isOpen, onClose, userData }: EditProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState(userData.bio || "");
  const [imageUrl, setImageUrl] = useState(userData.image || "");
  const [bannerUrl, setBannerUrl] = useState(userData.banner || "");

  const MAX_BIO_LENGTH = 160;
  const remainingChars = MAX_BIO_LENGTH - bio.length;

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio,
          image: imageUrl || undefined,
          banner: bannerUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the page to show updated data
        router.refresh();
        onClose();
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <div>

        <div className="space-y-6">
          {/* Banner URL */}
          <div>
            <label className="block text-sm font-medium text-cyber-text-secondary mb-2">
              Banner Image URL
            </label>
            <Input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="w-full"
            />
            <p className="text-xs text-cyber-text-muted mt-1">
              Paste a URL to an image for your profile banner (recommended: 1200x300px)
            </p>
          </div>

          {/* Profile Image URL */}
          <div>
            <label className="block text-sm font-medium text-cyber-text-secondary mb-2">
              Profile Picture URL
            </label>
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full"
            />
            <p className="text-xs text-cyber-text-muted mt-1">
              Paste a URL to an image for your profile picture
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-cyber-text-secondary mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= MAX_BIO_LENGTH) {
                  setBio(e.target.value);
                }
              }}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell us about yourself..."
              className="pixel-input w-full min-h-[100px] p-3"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-cyber-text-muted">
                Share a bit about yourself
              </p>
              <p className={`text-xs ${remainingChars < 20 ? "text-cyber-warning" : "text-cyber-text-muted"}`}>
                {remainingChars} / {MAX_BIO_LENGTH}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
