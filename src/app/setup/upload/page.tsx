import Link from "next/link";
import { DisclosureBadge } from "@/components/ui/DisclosureBadge";

export default function UploadPlaceholderPage() {
  /* Cookie gate enforced in middleware.ts */
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col gap-8 px-6 py-24 text-center md:text-left">
      <div className="sticky top-4 z-20 flex justify-center md:justify-end">
        <DisclosureBadge />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
        Step 3 of 3
      </p>
      <h1 className="font-serif text-3xl font-semibold text-slate-900">
        Upload arrives in Phase&nbsp;3
      </h1>
      <p className="text-slate-600">
        Your private room cookie is active. The next milestone wires the audio
        dropzone, FFmpeg extraction, MiniMax cloning, and warmup TTS as defined
        in the main development plan.
      </p>
      <Link
        href="/setup"
        className="text-sm font-medium text-rose-700 underline-offset-4 hover:text-rose-900 hover:underline"
      >
        Edit memory details
      </Link>
    </main>
  );
}
