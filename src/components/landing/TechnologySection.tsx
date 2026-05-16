"use client";

import { AnimatedSection } from "./AnimatedSection";

export function TechnologySection() {
  return (
    <section className="bg-foreground px-6 py-20 text-primary-foreground md:px-12 md:py-28">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection className="text-center">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-lavender">
            Under the hood
          </span>
          <h2 className="font-serif text-3xl font-semibold md:text-4xl lg:text-5xl">
            Thoughtful technology
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-primary-foreground/70">
            Built for a hackathon with real engineering. Designed to be fast,
            transparent, and emotionally aware.
          </p>

          <div className="mt-12 grid gap-6 text-left md:grid-cols-3 md:gap-8">
            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-lavender"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                  />
                </svg>
                <h3 className="font-semibold">Voice Recreation</h3>
              </div>
              <p className="text-sm leading-relaxed text-primary-foreground/60">
                MiniMax voice cloning from a short audio sample. Always clearly
                labeled as AI-generated.
              </p>
            </div>

            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-lavender"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
                <h3 className="font-semibold">Streaming Persona</h3>
              </div>
              <p className="text-sm leading-relaxed text-primary-foreground/60">
                Context-aware responses grounded in your family memories.
                Progressive speech playback.
              </p>
            </div>

            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-lavender"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <h3 className="font-semibold">Export Keepsake</h3>
              </div>
              <p className="text-sm leading-relaxed text-primary-foreground/60">
                Download your memory session as an audio file. A private
                keepsake for your family.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
