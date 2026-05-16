"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { CONSENT_TS_STORAGE_KEY } from "@/lib/constants/session";
import { AnimatedSection } from "./AnimatedSection";

/** Required consent copy — do not alter substantive meaning per product spec */
const CONSENT_TEXT =
  "This experience uses AI to recreate a voice from uploaded recordings. It is not the person, and it should not replace real family, community, or professional support. Uploaded audio is sent to MiniMax for processing. Only continue if you have the right to use these recordings and want to create a private memory experience.";

export function ConsentSection() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConsent = () => {
    if (!acknowledged) return;
    sessionStorage.setItem(CONSENT_TS_STORAGE_KEY, new Date().toISOString());
    router.push("/setup");
  };

  return (
    <section
      id="consent"
      className="bg-lavender-soft px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-2xl">
        <AnimatedSection>
          <div className="rounded-3xl border border-lavender/30 bg-card p-8 shadow-xl shadow-lavender/10 md:p-12">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender/20 text-foreground">
                <svg
                  className="h-7 w-7"
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
              </div>
            </div>

            <h2 className="text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Before you begin
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Please read and acknowledge the following
            </p>

            <div className="mt-8 rounded-xl border border-border bg-secondary/50 p-5">
              <p className="text-sm leading-relaxed text-foreground">
                {CONSENT_TEXT}
              </p>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-lavender/50">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-foreground accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              />
              <span className="text-sm leading-relaxed text-foreground">
                I acknowledge this disclosure and understand that this experience
                uses AI voice recreation. I have rights to the recordings I will
                upload.
              </span>
            </label>

            {shouldReduceMotion ? (
              <button
                type="button"
                disabled={!acknowledged}
                onClick={handleConsent}
                className="mt-8 w-full rounded-xl bg-foreground px-6 py-4 text-base font-semibold text-primary-foreground transition-all enabled:hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                I understand and consent
              </button>
            ) : (
              <motion.button
                type="button"
                disabled={!acknowledged}
                onClick={handleConsent}
                className="mt-8 w-full rounded-xl bg-foreground px-6 py-4 text-base font-semibold text-primary-foreground transition-all enabled:hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
                whileHover={acknowledged ? { scale: 1.01 } : {}}
                whileTap={acknowledged ? { scale: 0.99 } : {}}
              >
                I understand and consent
              </motion.button>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to our terms for this demo experience.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
