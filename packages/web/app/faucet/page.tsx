"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TokenIcon } from "@/components/TokenIcon";
import { useFaucet } from "@/lib/hooks/useFaucet";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";

const TOKENS = [
  {
    symbol: "cUSDC",
    address: CUSDC_ADDRESS,
    decimals: 6,
    defaultMint: "10000",
  },
  {
    symbol: "cETH",
    address: CETH_ADDRESS,
    decimals: 18,
    defaultMint: "10",
  },
];

export default function FaucetPage() {
  const { isConnected } = useAccount();
  const { mint, step, error, txHash } = useFaucet();

  const [selected, setSelected] = useState(TOKENS[0]);
  const [amount, setAmount] = useState(TOKENS[0].defaultMint);

  async function onMint(e: React.FormEvent) {
    e.preventDefault();
    await mint(selected.address, parseUnits(amount || "0", selected.decimals));
  }

  const busy = step === "encrypting" || step === "signing" || step === "confirming";

  return (
    <AppShell>
      <PageHeader
        icon="water_drop"
        title="FAUCET"
        subtitle="MOCK_ERC7984_DISPENSER | TESTNET_ONLY"
      />

      {!isConnected && (
        <EmptyState
          icon="account_circle_off"
          title="CONNECT WALLET TO MINT"
          body="A connected wallet on Arbitrum Sepolia is required"
        />
      )}

      {isConnected && (
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-7">
            <div className="glass-card p-6">
              <SectionHeader icon="water_drop" title="Mint Confidential Tokens" />

              <form onSubmit={onMint} className="space-y-6">
                <div>
                  <label className="text-label-caps mb-2 flex items-center gap-1.5 text-zinc-500">
                    <span className="material-symbols-outlined text-sm">
                      token
                    </span>
                    Token
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOKENS.map((t) => (
                      <button
                        key={t.symbol}
                        type="button"
                        onClick={() => {
                          setSelected(t);
                          setAmount(t.defaultMint);
                        }}
                        className={`flex items-center gap-3 border p-4 text-left transition-all ${
                          selected.symbol === t.symbol
                            ? "border-[--color-primary] bg-[--color-primary]/10"
                            : "border-zinc-800 hover:border-[--color-primary]/40"
                        }`}
                      >
                        <TokenIcon symbol={t.symbol} size="sm" />
                        <div>
                          <p className="font-display text-sm font-bold">
                            {t.symbol}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                            {t.address.slice(0, 8)}…{t.address.slice(-6)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-label-caps flex items-center gap-1.5 text-zinc-500">
                      <span className="material-symbols-outlined text-sm">
                        pin
                      </span>
                      Amount
                    </label>
                    <span className="flex items-center gap-1 font-mono text-[9px] uppercase text-[--color-primary]">
                      <span className="material-symbols-outlined text-xs">
                        enhanced_encryption
                      </span>
                      ENCRYPTED ON SUBMIT
                    </span>
                  </div>
                  <div className="flex border border-zinc-800 bg-zinc-950 focus-within:border-[--color-primary]">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
                      data-numeric
                    />
                    <span className="grid place-items-center px-3 text-label-caps text-zinc-500">
                      {selected.symbol}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                    {error}
                  </div>
                )}

                {step === "done" && (
                  <div className="border border-[--color-primary] bg-[--color-primary]/10 p-3 text-sm">
                    <span className="text-[--color-primary]">
                      MINTED {amount} {selected.symbol}.
                    </span>{" "}
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Tx
                    </a>{" "}
                    ·{" "}
                    <Link
                      href={"/portfolio" as Route}
                      className="underline"
                    >
                      Decrypt balance →
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="diam-btn-primary flex w-full items-center justify-center gap-2 py-4 text-sm"
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      busy ? "animate-spin" : ""
                    }`}
                  >
                    {step === "encrypting" && "enhanced_encryption"}
                    {step === "signing" && "draw"}
                    {step === "confirming" && "sync"}
                    {(step === "idle" || step === "error") && "water_drop"}
                    {step === "done" && "check_circle"}
                  </span>
                  {step === "encrypting" && "ENCRYPTING VIA NOX…"}
                  {step === "signing" && "CONFIRM IN WALLET…"}
                  {step === "confirming" && "MINTING ON-CHAIN…"}
                  {(step === "idle" || step === "error") &&
                    `MINT ${amount} ${selected.symbol}`}
                  {step === "done" && "MINTED ✓"}
                </button>
              </form>
            </div>
          </section>

          <aside className="col-span-12 space-y-4 lg:col-span-5">
            <div className="glass-card border-l-2 border-l-[--color-primary] p-4">
              <p className="text-label-caps mb-2 text-zinc-500">NEXT_STEPS</p>
              <ol className="space-y-2 font-mono text-xs">
                <Step
                  num="01"
                  text="Mint balance for both tokens you want to trade"
                />
                <Step
                  num="02"
                  text="Approve Diam contract as operator on each cToken (one-time)"
                />
                <Step
                  num="03"
                  text="Open an intent or RFQ from /create"
                />
              </ol>
            </div>

            <div className="glass-card p-4">
              <p className="text-label-caps mb-2 text-zinc-500">
                MOCK_ERC7984_NOTE
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-zinc-400">
                MockCToken is a real ERC-7984 implementation (~150 LOC) using
                Nox.transfer + Nox.mint primitives directly. Open faucet for
                testnet only — production tokens would use access control.
              </p>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="font-mono text-[--color-primary]">{num}</span>
      <span className="text-zinc-400">{text}</span>
    </li>
  );
}
