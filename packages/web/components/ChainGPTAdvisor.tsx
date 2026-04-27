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
    <div className="border-l-2 border-l-[--color-primary] bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-caps flex items-center gap-2 text-[--color-primary]">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
            ChainGPT Advisor
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            sanity-check {pair} pricing
          </p>
        </div>
        <button
          onClick={check}
          disabled={result.kind === "loading"}
          className="text-label-caps border border-zinc-800 px-3 py-1.5 transition-all hover:border-[--color-primary] hover:text-[--color-primary] disabled:opacity-50"
        >
          {result.kind === "loading" ? "ASKING…" : "CHECK"}
        </button>
      </div>

      {result.kind === "ok" && (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Fair"
              value={`$${result.fairPriceUsd.toLocaleString()}`}
            />
            <Stat
              label="Yours"
              value={`$${result.yourPriceUsd.toLocaleString()}`}
            />
            <Stat
              label="Δ"
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
            <p className="border border-yellow-900 bg-yellow-950/40 px-2 py-1 font-mono text-[10px] text-yellow-400">
              ⚠ {result.warning}
            </p>
          )}
          <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
            {result.rationale}
          </p>
        </div>
      )}

      {result.kind === "error" && (
        <p className="mt-3 font-mono text-[11px] text-[--color-danger]">
          {result.message}
        </p>
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
    ok: "text-[--color-primary]",
    warning: "text-yellow-400",
    muted: "text-zinc-400",
  } as const;
  return (
    <div>
      <p className="text-label-caps text-zinc-600">{label}</p>
      <p
        className={`font-mono text-sm ${tone ? colorMap[tone] : ""}`}
        data-numeric
      >
        {value}
      </p>
    </div>
  );
}
