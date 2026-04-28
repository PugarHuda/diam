"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  useReadContract,
  useReadContracts,
  useBlockNumber,
} from "wagmi";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS, CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import { shortAddress } from "@/lib/utils";

const TOKEN_NAMES: Record<string, string> = {
  [CUSDC_ADDRESS.toLowerCase()]: "cUSDC",
  [CETH_ADDRESS.toLowerCase()]: "cETH",
};

/**
 * Show last 3 intents from PrivateOTC contract — proves on-chain wiring.
 * Reads via nextIntentId + iterates last 3, no event indexing required.
 */
export function ActivityFeed() {
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const next = useReadContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "nextIntentId",
  });

  // Refetch on each block
  useEffect(() => {
    if (blockNumber) next.refetch();
  }, [blockNumber, next]);

  const total = next.data ? Number(next.data) : 0;
  const start = Math.max(0, total - 3);
  const ids = Array.from({ length: total - start }, (_, i) =>
    BigInt(start + i),
  );

  const result = useReadContracts({
    contracts: ids.map((id) => ({
      address: PRIVATE_OTC_ADDRESS,
      abi: privateOtcAbi,
      functionName: "intents" as const,
      args: [id] as const,
    })),
    allowFailure: true,
    query: { enabled: ids.length > 0 },
  });

  const rows = (result.data ?? [])
    .map((r, i) => {
      if (r.status !== "success") return null;
      const v = r.result as readonly [
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
      return {
        id: ids[i],
        maker: v[0],
        sellToken: v[1],
        buyToken: v[2],
        deadline: v[5],
        status: v[6],
        mode: v[7],
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .reverse();

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-8">
        <p className="section-marker mb-2">[LIVE FEED] · Recent Activity</p>
        <h2 className="text-headline-lg text-white">On-Chain Intents</h2>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center">
          <span className="material-symbols-outlined mb-2 text-zinc-700 text-4xl">
            inbox
          </span>
          <p className="font-mono text-sm text-zinc-500">
            ⟨ NO INTENTS YET — BE THE FIRST ⟩
          </p>
          <Link
            href={"/create" as Route}
            className="text-label-caps mt-4 inline-flex items-center gap-1.5 text-[--color-primary] hover:underline"
          >
            <span className="material-symbols-outlined text-base">
              add_circle
            </span>
            Open the first intent
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {rows.map((row) => (
            <Link
              key={row.id.toString()}
              href={
                (row.mode === 1
                  ? `/rfq/${row.id.toString()}`
                  : `/intents/${row.id.toString()}`) as Route
              }
              className="glass-card group transition-all hover:border-[--color-primary]/40 hover:bg-zinc-900/40"
            >
              <li className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-500">
                    #IX_{row.id.toString().padStart(4, "0")}
                  </span>
                  <ModeBadge mode={row.mode} />
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-zinc-300">
                    {TOKEN_NAMES[row.sellToken.toLowerCase()] ??
                      shortAddress(row.sellToken, 4)}
                  </span>
                  <span className="material-symbols-outlined text-sm text-zinc-600">
                    arrow_forward
                  </span>
                  <span className="text-[--color-primary]">
                    {TOKEN_NAMES[row.buyToken.toLowerCase()] ??
                      shortAddress(row.buyToken, 4)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 font-mono text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      person
                    </span>
                    {shortAddress(row.maker, 4)}
                  </span>
                  <StatusDot status={row.status} />
                </div>
              </li>
            </Link>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-end">
        <Link
          href={"/intents" as Route}
          className="text-label-caps inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-[--color-primary]"
        >
          View all intents
          <span className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>
      </div>
    </section>
  );
}

function ModeBadge({ mode }: { mode: number }) {
  const cfg =
    mode === 0
      ? {
          label: "Direct",
          icon: "swap_horiz",
          cls: "border-orange-900 bg-orange-950/40 text-orange-400",
        }
      : {
          label: "RFQ",
          icon: "hub",
          cls: "border-emerald-900 bg-emerald-950/40 text-emerald-400",
        };
  return (
    <span
      className={`text-label-caps flex items-center gap-1 border px-1.5 py-0.5 text-[9px] ${cfg.cls}`}
    >
      <span className="material-symbols-outlined text-xs">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: number }) {
  const cfg = {
    0: { color: "bg-[--color-primary] pulse-soft", label: "Open" },
    1: { color: "bg-zinc-500", label: "Filled" },
    2: { color: "bg-orange-500", label: "Cancelled" },
    3: { color: "bg-zinc-600", label: "Expired" },
  }[status as 0 | 1 | 2 | 3] ?? {
    color: "bg-zinc-700",
    label: "Unknown",
  };
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.color}`} />
      <span className="text-zinc-400">{cfg.label}</span>
    </span>
  );
}
