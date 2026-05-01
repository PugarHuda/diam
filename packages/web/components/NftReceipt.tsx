"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { CornerBrackets } from "./CornerBrackets";
import { useReceiptMint } from "@/lib/hooks/useReceiptMint";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "ok";
      imageDataUrl: string;
      prompt: string;
      fingerprint: string;
    }
  | { kind: "error"; message: string };

export interface NftReceiptProps {
  pair: string;
  intentId: string;
  mode: "Direct" | "RFQ";
  /** Tx hash from settle event */
  txHash?: string;
  blockNumber?: string;
  timestamp?: number;
  makerAddress?: string;
  /** Encrypted handle for sell amount — used as visual signature */
  sellHandle?: string;
}

export function NftReceipt(props: NftReceiptProps) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const mint = useReceiptMint();

  async function onMintOnchain() {
    await mint.submit({
      intentId: BigInt(props.intentId),
      mode: props.mode,
      settleTxHash: (props.txHash as `0x${string}` | undefined) ?? null,
      pair: props.pair,
    });
  }

  async function generate() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/chaingpt/nft-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
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
    a.download = `diam-receipt-${state.fingerprint}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function shareTwitter() {
    if (state.kind !== "ok") return;
    const text = encodeURIComponent(
      `Just executed a confidential OTC trade on @iEx_ec Nox via Diam.

🔒 Receipt: ${state.fingerprint}
📊 Pair: ${props.pair}
🎯 Mode: ${props.mode}

Built with @Chain_GPT for #iExecVibeCoding`,
    );
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent("https://private-otc.vercel.app")}`;
    window.open(url, "_blank");
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
            AI-generated · model: velogen · 512×512
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
          {/* Image with overlays */}
          <div className="relative overflow-hidden border border-[--color-primary]/40 bg-zinc-950">
            <CornerBrackets size="md" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.imageDataUrl}
              alt="ChainGPT-generated NFT receipt"
              className="w-full"
            />
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-15" />

            {/* Top-left: fingerprint */}
            <div className="absolute left-3 top-3 border border-[--color-primary]/40 bg-black/70 px-2 py-1 font-mono text-[10px] text-[--color-primary] backdrop-blur-sm">
              {state.fingerprint}
            </div>

            {/* Top-right: mode badge */}
            <div className="absolute right-3 top-3 border border-[--color-primary]/40 bg-black/70 px-2 py-1 font-mono text-[10px] text-[--color-primary] backdrop-blur-sm">
              {props.mode === "RFQ" ? "VICKREY_RFQ" : "DIRECT_OTC"}
            </div>

            {/* Bottom-left: pair */}
            <div className="absolute bottom-3 left-3 border border-[--color-primary]/40 bg-black/70 px-2 py-1 font-mono text-[10px] text-[--color-primary] backdrop-blur-sm">
              {props.pair}
            </div>

            {/* Bottom-right: NOX_TEE */}
            <div className="absolute bottom-3 right-3 border border-[--color-primary]/40 bg-black/70 px-2 py-1 font-mono text-[10px] text-[--color-primary] backdrop-blur-sm">
              NOX_TEE
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 border border-zinc-800 bg-zinc-950/40 p-3">
            <MetadataRow label="FINGERPRINT" value={state.fingerprint} mono />
            <MetadataRow
              label="MODE"
              value={props.mode === "RFQ" ? "Vickrey Auction" : "Bilateral"}
            />
            {props.txHash && (
              <MetadataRow
                label="TX_HASH"
                value={`${props.txHash.slice(0, 10)}…${props.txHash.slice(-6)}`}
                mono
                copyValue={props.txHash}
              />
            )}
            {props.blockNumber && (
              <MetadataRow label="BLOCK" value={props.blockNumber} mono />
            )}
            {props.makerAddress && (
              <MetadataRow
                label="MAKER"
                value={`${props.makerAddress.slice(0, 6)}…${props.makerAddress.slice(-4)}`}
                mono
                copyValue={props.makerAddress}
              />
            )}
            {props.timestamp && (
              <MetadataRow
                label="SETTLED"
                value={new Date(props.timestamp).toLocaleString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })}
              />
            )}
            {props.sellHandle && (
              <MetadataRow
                label="HANDLE_SIG"
                value={`${props.sellHandle.slice(0, 10)}…`}
                mono
                copyValue={props.sellHandle}
              />
            )}
            <MetadataRow label="NETWORK" value="ARB_SEPOLIA" mono />
          </div>

          {/* On-chain mint */}
          <OnchainMintPanel
            mint={mint}
            onMintOnchain={onMintOnchain}
          />

          {/* Action buttons */}
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
              onClick={shareTwitter}
              className="text-label-caps flex items-center gap-1.5 border border-zinc-800 px-3 py-2 transition-all hover:border-[--color-primary] hover:text-[--color-primary]"
              title="Share to X / Twitter"
            >
              <span className="material-symbols-outlined text-base">share</span>
              SHARE
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
              <span className="ml-2">AI prompt used</span>
            </summary>
            <p className="mt-2 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-zinc-400">
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

function OnchainMintPanel({
  mint,
  onMintOnchain,
}: {
  mint: ReturnType<typeof useReceiptMint>;
  onMintOnchain: () => Promise<void>;
}) {
  const busy = mint.step === "signing" || mint.step === "confirming";
  const minted = mint.step === "done" && mint.tokenId !== null;

  return (
    <div className="border border-[--color-primary]/40 bg-[--color-primary]/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-label-caps flex items-center gap-1.5 text-[--color-primary]">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            On-chain Receipt
          </p>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-zinc-500">
            Mint an ERC-721 keepsake on Arbitrum Sepolia. Metadata + SVG
            stored fully on-chain — survives any off-chain image host.
          </p>
        </div>
        <button
          onClick={onMintOnchain}
          disabled={busy || minted}
          className="text-label-caps flex shrink-0 items-center gap-1.5 border border-[--color-primary]/40 bg-[--color-primary]/10 px-3 py-1.5 text-[--color-primary] transition-colors hover:bg-[--color-primary]/20 disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-base ${
              busy ? "animate-spin" : ""
            }`}
          >
            {mint.step === "signing" && "draw"}
            {mint.step === "confirming" && "sync"}
            {mint.step === "done" && "check_circle"}
            {(mint.step === "idle" || mint.step === "error") && "token"}
          </span>
          {mint.step === "signing" && "CONFIRM IN WALLET…"}
          {mint.step === "confirming" && "MINTING…"}
          {minted && `MINTED #${mint.tokenId!.toString()}`}
          {(mint.step === "idle" || mint.step === "error") && "MINT ON-CHAIN"}
        </button>
      </div>

      {minted && mint.txHash && (
        <p className="mt-2 flex items-center gap-2 font-mono text-[10px] text-zinc-400">
          <span className="text-[--color-primary]">✓</span>
          <a
            href={`https://sepolia.arbiscan.io/tx/${mint.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="break-all text-[--color-primary] underline hover:text-[--color-primary]/80"
          >
            {mint.txHash.slice(0, 10)}…{mint.txHash.slice(-8)}
          </a>
        </p>
      )}
      {mint.step === "error" && mint.error && (
        <p className="mt-2 font-mono text-[10px] text-[--color-danger]">
          {mint.error}
        </p>
      )}
    </div>
  );
}

function MetadataRow({
  label,
  value,
  mono,
  copyValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
}) {
  return (
    <div>
      <p className="text-label-caps text-zinc-600">{label}</p>
      <div
        className={`mt-0.5 flex items-center gap-1.5 ${mono ? "font-mono" : ""} text-xs text-zinc-300`}
      >
        <span>{value}</span>
        {copyValue && <CopyButton value={copyValue} size="sm" />}
      </div>
    </div>
  );
}
