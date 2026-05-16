"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { DisclosureBadge } from "@/components/ui/DisclosureBadge";
import { CONSENT_TS_STORAGE_KEY } from "@/lib/constants/session";

/** Required copy — do not alter substantive meaning per product spec */
const REQUIRED_COPY = [
  "This experience uses AI to recreate a voice from uploaded recordings.",
  "It is not the person, and it should not replace real family, community,",
  "or professional support. Uploaded audio is sent to MiniMax for processing.",
  "Only continue if you have the right to use these recordings and want to",
  "create a private memory experience.",
].join("\n");

export default function ConsentGate() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [ack, setAck] = useState(false);

  const onContinue = () => {
    if (!ack) return;
    sessionStorage.setItem(CONSENT_TS_STORAGE_KEY, new Date().toISOString());
    router.push("/setup");
  };

  const panelClass =
    "rounded-3xl border border-rose-100/80 bg-white/90 p-6 shadow-[0_20px_60px_-24px_rgba(190,24,93,0.35)] backdrop-blur-sm md:p-8";

  const consentPanel = (
    <>
      <h2
        id="consent-heading"
        className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500"
      >
        Read before continuing
      </h2>
      <p
        className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-800"
      >
        {REQUIRED_COPY}
      </p>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-stone-50/80 p-4 text-left text-sm text-slate-700 transition hover:border-rose-200">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-rose-600 accent-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        />
        <span>
          I acknowledge this disclosure and understand the experience uses AI —
          including sending audio to MiniMax when I proceed.
        </span>
      </label>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="https://github.com/hareeshkar/kindred-echo"
          className="order-3 rounded-xl px-5 py-2.5 text-center text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline sm:order-1 sm:flex-1 sm:text-left"
          prefetch={false}
        >
          View source
        </Link>
        <button
          type="button"
          disabled={!ack}
          onClick={onContinue}
          className="order-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition enabled:hover:from-rose-500 enabled:hover:to-rose-600 enabled:focus-visible:outline enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          I understand and consent
        </button>
      </div>
    </>
  );

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-10 px-6 py-16 md:max-w-xl">
      <div className="sticky top-4 z-20 flex justify-center md:justify-end">
        <DisclosureBadge />
      </div>
      <header className="space-y-3 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
          Private memory room
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
          Kindred Echo
        </h1>
        <p className="text-balance text-base text-slate-600">
          Gentle, consent-first remembrance — always labeled as an AI recreation.
        </p>
      </header>

      {reduceMotion ? (
        <section className={panelClass} aria-labelledby="consent-heading">
          {consentPanel}
        </section>
      ) : (
        <motion.section
          className={panelClass}
          aria-labelledby="consent-heading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {consentPanel}
        </motion.section>
      )}

      <p className="text-center text-xs text-slate-500 md:text-left" aria-live="polite">
        Health check:{" "}
        <code className="rounded-md bg-white px-2 py-0.5 text-rose-600 shadow-sm ring-1 ring-rose-100">
          GET /api/health
        </code>{" "}
        · Units:{" "}
        <code className="rounded-md bg-white px-2 py-0.5 text-rose-600 shadow-sm ring-1 ring-rose-100">
          npm run test:unit
        </code>
      </p>
    </main>
  );
}
