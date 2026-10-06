import Image from "next/image";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageBannerProps {
  /** Pixel-art background (GIF stays animated) */
  image: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** CSS object-position for the art, e.g. "center 30%" */
  imagePosition?: string;
}

/** Page header with a pixel-art backdrop. Sits under the fixed nav. */
export function PageBanner({ image, eyebrow, title, description, children, className, imagePosition }: PageBannerProps) {
  return (
    <header className={cn("relative overflow-hidden border-b-[3px] border-cyber-ink", className)}>
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={image}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover pixelated"
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-dark via-cyber-dark/80 to-cyber-dark/20" />
      </div>
      <div className="container-custom relative pt-32 pb-14 md:pt-36 md:pb-20">
        {eyebrow && (
          <p className="pixel-label mb-4 inline-block border-2 border-cyber-ink bg-cyber-warning px-2 py-1 text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-display-2 mb-4 max-w-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-lg text-cyber-text-secondary md:text-xl">{description}</p>}
        {children}
      </div>
    </header>
  );
}
