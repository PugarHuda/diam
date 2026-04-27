"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import type { Hex } from "viem";
import { AppShell } from "@/components/AppShell";
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
      <header className="mb-8">
        <h1 className="text-headline-xl text-3xl font-bold tracking-tight text-white">
          PORTFOLIO
        </h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          ENCRYPTED_BALANCES | OWNER_DECRYPT_ONLY
        </p>
      </header>

      {!isConnected && (
        <div className="glass-card p-12 text-center">
          <span
            className="material-symbols-outlined mb-3 text-zinc-700"
            style={{ fontSize: "3rem" }}
          >
            account_circle_off
          </span>
          <p className="font-mono text-zinc-500">
            ⟨ WALLET NOT CONNECTED ⟩
          </p>
          <p className="mt-2 font-mono text-[11px] text-zinc-600">
            Connect a wallet to view your encrypted balances
          </p>
        </div>
      )}

      {isConnected && address && (
        <>
          <div className="glass-card mb-6 flex items-center justify-between border-l-2 border-l-[--color-primary] p-4">
            <div>
              <p className="text-label-caps text-zinc-500">CONNECTED_ADDRESS</p>
              <p className="font-mono text-sm text-[--color-primary]">
                {shortAddress(address, 8)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-label-caps text-zinc-500">NETWORK</p>
              <p className="font-mono text-sm">ARBITRUM_SEPOLIA</p>
            </div>
          </div>

          <div className="space-y-3">
            {TOKENS.map((t) => (
              <BalanceRow key={t.address} token={t} account={address} />
            ))}
          </div>

          <div className="mt-8 border border-zinc-800 bg-zinc-900/30 p-6">
            <p className="text-label-caps mb-2 text-zinc-500">
              DECRYPTION_NOTICE
            </p>
            <p className="font-mono text-xs leading-relaxed text-zinc-400">
              Balance handles are 32-byte references to encrypted state stored
              off-chain in iExec Nox TEE. Decryption requires your wallet
              signature + ACL membership granted by the cToken contract.
              Decrypted values are computed{" "}
              <span className="text-[--color-primary]">in your browser</span>{" "}
              and never leave it.
            </p>
          </div>
        </>
      )}
    </AppShell>
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
    <div className="glass-card flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center border border-zinc-800 bg-zinc-950 font-mono text-xs text-[--color-primary]">
          {token.symbol[1]}
        </div>
        <div>
          <p className="font-display text-sm font-bold">{token.symbol}</p>
          <p className="font-mono text-[11px] text-zinc-600">
            {handleQuery.data
              ? `${(handleQuery.data as string).slice(0, 14)}…[NOX]`
              : "loading…"}
          </p>
        </div>
      </div>

      <div className="text-right">
        {decrypted !== null ? (
          <>
            <p
              className="font-mono text-lg text-[--color-primary]"
              data-numeric
            >
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
            className="text-label-caps border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[--color-primary] transition-all hover:bg-[--color-primary] hover:text-[--color-primary-fg] disabled:opacity-50"
          >
            {loading ? "DECRYPTING…" : "DECRYPT"}
          </button>
        )}
        {error && (
          <p className="mt-1 font-mono text-[10px] text-[--color-danger]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
