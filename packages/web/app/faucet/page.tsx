"use client";

import { useState } from "react";
import Link from "next/link";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { useFaucet } from "@/lib/hooks/useFaucet";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";

const TOKENS = [
  { symbol: "cUSDC", address: CUSDC_ADDRESS, decimals: 6, defaultMint: "10000" },
  { symbol: "cETH", address: CETH_ADDRESS, decimals: 18, defaultMint: "10" },
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
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold">Faucet</h1>
        <p className="mt-2 text-sm text-[--color-muted]">
          Mint mock confidential tokens to your wallet. Encrypted via Nox.
          Testnet only — no real value.
        </p>

        {!isConnected && (
          <div className="mt-8 rounded-xl border border-[--color-border] bg-[--color-surface] p-8 text-center">
            <p className="text-[--color-muted]">Connect wallet to mint.</p>
          </div>
        )}

        {isConnected && (
          <form
            onSubmit={onMint}
            className="mt-8 space-y-6 rounded-xl border border-[--color-border] bg-[--color-surface] p-6"
          >
            <div>
              <label className="block text-sm font-medium">Token</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TOKENS.map((t) => (
                  <button
                    key={t.symbol}
                    type="button"
                    onClick={() => {
                      setSelected(t);
                      setAmount(t.defaultMint);
                    }}
                    className={`rounded-md border px-4 py-3 text-left transition ${
                      selected.symbol === t.symbol
                        ? "border-[--color-accent] bg-[--color-accent]/10"
                        : "border-[--color-border] hover:border-[--color-accent]"
                    }`}
                  >
                    <p className="font-medium">{t.symbol}</p>
                    <p className="mt-1 font-mono text-xs text-[--color-muted]">
                      {t.address.slice(0, 8)}…{t.address.slice(-6)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Amount</label>
              <div className="mt-1 flex rounded-md border border-[--color-border] bg-[--color-bg] focus-within:border-[--color-accent]">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent px-3 py-2 font-mono focus:outline-none"
                  data-numeric
                />
                <span className="grid place-items-center px-3 text-sm text-[--color-muted]">
                  {selected.symbol}
                </span>
              </div>
              <p className="mt-1 text-xs text-[--color-muted]">
                Encrypted on-chain. Other addresses only see &quot;some balance
                changed&quot; — never the amount.
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                {error}
              </div>
            )}

            {step === "done" && (
              <div className="rounded-md border border-[--color-success] bg-[--color-success]/10 p-3 text-sm">
                Minted {amount} {selected.symbol}.{" "}
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  View tx
                </a>
                {" · "}
                <Link href="/portfolio" className="underline">
                  Decrypt balance →
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-[--color-accent] px-6 py-3 font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover] disabled:opacity-50"
            >
              {step === "encrypting" && "Encrypting amount via Nox…"}
              {step === "signing" && "Confirm in wallet…"}
              {step === "confirming" && "Minting on-chain…"}
              {(step === "idle" || step === "error") &&
                `Mint ${amount} ${selected.symbol}`}
              {step === "done" && "Minted ✓"}
            </button>
          </form>
        )}

        <div className="mt-8 rounded-md border border-[--color-border] bg-[--color-surface]/50 p-4 text-sm text-[--color-muted]">
          <p className="font-medium text-[--color-foreground]">Next steps</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Mint balance for both tokens you want to trade</li>
            <li>
              Approve PrivateOTC as operator on each cToken (one-time, in your
              wallet)
            </li>
            <li>
              Create an{" "}
              <Link href="/create" className="text-[--color-accent] underline">
                intent or RFQ
              </Link>
            </li>
          </ol>
        </div>
      </main>
    </>
  );
}
