import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { WindowBar } from "@/components/ui";
import { Mascot, type MascotMood } from "@/components/brand";

export interface AuthShellProps {
  title: string;
  subtitle: string;
  windowTitle: string;
  mood?: MascotMood;
  art?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Two-panel layout for sign in / sign up / password pages. */
export function AuthShell({
  title,
  subtitle,
  windowTitle,
  mood = "hi",
  art = "/images/banners/cityBackground.gif",
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="container-custom grid min-h-screen items-center gap-10 pt-28 pb-20 lg:grid-cols-2">
      {/* Art panel */}
      <div className="relative hidden h-full max-h-[640px] overflow-hidden border-[3px] border-cyber-ink shadow-[10px_10px_0_0_var(--color-cyber-ink)] lg:block">
        <Image src={art} alt="" fill unoptimized priority sizes="50vw" className="pixelated object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark via-cyber-dark/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-8">
          <Mascot mood={mood} width={130} className="drop-shadow-[4px_4px_0_var(--color-cyber-ink)]" />
          <Link href="/courses" className="mb-4 font-ui text-cyber-text-primary hover:text-cyber-primary">
            Browse the courses first ▶
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-display-2 mb-3">{title}</h1>
        <p className="mb-8 text-lg text-cyber-text-secondary">{subtitle}</p>
        <div className="pixel-panel !shadow-[8px_8px_0_0_var(--color-cyber-ink)]">
          <WindowBar title={windowTitle} />
          <div className="p-6 sm:p-8">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-cyber-text-secondary">{footer}</div>}
      </div>
    </main>
  );
}
