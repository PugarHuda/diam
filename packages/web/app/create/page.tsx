import Link from "next/link";
import type { Route } from "next";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { HelpHint } from "@/components/Tooltip";

export default function CreatePage() {
  return (
    <AppShell>
      <PageHeader
        icon="add_circle"
        title="CREATE INTENT"
        subtitle="CHOOSE_EXECUTION_MODE | NETWORK: ARBITRUM_SEPOLIA"
      />

      <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ModeCard
          href="/create/direct"
          tier="Mode 01"
          title="Direct OTC"
          tagline="One maker · one taker"
          description="Atomic bilateral settlement with a known counterparty. Specify a hidden minimum buy price; the first qualifying taker fills."
          icon="swap_horiz"
          stats={[
            { label: "Latency", value: "< 5s" },
            { label: "Privacy", value: "End-to-end" },
          ]}
        />
        <ModeCard
          href="/create/rfq"
          tier="Mode 02"
          title="RFQ Mode"
          tagline="N takers · Vickrey pricing"
          description="Multi-bidder sealed auction. Highest sealed bid wins, pays second-highest price. Mathematically optimal execution for size."
          icon="hub"
          stats={[
            { label: "Pricing", value: "Vickrey" },
            { label: "Max bidders", value: "10" },
          ]}
          highlight
        />
      </div>

      <div className="mt-6 flex items-start gap-3 border border-zinc-800 bg-zinc-900/30 p-6">
        <span
          className="material-symbols-outlined text-[--color-primary]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          gpp_good
        </span>
        <div>
          <p className="text-label-caps mb-2 flex items-center gap-1.5 text-zinc-500">
            STRATEGY_B_GUARANTEE
            <HelpHint content="Strategy B is Diam's privacy-preserving rejection pattern. When a bid is below maker's minimum, the contract uses Nox.safeSub + Nox.select to route encrypted zeros instead of real amounts — atomic no-op, no info leak via revert." />
          </p>
          <p className="text-sm text-zinc-400">
            When a bid falls below your hidden minimum, Diam settles the trade
            as an{" "}
            <span className="font-mono text-[--color-primary]">
              atomic no-op via Nox.safeSub + Nox.select
            </span>
            . The on-chain status is always{" "}
            <span className="font-mono text-[--color-primary]">Filled</span> —
            observers cannot distinguish a successful trade from a rejected
            one. Privacy preserved on every outcome.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function ModeCard({
  href,
  tier,
  title,
  tagline,
  description,
  icon,
  stats,
  highlight,
}: {
  href: Route;
  tier: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  stats: { label: string; value: string }[];
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`glass-card group relative flex flex-col p-8 transition-all ${
        highlight
          ? "border-[--color-primary]/40 bg-[--color-primary]/[0.03]"
          : "glow-border"
      }`}
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center border border-[--color-primary]/40 bg-[--color-primary]/10">
          <span className="material-symbols-outlined text-[--color-primary]">
            {icon}
          </span>
        </div>
        <span
          className={`text-label-caps ${
            highlight ? "text-[--color-primary]" : "text-zinc-500"
          }`}
        >
          {tier}
        </span>
      </div>

      <h2 className="text-headline-lg mb-1 text-white">{title}</h2>
      <p className="text-label-caps mb-6 text-zinc-500">{tagline}</p>

      <p className="mb-8 flex-grow text-sm leading-relaxed text-zinc-400">
        {description}
      </p>

      <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-label-caps text-zinc-600">{s.label}</p>
            <p className="mt-1 font-mono text-sm text-[--color-primary]">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <span className="mt-6 inline-flex items-center gap-2 text-label-caps text-[--color-primary] transition-all group-hover:gap-3">
        Continue
        <span className="material-symbols-outlined text-base">
          arrow_forward
        </span>
      </span>
    </Link>
  );
}
