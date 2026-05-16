"use client";

import { DisclosureBadge } from "@/components/ui/DisclosureBadge";
import MemoryForm from "@/components/setup/MemoryForm";
import { CONSENT_TS_STORAGE_KEY } from "@/lib/constants/session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SetupWizard({ notice }: { notice?: string }) {
  const router = useRouter();
  const [consentAt, setConsentAt] = useState<string | null>(null);

  useEffect(() => {
    const ts =
      typeof window !== "undefined"
        ? sessionStorage.getItem(CONSENT_TS_STORAGE_KEY)
        : null;
    if (!ts) {
      router.replace("/");
      return;
    }
    setConsentAt(ts);
  }, [router]);

  if (consentAt === null) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center px-6 py-24">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600 motion-reduce:animate-none motion-reduce:border-t-transparent"
          role="status"
          aria-label="Checking consent"
        />
        <p className="mt-6 text-sm text-slate-500">Checking consent status…</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-full overflow-hidden pb-28">
      <div
        className="pointer-events-none absolute inset-x-0 -top-48 h-[28rem] bg-[radial-gradient(ellipse_at_top,_rgba(251,113,133,0.22),transparent_62%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
        <div className="sticky top-4 z-20 flex justify-center md:justify-end">
          <DisclosureBadge />
        </div>
        <header className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-500">
            Guided setup
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Shape the remembrance
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 md:text-base">
            The voice you hear remains an AI recreation. These details steer tone
            — they never resurrect the person, only echoed memories shared by
            you.
          </p>
        </header>

        {notice === "missing-room" && (
          <aside
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-5"
            role="status"
          >
            Finish creating your memory room before upload — we redirected you
            here to protect your privacy boundary.
          </aside>
        )}

        <div className="mx-auto w-full md:mx-0">
          <MemoryForm consentAt={consentAt} />
        </div>

        <footer className="text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
          >
            Leave and return later
          </Link>
        </footer>
      </div>
    </main>
  );
}
