"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { CopyButton } from "./CopyButton";
import { CornerBrackets } from "./CornerBrackets";
import { useReceiptMint } from "@/lib/hooks/useReceiptMint";
import { useExistingReceipt } from "@/lib/hooks/useExistingReceipt";
import { DIAM_RECEIPT_ADDRESS } from "@/lib/wagmi";

type State =
  | { kind: "idle" }
  | { kind: "generating-image" }
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
  const { address } = useAccount();
  const [state, setState] = useState<State>({ kind: "idle" });
  // True when the user has clicked MINT and we want to fire the on-chain
  // tx as soon as the image (success or failure) has rendered. Triggering
  // mint inline after `setState` would race the React commit — MetaMask
  // would pop up before the image paints. Watching this flag in a
  // useEffect ordered AFTER the image render guarantees the visual lands
  // first, then the wallet prompt.
  const [pendingMint, setPendingMint] = useState(false);
  const mint = useReceiptMint();
  const existing = useExistingReceipt(BigInt(props.intentId), address);

  useEffect(() => {
    if (mint.step === "done" && mint.tokenId !== null) {
      existing.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mint.step, mint.tokenId]);

  // Fire the on-chain mint AFTER the image-generation phase resolves
  // (either ok or error) and the image render has committed. The
  // `state.kind !== "generating-image"` guard ensures we don't fire
  // while still loading; pendingMint is the user-intent flag.
  useEffect(() => {
    if (!pendingMint) return;
    if (state.kind === "generating-image") return;
    setPendingMint(false);
    void mint.submit({
      intentId: BigInt(props.intentId),
      mode: props.mode,
      settleTxHash: (props.txHash as `0x${string}` | undefined) ?? null,
      pair: props.pair,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMint, state.kind]);

  // Single-click flow: kick off ChainGPT image, mark the user as wanting
  // a mint, then let the effect above launch the wallet prompt only
  // after the image has painted.
  async function mintReceipt() {
    if (
      existing.alreadyMinted ||
      pendingMint ||
      mint.step === "signing" ||
      mint.step === "confirming"
    ) {
      return;
    }
    setState({ kind: "generating-image" });
    setPendingMint(true);
    try {
      const res = await fetch("/api/chaingpt/nft-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
      });
      if (res.ok) {
        const data = await res.json();
        setState({ kind: "ok", ...data });
      } else {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setState({
          kind: "error",
          message: `Image generation failed: ${err.error ?? "request failed"} — proceeding with on-chain mint anyway.`,
        });
      }
    } catch (err) {
      setState({
        kind: "error",
        message: `Image generation failed: ${err instanceof Error ? err.message : String(err)} — proceeding with on-chain mint anyway.`,
      });
    }
    // pendingMint is true → effect above runs once state.kind !== "generating-image"
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

  const onchainTokenId = mint.tokenId ?? existing.tokenId;
  const isMinting =
    state.kind === "generating-image" ||
    mint.step === "signing" ||
    mint.step === "confirming";
  const showButton = !existing.alreadyMinted && state.kind !== "ok";

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
            On-chain NFT Receipt
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            ChainGPT velogen 512×512 + ERC-721 on Arbitrum Sepolia
          </p>
        </div>

        {existing.alreadyMinted && onchainTokenId !== null && (
          <a
            href={`https://sepolia.arbiscan.io/token/${DIAM_RECEIPT_ADDRESS}?a=${onchainTokenId.toString()}`}
            target="_blank"
            rel="noreferrer"
            className="text-label-caps flex items-center gap-1.5 border border-[--color-primary]/40 bg-[--color-primary]/10 px-3 py-1.5 text-[--color-primary] hover:bg-[--color-primary]/20"
          >
            <span className="material-symbols-outlined text-base">
              check_circle
            </span>
            MINTED #{onchainTokenId.toString()}
          </a>
        )}

        {showButton && (
          <button
            onClick={mintReceipt}
            disabled={isMinting || existing.isLoading}
            className="text-label-caps flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 transition-all hover:border-[--color-primary] hover:text-[--color-primary] disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-base ${
                isMinting ? "animate-spin" : ""
              }`}
            >
              {state.kind === "generating-image" && "auto_awesome"}
              {mint.step === "signing" && "draw"}
              {mint.step === "confirming" && "sync"}
              {!isMinting && "auto_awesome"}
            </span>
            {state.kind === "generating-image" && "GENERATING…"}
            {mint.step === "signing" && "CONFIRM IN WALLET…"}
            {mint.step === "confirming" && "MINTING ON-CHAIN…"}
            {!isMinting && "MINT RECEIPT"}
          </button>
        )}
      </div>

      {existing.alreadyMinted && state.kind !== "ok" && (
        <p className="mt-3 font-mono text-[11px] text-zinc-500">
          You already minted Receipt #{onchainTokenId?.toString()} for this
          trade. View on Arbiscan or in your wallet — duplicates are blocked.
        </p>
      )}

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

          {/* On-chain mint status */}
          <OnchainStatus
            mint={mint}
            existingTokenId={existing.tokenId}
          />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 border border-zinc-800 bg-zinc-950/40 p-3">
            <MetadataRow label="FINGERPRINT" value={state.fingerprint} mono />
            <MetadataRow
              label="MODE"
              value={props.mode === "RFQ" ? "Vickrey Auction" : "Bilateral"}
            />
            {props.txHash && (
              <MetadataRow
                label="SETTLE_TX"
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

          {/* Download / share — keep image artifacts available even after mint. */}
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

      {state.kind === "error" && !isMinting && (
        <p className="mt-3 flex items-center gap-1 font-mono text-[11px] text-amber-400">
          <span className="material-symbols-outlined text-xs">info</span>
          {state.message}
        </p>
      )}
    </div>
  );
}

function OnchainStatus({
  mint,
  existingTokenId,
}: {
  mint: ReturnType<typeof useReceiptMint>;
  existingTokenId: bigint | null;
}) {
  const tokenId = mint.tokenId ?? existingTokenId;
  if (mint.step === "signing") {
    return (
      <p className="font-mono text-[10px] text-amber-300">
        → confirm transaction in wallet to commit on-chain receipt…
      </p>
    );
  }
  if (mint.step === "confirming") {
    return (
      <p className="flex items-center gap-2 font-mono text-[10px] text-amber-300">
        <span className="material-symbols-outlined animate-spin text-xs">
          sync
        </span>
        Minting on-chain — Arbitrum Sepolia confirming…
        {mint.txHash && (
          <a
            href={`https://sepolia.arbiscan.io/tx/${mint.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[--color-primary] underline"
          >
            tx →
          </a>
        )}
      </p>
    );
  }
  if (mint.step === "done" && tokenId !== null) {
    return (
      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[--color-primary]">
        <span className="material-symbols-outlined text-xs">verified</span>
        Minted Receipt NFT
        <a
          href={`https://sepolia.arbiscan.io/token/${DIAM_RECEIPT_ADDRESS}?a=${tokenId.toString()}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[--color-primary]/80"
        >
          #{tokenId.toString()} on Arbiscan
        </a>
        {mint.txHash && (
          <a
            href={`https://sepolia.arbiscan.io/tx/${mint.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[--color-primary]/80"
          >
            tx
          </a>
        )}
      </div>
    );
  }
  if (mint.step === "error") {
    return (
      <p className="font-mono text-[10px] text-[--color-danger]">
        On-chain mint failed: {mint.error}
      </p>
    );
  }
  return null;
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
