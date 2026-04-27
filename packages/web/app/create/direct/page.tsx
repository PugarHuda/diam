"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { AppShell } from "@/components/AppShell";
import { ChainGPTAdvisor } from "@/components/ChainGPTAdvisor";
import { useCreateIntent } from "@/lib/hooks/useCreateIntent";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";

const TOKENS = [
  { symbol: "cUSDC", address: CUSDC_ADDRESS, decimals: 6 },
  { symbol: "cETH", address: CETH_ADDRESS, decimals: 18 },
];

const DEADLINE_PRESETS = [
  { label: "1H", seconds: 3600 },
  { label: "6H", seconds: 6 * 3600 },
  { label: "1D", seconds: 86400 },
  { label: "1W", seconds: 7 * 86400 },
];

export default function DirectOtcPage() {
  const { submit, step, error, intentId, txHash } = useCreateIntent();

  const [sellSymbol, setSellSymbol] = useState("cETH");
  const [buySymbol, setBuySymbol] = useState("cUSDC");
  const [sellAmount, setSellAmount] = useState("");
  const [minBuyAmount, setMinBuyAmount] = useState("");
  const [deadline, setDeadline] = useState(3600);
  const [allowedTaker, setAllowedTaker] = useState("");

  const sellTok = TOKENS.find((t) => t.symbol === sellSymbol)!;
  const buyTok = TOKENS.find((t) => t.symbol === buySymbol)!;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      sellToken: sellTok.address,
      buyToken: buyTok.address,
      sellAmount: parseUnits(sellAmount || "0", sellTok.decimals),
      minBuyAmount: parseUnits(minBuyAmount || "0", buyTok.decimals),
      deadlineSeconds: deadline,
      allowedTaker: allowedTaker
        ? (allowedTaker as `0x${string}`)
        : undefined,
    });
  }

  const busy =
    step === "encrypting" || step === "signing" || step === "confirming";

  return (
    <AppShell>
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-headline-xl text-3xl font-bold tracking-tight text-white">
            DIRECT OTC
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            INTENT_ENGINE_V2 | BILATERAL_SETTLEMENT
          </p>
        </div>
        <div className="flex bg-zinc-900 p-1 border border-zinc-800">
          <span className="px-6 py-2 bg-[--color-primary] text-[--color-primary-fg] text-label-caps">
            Direct OTC
          </span>
          <a
            href="/create/rfq"
            className="px-6 py-2 text-zinc-500 text-label-caps hover:text-zinc-300"
          >
            RFQ Mode
          </a>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Form ────────────────────────────────────── */}
        <section className="col-span-12 lg:col-span-7">
          <div className="glass-card relative overflow-hidden p-6">
            <div className="absolute right-2 top-2 font-mono text-[8px] text-zinc-700">
              INTENT_ENGINE_V2
            </div>
            <div className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-[--color-primary] pulse-soft" />

            <h3 className="text-label-caps mb-6 flex items-center gap-2 text-zinc-400">
              <span className="h-1.5 w-1.5 bg-[--color-primary]" />
              Create Direct Intent
            </h3>

            <form onSubmit={onSubmit} className="space-y-6">
              <FieldRow>
                <Field label="Sell Token">
                  <Select
                    value={sellSymbol}
                    onChange={setSellSymbol}
                    options={TOKENS}
                  />
                </Field>
                <Field
                  label="Sell Amount"
                  hint="Encrypted on submit"
                  badge="HIDDEN"
                >
                  <NumberInput
                    value={sellAmount}
                    onChange={setSellAmount}
                    suffix={sellTok.symbol}
                  />
                </Field>
              </FieldRow>

              <div className="flex justify-center">
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-600 hover:text-[--color-primary]">
                  <span className="material-symbols-outlined text-lg">
                    swap_vert
                  </span>
                </div>
              </div>

              <FieldRow>
                <Field label="Buy Token">
                  <Select
                    value={buySymbol}
                    onChange={setBuySymbol}
                    options={TOKENS}
                  />
                </Field>
                <Field
                  label="Min Buy Amount"
                  hint="Hidden minimum — Strategy B"
                  badge="HIDDEN"
                >
                  <NumberInput
                    value={minBuyAmount}
                    onChange={setMinBuyAmount}
                    suffix={buyTok.symbol}
                  />
                </Field>
              </FieldRow>

              <Field label="Expires In">
                <div className="flex gap-2">
                  {DEADLINE_PRESETS.map((p) => (
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
              </Field>

              <Field
                label="Allowed Taker"
                hint="Empty = open to anyone · 0x... = locked"
              >
                <input
                  type="text"
                  value={allowedTaker}
                  onChange={(e) => setAllowedTaker(e.target.value)}
                  placeholder="0x..."
                  className="diam-input"
                />
              </Field>

              {sellAmount && minBuyAmount && Number(sellAmount) > 0 && (
                <ChainGPTAdvisor
                  pair={`${sellTok.symbol}/${buyTok.symbol}`}
                  unitPriceUsd={Number(minBuyAmount) / Number(sellAmount)}
                />
              )}

              {error && (
                <div className="border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                  {error}
                </div>
              )}

              {step === "done" && intentId !== null && (
                <div className="border border-[--color-primary] bg-[--color-primary]/10 p-3 text-sm">
                  <span className="text-[--color-primary]">
                    INTENT #{intentId.toString()} BROADCAST.
                  </span>{" "}
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    View tx →
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
                {step === "confirming" && "CONFIRMING ON-CHAIN…"}
                {(step === "idle" || step === "error") &&
                  "BROADCAST ENCRYPTION"}
                {step === "done" && "BROADCAST COMPLETE ✓"}
              </button>
            </form>
          </div>
        </section>

        {/* ── Side panel ────────────────────────────── */}
        <aside className="col-span-12 space-y-4 lg:col-span-5">
          <div className="glass-card border-l-2 border-l-[--color-primary] p-4">
            <p className="text-label-caps mb-2 text-zinc-500">
              ENCRYPTION_PIPELINE
            </p>
            <ol className="space-y-3 text-sm">
              <PipelineStep
                step="01"
                label="Encrypt amounts off-chain"
                desc="Nox JS SDK calls Handle Gateway"
                active={step === "encrypting"}
                done={
                  step === "signing" ||
                  step === "confirming" ||
                  step === "done"
                }
              />
              <PipelineStep
                step="02"
                label="Sign + broadcast tx"
                desc="MetaMask signature on Arbitrum"
                active={step === "signing"}
                done={step === "confirming" || step === "done"}
              />
              <PipelineStep
                step="03"
                label="Confirm + parse event"
                desc="IntentCreated event decoded"
                active={step === "confirming"}
                done={step === "done"}
              />
            </ol>
          </div>

          <div className="glass-card p-4">
            <p className="text-label-caps mb-2 text-zinc-500">
              STRATEGY_B_NOTE
            </p>
            <p className="text-xs leading-relaxed text-zinc-400">
              Min buy amount is encrypted via Nox. If a taker bid falls below,
              Diam settles atomically as no-op via{" "}
              <span className="font-mono text-[--color-primary]">
                safeSub + select
              </span>
              . Status always shows Filled on-chain — privacy preserved on
              rejection.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  hint,
  badge,
  children,
}: {
  label: string;
  hint?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-label-caps text-zinc-500">{label}</label>
        {badge && (
          <span className="font-mono text-[9px] uppercase text-[--color-primary]">
            {badge}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className="font-mono text-[10px] text-zinc-600">{hint}</p>
      )}
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
  options: { symbol: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="diam-input appearance-none pr-10"
      >
        {options.map((o) => (
          <option key={o.symbol} value={o.symbol}>
            {o.symbol}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-zinc-600">
        expand_more
      </span>
    </div>
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
    <div className="flex border border-zinc-800 bg-zinc-950 focus-within:border-[--color-primary]">
      <input
        type="number"
        step="any"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="flex-1 bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
        data-numeric
      />
      <span className="grid place-items-center px-3 text-label-caps text-zinc-500">
        {suffix}
      </span>
    </div>
  );
}

function PipelineStep({
  step,
  label,
  desc,
  active,
  done,
}: {
  step: string;
  label: string;
  desc: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-xs ${
          done
            ? "border-[--color-primary] bg-[--color-primary] text-[--color-primary-fg]"
            : active
              ? "border-[--color-primary] text-[--color-primary] pulse-soft"
              : "border-zinc-800 text-zinc-600"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <div className="flex-1 pt-1">
        <p
          className={`text-sm ${
            active || done ? "text-zinc-200" : "text-zinc-500"
          }`}
        >
          {label}
        </p>
        <p className="font-mono text-[10px] text-zinc-600">{desc}</p>
      </div>
    </li>
  );
}
