"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { Header } from "@/components/Header";
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

  const intentQuery = useReadContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "intents",
    args: [intentId],
  });

  const accept = useAcceptIntent();
  const cancel = useCancelIntent();
  const [bidAmount, setBidAmount] = useState("");

  if (intentQuery.isLoading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-[--color-muted]">Loading intent #{id}…</p>
        </main>
      </>
    );
  }

  if (!intentQuery.data) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-[--color-danger]">Intent not found.</p>
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

  const isMaker = address && address.toLowerCase() === intent.maker.toLowerCase();
  const isOpen = intent.status === 0;
  const isExpired = Number(intent.deadline) <= Math.floor(Date.now() / 1000);
  const buyTok = TOKEN_NAMES[intent.buyToken.toLowerCase()];

  // RFQ mode → redirect-style nudge
  if (intent.mode === 1) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-[--color-muted]">
            This is an RFQ.{" "}
            <Link href={`/rfq/${id}`} className="text-[--color-accent] underline">
              Open RFQ view →
            </Link>
          </p>
        </main>
      </>
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
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-[--color-muted]">
          <Link href="/intents" className="hover:text-[--color-foreground]">
            ← All intents
          </Link>
        </p>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Intent #{id}</h1>
          <span className="rounded px-2 py-1 text-xs font-medium bg-[--color-accent]/10 text-[--color-accent]">
            {modeLabel(intent.mode)}
          </span>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-4 rounded-xl border border-[--color-border] bg-[--color-surface] p-6 md:grid-cols-2">
          <Field label="Status" value={statusLabel(intent.status)} />
          <Field
            label="Maker"
            value={shortAddress(intent.maker)}
            mono
          />
          <Field
            label="Sell asset"
            value={
              TOKEN_NAMES[intent.sellToken.toLowerCase()]?.symbol ??
              shortAddress(intent.sellToken)
            }
            mono
          />
          <Field
            label="Buy asset"
            value={
              TOKEN_NAMES[intent.buyToken.toLowerCase()]?.symbol ??
              shortAddress(intent.buyToken)
            }
            mono
          />
          <Field
            label="Sell amount (encrypted)"
            value={`${intent.sellAmountHandle.slice(0, 14)}…`}
            mono
          />
          <Field
            label="Min buy (encrypted)"
            value={`${intent.minBuyAmountHandle.slice(0, 14)}…`}
            mono
          />
          <Field
            label="Expires"
            value={new Date(Number(intent.deadline) * 1000).toLocaleString()}
          />
          <Field
            label="Allowed taker"
            value={
              intent.allowedTaker === "0x0000000000000000000000000000000000000000"
                ? "Open to anyone"
                : shortAddress(intent.allowedTaker)
            }
            mono
          />
        </dl>

        {isMaker && isOpen && (
          <div className="mt-8 rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
            <h2 className="text-lg font-semibold">Maker actions</h2>
            <p className="mt-1 text-sm text-[--color-muted]">
              You created this intent.
            </p>
            <button
              onClick={onCancel}
              disabled={cancel.step === "signing" || cancel.step === "confirming"}
              className="mt-4 rounded-md border border-[--color-warning] bg-[--color-warning]/10 px-4 py-2 text-sm text-[--color-warning] transition hover:bg-[--color-warning]/20 disabled:opacity-50"
            >
              {cancel.step === "signing" && "Signing…"}
              {cancel.step === "confirming" && "Confirming…"}
              {(cancel.step === "idle" ||
                cancel.step === "error" ||
                cancel.step === "done") &&
                "Cancel intent"}
            </button>
            {cancel.error && (
              <p className="mt-2 text-xs text-[--color-danger]">
                {cancel.error}
              </p>
            )}
          </div>
        )}

        {!isMaker && isOpen && !isExpired && (
          <form
            onSubmit={onAccept}
            className="mt-8 rounded-xl border border-[--color-border] bg-[--color-surface] p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold">Accept this intent</h2>
            <p className="text-sm text-[--color-muted]">
              Submit your buy amount. Encrypted off-chain. If below the maker's
              hidden minimum, the trade settles as a no-op (privacy preserved).
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

            {accept.error && (
              <div className="rounded-md border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
                {accept.error}
              </div>
            )}

            {accept.step === "done" && (
              <div className="rounded-md border border-[--color-success] bg-[--color-success]/10 p-3 text-sm">
                Trade settled.{" "}
                <a
                  href={`https://sepolia.arbiscan.io/tx/${accept.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  View tx →
                </a>{" "}
                Decrypt your{" "}
                <Link href="/portfolio" className="underline">
                  portfolio
                </Link>{" "}
                to see actual amounts.
              </div>
            )}

            <button
              type="submit"
              disabled={
                accept.step === "encrypting" ||
                accept.step === "signing" ||
                accept.step === "confirming"
              }
              className="w-full rounded-md bg-[--color-accent] px-6 py-3 font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover] disabled:opacity-50"
            >
              {accept.step === "encrypting" && "Encrypting bid…"}
              {accept.step === "signing" && "Confirm in wallet…"}
              {accept.step === "confirming" && "Settling on-chain…"}
              {(accept.step === "idle" || accept.step === "error") &&
                "Accept + settle"}
              {accept.step === "done" && "Settled ✓"}
            </button>
          </form>
        )}

        {!isOpen && (
          <div className="mt-8 rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
            <p className="text-sm text-[--color-muted]">
              Intent is {statusLabel(intent.status).toLowerCase()}.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-[--color-muted]">
        {label}
      </dt>
      <dd className={`mt-1 ${mono ? "font-mono text-sm" : "text-sm"}`}>
        {value}
      </dd>
    </div>
  );
}
