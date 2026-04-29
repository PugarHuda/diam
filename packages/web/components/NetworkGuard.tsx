"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";

const TARGET_CHAIN = arbitrumSepolia;

/**
 * Banner that appears when the connected wallet is on the wrong network.
 * Renders nothing when the user is disconnected or already on the right chain.
 *
 * Mounted once in AppShell so every page benefits without per-page boilerplate.
 */
export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;
  if (chainId === TARGET_CHAIN.id) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-700 bg-amber-950/40 px-6 py-2.5 lg:ml-64 lg:px-8"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-base text-amber-400"
            aria-hidden
          >
            warning
          </span>
          <div className="font-mono text-[12px] leading-snug">
            <span className="text-amber-400">
              WRONG_NETWORK · chainid {chainId}
            </span>
            <span className="ml-2 text-zinc-400">
              Diam runs on {TARGET_CHAIN.name} ({TARGET_CHAIN.id}). Wallet
              actions will fail.
            </span>
          </div>
        </div>
        <button
          onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
          disabled={isPending}
          className="text-label-caps shrink-0 border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-amber-400 transition hover:bg-amber-400/20 disabled:opacity-50"
        >
          {isPending ? "Switching…" : `Switch to ${TARGET_CHAIN.name}`}
        </button>
      </div>
    </div>
  );
}
