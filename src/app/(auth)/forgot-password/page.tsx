import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Forgot password - CyberCodex",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password?"
      subtitle="No worries. Enter your email and we'll send you a reset link."
      windowTitle="recover.exe"
      mood="really"
      footer={
        <Link href="/login" className="font-ui text-cyber-primary hover:underline">
          ◀ Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
