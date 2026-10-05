import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * "The guy" — CyberCodex's mascot. Transparent pixel-art GIFs in
 * public/images/guy, one per mood. Use him for greetings, empty states,
 * success/failure feedback and loading.
 */
export const mascotMoods = {
  hi: { src: "/images/guy/guyHi.gif", w: 470, h: 520 },
  hacker: { src: "/images/guy/guyHacker.gif", w: 470, h: 350 },
  cheers: { src: "/images/guy/guyCheers.gif", w: 450, h: 450 },
  coffee: { src: "/images/guy/guyCoffee.gif", w: 450, h: 440 },
  hotCoffee: { src: "/images/guy/guyHotCoffee.gif", w: 760, h: 580 },
  looking: { src: "/images/guy/guyLooking.gif", w: 460, h: 470 },
  nodding: { src: "/images/guy/guyNoding.gif", w: 390, h: 450 },
  notHappy: { src: "/images/guy/guyNotHappy.gif", w: 330, h: 430 },
  really: { src: "/images/guy/guyReally.gif", w: 420, h: 440 },
  smart: { src: "/images/guy/guySmart.gif", w: 490, h: 440 },
  turnAround: { src: "/images/guy/guyTurnAround.gif", w: 470, h: 520 },
  wakesUp: { src: "/images/guy/guyWakesUp.gif", w: 390, h: 480 },
  hoodOn: { src: "/images/guy/guyWeirdHoodOn.gif", w: 550, h: 510 },
} as const;

export type MascotMood = keyof typeof mascotMoods;

export interface MascotProps {
  mood?: MascotMood;
  /** Rendered width in px; height follows the GIF's aspect ratio */
  width?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

export function Mascot({ mood = "hi", width = 160, className, priority, alt = "" }: MascotProps) {
  const m = mascotMoods[mood];
  return (
    <Image
      src={m.src}
      alt={alt}
      width={width}
      height={Math.round((width * m.h) / m.w)}
      className={cn("select-none", className)}
      unoptimized
      priority={priority}
      draggable={false}
    />
  );
}

/** Mascot with a speech bubble, for empty states and tips. */
export function MascotSays({
  mood = "hi",
  children,
  width = 120,
  className,
}: MascotProps & { children: React.ReactNode }) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <Mascot mood={mood} width={width} className="shrink-0" />
      <div className="relative mb-6 pixel-panel !shadow-[4px_4px_0_0_var(--color-cyber-ink)] bg-cyber-text-primary px-4 py-3 text-cyber-ink font-ui font-medium">
        {children}
        <span
          className="absolute -left-[9px] bottom-3 h-3 w-3 bg-cyber-text-primary border-l-[3px] border-b-[3px] border-cyber-ink rotate-45"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
