"use client";

import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import { parseUnits } from "viem";
import { AppShell } from "@/components/AppShell";
import { useCreateRfq } from "@/lib/hooks/useOtcWrites";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";

const TOKENS = [
  { symbol: "cUSDC", address: CUSDC_ADDRESS, decimals: 6 },
  { symbol: "cETH", address: CETH_ADDRESS, decimals: 18 },
];

const WINDOW_PRESETS = [
  { label: "30M", seconds: 30 * 60 },
  { label: "1H", seconds: 3600 },
  { label: "6H", seconds: 6 * 3600 },
  { label: "1D", seconds: 86400 },
];

export default function RfqCreatePage() {
  const { submit, step, error, intentId, txHash } = useCreateRfq();

  const [sellSymbol, setSellSymbol] = useState("cETH");
  const [buySymbol, setBuySymbol] = useState("cUSDC");
  const [sellAmount, setSellAmount] = useState("");
  const [deadline, setDeadline] = useState(3600);

  const sellTok = TOKENS.find((t) => t.symbol === sellSymbol)!;
  const buyTok = TOKENS.find((t) => t.symbol === buySymbol)!;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      sellToken: sellTok.address,
      buyToken: buyTok.address,
      sellAmount: parseUnits(sellAmount || "0", sellTok.decimals),
      biddingDeadlineSeconds: deadline,
    });
  }

  const busy =
    step === "encrypting" || step === "signing" || step === "confirming";

  return (
    <AppShell>
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-headline-xl text-3xl font-bold tracking-tight text-white">
            RFQ MODE
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            VICKREY_ENGINE | SECOND_PRICE_SEALED_BID
          </p>
        </div>
        <div className="flex bg-zinc-900 p-1 border border-zinc-800">
          <Link
            href={"/create/direct" as Route}
            className="px-6 py-2 text-zinc-500 text-label-caps hover:text-zinc-300"
          >
            Direct OTC
          </Link>
          <span className="px-6 py-2 bg-[--color-primary] text-[--color-primary-fg] text-label-caps">
            RFQ Mode
          </span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7">
          <div className="glass-card p-6">
            <h3 className="text-label-caps mb-6 flex items-center gap-2 text-zinc-400">
              <span className="h-1.5 w-1.5 bg-[--color-primary]" />
              Open Sealed-Bid Auction
            </h3>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-label-caps text-zinc-500">
                    Sell Token
                  </label>
                  <div className="relative">
                    <select
                      value={sellSymbol}
                      onChange={(e) => setSellSymbol(e.target.value)}
                      className="diam-input appearance-none pr-10"
                    >
                      {TOKENS.map((t) => (
                        <option key={t.symbol} value={t.symbol}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-zinc-600">
                      expand_more
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-label-caps text-zinc-500">
                    Buy Token
                  </label>
                  <div className="relative">
                    <select
                      value={buySymbol}
                      onChange={(e) => setBuySymbol(e.target.value)}
                      className="diam-input appearance-none pr-10"
                    >
                      {TOKENS.map((t) => (
                        <option key={t.symbol} value={t.symbol}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-zinc-600">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-label-caps text-zinc-500">
                    Sell Amount
                  </label>
                  <span className="font-mono text-[9px] uppercase text-[--color-primary]">
                    HIDDEN
                  </span>
                </div>
                <div className="flex border border-zinc-800 bg-zinc-950 focus-within:border-[--color-primary]">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
                    data-numeric
                  />
                  <span className="grid place-items-center px-3 text-label-caps text-zinc-500">
                    {sellTok.symbol}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-zinc-600">
                  Takers see asset pair only — not size
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-label-caps text-zinc-500">
                  Bidding Window
                </label>
                <div className="flex gap-2">
                  {WINDOW_PRESETS.map((p) => (
                    <button
                      key={p.seconds}
                      type="button"
                      onClick={() => setDeadline(p.seconds)}
                      className={`text-label-caps border px-4 py-2 transition-all ${
                        deadline === p.seconds
                          ? "border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]"
                          : "border-zinc-800 text-zinc-500 hover:border-[--color-primary]/40"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                  {error}
                </div>
              )}

              {step === "done" && intentId !== null && (
                <div className="border border-[--color-primary] bg-[--color-primary]/10 p-3 text-sm">
                  <span className="text-[--color-primary]">
                    RFQ #{intentId.toString()} OPEN.
                  </span>{" "}
                  <Link
                    href={`/rfq/${intentId.toString()}` as Route}
                    className="underline"
                  >
                    View RFQ →
                  </Link>{" "}
                  ·{" "}
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Tx
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="diam-btn-primary w-full py-4 text-sm"
              >
                {step === "encrypting" && "ENCRYPTING VIA NOX…"}
                {step === "signing" && "CONFIRM IN WALLET…"}
                {step === "confirming" && "OPENING ON-CHAIN…"}
                {(step === "idle" || step === "error") && "OPEN AUCTION"}
                {step === "done" && "BROADCAST COMPLETE ✓"}
              </button>
            </form>
          </div>
        </section>

        <aside className="col-span-12 space-y-4 lg:col-span-5">
          <div className="glass-card border-l-2 border-l-[--color-primary] p-6">
            <div className="mb-3 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-[--color-primary]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <p className="text-label-caps text-[--color-primary]">
                Vickrey Auction
              </p>
            </div>
            <p className="text-sm text-zinc-300">
              Highest sealed bid wins. Winner pays{" "}
              <span className="font-mono text-[--color-primary]">
                second-highest
              </span>{" "}
              price.
            </p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-zinc-500">
              Mathematically optimal for sellers. Bidders are incentivized to
              bid honestly — bidding below true valuation never increases their
              win probability and bidding above creates downside risk.
            </p>
          </div>

          <div className="glass-card p-6">
            <p className="text-label-caps mb-3 text-zinc-500">
              ON_CHAIN_LOGIC
            </p>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-zinc-400">
              <code>{`for (uint i = 1; i < bids.length; i++) {
  ebool isHigher = Nox.gt(candidate, highest);
  second  = Nox.select(isHigher, highest, second);
  highest = Nox.select(isHigher, candidate, highest);
}
priceToPay = second;  // encrypted`}</code>
            </pre>
            <p className="mt-3 font-mono text-[10px] text-zinc-600">
              All comparisons run inside encrypted handles. Cap: 10 bidders.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
