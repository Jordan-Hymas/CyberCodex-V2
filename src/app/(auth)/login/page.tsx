import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/ui";

export const metadata = {
  title: "Login - CyberCodex.io",
  description: "Sign in to your CyberCodex account",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; verified?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, verified, error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center py-20">
      <Container>
        <div className="flex flex-col items-center">
          <div className="text-center mb-12">
            <h1 className="text-display-2 gradient-text mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-cyber-text-secondary">
              Sign in to continue your cybersecurity journey
            </p>
          </div>

          <LoginForm callbackUrl={callbackUrl} verified={verified === "true"} errorCode={error} />

          <p className="mt-8 text-center text-sm text-cyber-text-secondary">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-cyber-primary hover:text-cyber-secondary font-medium"
            >
              Create one now
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
