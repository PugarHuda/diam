"use client";

import { use, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { TokenIcon } from "@/components/TokenIcon";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS, CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import { useAcceptIntent, useCancelIntent } from "@/lib/hooks/useOtcWrites";
import { statusLabel, modeLabel } from "@/lib/hooks/useIntents";
import { shortAddress } from "@/lib/utils";

const TOKEN_NAMES: Record<string, { symbol: string; decimals: number }> = {
  [CUSDC_ADDRESS.toLowerCase()]: { symbol: "cUSDC", decimals: 6 },
  [CETH_ADDRESS.toLowerCase()]: { symbol: "cETH", decimals: 18 },
};

export default function IntentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const intentId = BigInt(id);

  const { address } = useAccount();
  const accept = useAcceptIntent();
  const cancel = useCancelIntent();
  const [bidAmount, setBidAmount] = useState("");

  const intentQuery = useReadContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "intents",
    args: [intentId],
  });

  if (intentQuery.isLoading) {
    return (
      <AppShell>
        <p className="font-mono text-sm text-zinc-500">
          ⟨ FETCHING INTENT #{id} ⟩
        </p>
      </AppShell>
    );
  }

  if (!intentQuery.data) {
    return (
      <AppShell>
        <p className="font-mono text-sm text-[--color-danger]">
          ⟨ INTENT NOT FOUND ⟩
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

  const intent = {
    maker: v[0],
    sellToken: v[1],
    buyToken: v[2],
    sellAmountHandle: v[3],
    minBuyAmountHandle: v[4],
    deadline: v[5],
    status: v[6],
    mode: v[7],
    allowedTaker: v[8],
  };

  const isMaker =
    address && address.toLowerCase() === intent.maker.toLowerCase();
  const isOpen = intent.status === 0;
  const isExpired = Number(intent.deadline) <= Math.floor(Date.now() / 1000);
  const buyTok = TOKEN_NAMES[intent.buyToken.toLowerCase()];

  if (intent.mode === 1) {
    return (
      <AppShell>
        <p className="font-mono text-sm text-zinc-500">
          ⟨ THIS IS AN RFQ ⟩{" "}
          <Link
            href={`/rfq/${id}` as Route}
            className="text-[--color-primary] underline"
          >
            Open RFQ view →
          </Link>
        </p>
      </AppShell>
    );
  }

  async function onAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!buyTok) return;
    await accept.submit(intentId, parseUnits(bidAmount || "0", buyTok.decimals));
  }

  async function onCancel() {
    await cancel.submit(intentId);
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
        icon="receipt_long"
        title={`INTENT #IX_${id.padStart(4, "0")}`}
        subtitle="DIRECT_OTC | BILATERAL_SETTLEMENT"
        badge={
          <span className="text-label-caps flex items-center gap-1.5 border border-orange-900 bg-orange-950/40 px-3 py-1 text-orange-400">
            <span className="material-symbols-outlined text-base">person</span>
            {modeLabel(intent.mode)}
          </span>
        }
      />


      <div className="grid grid-cols-12 gap-6">
        {/* Detail panel */}
        <section className="col-span-12 lg:col-span-7">
          <div className="glass-card p-6">
            <SectionHeader icon="article" title="Intent Manifest" />

            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField
                icon="flag"
                label="Status"
                value={statusLabel(intent.status)}
              />
              <DetailField
                icon="person"
                label="Maker"
                value={shortAddress(intent.maker, 6)}
                mono
              />
              <DetailField
                icon="upload"
                label="Sell Asset"
                value={
                  TOKEN_NAMES[intent.sellToken.toLowerCase()]?.symbol ??
                  shortAddress(intent.sellToken)
                }
                mono
              />
              <DetailField
                icon="download"
                label="Buy Asset"
                value={
                  TOKEN_NAMES[intent.buyToken.toLowerCase()]?.symbol ??
                  shortAddress(intent.buyToken)
                }
                mono
              />
              <DetailField
                icon="lock"
                label="Sell Amount (Encrypted)"
                value={`${intent.sellAmountHandle.slice(0, 14)}…`}
                mono
                small
              />
              <DetailField
                icon="lock"
                label="Min Buy (Encrypted)"
                value={`${intent.minBuyAmountHandle.slice(0, 14)}…`}
                mono
                small
              />
              <DetailField
                icon="schedule"
                label="Expires"
                value={new Date(
                  Number(intent.deadline) * 1000,
                ).toLocaleString()}
                small
              />
              <DetailField
                icon="group"
                label="Allowed Taker"
                value={
                  intent.allowedTaker ===
                  "0x0000000000000000000000000000000000000000"
                    ? "Open to anyone"
                    : shortAddress(intent.allowedTaker, 6)
                }
                mono
              />
            </dl>

            <div className="mt-6 flex items-center justify-center gap-3 border-t border-zinc-800 pt-6">
              <TokenIcon
                symbol={
                  TOKEN_NAMES[intent.sellToken.toLowerCase()]?.symbol ?? "?"
                }
                size="lg"
              />
              <span className="material-symbols-outlined text-2xl text-[--color-primary]">
                arrow_forward
              </span>
              <TokenIcon
                symbol={
                  TOKEN_NAMES[intent.buyToken.toLowerCase()]?.symbol ?? "?"
                }
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* Action panel */}
        <aside className="col-span-12 space-y-4 lg:col-span-5">
          {isMaker && isOpen && (
            <div className="glass-card border-l-2 border-l-orange-500 p-6">
              <p className="text-label-caps mb-2 text-orange-400">
                Maker Actions
              </p>
              <p className="mb-4 font-mono text-[11px] text-zinc-500">
                You created this intent
              </p>
              <button
                onClick={onCancel}
                disabled={
                  cancel.step === "signing" || cancel.step === "confirming"
                }
                className="text-label-caps w-full border border-orange-900 bg-orange-950/40 px-4 py-3 text-orange-400 transition-all hover:bg-orange-950/60 disabled:opacity-50"
              >
                {cancel.step === "signing" && "SIGNING…"}
                {cancel.step === "confirming" && "CONFIRMING…"}
                {(cancel.step === "idle" ||
                  cancel.step === "error" ||
                  cancel.step === "done") &&
                  "CANCEL INTENT"}
              </button>
              {cancel.error && (
                <p className="mt-2 font-mono text-[10px] text-[--color-danger]">
                  {cancel.error}
                </p>
              )}
            </div>
          )}

          {!isMaker && isOpen && !isExpired && (
            <form onSubmit={onAccept} className="glass-card space-y-4 p-6">
              <p className="text-label-caps flex items-center gap-2 text-[--color-primary]">
                <span className="h-1.5 w-1.5 bg-[--color-primary]" />
                Accept + Settle
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
                Submit your buy amount. Encrypted via Nox. If below maker's
                hidden minimum, trade settles atomically as no-op (Strategy B).
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

              {accept.error && (
                <div className="border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                  {accept.error}
                </div>
              )}

              {accept.step === "done" && (
                <div className="border border-[--color-primary] bg-[--color-primary]/10 p-3 text-sm">
                  <span className="text-[--color-primary]">SETTLED.</span>{" "}
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${accept.txHash}`}
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
                    Decrypt portfolio →
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  accept.step === "encrypting" ||
                  accept.step === "signing" ||
                  accept.step === "confirming"
                }
                className="diam-btn-primary w-full py-4 text-sm"
              >
                {accept.step === "encrypting" && "ENCRYPTING BID…"}
                {accept.step === "signing" && "CONFIRM IN WALLET…"}
                {accept.step === "confirming" && "SETTLING ON-CHAIN…"}
                {(accept.step === "idle" || accept.step === "error") &&
                  "ACCEPT + SETTLE"}
                {accept.step === "done" && "SETTLED ✓"}
              </button>
            </form>
          )}

          {!isOpen && (
            <div className="glass-card p-6">
              <p className="font-mono text-sm text-zinc-500">
                ⟨ INTENT {statusLabel(intent.status).toUpperCase()} ⟩
              </p>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function DetailField({
  icon,
  label,
  value,
  mono,
  small,
}: {
  icon?: string;
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <span className="material-symbols-outlined mt-0.5 text-base text-[--color-primary]/60">
          {icon}
        </span>
      )}
      <div className="flex-1">
        <dt className="text-label-caps text-zinc-500">{label}</dt>
        <dd
          className={`mt-1 ${mono ? "font-mono" : ""} ${
            small ? "text-xs" : "text-sm"
          } text-zinc-200`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
