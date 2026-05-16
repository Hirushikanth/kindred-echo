"use client";

import { DisclosureBadge } from "@/components/ui/DisclosureBadge";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lavender-soft">
            <svg
              className="h-5 w-5 text-foreground"
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
          </div>
          <span className="font-serif text-lg font-semibold text-foreground">
            Kindred Echo
          </span>
        </div>

        <div className="hidden md:block">
          <DisclosureBadge />
        </div>

        <a
          href="#consent"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground/90"
        >
          Begin
        </a>
      </div>
    </header>
  );
}
