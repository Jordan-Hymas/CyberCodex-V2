"use client";

import { useState } from "react";
import Image from "next/image";
import { PricingCard, Accordion, Button } from "@/components/ui";
import { PageBanner } from "@/components/layout/PageBanner";
import { FeatureComparison } from "@/components/pricing/FeatureComparison";
import { Mascot } from "@/components/brand";
import { pricingTiers, pricingFeatures, pricingFAQ } from "@/lib/config";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const yearly = billingPeriod === "yearly";

  return (
    <main className="min-h-screen pb-24">
      <PageBanner
        image="/images/banners/purpleSKy.gif"
        eyebrow="Pricing"
        title="Pick your loadout"
        description="Start free and play the first chapters of most courses. Go Elite when you want everything."
      >
        {/* Billing toggle */}
        <div role="radiogroup" aria-label="Billing period" className="mt-8 inline-flex border-[3px] border-cyber-ink bg-cyber-ink shadow-[4px_4px_0_0_var(--color-cyber-ink)]">
          {(["monthly", "yearly"] as const).map((period) => (
            <button
              key={period}
              role="radio"
              aria-checked={billingPeriod === period}
              onClick={() => setBillingPeriod(period)}
              className={cn(
                "px-5 py-2 font-ui capitalize transition-colors duration-100",
                billingPeriod === period ? "bg-cyber-primary text-cyber-ink" : "text-cyber-text-secondary hover:text-cyber-text-primary"
              )}
            >
              {period}
              {period === "yearly" && (
                <span className={cn("ml-2 text-xs", billingPeriod === period ? "text-cyber-ink/70" : "text-cyber-warning")}>
                  −{pricingTiers.pro.savingsPercentage}%
                </span>
              )}
            </button>
          ))}
        </div>
      </PageBanner>

      {/* Plans */}
      <section className="container-custom pt-14">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <PricingCard
            title={pricingTiers.free.name}
            price={pricingTiers.free.price}
            period={pricingTiers.free.period}
            description={pricingTiers.free.description}
            features={pricingTiers.free.features}
            ctaText={pricingTiers.free.ctaText}
            ctaVariant={pricingTiers.free.ctaVariant}
            ctaHref="/signup"
            icon={<Mascot mood="coffee" width={72} />}
          />
          <PricingCard
            title={pricingTiers.pro.name}
            price={yearly ? pricingTiers.pro.priceYearly : pricingTiers.pro.price}
            period={yearly ? pricingTiers.pro.periodYearly : pricingTiers.pro.period}
            description={pricingTiers.pro.description}
            features={pricingTiers.pro.features}
            ctaText={pricingTiers.pro.ctaText}
            ctaVariant={pricingTiers.pro.ctaVariant}
            ctaHref={`/signup?plan=elite&billing=${billingPeriod}`}
            badge={yearly ? `Save ${pricingTiers.pro.savingsPercentage}%` : pricingTiers.pro.badge}
            highlighted={pricingTiers.pro.highlighted}
            icon={<Image src="/images/logo/coin.webp" alt="" width={64} height={64} className="pixelated animate-float" />}
          />
        </div>
      </section>

      {/* Comparison */}
      <section id="features" className="container-custom scroll-mt-24 pt-[var(--section-padding)]">
        <div className="mx-auto max-w-5xl">
          <p className="pixel-label mb-3 text-cyber-secondary">Compare</p>
          <h2 className="text-display-2 mb-10">What&apos;s in each plan</h2>
          <FeatureComparison features={pricingFeatures} freeLabel={pricingTiers.free.name} proLabel={pricingTiers.pro.name} />
        </div>
      </section>

      {/* FAQ */}
      <section className="container-custom pt-[var(--section-padding)]">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="pixel-label mb-3 text-cyber-pink">FAQ</p>
            <h2 className="text-display-2 mb-6">Questions?</h2>
            <Mascot mood="smart" width={140} className="hidden lg:block" />
          </div>
          <Accordion items={pricingFAQ} />
        </div>
      </section>

      {/* CTA */}
      <section className="container-custom pt-[var(--section-padding)]">
        <div className="relative mx-auto max-w-5xl overflow-hidden border-[3px] border-cyber-ink shadow-[10px_10px_0_0_var(--color-cyber-ink)]">
          <Image src="/images/categories/GameSpooky3.gif" alt="" fill unoptimized sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-cyber-dark/75" />
          <div className="relative flex flex-col items-center gap-6 px-6 py-14 text-center md:py-20">
            <h2 className="text-display-2">Ready to level up?</h2>
            <p className="max-w-xl text-lg text-cyber-text-secondary">
              Make a free account in a minute. Upgrade whenever you&apos;re ready.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button href="/signup" size="lg">
                Start free
              </Button>
              <Button href="/courses" variant="secondary" size="lg">
                Browse courses
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
