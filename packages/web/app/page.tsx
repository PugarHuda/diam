import Link from "next/link";
import type { Route } from "next";
import { Header } from "@/components/Header";
import { LiveStats } from "@/components/LiveStats";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="scanline pt-16">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative flex min-h-[820px] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
          <div className="absolute left-8 top-24 hidden font-mono text-[10px] text-[--color-primary]/30 md:block">
            [ COORDINATE_AXIS: ARBITRUM_SEPOLIA ]
          </div>
          <div className="absolute right-8 top-24 hidden font-mono text-[10px] text-[--color-primary]/30 md:block">
            [ SYSTEM_STATUS: ENCRYPTED ]
          </div>

          <div className="z-10 max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-[--color-primary]/30 bg-[--color-primary]/5 px-3 py-1">
              <span className="h-2 w-2 bg-[--color-primary] pulse-soft" />
              <span className="text-label-caps text-[10px] text-[--color-primary]">
                Confidential Layer Active
              </span>
            </div>

            <h1 className="text-headline-xl mb-6 text-white">
              Diam: Your trade.{" "}
              <span className="text-[--color-primary]">Their guess.</span>
              <br />
              Nobody knows.
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-base text-zinc-400">
              Institutional-grade dark pool on iExec Nox. Seal your intent,
              execute in silence, settle with absolute finality — without
              revealing a single byte of alpha.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={"/intents" as Route}>
                <button className="diam-btn-primary px-8 py-4 text-sm">
                  Launch App
                </button>
              </Link>
              <a
                href="https://github.com/PugarHuda/diam"
                target="_blank"
                rel="noreferrer"
              >
                <button className="diam-btn-secondary px-8 py-4 text-sm">
                  View Source
                </button>
              </a>
            </div>
          </div>

          {/* Live on-chain stats */}
          <LiveStats />

          {/* Terminal mock card */}
          <div className="glass-card mt-12 w-full max-w-5xl overflow-hidden border-[--color-primary]/20 p-1">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                <div className="h-2 w-2 rounded-full bg-green-500/50" />
              </div>
              <div className="font-mono text-[10px] text-zinc-500">
                DIAM_TERMINAL_V1.0 · ARBITRUM_SEPOLIA
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-3">
              <TerminalField
                label="Order Origin"
                value="0x6002...4669"
                tone="primary"
              />
              <TerminalField label="Amount (Sealed)" sealed />
              <TerminalField
                label="Bid Proof"
                value="zk_handle_0x0000066eee23..."
                truncate
              />
            </div>
          </div>
        </section>

        {/* ── Why Diam ───────────────────────────────────────── */}
        <section className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="mb-16">
            <h2 className="text-headline-lg mb-4 text-white">Why Diam?</h2>
            <div className="h-1 w-16 bg-[--color-primary]" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ComparisonCard
              tier="Tier 01: Vulnerable"
              title="Public DEXs"
              items={[
                { icon: "close", text: "Full mempool transparency" },
                { icon: "close", text: "Front-running & MEV vulnerability" },
                { icon: "close", text: "Slippage on size > $100k" },
              ]}
              tone="danger"
            />
            <ComparisonCard
              tier="Tier 02: Manual"
              title="Telegram OTC"
              items={[
                { icon: "warning", text: "Counterparty trust required" },
                { icon: "warning", text: "Manual escrow + wire transfers" },
                { icon: "warning", text: "Information leakage in groups" },
              ]}
              tone="warning"
            />
            <ComparisonCard
              tier="Tier 03: Diam Protocol"
              title="Diam"
              items={[
                { icon: "check", text: "Zero-Knowledge Seal via Nox TEE" },
                { icon: "check", text: "MEV-resistant execution" },
                { icon: "check", text: "Vickrey-fair RFQ pricing" },
                { icon: "check", text: "Composable with any ERC-20" },
              ]}
              tone="primary"
            />
          </div>
        </section>

        {/* ── Architecture ───────────────────────────────────── */}
        <section className="bg-zinc-950 px-6 py-24">
          <div className="mx-auto mb-16 max-w-[1200px] text-center">
            <h2 className="text-headline-lg mb-4 text-white">
              Architecture of Silence
            </h2>
            <p className="mx-auto max-w-xl text-base text-zinc-500">
              Three composable layers engineered for absolute discretion across
              the entire trade lifecycle.
            </p>
          </div>

          <div className="mx-auto grid max-w-[1200px] grid-cols-1 border border-zinc-800 md:grid-cols-3">
            <LayerCard
              tier="Surface Layer"
              icon="terminal"
              title="MCP Plugin Layer"
              body="AI agents (Claude, Cursor, ChainGPT) trade through Diam via standardized MCP tools — one prompt, encrypted execution, no metadata leaks."
              border
            />
            <LayerCard
              tier="Logic Layer"
              icon="settings_input_component"
              title="Compound Engineering"
              body="Autonomous agents (MarketMaker, RFQ Sweeper, Strategy Coach, Settlement Monitor) that compound your trading edge while privacy stays intact."
              border
            />
            <LayerCard
              tier="Base Layer"
              icon="security"
              title="Core Protocol"
              body="Solidity contracts using Nox safeSub + select primitives. Strategy B settles atomically — privacy preserved even on bid rejection."
            />
          </div>

          <div className="mx-auto mt-8 flex max-w-[1200px] justify-between px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
            <div>L3_DEPLOYMENT_ACTIVE</div>
            <div>NOX_PROXY: 0xd464...c229</div>
            <div>UPTIME: 99.9999%</div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="glass-card relative z-10 mx-auto max-w-4xl border-[--color-primary]/20 p-12 text-center md:p-16">
            <h2 className="text-headline-xl mb-6 text-white">
              Ready to enter the dark pool?
            </h2>
            <p className="mb-10 text-lg text-zinc-400">
              Institutional-grade privacy is no longer a luxury. It is a
              requirement.
            </p>
            <Link href={"/faucet" as Route}>
              <button className="diam-btn-primary px-12 py-5 text-base">
                Establish Secure Connection
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between border-t border-zinc-900 bg-zinc-950 px-8 py-12 md:flex-row">
        <div className="mb-4 text-label-caps text-zinc-600 md:mb-0">
          © 2026 DIAM PROTOCOL · CONFIDENTIAL LAYER ON IEXEC NOX
        </div>
        <div className="flex gap-8">
          <a
            href="https://github.com/PugarHuda/diam"
            target="_blank"
            rel="noreferrer"
            className="text-label-caps text-zinc-600 transition-colors hover:text-[--color-primary]"
          >
            Github
          </a>
          <a
            href="https://docs.iex.ec/nox-protocol/getting-started/welcome"
            target="_blank"
            rel="noreferrer"
            className="text-label-caps text-zinc-600 transition-colors hover:text-[--color-primary]"
          >
            Nox Docs
          </a>
          <a
            href="https://sepolia.arbiscan.io/address/0x32C6552b0FB40833568ECb44aF70A44059FE3FF5"
            target="_blank"
            rel="noreferrer"
            className="text-label-caps text-zinc-600 transition-colors hover:text-[--color-primary]"
          >
            Contract
          </a>
        </div>
      </footer>
    </>
  );
}

/* ─────────── Sub-components ─────────── */

function TerminalField({
  label,
  value,
  sealed,
  truncate,
  tone,
}: {
  label: string;
  value?: string;
  sealed?: boolean;
  truncate?: boolean;
  tone?: "primary";
}) {
  return (
    <div className="space-y-3 text-left">
      <div className="text-label-caps text-zinc-500">{label}</div>
      <div className="flex h-10 items-center border border-zinc-800 bg-zinc-950 px-4">
        {sealed ? (
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 w-3 ${
                  i === 3 ? "" : "bg-[--color-primary]/20"
                }`}
              />
            ))}
          </div>
        ) : (
          <span
            className={`font-mono text-sm ${
              tone === "primary" ? "text-[--color-primary]" : "text-zinc-600"
            } ${truncate ? "truncate" : ""}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function ComparisonCard({
  tier,
  title,
  items,
  tone,
}: {
  tier: string;
  title: string;
  items: { icon: string; text: string }[];
  tone: "danger" | "warning" | "primary";
}) {
  const isPrimary = tone === "primary";
  const iconColor = {
    danger: "text-red-500/60",
    warning: "text-yellow-500/60",
    primary: "text-[--color-primary]",
  }[tone];

  return (
    <div
      className={`glass-card flex flex-col p-8 ${
        isPrimary
          ? "border-[--color-primary]/40 bg-[--color-primary]/[0.03]"
          : "glow-border"
      }`}
    >
      {isPrimary && (
        <span
          className="material-symbols-outlined absolute right-6 top-6 text-[--color-primary]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified
        </span>
      )}
      <div
        className={`mb-8 text-label-caps ${
          isPrimary ? "text-[--color-primary]" : "text-zinc-500"
        }`}
      >
        {tier}
      </div>
      <h3 className="text-headline-lg mb-6 text-white">{title}</h3>
      <ul className="flex-grow space-y-4">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-base text-zinc-400"
          >
            <span className={`material-symbols-outlined ${iconColor}`}>
              {item.icon}
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LayerCard({
  tier,
  icon,
  title,
  body,
  border,
}: {
  tier: string;
  icon: string;
  title: string;
  body: string;
  border?: boolean;
}) {
  return (
    <div
      className={`p-12 transition-all hover:bg-zinc-900/50 ${
        border ? "border-b border-zinc-800 md:border-b-0 md:border-r" : ""
      }`}
    >
      <div className="mb-8 grid h-12 w-12 place-items-center border border-[--color-primary]/40 bg-[--color-primary]/10">
        <span className="material-symbols-outlined text-[--color-primary]">
          {icon}
        </span>
      </div>
      <div className="mb-2 text-label-caps text-[--color-primary]">{tier}</div>
      <h4 className="text-headline-lg mb-4 text-xl text-white">{title}</h4>
      <p className="font-mono text-xs leading-relaxed text-zinc-500">{body}</p>
    </div>
  );
}
