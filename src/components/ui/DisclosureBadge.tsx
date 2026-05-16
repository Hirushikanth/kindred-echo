/** Phase 6 / main plan: always-visible disclosure chrome */
export function DisclosureBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur-sm ring-1 ring-stone-100 ${className}`}
      role="status"
      aria-label="Artificial-intelligence recreation in a private room"
    >
      <svg
        className="h-3 w-3 text-rose-500"
        aria-hidden
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h16.5a.75.75 0 00.75-.75v-10.5a.75.75 0 00-.75-.75H4.5a.75.75 0 00-.75.75v10.5c0 .414.336.75.75.75z"
        />
      </svg>
      <span className="whitespace-nowrap">
        AI Memory Recreation&nbsp;·&nbsp;Private Room
      </span>
    </div>
  );
}
