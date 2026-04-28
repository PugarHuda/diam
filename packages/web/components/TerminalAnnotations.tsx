"use client";

import { useEffect, useState } from "react";
import { useBlockNumber, useChainId } from "wagmi";

const CHAIN_NAMES: Record<number, string> = {
  421614: "ARBITRUM_SEPOLIA",
  42161: "ARBITRUM_MAINNET",
  31337: "LOCAL_ANVIL",
};

/**
 * Live block number + chain ID — replaces static `[ COORDINATE_AXIS ]` decoration.
 * Reads on-chain state via wagmi, watches for new blocks.
 */
export function HeroAnnotations() {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const chainId = useChainId();
  const [tick, setTick] = useState(0);

  // Tick every second for "live" subtitle update
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const time = new Date().toISOString().split("T")[1].slice(0, 8);
  const chainName = CHAIN_NAMES[chainId] ?? `CHAIN_${chainId}`;

  return (
    <>
      <div className="absolute left-8 top-24 hidden font-mono text-[10px] text-[--color-primary]/40 md:flex md:items-center md:gap-2">
        <span className="h-1 w-1 rounded-full bg-[--color-primary] pulse-soft" />
        <span suppressHydrationWarning>
          [ BLOCK: {blockNumber ? blockNumber.toString() : "—"} · {chainName} ]
        </span>
      </div>
      <div className="absolute right-8 top-24 hidden font-mono text-[10px] text-[--color-primary]/40 md:flex md:items-center md:gap-2">
        <span suppressHydrationWarning>
          [ {time} UTC · NOX_TEE: ACTIVE ]
        </span>
        <span className="h-1 w-1 rounded-full bg-[--color-primary] pulse-soft" />
      </div>
      {/* Hidden tick reference so React re-renders */}
      <span className="hidden">{tick}</span>
    </>
  );
}

/**
 * Live terminal mock card header — block + chain instead of static V1.0
 */
export function TerminalCardHeader() {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const chainId = useChainId();
  const chainName = CHAIN_NAMES[chainId] ?? `CHAIN_${chainId}`;

  return (
    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500/50" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
        <div className="h-2 w-2 rounded-full bg-green-500/50 pulse-soft" />
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
        <span suppressHydrationWarning>
          BLOCK_{blockNumber?.toString() ?? "—"}
        </span>
        <span className="text-zinc-700">·</span>
        <span>{chainName}</span>
      </div>
    </div>
  );
}
