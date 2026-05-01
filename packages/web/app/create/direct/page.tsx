"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { ChainGPTAdvisor } from "@/components/ChainGPTAdvisor";
import { OperatorAuth } from "@/components/OperatorAuth";
import { useCreateIntent } from "@/lib/hooks/useCreateIntent";
import { useSetOperator } from "@/lib/hooks/useSetOperator";
import { safeUnitPrice } from "@/lib/precision";
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
  const { address } = useAccount();
  const { submit, step, error, intentId, txHash } = useCreateIntent();

  const [sellSymbol, setSellSymbol] = useState("cETH");
  const [buySymbol, setBuySymbol] = useState("cUSDC");
  const [sellAmount, setSellAmount] = useState("");
  const [minBuyAmount, setMinBuyAmount] = useState("");
  const [deadline, setDeadline] = useState(3600);
  const [allowedTaker, setAllowedTaker] = useState("");

  const sellTok = TOKENS.find((t) => t.symbol === sellSymbol)!;
  const buyTok = TOKENS.find((t) => t.symbol === buySymbol)!;

  // Maker must authorize OTC as operator on sellToken — otherwise any
  // taker who later tries to accept this intent gets a "not operator"
  // revert at settlement time. Block submit until authorized.
  const sellTokenAuth = useSetOperator(sellTok.address, address);

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
      <PageHeader
        icon="swap_horiz"
        title="DIRECT OTC"
        subtitle="INTENT_ENGINE_V2 | BILATERAL_SETTLEMENT"
        action={
          <div className="flex border border-zinc-800 bg-zinc-900 p-1">
            <span className="text-label-caps flex items-center gap-1.5 bg-[--color-primary] px-4 py-2 text-[--color-primary-fg]">
              <span className="material-symbols-outlined text-base">
                swap_horiz
              </span>
              Direct
            </span>
            <a
              href="/create/rfq"
              className="text-label-caps flex items-center gap-1.5 px-4 py-2 text-zinc-500 hover:text-zinc-300"
            >
              <span className="material-symbols-outlined text-base">hub</span>
              RFQ
            </a>
          </div>
        }
      />


      <div className="grid grid-cols-12 gap-6">
        {/* ── Form ────────────────────────────────────── */}
        <section className="col-span-12 lg:col-span-7">
          <div className="glass-card relative overflow-hidden p-6">
            <div className="absolute right-2 top-2 font-mono text-[8px] text-zinc-700">
              INTENT_ENGINE_V2
            </div>
            <div className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-[--color-primary] pulse-soft" />

            <SectionHeader icon="add_circle" title="Create Direct Intent" />

            <div className="mb-6">
              <OperatorAuth
                token={sellTok.address}
                account={address}
                symbol={sellTok.symbol}
                reason={`Settlement debits ${sellTok.symbol} from your wallet to the taker. Diam needs operator permission first — without it, anyone trying to accept this intent will get a "not operator" revert.`}
              />
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <FieldRow>
                <Field label="Sell Token" icon="upload">
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
                  icon="pin"
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
                <Field label="Buy Token" icon="download">
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
                  icon="vertical_align_bottom"
                >
                  <NumberInput
                    value={minBuyAmount}
                    onChange={setMinBuyAmount}
                    suffix={buyTok.symbol}
                  />
                </Field>
              </FieldRow>

              <Field label="Expires In" icon="timer">
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
                icon="person_add"
              >
                <input
                  type="text"
                  value={allowedTaker}
                  onChange={(e) => setAllowedTaker(e.target.value)}
                  placeholder="0x..."
                  className="diam-input"
                />
              </Field>

              {(() => {
                const unitPrice = safeUnitPrice(minBuyAmount, sellAmount);
                if (unitPrice === null) return null;
                return (
                  <ChainGPTAdvisor
                    pair={`${sellTok.symbol}/${buyTok.symbol}`}
                    unitPriceUsd={unitPrice}
                  />
                );
              })()}

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
                disabled={busy || step === "done" || !sellTokenAuth.isOperator}
                title={
                  step === "done"
                    ? "Already broadcast — see the link above to view the intent"
                    : !sellTokenAuth.isOperator && address
                      ? `Authorize Diam for ${sellTok.symbol} above first`
                      : undefined
                }
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
                  {(step === "idle" || step === "error") && "send"}
                  {step === "done" && "check_circle"}
                </span>
                {step === "encrypting" && "ENCRYPTING VIA NOX…"}
                {step === "signing" && "CONFIRM IN WALLET…"}
                {step === "confirming" && "CONFIRMING ON-CHAIN…"}
                {(step === "idle" || step === "error") &&
                  (!sellTokenAuth.isOperator && address
                    ? `AUTHORIZE ${sellTok.symbol} FIRST`
                    : "BROADCAST ENCRYPTION")}
                {step === "done" && "BROADCAST COMPLETE"}
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
  icon,
  children,
}: {
  label: string;
  hint?: string;
  badge?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-label-caps flex items-center gap-1.5 text-zinc-500">
          {icon && (
            <span className="material-symbols-outlined text-sm">{icon}</span>
          )}
          {label}
        </label>
        {badge && (
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase text-[--color-primary]">
            <span className="material-symbols-outlined text-xs">
              visibility_off
            </span>
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
