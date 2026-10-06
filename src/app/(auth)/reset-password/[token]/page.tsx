import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Reset password - CyberCodex",
  description: "Choose a new password",
};

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  // params is a Promise in Next 15+; reading it synchronously gave an undefined token
  const { token } = await params;

  return (
    <AuthShell
      title="Reset password"
      subtitle="Pick a new password. Make it a strong one."
      windowTitle="reset.exe"
      mood="smart"
      footer={
        <Link href="/login" className="font-ui text-cyber-primary hover:underline">
          ◀ Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
