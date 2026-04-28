"use client";

import { useState } from "react";

const STRATEGY_B_SNIPPET = `// Diam — Strategy B: atomic conditional settlement via Nox.safeSub + Nox.select
function acceptIntent(uint256 id, externalEuint256 buyAmountHandle, bytes calldata buyProof) external {
  Intent storage intent = intents[id];
  if (intent.status != IntentStatus.Open) revert IntentNotOpen();
  if (block.timestamp > intent.deadline) revert DeadlinePassed();
  euint256 buyAmount = Nox.fromExternal(buyAmountHandle, buyProof);
  (ebool sufficient,) = Nox.safeSub(buyAmount, intent.minBuyAmount);
  euint256 zero = Nox.toEuint256(0);
  euint256 effectiveSell = Nox.select(sufficient, intent.sellAmount, zero);
  euint256 effectiveBuy  = Nox.select(sufficient, buyAmount, zero);
  Nox.allowTransient(effectiveSell, address(intent.sellToken));
  Nox.allowTransient(effectiveBuy,  address(intent.buyToken));
  intent.sellToken.confidentialTransferFrom(intent.maker, msg.sender, euint256.unwrap(effectiveSell));
  intent.buyToken.confidentialTransferFrom(msg.sender, intent.maker, euint256.unwrap(effectiveBuy));
  intent.status = IntentStatus.Filled;
  emit Settled(id, msg.sender);
}`;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; riskLevel: "low" | "medium" | "high"; raw: string; findings: string[] }
  | { kind: "error"; message: string };

export function AuditButton({
  code = STRATEGY_B_SNIPPET,
  label = "Audit Strategy B logic",
}: {
  code?: string;
  label?: string;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [open, setOpen] = useState(false);

  async function run() {
    setState({ kind: "loading" });
    setOpen(true);
    try {
      const res = await fetch("/api/chaingpt/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Request failed");
      }
      const data = await res.json();
      setState({ kind: "ok", ...data });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-caps flex items-center gap-1.5 text-[--color-primary]">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
            ChainGPT Auditor
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            Smart contract audit · model: smart_contract_auditor
          </p>
        </div>
        <button
          onClick={run}
          disabled={state.kind === "loading"}
          className="text-label-caps flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 transition-all hover:border-[--color-primary] hover:text-[--color-primary] disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-base ${
              state.kind === "loading" ? "animate-spin" : ""
            }`}
          >
            {state.kind === "loading" ? "sync" : "search"}
          </span>
          {state.kind === "loading" ? "AUDITING…" : label}
        </button>
      </div>

      {open && state.kind === "ok" && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-3">
            <RiskBadge level={state.riskLevel} />
            <span className="text-label-caps text-zinc-500">
              {state.findings.length} finding{state.findings.length === 1 ? "" : "s"}
            </span>
          </div>

          {state.findings.length > 0 && (
            <ul className="space-y-1">
              {state.findings.slice(0, 5).map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-zinc-300"
                >
                  <span className="material-symbols-outlined text-sm text-[--color-primary]/60">
                    chevron_right
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <details className="border border-zinc-800 bg-zinc-950/40 p-3">
            <summary className="text-label-caps cursor-pointer text-zinc-400 hover:text-[--color-primary]">
              <span className="ml-2">Full audit report (markdown)</span>
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-400">
              {state.raw}
            </pre>
          </details>
        </div>
      )}

      {open && state.kind === "error" && (
        <p className="mt-3 flex items-center gap-1 font-mono text-[11px] text-[--color-danger]">
          <span className="material-symbols-outlined text-xs">error</span>
          {state.message}
        </p>
      )}
    </div>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const cfg = {
    low: {
      cls: "border-emerald-900 bg-emerald-950/40 text-emerald-400",
      label: "Low Risk",
      icon: "check_circle",
    },
    medium: {
      cls: "border-yellow-900 bg-yellow-950/40 text-yellow-400",
      label: "Medium Risk",
      icon: "warning",
    },
    high: {
      cls: "border-red-900 bg-red-950/40 text-red-400",
      label: "High Risk",
      icon: "error",
    },
  }[level];

  return (
    <span
      className={`text-label-caps flex items-center gap-1.5 border px-2 py-1 ${cfg.cls}`}
    >
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
