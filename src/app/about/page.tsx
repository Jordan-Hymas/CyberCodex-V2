"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, ProgressBar } from "@/components/ui";
import { PageBanner } from "@/components/layout/PageBanner";
import { Mascot } from "@/components/brand";
import { cn } from "@/lib/utils";

const creatorLinks = [
    { label: "Github", href: "https://github.com/Jhymas20", path: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jordan-hymas/", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
    { label: "Tiktok", href: "https://www.tiktok.com/@node.io", path: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" },
];

const tabs = [
  { id: "journey", label: "Journey" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
] as const;

export default function AboutPage() {
 const values = [
  {
    backgroundGif: "/images/banners/GameSpooky3.gif",
    title: "Practical Learning",
    subtext:
      "Master cybersecurity through experience, not theory. Every course features interactive labs, capture-the-flag (CTF) missions, and real-world simulations that strengthen your skills through direct application. CyberCodex is built on one core belief, the best way to learn is by doing.",
    badge: "Hands-On Training",
  },
  {
    backgroundGif: "/images/banners/GameSpooky.gif",
    title: "Ethical Foundation",
    subtext:
      "Learn to protect and secure systems the right way. CyberCodex emphasizes ethical hacking, responsible disclosure, and understanding the legal boundaries of cybersecurity work. Our goal is to train professionals who lead with integrity and use their skills for good.",
    badge: "Hack Responsibly",
  },
  {
    backgroundGif: "/images/banners/shock.gif",
    title: "Always Evolving",
    subtext:
      "Cybersecurity never stands still, and neither do we. Our content is continuously updated to reflect the latest threats, vulnerabilities, and defense techniques. Learn modern tools, frameworks, and strategies that keep your knowledge sharp and industry-relevant.",
    badge: "Stay Ahead",
  },
  {
    backgroundGif: "/images/banners/GameSpooky2.gif",
    title: "Community & Collaboration",
    subtext:
      "CyberCodex is more than a platform, it’s a community of developers, students, and professionals who grow together. Connect with others, share insights, and collaborate on challenges that push your limits. Because the best security experts are the ones who never stop learning from each other.",
    badge: "Learn Together",
  },
];

  const [activeTab, setActiveTab] = useState<"about" | "skills" | "journey">("journey");

  const skills = [
    { category: "Frontend", items: [
      { name: "React", level: 80 },
      { name: "Next.js", level: 73 },
      { name: "TypeScript", level: 72 },
      { name: "UI/UX Design Principles", level: 75 }
    ]},
    { category: "Backend", items: [
      { name: "C, C++, C#", level: 80 },
      { name: "Python", level: 80 },
      { name: "PostgreSQL", level: 70 },
      { name: "API Design", level: 75 }
    ]},
    { category: "Security", items: [
      { name: "Penetration Testing", level: 78 },
      { name: "CCNA Certified", level: 85 },
      { name: "Network Security", level: 75 },
      { name: "Ethical Hacking", level: 80 }
    ]},
    { category: "Tools", items: [
      { name: "Git", level: 90 },
      { name: "Docker", level: 70 },
      { name: "Linux", level: 85 },
      { name: "Kali", level: 70 }
    ]},
  ];

  const journey = [
    { year: "2026", title: "Graduated College with B.S. in Cybersecurity and Computer Science", description: "Studied ethical hacking, network defense, and software engineering, bridging security and development through hands-on projects." },
    { year: "2025", title: "Launched CyberCodex.io", description: "Built and deployed a cybersecurity education platform focused on Linux, Python, and ethical hacking fundamentals. Designed branding, frontend, and backend architecture." },
    { year: "2024", title: "IT Network Technician - NPCE", description: "Supported enterprise networks, configured domain accounts, firewalls, and remote deployments across multiple client sites. Developed internal automation scripts to improve workflow." },
    { year: "2023", title: "Node.io & Automation SaaS Prototypes", description: "Prototyped Node.io and n8n-driven workflow automations for small businesses, automating daily reports, email triggers, and schedule notifications." },
  ];

  return (
    <main className="min-h-screen pb-24">
      <PageBanner
        image="/images/banners/space_banner.png"
        eyebrow="About"
        title="About CyberCodex"
        description="We're on a mission to democratize cybersecurity knowledge and empower the next generation of security professionals"
      />

      {/* Story */}
      <section className="container-custom pt-[var(--section-padding)]">
        <div className="grid items-center gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <p className="pixel-label mb-3 text-cyber-pink">Our story</p>
            <h2 className="text-display-2 mb-8">Learn by doing</h2>
            <p className="mb-5 text-lg leading-relaxed text-cyber-text-secondary">
              CyberCodex was born from a simple observation: cybersecurity education was either too theoretical or
              inaccessible to most people. We set out to change that by creating a platform where anyone, regardless
              of their background, could learn practical security skills through hands-on experience.
            </p>
            <p className="text-lg leading-relaxed text-cyber-text-secondary">
              Today, we're proud to serve a global community of learners, from curious beginners to seasoned professionals
              looking to expand their skillset. Every course, every lab, and every challenge is designed with one goal in mind:
              to make you a better security professional.
            </p>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="border-[3px] border-cyber-ink bg-cyber-secondary p-4 shadow-[8px_8px_0_0_var(--color-cyber-ink)]">
              <Mascot mood="hotCoffee" width={240} />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container-custom pt-[var(--section-padding)]">
        <p className="pixel-label mb-3 text-cyber-secondary">What we believe</p>
        <h2 className="text-display-2 mb-10">Four rules of the game</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {values.map((value) => (
            <article key={value.title} className="card !p-0">
              <div className="relative h-36 overflow-hidden border-b-[3px] border-cyber-ink">
                <Image src={value.backgroundGif} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <span className="absolute left-3 top-3 border-2 border-cyber-ink bg-cyber-warning px-2 py-0.5 pixel-label text-cyber-ink shadow-[2px_2px_0_0_var(--color-cyber-ink)]">
                  {value.badge}
                </span>
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-2xl text-cyber-primary">{value.title}</h3>
                <p className="leading-relaxed text-cyber-text-secondary">{value.subtext}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Creator */}
      <section className="container-custom pt-[var(--section-padding)]">
        <p className="pixel-label mb-3 text-cyber-warning">Meet the creator</p>
        <h2 className="text-display-2 mb-10">Player one</h2>
        <div className="pixel-panel grid md:grid-cols-[18rem_1fr]">
          {/* Character sheet */}
          <aside className="border-b-[3px] border-cyber-ink bg-cyber-dark-tertiary p-6 md:border-b-0 md:border-r-[3px]">
            <div className="mx-auto mb-5 w-fit border-[3px] border-cyber-ink bg-cyber-secondary p-3 shadow-[4px_4px_0_0_var(--color-cyber-ink)]">
              <Mascot mood="wakesUp" width={140} alt="Jordan Hymas" />
            </div>
            <div className="mb-5 text-center">
              <h3 className="text-2xl text-cyber-text-primary">Jordan Hymas</h3>
              <p className="font-ui text-cyber-primary">Founder & Developer</p>
              <p className="text-sm text-cyber-text-muted">Cyber Security • Computer Science</p>
            </div>
            <div className="mb-6 flex justify-center gap-3">
              {creatorLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="grid h-10 w-10 place-items-center border-2 border-cyber-ink bg-cyber-dark-secondary text-cyber-text-primary shadow-[3px_3px_0_0_var(--color-cyber-ink)] hover:bg-cyber-primary hover:text-cyber-ink"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={link.path} />
                  </svg>
                </a>
              ))}
            </div>
            <dl className="space-y-2 font-ui text-sm">
              {[
                ["Location", "United States"],
                ["Experience", "4+ Years"],
                ["Projects", "20+ Completed"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-2 border-cyber-ink bg-cyber-dark-secondary px-3 py-2">
                  <dt className="text-cyber-text-muted">{k}</dt>
                  <dd className="text-cyber-warning">{v}</dd>
                </div>
              ))}
            </dl>
          </aside>

          {/* Tabs */}
          <div className="min-w-0 p-6 md:p-8">
            <div role="tablist" aria-label="About the creator" className="mb-8 flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "border-2 border-cyber-ink px-4 py-2 font-ui transition-colors duration-100",
                    activeTab === tab.id
                      ? "bg-cyber-primary text-cyber-ink"
                      : "bg-cyber-dark-tertiary text-cyber-text-secondary shadow-[3px_3px_0_0_var(--color-cyber-ink)] hover:text-cyber-text-primary"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="animate-fade-in" key={activeTab}>
              {activeTab === "journey" && (
                <ol className="relative space-y-5 before:absolute before:bottom-4 before:left-[0.95rem] before:top-4 before:border-l-[3px] before:border-dashed before:border-cyber-border">
                  {journey.map((item) => (
                    <li key={item.year + item.title} className="relative flex gap-4">
                      <span className="relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center border-2 border-cyber-ink bg-cyber-warning shadow-[2px_2px_0_0_var(--color-cyber-ink)]" aria-hidden="true">
                        <span className="h-2 w-2 bg-cyber-ink" />
                      </span>
                      <div className="flex-1 border-2 border-cyber-ink bg-cyber-dark-tertiary p-4">
                        <span className="pixel-label text-cyber-warning">{item.year}</span>
                        <h4 className="mb-1 text-cyber-text-primary">{item.title}</h4>
                        <p className="text-sm leading-relaxed text-cyber-text-secondary">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {activeTab === "about" && (
                        <div className="space-y-4 text-cyber-text-secondary leading-relaxed">
                          <p>
                            IT and Network Technician with a dual focus in Computer Science and Cybersecurity, passionate about creating tools and
                            experiences that make learning technology both practical and engaging. I built CyberCodex to turn complex security topics
                            into interactive, hands-on lessons that empower learners to build confidence through real application.
                          </p>
                          <p>
                            Combining my academic background with real-world IT experience, I’ve worked across network management, system support, and
                            software development. Those experiences taught me that the best way to understand cybersecurity is through direct practice, 
                            a belief that drives every course, lab, and challenge on CyberCodex. My goal is to make technical education approachable while
                            still grounded in professional standards used throughout the industry.
                          </p>
                          <p>
                            When I’m not developing new features or refining lessons, you’ll usually find me:
                          </p>
                          <ul className="space-y-2 pl-1">
                            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-cyber-primary" aria-hidden="true" /><span>Playing basketball, I played at the college level and still love staying active on the court</span></li>
                            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-cyber-primary" aria-hidden="true" /><span>Creating cybersecurity and coding content for my TikTok audience to inspire new learners</span></li>
                            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-cyber-primary" aria-hidden="true" /><span>Exploring new penetration-testing tools, automation workflows, and open-source security projects</span></li>
                            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-cyber-primary" aria-hidden="true" /><span>Helping others get started in IT, coding, and cybersecurity through mentoring and tutorials</span></li>
                          </ul>
                          <p className="border-l-[6px] border-cyber-primary bg-cyber-dark-tertiary px-4 py-3 font-ui text-cyber-text-primary">
                            "I believe the best way to learn cybersecurity is by doing, that’s why every course on CyberCodex is built around hands-on practice and real-world challenges."
                          </p>
                        </div>
              )}

              {activeTab === "skills" && (
                <div className="grid gap-8 sm:grid-cols-2">
                  {skills.map((group) => (
                    <div key={group.category}>
                      <h4 className="mb-4 text-cyber-secondary">{group.category}</h4>
                      <div className="space-y-4">
                        {group.items.map((skill) => (
                          <ProgressBar key={skill.name} label={skill.name} value={skill.level} showPercentage size="sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-custom pt-[var(--section-padding)]">
        <div className="relative overflow-hidden border-[3px] border-cyber-ink shadow-[10px_10px_0_0_var(--color-cyber-ink)]">
          <Image src="/images/banners/GameSpooky.gif" alt="" fill unoptimized sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-cyber-dark/75" />
          <div className="relative flex flex-col items-center gap-6 px-6 py-14 text-center md:py-20">
            <Mascot mood="hi" width={110} />
            <h2 className="text-display-2">Ready to start your journey?</h2>
            <p className="max-w-xl text-lg text-cyber-text-secondary">
              Join our community of learners and take the first step toward becoming a cybersecurity professional
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button href="/courses" size="lg">
                Browse courses
              </Button>
              <Button href="/pricing" variant="secondary" size="lg">
                View pricing
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
