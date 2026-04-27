"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { parseUnits } from "viem";
import { AppShell } from "@/components/AppShell";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS, CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import { useSubmitBid, useFinalizeRfq } from "@/lib/hooks/useOtcWrites";
import { statusLabel } from "@/lib/hooks/useIntents";
import { shortAddress } from "@/lib/utils";

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

  const [bidAmount, setBidAmount] = useState("");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

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
        <p className="font-mono text-sm text-zinc-500">
          ⟨ FETCHING RFQ #{id} ⟩
        </p>
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
  ];

  const rfq = {
    maker: v[0],
    sellToken: v[1],
    buyToken: v[2],
    deadline: v[5],
    status: v[6],
  };

  const isOpen = rfq.status === 0;
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
      <p className="mb-6">
        <Link
          href={"/intents" as Route}
          className="text-label-caps text-zinc-500 hover:text-[--color-primary]"
        >
          ← All Intents
        </Link>
      </p>

      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-headline-xl text-3xl font-bold tracking-tight text-white">
            RFQ #IX_{id.padStart(4, "0")}
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            VICKREY_AUCTION | {sellSym}_TO_{buyTok?.symbol ?? "?"}
          </p>
        </div>
        <span className="text-label-caps border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-emerald-400">
          Public RFQ
        </span>
      </header>

      <Countdown remaining={remaining} expired={isExpired} />

      <div className="mt-6 grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7">
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-label-caps flex items-center gap-2 text-zinc-400">
                <span className="h-1.5 w-1.5 bg-[--color-primary]" />
                Sealed Bids
              </h3>
              <p
                className="text-headline-lg text-3xl text-[--color-primary]"
                data-numeric
              >
                {bids.length}
              </p>
            </div>

            <p className="mb-6 font-mono text-[11px] text-zinc-500">
              Amounts encrypted — only winner & maker decrypt the price after
              finalize
            </p>

            {bids.length > 0 && (
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
            )}
          </div>
        </section>

        <aside className="col-span-12 space-y-4 lg:col-span-5">
          {!isMaker && isOpen && !isExpired && (
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
                className="diam-btn-primary w-full py-4 text-sm"
              >
                {submitBid.step === "encrypting" && "ENCRYPTING BID…"}
                {submitBid.step === "signing" && "CONFIRM IN WALLET…"}
                {submitBid.step === "confirming" && "SUBMITTING…"}
                {(submitBid.step === "idle" || submitBid.step === "error") &&
                  "SUBMIT SEALED BID"}
                {submitBid.step === "done" && "SUBMITTED ✓"}
              </button>
            </form>
          )}

          {isOpen && isExpired && bids.length >= 2 && (
            <div className="glass-card border-l-2 border-l-[--color-primary] p-6">
              <p className="text-label-caps mb-2 text-[--color-primary]">
                Ready to Finalize
              </p>
              <p className="mb-4 font-mono text-[11px] text-zinc-500">
                Bidding closed. Anyone can call finalize. Vickrey logic runs
                on-chain via encrypted comparisons.
              </p>
              <button
                onClick={() => finalize.submit(rfqId)}
                disabled={
                  finalize.step === "signing" || finalize.step === "confirming"
                }
                className="diam-btn-primary w-full py-4 text-sm"
              >
                {finalize.step === "signing" && "CONFIRM IN WALLET…"}
                {finalize.step === "confirming" && "RUNNING VICKREY…"}
                {(finalize.step === "idle" || finalize.step === "error") &&
                  "FINALIZE RFQ"}
                {finalize.step === "done" && "FINALIZED ✓"}
              </button>
              {finalize.error && (
                <p className="mt-2 font-mono text-[10px] text-[--color-danger]">
                  {finalize.error}
                </p>
              )}
            </div>
          )}

          {!isOpen && (
            <div className="glass-card p-6">
              <p className="font-mono text-sm text-zinc-500">
                ⟨ RFQ {statusLabel(rfq.status).toUpperCase()} ⟩
              </p>
            </div>
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
