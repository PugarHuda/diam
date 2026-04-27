"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import type { Hex } from "viem";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TokenIcon } from "@/components/TokenIcon";
import { useNoxClient, decryptUint256 } from "@/lib/nox-client";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import { shortAddress } from "@/lib/utils";

const TOKENS = [
  { symbol: "cUSDC", address: CUSDC_ADDRESS, decimals: 6 },
  { symbol: "cETH", address: CETH_ADDRESS, decimals: 18 },
];

const ERC7984_ABI = [
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  return (
    <AppShell>
      <PageHeader
        icon="account_balance_wallet"
        title="PORTFOLIO"
        subtitle="ENCRYPTED_BALANCES | OWNER_DECRYPT_ONLY"
      />

      {!isConnected && (
        <EmptyState
          icon="account_circle_off"
          title="WALLET NOT CONNECTED"
          body="Connect a wallet to view your encrypted balances"
        />
      )}

      {isConnected && address && (
        <>
          <div className="glass-card mb-6 grid grid-cols-3 gap-4 border-l-2 border-l-[--color-primary] p-4">
            <StatBlock
              icon="badge"
              label="ADDRESS"
              value={shortAddress(address, 6)}
              tone="primary"
            />
            <StatBlock
              icon="hub"
              label="NETWORK"
              value="ARB_SEPOLIA"
            />
            <StatBlock icon="lock" label="ENCRYPTION" value="NOX_TEE" />
          </div>

          <div className="space-y-3">
            {TOKENS.map((t) => (
              <BalanceRow key={t.address} token={t} account={address} />
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 border border-zinc-800 bg-zinc-900/30 p-6">
            <span className="material-symbols-outlined text-[--color-primary]">
              shield
            </span>
            <div>
              <p className="text-label-caps mb-2 text-zinc-500">
                DECRYPTION_NOTICE
              </p>
              <p className="font-mono text-xs leading-relaxed text-zinc-400">
                Balance handles are 32-byte references to encrypted state
                stored off-chain in iExec Nox TEE. Decryption requires your
                wallet signature + ACL membership granted by the cToken
                contract. Decrypted values are computed{" "}
                <span className="text-[--color-primary]">in your browser</span>{" "}
                and never leave it.
              </p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatBlock({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`material-symbols-outlined ${
          tone === "primary" ? "text-[--color-primary]" : "text-zinc-500"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-label-caps text-zinc-500">{label}</p>
        <p
          className={`font-mono text-sm ${
            tone === "primary" ? "text-[--color-primary]" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function BalanceRow({
  token,
  account,
}: {
  token: { symbol: string; address: `0x${string}`; decimals: number };
  account: `0x${string}`;
}) {
  const { ready, getClient } = useNoxClient();
  const [decrypted, setDecrypted] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = useReadContract({
    address: token.address,
    abi: ERC7984_ABI,
    functionName: "confidentialBalanceOf",
    args: [account],
  });

  async function onDecrypt() {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const client = await getClient();
      if (!client) throw new Error("Nox client unavailable");
      if (!handleQuery.data) throw new Error("Balance handle not loaded");
      const value = await decryptUint256(client, handleQuery.data as Hex);
      setDecrypted(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card flex items-center justify-between p-4 transition-all hover:border-[--color-primary]/40">
      <div className="flex items-center gap-4">
        <TokenIcon symbol={token.symbol} size="md" />
        <div>
          <p className="font-display text-sm font-bold">{token.symbol}</p>
          <p className="flex items-center gap-1 font-mono text-[11px] text-zinc-600">
            <span className="material-symbols-outlined text-xs text-[--color-primary]/40">
              lock
            </span>
            {handleQuery.data
              ? `${(handleQuery.data as string).slice(0, 14)}…`
              : "loading…"}
          </p>
        </div>
      </div>

      <div className="text-right">
        {decrypted !== null ? (
          <>
            <p
              className="flex items-center justify-end gap-2 font-mono text-lg text-[--color-primary]"
              data-numeric
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock_open
              </span>
              {formatUnits(decrypted, token.decimals)}
            </p>
            <p className="text-label-caps text-zinc-600">
              {token.symbol} · DECRYPTED
            </p>
          </>
        ) : (
          <button
            onClick={onDecrypt}
            disabled={!ready || loading || !handleQuery.data}
            className="text-label-caps flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[--color-primary] transition-all hover:bg-[--color-primary] hover:text-[--color-primary-fg] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">
              {loading ? "sync" : "key"}
            </span>
            {loading ? "DECRYPTING…" : "DECRYPT"}
          </button>
        )}
        {error && (
          <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[--color-danger]">
            <span className="material-symbols-outlined text-xs">error</span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
