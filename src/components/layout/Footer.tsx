import Link from "next/link";
import { config } from "@/lib/config";
import { PixelLogo, Wordmark } from "@/components/brand";

type FooterLink = { label: string; href: string; soon?: boolean };

const socialIcons = {
  github: { label: "GitHub", path: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" },
  twitter: { label: "X (Twitter)", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  discord: { label: "Discord", path: "M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" },
} as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: {
      title: "Platform",
      links: [
        { label: "Courses", href: "/courses" },
        { label: "Labs", href: "/labs" },
        { label: "Community", href: "/community" },
        { label: "Certifications", href: "/certifications", soon: true },
      ],
    },
    resources: {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs", soon: true },
        { label: "Blog", href: "/blog", soon: true },
        { label: "Tutorials", href: "/tutorials", soon: true },
        { label: "Tools", href: "/tools", soon: true },
      ],
    },
    company: {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Pricing", href: "/pricing" },
        { label: "Contact", href: "/contact", soon: true },
        { label: "Careers", href: "/careers", soon: true },
      ],
    },
    legal: {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy", soon: true },
        { label: "Terms of Service", href: "/terms", soon: true },
        { label: "Cookie Policy", href: "/cookies", soon: true },
        { label: "Responsible Disclosure", href: "/disclosure", soon: true },
      ],
    },
  };

  const socials = (Object.keys(socialIcons) as (keyof typeof socialIcons)[]).filter((key) => config.social[key]);

  return (
    <footer className="border-t-[3px] border-cyber-ink bg-cyber-dark-secondary">
      <div className="container-custom py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-3" aria-label="CyberCodex home">
              <PixelLogo size={44} />
              <Wordmark />
            </Link>
            <p className="max-w-xs text-cyber-text-secondary">
              Learn cybersecurity by doing it: lessons, browser labs and XP for every exercise.
            </p>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-3">
                {socials.map((key) => (
                  <a
                    key={key}
                    href={config.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialIcons[key].label}
                    className="grid h-10 w-10 place-items-center border-2 border-cyber-ink bg-cyber-dark-tertiary text-cyber-text-primary shadow-[3px_3px_0_0_var(--color-cyber-ink)] transition-colors duration-100 hover:bg-cyber-primary hover:text-cyber-ink"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={socialIcons[key].path} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          <div className="col-span-2 grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-4">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="pixel-label mb-4 !text-[0.8rem] text-cyber-warning">{section.title}</h3>
                <ul className="space-y-2.5">
                  {(section.links as readonly FooterLink[]).map((link) => (
                    <li key={link.href}>
                      {link.soon ? (
                        <span className="flex items-center gap-2 text-cyber-text-muted" title="Coming soon">
                          {link.label}
                          <span className="border border-cyber-border px-1 font-ui text-[0.6rem] uppercase tracking-wider">
                            Soon
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-cyber-text-secondary transition-colors duration-100 hover:text-cyber-primary"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t-2 border-dashed border-cyber-border pt-6 text-sm text-cyber-text-muted md:flex-row md:items-start md:justify-between">
          <p className="shrink-0">© {currentYear} CyberCodex</p>
          <p className="max-w-3xl md:text-right">
            <strong className="text-cyber-text-secondary">Educational use only.</strong> Everything taught here is for
            authorized security testing, CTFs and learning. Using these techniques on systems you don&apos;t have
            permission to test may be illegal.
          </p>
        </div>
      </div>
    </footer>
  );
}
