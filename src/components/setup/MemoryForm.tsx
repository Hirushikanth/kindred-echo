"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  parseCommaList,
  parseLineList,
} from "@/lib/setup/parse-memory-fields";

const inputCn =
  "rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-200/40 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/35";

const textareaCn =
  "min-h-[5rem] resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/35";

export default function MemoryForm({ consentAt }: { consentAt: string }) {
  const emptyProfile = () => ({
    hobbies: [] as string[],
    favoriteSayings: [] as string[],
    importantMemories: [] as string[],
    familyMembers: [] as string[],
    avoidTopics: [] as string[],
    speakingStyleNotes: [] as string[],
  });

  const [lovedOneName, setLovedOneName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [familyMemberName, setFamilyMemberName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [hobbiesRaw, setHobbiesRaw] = useState("");
  const [favoriteSayingsRaw, setFavoriteSayingsRaw] = useState("");
  const [importantMemoriesRaw, setImportantMemoriesRaw] = useState("");
  const [familyMembersRaw, setFamilyMembersRaw] = useState("");
  const [avoidTopicsRaw, setAvoidTopicsRaw] = useState("");
  const [speakingStyleRaw, setSpeakingStyleRaw] = useState("");

  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const [apiErr, setApiErr] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiErr(undefined);
    setErrs({});
    const n: Record<string, string | undefined> = {};
    if (!lovedOneName.trim())
      n.lovedOneName = "Please enter your loved one's name.";
    if (!relationship.trim())
      n.relationship = "Please describe the relationship.";
    if (!familyMemberName.trim())
      n.familyMemberName = "Please enter your name.";
    if (Object.keys(n).length) {
      setErrs(n);
      return;
    }

    const memoryProfile: ReturnType<typeof emptyProfile> & {
      occupation?: string;
    } = {
      ...emptyProfile(),
      hobbies: parseCommaList(hobbiesRaw),
      favoriteSayings: parseLineList(favoriteSayingsRaw),
      importantMemories: parseLineList(importantMemoriesRaw),
      familyMembers: parseCommaList(familyMembersRaw),
      avoidTopics: parseCommaList(avoidTopicsRaw),
      speakingStyleNotes: parseLineList(speakingStyleRaw),
    };
    const occ = occupation.trim();
    if (occ) memoryProfile.occupation = occ;

    setBusy(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lovedOneName: lovedOneName.trim(),
          relationship: relationship.trim(),
          familyMemberName: familyMemberName.trim(),
          consentAt,
          memoryProfile,
        }),
      });
      const data = (await res.json()) as {
        roomId?: string;
        error?: string;
      };
      if (!res.ok || !data.roomId) {
        setApiErr(data.error ?? "Could not save your room.");
        setBusy(false);
        return;
      }
      window.location.assign("/setup/upload");
    } catch {
      setApiErr("Network error — check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-8 rounded-3xl border border-white/60 bg-white/95 p-6 shadow-[0_28px_80px_-38px_rgba(15,23,42,0.45)] md:p-10"
      noValidate
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
          Step 2 of 3
        </p>
        <h2 className="font-serif text-2xl font-semibold text-slate-900 md:text-3xl">
          Memory setup
        </h2>
        <p className="text-sm text-slate-600">
          We only collect what helps the AI stay caring and truthful. Optional
          fields sharpen tone — skip them for a faster path.
        </p>
      </header>

      <nav
        className="flex flex-wrap gap-2 text-xs font-medium text-slate-500"
        aria-label="Progress"
      >
        <StepPill done label="Consent" />
        <StepPill active label="Details" />
        <StepPill label="Upload" />
      </nav>

      <section className="grid gap-5 md:grid-cols-2" aria-labelledby="req-h">
        <h3 id="req-h" className="sr-only">
          Required information
        </h3>

        <Field
          label="Loved one's name"
          hint="Legal or preferred — your choice."
          value={lovedOneName}
          onChange={setLovedOneName}
          error={errs.lovedOneName}
          required
          autoComplete="name"
          id="ln"
        />

        <Field
          label="Their relationship to you"
          hint="Example: grandmother, uncle, lifelong friend."
          value={relationship}
          onChange={setRelationship}
          error={errs.relationship}
          required
          autoComplete="off"
          id="rel"
        />

        <Field
          label="Your name"
          hint="How you would like the room to greet you."
          value={familyMemberName}
          onChange={setFamilyMemberName}
          error={errs.familyMemberName}
          required
          autoComplete="name"
          id="you"
          className="md:col-span-2"
        />
      </section>

      <details className="group rounded-2xl border border-stone-200 bg-stone-50/70 open:border-rose-200 open:bg-white/90">
        <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-slate-800 marker:text-rose-500">
          Optional memory depth
          <span className="ml-2 font-normal text-slate-500">
            — hobbies, sayings, tone
          </span>
        </summary>

        <div className="space-y-5 border-t border-stone-200/80 px-5 py-5">
          <Field
            label="Occupation (optional)"
            hint="Helps the voice feel grounded and specific."
            value={occupation}
            onChange={setOccupation}
            id="occ"
          />

          <Field
            label="Hobbies"
            hint="Comma-separated list."
            value={hobbiesRaw}
            onChange={setHobbiesRaw}
            id="hob"
          />

          <label className="flex flex-col gap-2" htmlFor="say">
            <span className="text-sm font-medium text-slate-800">
              Favorite sayings
            </span>
            <span className="text-xs text-slate-500">
              One phrase per line — short is best.
            </span>
            <textarea
              id="say"
              rows={3}
              value={favoriteSayingsRaw}
              onChange={(e) => setFavoriteSayingsRaw(e.target.value)}
              className={textareaCn}
            />
          </label>

          <label className="flex flex-col gap-2" htmlFor="mem">
            <span className="text-sm font-medium text-slate-800">
              Important memories
            </span>
            <span className="text-xs text-slate-500">
              Stories the AI can echo without inventing new facts.
            </span>
            <textarea
              id="mem"
              rows={4}
              value={importantMemoriesRaw}
              onChange={(e) => setImportantMemoriesRaw(e.target.value)}
              className={textareaCn}
            />
          </label>

          <Field
            label="Other family members"
            hint="Comma-separated."
            value={familyMembersRaw}
            onChange={setFamilyMembersRaw}
            id="fam"
          />

          <Field
            label="Topics to avoid"
            hint="Comma-separated — grief triggers, medical details, etc."
            value={avoidTopicsRaw}
            onChange={setAvoidTopicsRaw}
            id="avoid"
          />

          <label className="flex flex-col gap-2" htmlFor="style">
            <span className="text-sm font-medium text-slate-800">
              Speaking style notes
            </span>
            <span className="text-xs text-slate-500">
              Rhythms, phrases, temperament — line per idea.
            </span>
            <textarea
              id="style"
              rows={3}
              value={speakingStyleRaw}
              onChange={(e) => setSpeakingStyleRaw(e.target.value)}
              className={textareaCn}
            />
          </label>
        </div>
      </details>

      <div aria-live="assertive">
        {apiErr && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {apiErr}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-2 flex flex-col gap-3 border-t border-stone-200/70 bg-[#fcf9f7]/95 px-2 pb-4 pt-4 backdrop-blur supports-[backdrop-filter]:bg-[#fcf9f7]/85 md:flex-row md:items-center md:justify-between md:rounded-2xl md:border md:px-4">
        <Link
          href="/"
          className="text-center text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline md:text-left"
        >
          ← Back to consent
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex justify-center rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Creating your room…" : "Create memory room"}
        </button>
      </div>
    </form>
  );
}

function StepPill({
  label,
  active,
  done,
}: {
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 ring-1 ring-inset ${
        active
          ? "bg-rose-600 text-white ring-rose-600"
          : done
            ? "bg-rose-50 text-rose-800 ring-rose-200"
            : "bg-white text-slate-500 ring-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

function Field(props: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  id: string;
  className?: string;
}) {
  const {
    label,
    hint,
    value,
    onChange,
    error,
    required,
    autoComplete,
    id,
    className = "",
  } = props;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
        {required && (
          <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            required
          </span>
        )}
      </label>
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
      <input
        id={id}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCn}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
