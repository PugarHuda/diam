"use client";

import { useEffect } from "react";

/**
 * Next.js App Router error boundary — replaces white-screen crashes with a
 * styled fallback that matches the rest of the dApp. The `reset()` callback
 * re-renders the segment without a full-page reload (cheaper than F5 because
 * RainbowKit/Wagmi state survives).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Surface to console for dev debugging — Next.js also reports via telemetry.
  useEffect(() => {
    console.error("[diam] unhandled error:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[--color-bg] px-6 text-center">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-10" />

      <div className="max-w-md space-y-6 border border-[--color-danger]/40 bg-zinc-950/80 p-8 backdrop-blur-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center border border-[--color-danger]/40 bg-[--color-danger]/10">
          <span
            className="material-symbols-outlined text-[--color-danger]"
            style={{ fontSize: "2rem", fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            error
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-label-caps text-[--color-danger]">
            ⟨ SYSTEM_FAULT ⟩
          </p>
          <h1 className="font-mono text-lg text-zinc-100">
            Something broke in the encryption pipeline
          </h1>
          <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
            A client component threw before render. Your wallet session and
            on-chain state are unaffected — the contract is still live and your
            balances are safe.
          </p>
        </div>

        <details className="border border-zinc-800 bg-zinc-950/60 p-3 text-left">
          <summary className="text-label-caps cursor-pointer text-zinc-500 hover:text-[--color-danger]">
            <span className="ml-2">Error details</span>
          </summary>
          <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-zinc-400">
            {error.message}
            {error.digest && (
              <>
                <br />
                <span className="text-zinc-600">digest: {error.digest}</span>
              </>
            )}
          </p>
        </details>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="diam-btn-primary flex flex-1 items-center justify-center gap-2 py-3 text-sm"
          >
            <span className="material-symbols-outlined text-base">
              restart_alt
            </span>
            Retry segment
          </button>
          <a
            href="/"
            className="text-label-caps flex items-center gap-2 border border-zinc-800 px-4 py-3 transition hover:border-[--color-primary] hover:text-[--color-primary]"
          >
            <span className="material-symbols-outlined text-base">home</span>
            Home
          </a>
        </div>
      </div>
    </main>
  );
}
