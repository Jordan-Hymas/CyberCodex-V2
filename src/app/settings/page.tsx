import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const metadata = {
  title: "Settings - CyberCodex.io",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/settings");
  }

  return (
    <main className="min-h-screen pt-28 pb-24 md:pt-32">
      <div className="container-custom">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="pixel-label mb-3 text-cyber-pink">Options</p>
            <h1 className="text-display-2 mb-3">Settings</h1>
            <p className="text-cyber-text-secondary">Manage your account settings and preferences</p>
          </div>

          {/* Settings Tabs */}
          <SettingsTabs user={session.user} />
        </div>
      </div>
    </main>
  );
}
