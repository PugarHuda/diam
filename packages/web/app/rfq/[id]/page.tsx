"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { parseUnits } from "viem";
import { Header } from "@/components/Header";
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

  const intentQuery = useReadContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "intents",
    args: [rfqId],
  });

  // Probe up to MAX_BIDS_PER_RFQ slots (10)
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

  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  if (intentQuery.isLoading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-[--color-muted]">Loading RFQ #{id}…</p>
        </main>
      </>
    );
  }

  if (!intentQuery.data) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-[--color-danger]">RFQ not found.</p>
        </main>
      </>
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
    `0x${string}`
  ];

  const rfq = {
    maker: v[0],
    sellToken: v[1],
    buyToken: v[2],
    deadline: v[5],
    status: v[6],
    mode: v[7],
  };

  const isOpen = rfq.status === 0;
  const isExpired = Number(rfq.deadline) <= now;
  const isMaker = address && address.toLowerCase() === rfq.maker.toLowerCase();
  const buyTok = TOKEN_NAMES[rfq.buyToken.toLowerCase()];
  const sellSym =
    TOKEN_NAMES[rfq.sellToken.toLowerCase()]?.symbol ?? shortAddress(rfq.sellToken);

  const remaining = Number(rfq.deadline) - now;

  async function onSubmitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!buyTok) return;
    await submitBid.submit(rfqId, parseUnits(bidAmount || "0", buyTok.decimals));
  }

  async function onFinalize() {
    await finalize.submit(rfqId);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-[--color-muted]">
          <Link href="/intents" className="hover:text-[--color-foreground]">
            ← All intents
          </Link>
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RFQ #{id}</h1>
            <p className="mt-1 font-mono text-sm text-[--color-muted]">
              {sellSym} → {buyTok?.symbol ?? shortAddress(rfq.buyToken)}
            </p>
          </div>
          <span className="rounded bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400">
            Vickrey RFQ
          </span>
        </div>

        <Countdown remaining={remaining} expired={isExpired} />

        <div className="mt-8 rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[--color-muted]">
            Sealed bids
          </h2>
          <p className="mt-2 text-3xl font-bold" data-numeric>
            {bids.length}
          </p>
          <p className="mt-1 text-xs text-[--color-muted]">
            Amounts encrypted — only the winner & maker decrypt the price after
            finalize.
          </p>

          {bids.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-[--color-border] pt-4">
              {bids.map((bid, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-xs">
                    {shortAddress(bid.taker)}
                  </span>
                  <span className="font-mono text-xs text-[--color-muted]">
                    {bid.handle.slice(0, 12)}…
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isMaker && isOpen && !isExpired && (
          <form
            onSubmit={onSubmitBid}
            className="mt-6 rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold">Submit sealed bid</h2>
            <p className="text-sm text-[--color-muted]">
              Bid honestly — Vickrey rules guarantee you only pay the
              second-highest price if you win.
            </p>

            <div>
              <label className="block text-sm font-medium">Your bid</label>
              <div className="mt-1 flex rounded-md border border-[--color-border] bg-[--color-bg] focus-within:border-[--color-accent]">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent px-3 py-2 font-mono focus:outline-none"
                  data-numeric
                />
                <span className="grid place-items-center px-3 text-sm text-[--color-muted]">
                  {buyTok?.symbol ?? ""}
                </span>
              </div>
            </div>

            {submitBid.error && (
              <div className="rounded-md border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                {submitBid.error}
              </div>
            )}

            {submitBid.step === "done" && (
              <div className="rounded-md border border-[--color-success] bg-[--color-success]/10 p-3 text-sm">
                Bid submitted.{" "}
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
              className="w-full rounded-md bg-[--color-accent] px-6 py-3 font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover] disabled:opacity-50"
            >
              {submitBid.step === "encrypting" && "Encrypting bid…"}
              {submitBid.step === "signing" && "Confirm in wallet…"}
              {submitBid.step === "confirming" && "Submitting on-chain…"}
              {(submitBid.step === "idle" || submitBid.step === "error") &&
                "Submit sealed bid"}
              {submitBid.step === "done" && "Submitted ✓"}
            </button>
          </form>
        )}

        {isOpen && isExpired && bids.length >= 2 && (
          <div className="mt-6 rounded-xl border border-[--color-accent] bg-[--color-accent]/5 p-6">
            <h2 className="text-lg font-semibold">Ready to finalize</h2>
            <p className="mt-1 text-sm text-[--color-muted]">
              Bidding window closed. Anyone can call finalize to reveal the
              winner and settle. Vickrey logic runs on-chain.
            </p>
            <button
              onClick={onFinalize}
              disabled={
                finalize.step === "signing" || finalize.step === "confirming"
              }
              className="mt-4 w-full rounded-md bg-[--color-accent] px-6 py-3 font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover] disabled:opacity-50"
            >
              {finalize.step === "signing" && "Confirm in wallet…"}
              {finalize.step === "confirming" && "Running Vickrey on-chain…"}
              {(finalize.step === "idle" || finalize.step === "error") &&
                "Finalize RFQ"}
              {finalize.step === "done" && "Finalized ✓"}
            </button>
            {finalize.error && (
              <p className="mt-2 text-xs text-[--color-danger]">
                {finalize.error}
              </p>
            )}
          </div>
        )}

        {!isOpen && (
          <div className="mt-6 rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
            <p className="text-sm text-[--color-muted]">
              RFQ {statusLabel(rfq.status).toLowerCase()}.
            </p>
          </div>
        )}
      </main>
    </>
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
      <div className="mt-6 rounded-md border border-[--color-warning] bg-[--color-warning]/10 px-4 py-2 text-sm text-[--color-warning]">
        Bidding window closed
      </div>
    );
  }
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return (
    <div className="mt-6 flex items-center gap-3 rounded-md border border-[--color-border] bg-[--color-surface] px-4 py-3">
      <span className="text-xs uppercase tracking-wider text-[--color-muted]">
        Closes in
      </span>
      <span className="font-mono text-lg" data-numeric>
        {h > 0 && `${h}h `}
        {m.toString().padStart(2, "0")}m {s.toString().padStart(2, "0")}s
      </span>
    </div>
  );
}
