"use client";

import { useSetOperator } from "@/lib/hooks/useSetOperator";

/**
 * Inline status + action banner for "approve PrivateOTC as operator".
 * Renders nothing if the connected wallet has already authorized OTC for
 * the given token. Shows a one-click authorization button otherwise.
 *
 * Mount this:
 *   - On the faucet page (so users authorize after first mint).
 *   - On accept-intent / submit-bid flows for the buyToken (taker side).
 *   - On create-intent flows for the sellToken (maker side).
 */
export function OperatorAuth({
  token,
  account,
  symbol,
  reason,
  compact = false,
}: {
  token: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
  symbol: string;
  /** Why this auth is needed — shown in the explanatory line */
  reason?: string;
  /** Hide the rationale paragraph for tight contexts */
  compact?: boolean;
}) {
  const { isOperator, isLoading, authorize, step, error } = useSetOperator(
    token,
    account,
  );

  if (!token || !account) return null;
  if (isLoading) return null;
  if (isOperator) return null; // Authorized — nothing to render

  const busy = step === "signing" || step === "confirming";

  return (
    <div className="glass-card border-l-2 border-l-amber-400 p-4">
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined text-amber-400"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          shield_lock
        </span>
        <div className="flex-1 space-y-2">
          <p className="text-label-caps text-amber-400">
            Authorize Diam for {symbol}
          </p>
          {!compact && (
            <p className="font-mono text-[11px] leading-relaxed text-zinc-400">
              {reason ??
                `One-time authorization. Diam needs operator permission on ${symbol} so settlement can pull encrypted tokens from your wallet during a trade. Without this, accept / settle reverts with "not operator".`}
            </p>
          )}
          <button
            onClick={authorize}
            disabled={busy}
            className="text-label-caps inline-flex items-center gap-1.5 border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-amber-300 transition-colors hover:bg-amber-400/20 disabled:opacity-60"
          >
            <span
              className={`material-symbols-outlined text-sm ${
                busy ? "animate-spin" : ""
              }`}
            >
              {step === "signing" && "draw"}
              {step === "confirming" && "sync"}
              {(step === "idle" || step === "error") && "verified_user"}
              {step === "done" && "check_circle"}
            </span>
            {step === "signing" && "Confirm in wallet…"}
            {step === "confirming" && "Authorizing on-chain…"}
            {(step === "idle" || step === "error") &&
              `Authorize Diam (${symbol}, 60d)`}
            {step === "done" && "Authorized"}
          </button>
          {error && (
            <p className="font-mono text-[10px] text-[--color-danger]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
