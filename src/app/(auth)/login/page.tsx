import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Sign in - CyberCodex",
  description: "Sign in to your CyberCodex account",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; verified?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, verified, error } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Continue where you left off."
      windowTitle="login.exe"
      mood="hi"
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-ui text-cyber-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} verified={verified === "true"} errorCode={error} />
    </AuthShell>
  );
}
