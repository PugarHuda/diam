"use client";

import Link from "next/link";
import type { Route } from "next";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TokenIcon } from "@/components/TokenIcon";
import { useIntents, statusLabel, modeLabel } from "@/lib/hooks/useIntents";
import { shortAddress } from "@/lib/utils";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";

const TOKEN_NAMES: Record<string, string> = {
  [CUSDC_ADDRESS.toLowerCase()]: "cUSDC",
  [CETH_ADDRESS.toLowerCase()]: "cETH",
};

export default function IntentsPage() {
  const { rows, isLoading, error } = useIntents(20);

  return (
    <AppShell>
      <PageHeader
        icon="grid_view"
        title="ACTIVE INTENTS"
        subtitle="ASSET_PAIRS_VISIBLE | AMOUNTS_ENCRYPTED"
        action={
          <Link href={"/create" as Route}>
            <button className="diam-btn-primary flex items-center gap-2 px-5 py-2 text-xs">
              <span className="material-symbols-outlined text-base">add</span>
              New Intent
            </button>
          </Link>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 font-mono text-sm text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-base">
            sync
          </span>
          FETCHING ON-CHAIN INTENTS
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 border border-[--color-danger] bg-[--color-danger]/10 p-3 font-mono text-sm text-[--color-danger]">
          <span className="material-symbols-outlined text-base">error</span>
          {error.message}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <EmptyState
          icon="inbox"
          title="NO ACTIVE INTENTS"
          body="No one has opened a trade yet on this network"
          action={
            <Link href={"/create" as Route}>
              <button className="diam-btn-primary flex items-center gap-2 px-5 py-2 text-xs">
                <span className="material-symbols-outlined text-base">
                  add
                </span>
                Open the first one
              </button>
            </Link>
          }
        />
      )}

      {rows.length > 0 && (
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="border-b border-zinc-800 p-6">
            <SectionHeader
              icon="menu_book"
              title="Order Book"
              right={
                <div className="flex gap-4">
                  <Legend color="bg-[--color-primary]" label="Open" />
                  <Legend color="bg-zinc-500" label="Filled" />
                  <Legend color="bg-orange-500" label="Cancelled" />
                </div>
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <Th>Intent ID</Th>
                  <Th>Pair</Th>
                  <Th>Mode</Th>
                  <Th>Maker</Th>
                  <Th>Volume (Encrypted)</Th>
                  <Th>Status</Th>
                  <Th>Expires</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {rows.map((row) => (
                  <tr
                    key={row.id.toString()}
                    className="group transition-colors hover:bg-zinc-800/20"
                  >
                    <Td>
                      <span className="font-mono text-xs text-zinc-400">
                        #IX_{row.id.toString().padStart(4, "0")}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <TokenIcon
                          symbol={
                            TOKEN_NAMES[row.sellToken.toLowerCase()] ?? "?"
                          }
                          size="sm"
                        />
                        <span className="material-symbols-outlined text-sm text-zinc-600">
                          arrow_forward
                        </span>
                        <TokenIcon
                          symbol={
                            TOKEN_NAMES[row.buyToken.toLowerCase()] ?? "?"
                          }
                          size="sm"
                        />
                      </div>
                    </Td>
                    <Td>
                      <ModeBadge mode={row.mode} />
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {shortAddress(row.maker)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-600">
                        <span className="material-symbols-outlined text-sm text-[--color-primary]/40">
                          lock
                        </span>
                        {row.sellAmountHandle.slice(0, 10)}…
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td>
                      <RelativeTime ts={row.deadline} />
                    </Td>
                    <Td align="right">
                      {row.status === 0 && (
                        <Link
                          href={
                            (row.mode === 1
                              ? `/rfq/${row.id.toString()}`
                              : `/intents/${row.id.toString()}`) as Route
                          }
                          className="text-label-caps border border-zinc-800 bg-zinc-900 px-3 py-1 text-[--color-primary] transition-all hover:bg-[--color-primary] hover:text-[--color-primary-fg]"
                        >
                          {row.mode === 1 ? "Place Bid" : "Accept"}
                        </Link>
                      )}
                      {row.status !== 0 && (
                        <Link
                          href={`/intents/${row.id.toString()}` as Route}
                          className="text-label-caps text-zinc-600 hover:text-zinc-300"
                        >
                          View
                        </Link>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/30 p-4">
            <span className="font-mono text-[10px] text-zinc-600">
              SHOWING {rows.length} INTENTS
            </span>
            <div className="font-mono text-[10px] text-zinc-600">
              ENCRYPTED_VOLUME · NOX_LAYER
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Th({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`text-label-caps px-6 py-4 text-zinc-500 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: "right";
}) {
  return (
    <td
      className={`px-6 py-4 text-sm ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </td>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="font-mono text-[9px] uppercase text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function ModeBadge({ mode }: { mode: number }) {
  const cls =
    mode === 0
      ? "border-orange-900 bg-orange-950/40 text-orange-400"
      : "border-emerald-900 bg-emerald-950/40 text-emerald-400";
  return (
    <span className={`text-label-caps border px-2 py-0.5 text-[10px] ${cls}`}>
      {mode === 0 ? "Direct 1:1" : "Public RFQ"}
    </span>
  );
}

function StatusBadge({ status }: { status: number }) {
  const map: Record<number, string> = {
    0: "border-emerald-900 bg-emerald-950/40 text-emerald-400",
    1: "border-zinc-800 bg-zinc-900/40 text-zinc-500",
    2: "border-orange-900 bg-orange-950/40 text-orange-400",
    3: "border-zinc-800 bg-zinc-900/40 text-zinc-600",
  };
  return (
    <span className={`text-label-caps border px-2 py-0.5 text-[10px] ${map[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

function RelativeTime({ ts }: { ts: bigint }) {
  const seconds = Number(ts) - Math.floor(Date.now() / 1000);
  if (seconds <= 0)
    return (
      <span className="font-mono text-xs text-zinc-600">expired</span>
    );
  if (seconds < 3600)
    return (
      <span className="font-mono text-xs">{Math.floor(seconds / 60)}m</span>
    );
  if (seconds < 86400)
    return (
      <span className="font-mono text-xs">{Math.floor(seconds / 3600)}h</span>
    );
  return (
    <span className="font-mono text-xs">{Math.floor(seconds / 86400)}d</span>
  );
}
