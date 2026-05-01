"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/AppShell";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TokenIcon } from "@/components/TokenIcon";
import { SkeletonRow } from "@/components/Skeleton";
import { useIntents, statusLabel, modeLabel } from "@/lib/hooks/useIntents";
import { shortAddress } from "@/lib/utils";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";

const TOKEN_NAMES: Record<string, string> = {
  [CUSDC_ADDRESS.toLowerCase()]: "cUSDC",
  [CETH_ADDRESS.toLowerCase()]: "cETH",
};

type ModeFilter = "all" | "direct" | "rfq";
type StatusFilter = "all" | "open" | "filled" | "cancelled" | "pending";
type PairFilter = "all" | "ceth-cusdc" | "cusdc-ceth";

const MODE_VALUES: ModeFilter[] = ["all", "direct", "rfq"];
const STATUS_VALUES: StatusFilter[] = [
  "all",
  "open",
  "pending",
  "filled",
  "cancelled",
];
const PAIR_VALUES: PairFilter[] = ["all", "ceth-cusdc", "cusdc-ceth"];

function parseEnum<T extends string>(
  raw: string | null,
  values: T[],
  fallback: T,
): T {
  return values.includes(raw as T) ? (raw as T) : fallback;
}

export default function IntentsPage() {
  const { address } = useAccount();
  const { rows, isLoading, error } = useIntents(30);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL so /intents?mode=rfq&status=filled is shareable.
  const [modeFilter, setModeFilter] = useState<ModeFilter>(() =>
    parseEnum(searchParams.get("mode"), MODE_VALUES, "all"),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseEnum(searchParams.get("status"), STATUS_VALUES, "all"),
  );
  const [pairFilter, setPairFilter] = useState<PairFilter>(() =>
    parseEnum(searchParams.get("pair"), PAIR_VALUES, "all"),
  );
  const [onlyMine, setOnlyMine] = useState(
    () => searchParams.get("mine") === "1",
  );

  // Reflect filter state back into the URL so links survive page reload
  // and browser back/forward keeps the same view. router.replace avoids
  // pushing a new history entry per filter click.
  useEffect(() => {
    const params = new URLSearchParams();
    if (modeFilter !== "all") params.set("mode", modeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (pairFilter !== "all") params.set("pair", pairFilter);
    if (onlyMine) params.set("mine", "1");
    const qs = params.toString();
    router.replace(qs ? `/intents?${qs}` : "/intents", { scroll: false });
  }, [modeFilter, statusFilter, pairFilter, onlyMine, router]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (modeFilter === "direct" && r.mode !== 0) return false;
      if (modeFilter === "rfq" && r.mode !== 1) return false;

      if (statusFilter === "open" && r.status !== 0) return false;
      if (statusFilter === "filled" && r.status !== 1) return false;
      if (statusFilter === "cancelled" && r.status !== 2) return false;
      if (statusFilter === "pending" && r.status !== 4) return false;

      if (pairFilter !== "all") {
        const sell = TOKEN_NAMES[r.sellToken.toLowerCase()] ?? "?";
        const buy = TOKEN_NAMES[r.buyToken.toLowerCase()] ?? "?";
        const pairKey = `${sell}-${buy}`.toLowerCase();
        if (pairFilter === "ceth-cusdc" && pairKey !== "ceth-cusdc") return false;
        if (pairFilter === "cusdc-ceth" && pairKey !== "cusdc-ceth") return false;
      }

      if (
        onlyMine &&
        address &&
        r.maker.toLowerCase() !== address.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [rows, modeFilter, statusFilter, pairFilter, onlyMine, address]);

  const clearFilters = () => {
    setModeFilter("all");
    setStatusFilter("all");
    setPairFilter("all");
    setOnlyMine(false);
  };

  const hasActiveFilter =
    modeFilter !== "all" ||
    statusFilter !== "all" ||
    pairFilter !== "all" ||
    onlyMine;

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

      {!isLoading && rows.length > 0 && (
        <FilterBar
          modeFilter={modeFilter}
          setModeFilter={setModeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          pairFilter={pairFilter}
          setPairFilter={setPairFilter}
          onlyMine={onlyMine}
          setOnlyMine={setOnlyMine}
          walletConnected={!!address}
          totalCount={rows.length}
          filteredCount={filtered.length}
          hasActiveFilter={hasActiveFilter}
          onClear={clearFilters}
        />
      )}

      {isLoading && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span className="material-symbols-outlined animate-spin text-base text-[--color-primary]">
                sync
              </span>
              FETCHING ON-CHAIN INTENTS
            </div>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-zinc-800/50">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
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

      {rows.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon="filter_alt_off"
          title="NO INTENTS MATCH THESE FILTERS"
          body="Try clearing one of the filters to see more results"
          action={
            <button
              onClick={clearFilters}
              className="diam-btn-primary flex items-center gap-2 px-5 py-2 text-xs"
            >
              <span className="material-symbols-outlined text-base">
                refresh
              </span>
              Clear filters
            </button>
          }
        />
      )}

      {filtered.length > 0 && (
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
                  <Th>Sell → Buy</Th>
                  <Th>Mode</Th>
                  <Th>Maker</Th>
                  <Th>Volume (Encrypted)</Th>
                  <Th>Status</Th>
                  <Th>Expires</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map((row) => (
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
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-label-caps text-rose-400/80"
                            title="Maker is selling this token"
                          >
                            SELL
                          </span>
                          <TokenIcon
                            symbol={
                              TOKEN_NAMES[row.sellToken.toLowerCase()] ?? "?"
                            }
                            size="sm"
                          />
                          <span className="font-mono text-xs text-zinc-200">
                            {TOKEN_NAMES[row.sellToken.toLowerCase()] ?? "?"}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-base text-zinc-600">
                          arrow_forward
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-label-caps text-emerald-400/80"
                            title="Maker wants to receive this token"
                          >
                            BUY
                          </span>
                          <TokenIcon
                            symbol={
                              TOKEN_NAMES[row.buyToken.toLowerCase()] ?? "?"
                            }
                            size="sm"
                          />
                          <span className="font-mono text-xs text-zinc-200">
                            {TOKEN_NAMES[row.buyToken.toLowerCase()] ?? "?"}
                          </span>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <ModeBadge mode={row.mode} />
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                        {shortAddress(row.maker)}
                        {address &&
                          row.maker.toLowerCase() === address.toLowerCase() && (
                            <span className="text-label-caps border border-[--color-primary]/40 bg-[--color-primary]/10 px-1.5 py-0.5 text-[8px] text-[--color-primary]">
                              YOU
                            </span>
                          )}
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
              SHOWING {filtered.length} OF {rows.length} INTENTS
              {hasActiveFilter ? " (FILTERED)" : ""}
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

function FilterBar({
  modeFilter,
  setModeFilter,
  statusFilter,
  setStatusFilter,
  pairFilter,
  setPairFilter,
  onlyMine,
  setOnlyMine,
  walletConnected,
  totalCount,
  filteredCount,
  hasActiveFilter,
  onClear,
}: {
  modeFilter: ModeFilter;
  setModeFilter: (v: ModeFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  pairFilter: PairFilter;
  setPairFilter: (v: PairFilter) => void;
  onlyMine: boolean;
  setOnlyMine: (v: boolean) => void;
  walletConnected: boolean;
  totalCount: number;
  filteredCount: number;
  hasActiveFilter: boolean;
  onClear: () => void;
}) {
  return (
    <div className="glass-card mb-4 p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterGroup
          label="MODE"
          options={[
            { value: "all", label: "All" },
            { value: "direct", label: "Direct" },
            { value: "rfq", label: "RFQ" },
          ]}
          value={modeFilter}
          onChange={setModeFilter}
        />

        <FilterGroup
          label="STATUS"
          options={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "pending", label: "Pending Reveal" },
            { value: "filled", label: "Filled" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <FilterGroup
          label="PAIR"
          options={[
            { value: "all", label: "All" },
            { value: "ceth-cusdc", label: "cETH → cUSDC" },
            { value: "cusdc-ceth", label: "cUSDC → cETH" },
          ]}
          value={pairFilter}
          onChange={setPairFilter}
        />

        {walletConnected && (
          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`text-label-caps flex items-center gap-1.5 border px-3 py-1.5 transition-colors ${
              onlyMine
                ? "border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]"
                : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {onlyMine ? "check_box" : "check_box_outline_blank"}
            </span>
            My Intents
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500">
            {filteredCount}/{totalCount}
          </span>
          {hasActiveFilter && (
            <button
              onClick={onClear}
              className="text-label-caps flex items-center gap-1 border border-zinc-800 px-2.5 py-1 text-zinc-500 transition-colors hover:border-[--color-danger] hover:text-[--color-danger]"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-label-caps text-zinc-600">{label}</span>
      <div className="flex border border-zinc-800 bg-zinc-950">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-label-caps px-3 py-1 transition-colors ${
              value === opt.value
                ? "bg-[--color-primary] text-[--color-primary-fg]"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
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
    4: "border-amber-700 bg-amber-950/40 text-amber-400 animate-pulse",
  };
  return (
    <span
      className={`text-label-caps border px-2 py-0.5 text-[10px] ${
        map[status] ?? "border-zinc-800 bg-zinc-900/40 text-zinc-500"
      }`}
    >
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
