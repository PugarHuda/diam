"use client";

import { useChainId } from "wagmi";

const CHAINS: Record<number, { name: string; short: string; ok: boolean }> = {
  421614: { name: "Arbitrum Sepolia", short: "ARB-SEP", ok: true },
  42161: { name: "Arbitrum", short: "ARB", ok: false },
  31337: { name: "Local Anvil", short: "LOCAL", ok: false },
};

export function NetworkBadge() {
  const chainId = useChainId();
  const cfg = CHAINS[chainId];

  if (!cfg) {
    return (
      <div className="hidden items-center gap-2 border border-orange-900 bg-orange-950/40 px-3 py-1.5 md:flex">
        <span className="material-symbols-outlined text-base text-orange-400">
          warning
        </span>
        <span className="text-label-caps text-orange-400">UNSUPPORTED</span>
      </div>
    );
  }

  return (
    <div
      className={`hidden items-center gap-2 border px-3 py-1.5 md:flex ${
        cfg.ok
          ? "border-[--color-primary]/40 bg-[--color-primary]/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          cfg.ok ? "bg-[--color-primary] pulse-soft" : "bg-zinc-500"
        }`}
      />
      <span
        className={`text-label-caps ${
          cfg.ok ? "text-[--color-primary]" : "text-zinc-500"
        }`}
      >
        {cfg.short}
      </span>
    </div>
  );
}
