"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "ok";
      pair: string;
      bias: "bullish" | "bearish" | "neutral";
      confidence: "low" | "medium" | "high";
      rationale: string;
    }
  | { kind: "error"; message: string };

export function MarketSignal({ pair }: { pair: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function fetchSignal() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/chaingpt/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Request failed");
      }
      const data = await res.json();
      setState({ kind: "ok", ...data });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-caps flex items-center gap-1.5 text-[--color-primary]">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              insights
            </span>
            ChainGPT Signal
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            24h bias · {pair}
          </p>
        </div>
        <button
          onClick={fetchSignal}
          disabled={state.kind === "loading"}
          className="text-label-caps flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 transition-all hover:border-[--color-primary] hover:text-[--color-primary] disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-base ${
              state.kind === "loading" ? "animate-spin" : ""
            }`}
          >
            {state.kind === "loading" ? "sync" : "trending_up"}
          </span>
          {state.kind === "loading" ? "FETCHING…" : "GET SIGNAL"}
        </button>
      </div>

      {state.kind === "ok" && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
          <BiasBadge bias={state.bias} />
          <ConfidenceMeter confidence={state.confidence} />
          <p className="col-span-2 font-mono text-[11px] leading-relaxed text-zinc-400">
            {state.rationale}
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <p className="mt-3 flex items-center gap-1 font-mono text-[11px] text-[--color-danger]">
          <span className="material-symbols-outlined text-xs">error</span>
          {state.message}
        </p>
      )}
    </div>
  );
}

function BiasBadge({ bias }: { bias: "bullish" | "bearish" | "neutral" }) {
  const cfg = {
    bullish: {
      icon: "trending_up",
      label: "Bullish",
      cls: "border-emerald-900 bg-emerald-950/40 text-emerald-400",
    },
    bearish: {
      icon: "trending_down",
      label: "Bearish",
      cls: "border-red-900 bg-red-950/40 text-red-400",
    },
    neutral: {
      icon: "trending_flat",
      label: "Neutral",
      cls: "border-zinc-800 bg-zinc-900/40 text-zinc-400",
    },
  }[bias];
  return (
    <div className={`flex items-center gap-2 border p-2 ${cfg.cls}`}>
      <span className="material-symbols-outlined">{cfg.icon}</span>
      <span className="text-label-caps">{cfg.label}</span>
    </div>
  );
}

function ConfidenceMeter({
  confidence,
}: {
  confidence: "low" | "medium" | "high";
}) {
  const bars = { low: 1, medium: 2, high: 3 }[confidence];
  return (
    <div className="flex flex-col justify-center gap-1 border border-zinc-800 bg-zinc-900/40 p-2">
      <span className="text-label-caps text-zinc-500">CONFIDENCE</span>
      <div className="flex items-end gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2 ${
              i <= bars ? "bg-[--color-primary]" : "bg-zinc-800"
            }`}
            style={{ height: `${i * 6}px` }}
          />
        ))}
        <span className="ml-2 font-mono text-xs text-zinc-300">
          {confidence.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
