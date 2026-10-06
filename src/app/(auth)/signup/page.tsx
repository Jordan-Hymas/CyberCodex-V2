import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Sign up - CyberCodex",
  description: "Create your CyberCodex account",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="New player"
      subtitle="Make an account to save progress, earn XP and join the leaderboard."
      windowTitle="new_player.exe"
      mood="cheers"
      art="/images/banners/fish.gif"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-ui text-cyber-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
