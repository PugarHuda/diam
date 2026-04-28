"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; imageDataUrl: string; prompt: string }
  | { kind: "error"; message: string };

export function NftReceipt({
  pair,
  intentId,
  mode,
}: {
  pair: string;
  intentId: string;
  mode: "Direct" | "RFQ";
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function generate() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/chaingpt/nft-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair, intentId, mode }),
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

  function download() {
    if (state.kind !== "ok") return;
    const a = document.createElement("a");
    a.href = state.imageDataUrl;
    a.download = `diam-receipt-${pair.replace("/", "-")}-${intentId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              token
            </span>
            ChainGPT NFT Receipt
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            AI-generated trade memo · {pair} · #{intentId}
          </p>
        </div>
        {state.kind !== "ok" && (
          <button
            onClick={generate}
            disabled={state.kind === "loading"}
            className="text-label-caps flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 transition-all hover:border-[--color-primary] hover:text-[--color-primary] disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-base ${
                state.kind === "loading" ? "animate-spin" : ""
              }`}
            >
              {state.kind === "loading" ? "sync" : "auto_awesome"}
            </span>
            {state.kind === "loading" ? "GENERATING…" : "MINT RECEIPT"}
          </button>
        )}
      </div>

      {state.kind === "ok" && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <div className="relative overflow-hidden border border-[--color-primary]/40 bg-zinc-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.imageDataUrl}
              alt="ChainGPT-generated NFT receipt"
              className="w-full"
            />
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
            <div className="absolute bottom-2 left-2 font-mono text-[9px] text-[--color-primary]">
              DIAM_RECEIPT_#{intentId}
            </div>
            <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[--color-primary]">
              {pair} · {mode}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={download}
              className="text-label-caps flex flex-1 items-center justify-center gap-1.5 border border-zinc-800 px-3 py-2 transition-all hover:border-[--color-primary] hover:text-[--color-primary]"
            >
              <span className="material-symbols-outlined text-base">
                download
              </span>
              DOWNLOAD JPG
            </button>
            <button
              onClick={() => setState({ kind: "idle" })}
              className="text-label-caps flex items-center gap-1.5 border border-zinc-800 px-3 py-2 transition-all hover:border-zinc-600"
              title="Generate another"
            >
              <span className="material-symbols-outlined text-base">
                refresh
              </span>
            </button>
          </div>

          <details className="border border-zinc-800 bg-zinc-950/40 p-3">
            <summary className="text-label-caps cursor-pointer text-zinc-500 hover:text-[--color-primary]">
              <span className="ml-2">Prompt used</span>
            </summary>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-zinc-400">
              {state.prompt}
            </p>
          </details>
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
