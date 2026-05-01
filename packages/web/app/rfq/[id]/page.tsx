"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { parseUnits } from "viem";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { NftReceipt } from "@/components/NftReceipt";
import { SkeletonCard } from "@/components/Skeleton";
import { OperatorAuth } from "@/components/OperatorAuth";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS, CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import {
  useSubmitBid,
  useFinalizeRfq,
  useRevealRfqWinner,
} from "@/lib/hooks/useOtcWrites";
import { statusLabel } from "@/lib/hooks/useIntents";
import { shortAddress } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useNoxClient, decryptUint256 } from "@/lib/nox-client";
import { formatUnits } from "viem";

const TOKEN_NAMES: Record<string, { symbol: string; decimals: number }> = {
  [CUSDC_ADDRESS.toLowerCase()]: { symbol: "cUSDC", decimals: 6 },
  [CETH_ADDRESS.toLowerCase()]: { symbol: "cETH", decimals: 18 },
};

const RFQ_BIDS_ABI = [
  {
    type: "function",
    name: "bids",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [
      { name: "taker", type: "address" },
      { name: "offeredAmount", type: "bytes32" },
      { name: "active", type: "bool" },
    ],
  },
] as const;

export default function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const rfqId = BigInt(id);

  const { address } = useAccount();
  const submitBid = useSubmitBid();
  const finalize = useFinalizeRfq();
  const reveal = useRevealRfqWinner();
  const toast = useToast();

  // Surface tx outcomes via toasts AND refetch on-chain state so UI reflects
  // status transitions (Open → PendingReveal → Filled) without a page reload.
  useEffect(() => {
    if (reveal.step === "done" && reveal.txHash) {
      toast.success("Winner revealed — settlement complete", {
        href: `https://sepolia.arbiscan.io/tx/${reveal.txHash}`,
      });
      intentQuery.refetch();
    } else if (reveal.step === "error" && reveal.error) {
      toast.error(`Reveal failed: ${reveal.error}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal.step, reveal.txHash]);

  useEffect(() => {
    if (finalize.step === "done" && finalize.txHash) {
      toast.success("Auction frozen — awaiting maker reveal", {
        href: `https://sepolia.arbiscan.io/tx/${finalize.txHash}`,
      });
      intentQuery.refetch();
    } else if (finalize.step === "error" && finalize.error) {
      toast.error(`Finalize failed: ${finalize.error}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalize.step, finalize.txHash]);

  useEffect(() => {
    if (submitBid.step === "done" && submitBid.txHash) {
      toast.success("Sealed bid submitted", {
        href: `https://sepolia.arbiscan.io/tx/${submitBid.txHash}`,
      });
      bidsQuery.refetch();
    } else if (submitBid.step === "error" && submitBid.error) {
      toast.error(`Bid failed: ${submitBid.error}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitBid.step, submitBid.txHash]);

  const [bidAmount, setBidAmount] = useState("");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Maker-only bid decryption state. After finalizeRFQ, every bid handle is
  // ACL-allowed for the maker via Nox.allow — we can pull plaintext amounts
  // through the same handle client used for encryption.
  const { ready: noxReady, getClient } = useNoxClient();
  const [decrypted, setDecrypted] = useState<Record<number, bigint>>({});
  const [decrypting, setDecrypting] = useState(false);

  async function handleDecryptBids() {
    if (decrypting) return;
    setDecrypting(true);
    try {
      const client = await getClient();
      if (!client) {
        toast.error("Nox client unavailable");
        return;
      }
      const out: Record<number, bigint> = {};
      for (let i = 0; i < bids.length; i++) {
        try {
          out[i] = await decryptUint256(client, bids[i].handle);
        } catch (err) {
          toast.error(
            `Bid #${i + 1} decryption failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
      setDecrypted(out);
      const total = Object.keys(out).length;
      if (total > 0) {
        toast.success(`Decrypted ${total} bid${total === 1 ? "" : "s"}`);
      }
    } finally {
      setDecrypting(false);
    }
  }

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const intentQuery = useReadContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "intents",
    args: [rfqId],
  });

  const bidsQuery = useReadContracts({
    contracts: Array.from({ length: 10 }, (_, i) => ({
      address: PRIVATE_OTC_ADDRESS,
      abi: RFQ_BIDS_ABI,
      functionName: "bids" as const,
      args: [rfqId, BigInt(i)] as const,
    })),
    allowFailure: true,
  });

  const bids = (bidsQuery.data ?? [])
    .filter((r) => r.status === "success")
    .map((r) => r.result as readonly [`0x${string}`, `0x${string}`, boolean])
    .map((v) => ({ taker: v[0], handle: v[1], active: v[2] }));

  if (intentQuery.isLoading) {
    return (
      <AppShell>
        <p className="text-label-caps mb-6 flex items-center gap-2 text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-base text-[--color-primary]">
            sync
          </span>
          FETCHING RFQ #{id}
        </p>
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-7">
            <SkeletonCard />
          </section>
          <aside className="col-span-12 space-y-4 lg:col-span-5">
            <SkeletonCard />
            <SkeletonCard />
          </aside>
        </div>
      </AppShell>
    );
  }

  if (!intentQuery.data) {
    return (
      <AppShell>
        <p className="font-mono text-sm text-[--color-danger]">
          ⟨ RFQ NOT FOUND ⟩
        </p>
      </AppShell>
    );
  }

  const v = intentQuery.data as readonly [
    `0x${string}`,
    `0x${string}`,
    `0x${string}`,
    `0x${string}`,
    `0x${string}`,
    bigint,
    number,
    number,
    `0x${string}`,
    `0x${string}`, // priceToPay
  ];

  const rfq = {
    maker: v[0],
    sellToken: v[1],
    buyToken: v[2],
    deadline: v[5],
    status: v[6],
  };

  const isOpen = rfq.status === 0;
  const isPendingReveal = rfq.status === 4;
  const isExpired = Number(rfq.deadline) <= now;
  const isMaker = address && address.toLowerCase() === rfq.maker.toLowerCase();
  const buyTok = TOKEN_NAMES[rfq.buyToken.toLowerCase()];
  const sellSym =
    TOKEN_NAMES[rfq.sellToken.toLowerCase()]?.symbol ??
    shortAddress(rfq.sellToken);

  const remaining = Number(rfq.deadline) - now;

  async function onSubmitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!buyTok) return;
    await submitBid.submit(
      rfqId,
      parseUnits(bidAmount || "0", buyTok.decimals),
    );
  }

  return (
    <AppShell>
      <Link
        href={"/intents" as Route}
        className="text-label-caps mb-6 inline-flex items-center gap-1.5 text-zinc-500 hover:text-[--color-primary]"
      >
        <span className="material-symbols-outlined text-base">
          arrow_back
        </span>
        All Intents
      </Link>

      <PageHeader
        icon="gavel"
        title={`RFQ #IX_${id.padStart(4, "0")}`}
        subtitle={`VICKREY_AUCTION | ${sellSym}_TO_${buyTok?.symbol ?? "?"}`}
        badge={
          <span className="text-label-caps flex items-center gap-1.5 border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-emerald-400">
            <span className="material-symbols-outlined text-base">hub</span>
            Public RFQ
          </span>
        }
      />


      <Countdown remaining={remaining} expired={isExpired} />

      <div className="mt-6 grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7">
          <div className="glass-card p-6">
            <SectionHeader
              icon="inventory_2"
              title="Sealed Bids"
              right={
                <p
                  className="flex items-center gap-2 text-3xl text-[--color-primary]"
                  data-numeric
                >
                  <span className="material-symbols-outlined">lock</span>
                  {bids.length}
                </p>
              }
            />


            <p className="mb-6 font-mono text-[11px] text-zinc-500">
              Amounts encrypted — only winner & maker decrypt the price after
              finalize
            </p>

            {bids.length > 0 ? (
              <ul className="space-y-2 border-t border-zinc-800 pt-4">
                {bids.map((bid, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border border-zinc-800 bg-zinc-900/30 p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-zinc-600">
                        #{(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="font-mono text-xs">
                        {shortAddress(bid.taker, 6)}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {bid.handle.slice(0, 14)}…[NOX]
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border-t border-zinc-800 pt-6">
                <div className="border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
                  <span
                    className="material-symbols-outlined text-zinc-700"
                    style={{ fontSize: "1.75rem" }}
                  >
                    inbox
                  </span>
                  <p className="mt-2 font-mono text-[11px] text-zinc-500">
                    {isOpen && !isExpired
                      ? "⟨ NO_BIDS_YET · be the first to seal a bid ⟩"
                      : "⟨ NO_BIDS_RECEIVED ⟩"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="col-span-12 space-y-4 lg:col-span-5">
          {!isMaker && isOpen && !isExpired && (
            <>
              <OperatorAuth
                token={rfq.buyToken}
                account={address}
                symbol={buyTok?.symbol ?? "buy token"}
                reason={`If you win this Vickrey auction, settlement pulls ${buyTok?.symbol ?? "your buy token"} from your wallet to the maker. Diam needs operator permission on this cToken first — one-time, lasts 60 days.`}
              />

              <form onSubmit={onSubmitBid} className="glass-card space-y-4 p-6">
                <p className="text-label-caps flex items-center gap-2 text-[--color-primary]">
                  <span className="h-1.5 w-1.5 bg-[--color-primary]" />
                  Submit Sealed Bid
                </p>
                <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
                  Bid honestly — Vickrey rules guarantee you only pay the
                  second-highest price if you win
                </p>

              <div className="space-y-2">
                <label className="text-label-caps text-zinc-500">
                  Your Bid
                </label>
                <div className="flex border border-zinc-800 bg-zinc-950 focus-within:border-[--color-primary]">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
                    data-numeric
                  />
                  <span className="grid place-items-center px-3 text-label-caps text-zinc-500">
                    {buyTok?.symbol ?? ""}
                  </span>
                </div>
              </div>

              {submitBid.error && (
                <div className="border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                  {submitBid.error}
                </div>
              )}

              {submitBid.step === "done" && (
                <div className="border border-[--color-primary] bg-[--color-primary]/10 p-3 text-sm">
                  <span className="text-[--color-primary]">
                    BID SUBMITTED.
                  </span>{" "}
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${submitBid.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Tx →
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitBid.step === "encrypting" ||
                  submitBid.step === "signing" ||
                  submitBid.step === "confirming"
                }
                className="diam-btn-primary flex w-full items-center justify-center gap-2 py-4 text-sm"
              >
                <span
                  className={`material-symbols-outlined text-base ${
                    submitBid.step === "encrypting" ||
                    submitBid.step === "confirming"
                      ? "animate-spin"
                      : ""
                  }`}
                >
                  {submitBid.step === "encrypting" && "enhanced_encryption"}
                  {submitBid.step === "signing" && "draw"}
                  {submitBid.step === "confirming" && "sync"}
                  {(submitBid.step === "idle" ||
                    submitBid.step === "error") &&
                    "lock"}
                  {submitBid.step === "done" && "check_circle"}
                </span>
                {submitBid.step === "encrypting" && "ENCRYPTING BID…"}
                {submitBid.step === "signing" && "CONFIRM IN WALLET…"}
                {submitBid.step === "confirming" && "SUBMITTING…"}
                {(submitBid.step === "idle" || submitBid.step === "error") &&
                  "SUBMIT SEALED BID"}
                {submitBid.step === "done" && "SUBMITTED"}
              </button>
              </form>
            </>
          )}

          {isOpen && isExpired && bids.length >= 2 && (
            <div className="glass-card border-l-2 border-l-[--color-primary] p-6">
              <p className="text-label-caps mb-2 text-[--color-primary]">
                Step 1 of 2 · Freeze Auction
              </p>
              <p className="mb-4 font-mono text-[11px] leading-relaxed text-zinc-500">
                Bidding closed. Anyone can compute the encrypted second-price
                via Vickrey. Maker then reveals the winning bid index in step 2.
              </p>
              <button
                onClick={() => finalize.submit(rfqId)}
                disabled={
                  finalize.step === "signing" || finalize.step === "confirming"
                }
                className="diam-btn-primary flex w-full items-center justify-center gap-2 py-4 text-sm"
              >
                <span
                  className={`material-symbols-outlined text-base ${
                    finalize.step === "confirming" ? "animate-spin" : ""
                  }`}
                >
                  {finalize.step === "signing" && "draw"}
                  {finalize.step === "confirming" && "sync"}
                  {(finalize.step === "idle" || finalize.step === "error") &&
                    "gavel"}
                  {finalize.step === "done" && "check_circle"}
                </span>
                {finalize.step === "signing" && "CONFIRM IN WALLET…"}
                {finalize.step === "confirming" && "RUNNING VICKREY…"}
                {(finalize.step === "idle" || finalize.step === "error") &&
                  "COMPUTE SECOND-PRICE"}
                {finalize.step === "done" && "FROZEN — AWAITING REVEAL"}
              </button>
              {finalize.error && (
                <p className="mt-2 font-mono text-[10px] text-[--color-danger]">
                  {finalize.error}
                </p>
              )}
            </div>
          )}

          {/* Step 2 — maker-only reveal panel */}
          {isPendingReveal && isMaker && (() => {
            const decryptedCount = Object.keys(decrypted).length;
            const allDecrypted =
              bids.length > 0 && decryptedCount === bids.length;
            const highestIdx = allDecrypted
              ? bids
                  .map((_, i) => i)
                  .reduce((best, i) =>
                    (decrypted[i] ?? 0n) > (decrypted[best] ?? 0n) ? i : best,
                  )
              : -1;

            return (
              <div className="glass-card border-l-2 border-l-amber-400 p-6">
                <p className="text-label-caps mb-2 flex items-center gap-2 text-amber-400">
                  <span className="h-1.5 w-1.5 animate-pulse bg-amber-400" />
                  Step 2 of 2 · Reveal Winner
                </p>
                <p className="mb-4 font-mono text-[11px] leading-relaxed text-zinc-500">
                  Auction frozen. As maker, every bid handle is{" "}
                  <span className="text-amber-400">ACL-allowed</span> for your
                  wallet. Decrypt below to see plaintext amounts, then pick the
                  highest bidder.
                </p>

                {bids.length > 0 ? (
                  <>
                    <button
                      onClick={handleDecryptBids}
                      disabled={!noxReady || decrypting || allDecrypted}
                      className="text-label-caps mb-3 flex w-full items-center justify-center gap-2 border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-amber-400 transition hover:bg-amber-400/20 disabled:opacity-40"
                    >
                      <span
                        className={`material-symbols-outlined text-base ${
                          decrypting ? "animate-spin" : ""
                        }`}
                      >
                        {decrypting
                          ? "sync"
                          : allDecrypted
                            ? "check_circle"
                            : "lock_open"}
                      </span>
                      {decrypting
                        ? "DECRYPTING…"
                        : allDecrypted
                          ? `${decryptedCount} bids decrypted`
                          : !noxReady
                            ? "WALLET NOT READY"
                            : `Decrypt ${bids.length} bid${bids.length === 1 ? "" : "s"} via Nox`}
                    </button>

                    <ul className="mb-4 space-y-2">
                      {bids.map((bid, i) => {
                        const amount = decrypted[i];
                        const isHighest = i === highestIdx;
                        return (
                          <li
                            key={i}
                            className={`flex items-center justify-between border p-3 transition ${
                              isHighest
                                ? "border-amber-400 bg-amber-400/5"
                                : "border-zinc-800 bg-zinc-900/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[10px] text-zinc-600">
                                #{(i + 1).toString().padStart(2, "0")}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-xs">
                                  {shortAddress(bid.taker, 6)}
                                </span>
                                {amount !== undefined ? (
                                  <span
                                    className={`font-mono text-[11px] ${
                                      isHighest
                                        ? "text-amber-400"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    {buyTok
                                      ? formatUnits(amount, buyTok.decimals)
                                      : amount.toString()}{" "}
                                    {buyTok?.symbol ?? ""}
                                    {isHighest && " · highest"}
                                  </span>
                                ) : (
                                  <span className="font-mono text-[10px] text-zinc-600">
                                    {bid.handle.slice(0, 14)}…[encrypted]
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => reveal.submit(rfqId, BigInt(i))}
                              disabled={
                                !allDecrypted ||
                                reveal.step === "signing" ||
                                reveal.step === "confirming"
                              }
                              className={`text-label-caps border px-3 py-1.5 transition disabled:opacity-40 ${
                                isHighest
                                  ? "border-amber-400 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30"
                                  : "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                              }`}
                              title={
                                allDecrypted
                                  ? "Settle to this bidder"
                                  : "Decrypt bids first"
                              }
                            >
                              Pick as winner
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="font-mono text-[11px] text-zinc-500">
                    No bids on this RFQ — nothing to reveal.
                  </p>
                )}

                {reveal.step !== "idle" && (
                  <p className="font-mono text-[10px] text-zinc-500">
                    {reveal.step === "signing" && "→ confirm in wallet…"}
                    {reveal.step === "confirming" && "→ submitting reveal…"}
                    {reveal.step === "done" && "✓ winner revealed — settling"}
                    {reveal.step === "error" && (
                      <span className="text-[--color-danger]">
                        ✕ {reveal.error}
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Non-maker view of PendingReveal — informational */}
          {isPendingReveal && !isMaker && (
            <div className="glass-card border-l-2 border-l-amber-400 p-6">
              <p className="text-label-caps mb-2 flex items-center gap-2 text-amber-400">
                <span className="h-1.5 w-1.5 animate-pulse bg-amber-400" />
                Awaiting Maker Reveal
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
                The Vickrey second-price has been computed and is encrypted
                on-chain. The maker is decrypting bid amounts off-chain to
                identify the actual winner. Settlement will trigger
                automatically once they reveal.
              </p>
            </div>
          )}

          {!isOpen && !isPendingReveal && (
            <div className="glass-card p-6">
              <p className="font-mono text-sm text-zinc-500">
                ⟨ RFQ {statusLabel(rfq.status).toUpperCase()} ⟩
              </p>
            </div>
          )}

          {(rfq.status === 1 || reveal.step === "done") && (
            <NftReceipt
              pair={`${sellSym}/${buyTok?.symbol ?? "?"}`}
              intentId={id}
              mode="RFQ"
              txHash={reveal.txHash ?? finalize.txHash ?? undefined}
              makerAddress={rfq.maker}
              timestamp={Date.now()}
            />
          )}

          <div className="glass-card border-l-2 border-l-[--color-primary] p-6">
            <div className="mb-3 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-[--color-primary]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <p className="text-label-caps text-[--color-primary]">
                Vickrey Pricing
              </p>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
              Highest bid wins. Pays second-highest. All comparisons run inside
              encrypted handles via Nox.gt + Nox.select.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Countdown({
  remaining,
  expired,
}: {
  remaining: number;
  expired: boolean;
}) {
  if (expired) {
    return (
      <div className="border border-orange-900 bg-orange-950/40 px-4 py-2 text-label-caps text-orange-400">
        ⟨ BIDDING WINDOW CLOSED ⟩
      </div>
    );
  }
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return (
    <div className="glass-card flex items-center gap-4 px-4 py-3">
      <span className="text-label-caps text-zinc-500">CLOSES IN</span>
      <span
        className="font-mono text-2xl text-[--color-primary]"
        data-numeric
      >
        {h > 0 && `${h}h `}
        {m.toString().padStart(2, "0")}m {s.toString().padStart(2, "0")}s
      </span>
      <div className="ml-auto h-2 w-2 rounded-full bg-[--color-primary] pulse-soft" />
    </div>
  );
}
