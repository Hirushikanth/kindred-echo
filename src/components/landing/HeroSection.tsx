"use client";

import { AnimatedSection } from "./AnimatedSection";

export function HeroSection() {
  return (
    <section className="relative px-6 pb-16 pt-8 md:px-12 md:pb-24 md:pt-12">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection className="flex flex-col items-center text-center">
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            Private Memory Room
          </span>

          {/* Main headline */}
          <h1 className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-7xl lg:text-8xl">
            <span className="block">Preserve the voices</span>
            <span className="block text-warm-gray">that shaped you</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:mt-8 md:text-xl">
            A private, consent-first space where families can hear cherished
            memories spoken in a loved one&apos;s preserved voice. An AI recreation
            for remembrance — never resurrection.
          </p>

          {/* Scroll indicator */}
          <div className="mt-12 flex flex-col items-center gap-2 text-muted-foreground md:mt-16">
            <span className="text-xs uppercase tracking-widest">Learn more</span>
            <svg
              className="h-5 w-5 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
