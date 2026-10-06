import Link from "next/link";
import { Mascot, type MascotMood } from "@/components/brand";

const cards: { title: string; description: string; href: string; mood: MascotMood; accent: string }[] = [
  { title: "Courses", description: "The full catalog, from Linux to malware analysis.", href: "/courses", mood: "smart", accent: "bg-cyber-secondary" },
  { title: "Labs", description: "Practice arenas where you can break things safely.", href: "/labs", mood: "hacker", accent: "bg-cyber-pink" },
  { title: "Community", description: "High scores, patch notes and fellow learners.", href: "/community", mood: "cheers", accent: "bg-cyber-warning" },
  { title: "Settings", description: "Profile, preferences and account security.", href: "/settings", mood: "looking", accent: "bg-cyber-accent" },
];

export function ExploreMore() {
  return (
    <section>
      <h2 className="text-display-2 mb-6 !text-[clamp(1.15rem,1.8vw,1.5rem)]">Explore</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card group flex-row items-center gap-4 !p-5">
            <div className={`shrink-0 border-2 border-cyber-ink p-1 ${card.accent}`}>
              <Mascot mood={card.mood} width={52} />
            </div>
            <div className="min-w-0">
              <h3 className="text-cyber-text-primary group-hover:text-cyber-primary">{card.title}</h3>
              <p className="text-sm text-cyber-text-secondary">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
