"use client";

import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "./AnimatedSection";

const steps = [
  {
    number: "01",
    title: "Consent & Privacy",
    description:
      "Read our disclosure, acknowledge the AI nature of this experience, and enter your private memory room.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Upload a Voice",
    description:
      "Share an old recording of your loved one — a voicemail, video clip, or audio file you have rights to use.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Add Family Context",
    description:
      "Share memories, stories, and details that help create meaningful, personalized remembrance moments.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Listen & Remember",
    description:
      "Hear AI-guided remembrance in the preserved voice. Export a keepsake audio file when ready.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 6h.008v.008H6V6z"
        />
      </svg>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-secondary/50 px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection className="mb-12 text-center md:mb-16">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </span>
          <h2 className="font-serif text-3xl font-semibold text-foreground md:text-4xl lg:text-5xl">
            A gentle path to remembrance
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
            Four thoughtful steps designed with care. Your experience takes less
            than two minutes to begin.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {steps.map((step) => (
            <StaggerItem key={step.number}>
              <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-lavender hover:shadow-lg hover:shadow-lavender/10 md:p-8">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender-soft text-foreground">
                    {step.icon}
                  </div>
                  <span className="font-serif text-2xl font-semibold text-lavender">
                    {step.number}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
