"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Header } from "@/components/Header";
import { useNoxClient, decryptUint256 } from "@/lib/nox-client";
import { CUSDC_ADDRESS, CETH_ADDRESS } from "@/lib/wagmi";
import type { Hex } from "viem";
import { formatUnits } from "viem";

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
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="mt-2 text-sm text-[--color-muted]">
          Your confidential token balances. Hidden by default — click decrypt to
          reveal locally via Nox SDK.
        </p>

        {!isConnected && (
          <div className="mt-8 rounded-xl border border-[--color-border] bg-[--color-surface] p-8 text-center">
            <p className="text-[--color-muted]">
              Connect your wallet to see balances.
            </p>
          </div>
        )}

        {isConnected && address && (
          <div className="mt-8 space-y-3">
            {TOKENS.map((t) => (
              <BalanceRow
                key={t.address}
                token={t}
                account={address}
              />
            ))}
          </div>
        )}
      </main>
    </>
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
    <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
      <div>
        <p className="text-sm font-medium">{token.symbol}</p>
        <p className="mt-1 font-mono text-xs text-[--color-muted]">
          {handleQuery.data
            ? `handle ${(handleQuery.data as string).slice(0, 12)}…`
            : "loading…"}
        </p>
      </div>
      <div className="text-right">
        {decrypted !== null ? (
          <p className="font-mono text-lg" data-numeric>
            {formatUnits(decrypted, token.decimals)} {token.symbol}
          </p>
        ) : (
          <button
            onClick={onDecrypt}
            disabled={!ready || loading || !handleQuery.data}
            className="rounded-md border border-[--color-border] px-3 py-1.5 text-xs transition hover:border-[--color-accent] disabled:opacity-50"
          >
            {loading ? "Decrypting…" : "Decrypt"}
          </button>
        )}
        {error && (
          <p className="mt-1 text-xs text-[--color-danger]">{error}</p>
        )}
      </div>
    </div>
  );
}
