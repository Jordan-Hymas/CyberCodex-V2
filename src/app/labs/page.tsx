import { Button } from "@/components/ui";
import { PageBanner } from "@/components/layout/PageBanner";
import { MascotSays } from "@/components/brand";

export const metadata = {
  title: "Labs - CyberCodex",
  description: "Hands-on cybersecurity labs in your browser",
};

const plannedLabs = [
  { name: "Linux shell", status: "Playable now", detail: "A sandboxed terminal inside the Linux Fundamentals course.", live: true },
  { name: "Python sandbox", status: "Playable now", detail: "Write and test Python right in the Python course.", live: true },
  { name: "Web exploitation", status: "In development", detail: "Vulnerable practice apps for XSS, SQLi and auth bugs.", live: false },
  { name: "Network recon", status: "In development", detail: "Scan and map a simulated network safely.", live: false },
];

export default function LabsPage() {
  return (
    <main className="min-h-screen pb-24">
      <PageBanner
        image="/images/banners/shock.gif"
        eyebrow="Labs"
        title="Practice arenas"
        description="Hands-on environments where you can break things safely. More arenas are on the way."
      />

      <div className="container-custom pt-12">
        <ul className="mb-12 grid gap-6 md:grid-cols-2">
          {plannedLabs.map((lab) => (
            <li key={lab.name} className="pixel-panel flex flex-col gap-2 p-6">
              <span
                className={`w-fit border-2 border-cyber-ink px-2 py-0.5 pixel-label text-cyber-ink ${lab.live ? "bg-cyber-primary" : "bg-cyber-dark-tertiary !text-cyber-text-muted"}`}
              >
                {lab.status}
              </span>
              <h2 className="text-xl" style={{ fontFamily: "var(--font-ui)", fontSize: "1.35rem", fontWeight: 600 }}>
                {lab.name}
              </h2>
              <p className="text-cyber-text-secondary">{lab.detail}</p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-6">
          <MascotSays mood="hacker">Can&apos;t wait? The Linux terminal is already live in the first course.</MascotSays>
          <Button href="/courses/linux-fundamentals" size="lg">
            Open the Linux course ▶
          </Button>
        </div>
      </div>
    </main>
  );
}
