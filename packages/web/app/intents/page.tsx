"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
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
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Open intents</h1>
            <p className="mt-1 text-sm text-[--color-muted]">
              Asset pairs visible. Amounts encrypted on-chain — only authorized
              parties can decrypt.
            </p>
          </div>
          <Link
            href="/create"
            className="rounded-md bg-[--color-accent] px-5 py-2 text-sm font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover]"
          >
            New intent →
          </Link>
        </div>

        {isLoading && (
          <p className="mt-12 text-center text-sm text-[--color-muted]">
            Loading on-chain intents…
          </p>
        )}

        {error && (
          <div className="mt-12 rounded-md border border-[--color-danger] bg-[--color-danger]/10 p-3 text-sm text-[--color-danger]">
            {error.message}
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <div className="mt-12 rounded-xl border border-dashed border-[--color-border] p-12 text-center">
            <p className="text-[--color-muted]">No intents yet.</p>
            <Link
              href="/create"
              className="mt-4 inline-block text-sm font-medium text-[--color-accent] hover:underline"
            >
              Be the first to post one →
            </Link>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-xl border border-[--color-border]">
            <table className="w-full">
              <thead className="bg-[--color-surface] text-left text-xs uppercase tracking-wider text-[--color-muted]">
                <tr>
                  <Th>ID</Th>
                  <Th>Pair</Th>
                  <Th>Mode</Th>
                  <Th>Maker</Th>
                  <Th>Status</Th>
                  <Th>Expires</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {rows.map((row) => (
                  <tr
                    key={row.id.toString()}
                    className="bg-[--color-surface] transition hover:bg-[--color-surface-elevated]"
                  >
                    <Td>
                      <span data-numeric>#{row.id.toString()}</span>
                    </Td>
                    <Td>
                      <span className="font-mono">
                        {TOKEN_NAMES[row.sellToken.toLowerCase()] ??
                          shortAddress(row.sellToken)}
                        {" → "}
                        {TOKEN_NAMES[row.buyToken.toLowerCase()] ??
                          shortAddress(row.buyToken)}
                      </span>
                    </Td>
                    <Td>
                      <ModeBadge mode={row.mode} />
                    </Td>
                    <Td>
                      <span className="font-mono text-xs">
                        {shortAddress(row.maker)}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td>
                      <RelativeTime ts={row.deadline} />
                    </Td>
                    <Td>
                      <Link
                        href={`/intents/${row.id.toString()}`}
                        className="text-sm text-[--color-accent] hover:underline"
                      >
                        Open →
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium">{children}</th>;
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm">{children}</td>;
}

function ModeBadge({ mode }: { mode: number }) {
  const cls =
    mode === 0
      ? "bg-blue-500/10 text-blue-400"
      : "bg-purple-500/10 text-purple-400";
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${cls}`}>
      {modeLabel(mode)}
    </span>
  );
}

function StatusBadge({ status }: { status: number }) {
  const map: Record<number, string> = {
    0: "bg-[--color-success]/10 text-[--color-success]",
    1: "bg-[--color-muted]/20 text-[--color-muted]",
    2: "bg-[--color-warning]/10 text-[--color-warning]",
    3: "bg-[--color-muted]/10 text-[--color-muted]",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${map[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

function RelativeTime({ ts }: { ts: bigint }) {
  const seconds = Number(ts) - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return <span className="text-[--color-muted]">expired</span>;
  if (seconds < 3600)
    return <span data-numeric>{Math.floor(seconds / 60)}m</span>;
  if (seconds < 86400)
    return <span data-numeric>{Math.floor(seconds / 3600)}h</span>;
  return <span data-numeric>{Math.floor(seconds / 86400)}d</span>;
}
