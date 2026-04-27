"use client";

import { useState } from "react";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "ok";
      fairPriceUsd: number;
      yourPriceUsd: number;
      deltaBps: number;
      warning?: string;
      rationale: string;
    }
  | { kind: "error"; message: string };

/**
 * Inline AI advisor. Calls ChainGPT to sanity-check a trade's fair price
 * before user submits. Server-side route handler keeps API key off client.
 */
export function ChainGPTAdvisor({
  pair,
  unitPriceUsd,
}: {
  pair: string;
  unitPriceUsd: number;
}) {
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function check() {
    setResult({ kind: "loading" });
    try {
      const res = await fetch("/api/chaingpt/fair-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair, yourPriceUsd: unitPriceUsd }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Request failed");
      }
      const data = await res.json();
      setResult({ kind: "ok", ...data });
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">ChainGPT advisor</p>
          <p className="text-xs text-[--color-muted]">
            Sanity-check {pair} pricing against market
          </p>
        </div>
        <button
          onClick={check}
          disabled={result.kind === "loading"}
          className="rounded-md border border-[--color-border] px-3 py-1.5 text-xs transition hover:border-[--color-accent] disabled:opacity-50"
        >
          {result.kind === "loading" ? "Asking…" : "Check"}
        </button>
      </div>

      {result.kind === "ok" && (
        <div className="mt-3 space-y-2 border-t border-[--color-border] pt-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Fair price" value={`$${result.fairPriceUsd.toLocaleString()}`} />
            <Stat
              label="Your price"
              value={`$${result.yourPriceUsd.toLocaleString()}`}
            />
            <Stat
              label="Delta"
              value={`${(result.deltaBps / 100).toFixed(2)}%`}
              tone={
                Math.abs(result.deltaBps) > 500
                  ? "warning"
                  : Math.abs(result.deltaBps) > 100
                    ? "muted"
                    : "ok"
              }
            />
          </div>
          {result.warning && (
            <p className="rounded border border-[--color-warning] bg-[--color-warning]/10 px-2 py-1 text-xs text-[--color-warning]">
              ⚠ {result.warning}
            </p>
          )}
          <p className="text-xs text-[--color-muted]">{result.rationale}</p>
        </div>
      )}

      {result.kind === "error" && (
        <p className="mt-3 text-xs text-[--color-danger]">{result.message}</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warning" | "muted";
}) {
  const colorMap = {
    ok: "text-[--color-success]",
    warning: "text-[--color-warning]",
    muted: "text-[--color-muted]",
  } as const;
  return (
    <div>
      <p className="text-xs text-[--color-muted]">{label}</p>
      <p
        className={`font-mono ${tone ? colorMap[tone] : ""}`}
        data-numeric
      >
        {value}
      </p>
    </div>
  );
}
