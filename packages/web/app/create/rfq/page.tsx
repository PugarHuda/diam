"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useCreateRfq } from "@/lib/hooks/useOtcWrites";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import { parseUnits } from "viem";

const TOKENS = [
  { symbol: "cUSDC", address: CUSDC_ADDRESS, decimals: 6 },
  { symbol: "cETH", address: CETH_ADDRESS, decimals: 18 },
];

const DEADLINE_PRESETS = [
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 6 * 3600 },
  { label: "1 day", seconds: 86400 },
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
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold">RFQ Mode</h1>
        <p className="mt-2 text-[--color-muted]">
          Multi-bidder Vickrey auction. Sealed bids, highest wins, pays
          second-highest. Encrypted end-to-end via Nox.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Sell asset">
              <Select value={sellSymbol} onChange={setSellSymbol} options={TOKENS} />
            </FormField>
            <FormField label="Buy asset">
              <Select value={buySymbol} onChange={setBuySymbol} options={TOKENS} />
            </FormField>
          </div>

          <FormField
            label="Sell amount"
            hint="Encrypted on submit. Takers see asset pair only — not size."
          >
            <NumberInput
              value={sellAmount}
              onChange={setSellAmount}
              suffix={sellTok.symbol}
            />
          </FormField>

          <FormField
            label="Bidding window"
            hint="Takers can submit sealed bids until this expires."
          >
            <div className="flex gap-2">
              {DEADLINE_PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => setDeadline(p.seconds)}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    deadline === p.seconds
                      ? "border-[--color-accent] bg-[--color-accent]/10 text-[--color-accent]"
                      : "border-[--color-border] text-[--color-muted] hover:border-[--color-accent]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </FormField>

          <div className="rounded-md border border-[--color-border] bg-[--color-surface]/50 p-4 text-sm">
            <p className="font-medium">Vickrey pricing</p>
            <p className="mt-1 text-[--color-muted]">
              Highest bid wins. Winner pays the <em>second-highest</em> bid.
              Mathematically optimal for sellers; bidders are incentivized to
              bid honestly. Both winning price and losing bids stay encrypted.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
              {error}
            </div>
          )}

          {step === "done" && intentId !== null && (
            <div className="rounded-md border border-[--color-success] bg-[--color-success]/10 p-3 text-sm">
              <p>RFQ #{intentId.toString()} created.</p>
              <p className="mt-1">
                <Link
                  href={`/rfq/${intentId.toString()}`}
                  className="underline"
                >
                  View RFQ →
                </Link>
                {" · "}
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Tx
                </a>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[--color-accent] px-6 py-3 font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover] disabled:opacity-50"
          >
            {step === "encrypting" && "Encrypting amount via Nox…"}
            {step === "signing" && "Confirm in wallet…"}
            {step === "confirming" && "Confirming on-chain…"}
            {(step === "idle" || step === "error") && "Open RFQ"}
            {step === "done" && "Done ✓"}
          </button>
        </form>
      </main>
    </>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[--color-muted]">{hint}</p>}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { symbol: string; address: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-md border border-[--color-border] bg-[--color-surface] px-3 py-2 focus:border-[--color-accent] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.symbol} value={o.symbol}>
          {o.symbol}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <div className="mt-1 flex rounded-md border border-[--color-border] bg-[--color-surface] focus-within:border-[--color-accent]">
      <input
        type="number"
        step="any"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.0"
        className="flex-1 bg-transparent px-3 py-2 font-mono focus:outline-none"
        data-numeric
      />
      <span className="grid place-items-center px-3 text-sm text-[--color-muted]">
        {suffix}
      </span>
    </div>
  );
}
