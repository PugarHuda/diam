import Link from "next/link";
import type { Route } from "next";
import { Header } from "@/components/Header";
import { LiveStats } from "@/components/LiveStats";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CopyButton } from "@/components/CopyButton";
import { CornerBrackets } from "@/components/CornerBrackets";
import { TerminalCursor } from "@/components/TerminalCursor";
import { HelpHint } from "@/components/Tooltip";
import {
  HeroAnnotations,
  TerminalCardHeader,
} from "@/components/TerminalAnnotations";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="scanline pt-16">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative flex min-h-[820px] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
          <HeroAnnotations />

          {/* Decorative scanning beam */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-1 bg-gradient-to-b from-[--color-primary]/40 to-transparent scan-beam" />

          <div className="z-10 max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-[--color-primary]/30 bg-[--color-primary]/5 px-3 py-1 fade-up">
              <span className="h-2 w-2 bg-[--color-primary] pulse-soft" />
              <span className="text-label-caps text-[10px] text-[--color-primary]">
                Confidential Layer Active
              </span>
            </div>

            <h1 className="text-headline-xl mb-6 text-white fade-up fade-up-1">
              Diam: Your trade.{" "}
              <span className="text-[--color-primary]">Their guess.</span>
              <br />
              Nobody knows.
              <TerminalCursor className="ml-2" />
            </h1>

            <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-zinc-600 fade-up fade-up-1">
              Confidential OTC · Direct + Vickrey RFQ
            </p>

            <p className="mx-auto mb-10 max-w-2xl text-base text-zinc-400 fade-up fade-up-2">
              Confidential OTC desk on iExec Nox — Direct bilateral or RFQ
              Vickrey auction with sealed bids. Dark-pool privacy, fully
              composable with any ERC-20.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row fade-up fade-up-3">
              <Link href={"/intents" as Route}>
                <button className="diam-btn-primary glow-on-hover px-8 py-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      play_arrow
                    </span>
                    Launch App
                  </span>
                </button>
              </Link>
              <a
                href="https://github.com/PugarHuda/diam"
                target="_blank"
                rel="noreferrer"
              >
                <button className="diam-btn-secondary px-8 py-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      code
                    </span>
                    View Source
                  </span>
                </button>
              </a>
            </div>
          </div>

          {/* Live on-chain stats */}
          <LiveStats />

          {/* Terminal mock card */}
          <div className="glass-card mt-12 w-full max-w-5xl overflow-hidden border-[--color-primary]/20 p-1">
            <TerminalCardHeader />
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
            <p className="section-marker mb-2">[01] · The problem</p>
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
            <p className="section-marker mb-2">[02] · How it works</p>
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

          <div className="mx-auto mt-8 flex max-w-[1200px] flex-wrap justify-between gap-3 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
            <a
              href="https://sepolia.arbiscan.io/address/0x5b2C0c83e41bF9ef072d742096C49DFDB814CEB4"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[--color-primary]"
            >
              CONTRACT: 0x32C6…3FF5
            </a>
            <a
              href="https://sepolia.arbiscan.io/address/0xd464B198f06756a1d00be223634b85E0a731c229"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[--color-primary]"
            >
              NOX_PROXY: 0xd464…c229
            </a>
            <a
              href="https://github.com/PugarHuda/diam"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[--color-primary]"
            >
              SRC: GITHUB.COM/PUGARHUDA/DIAM
            </a>
          </div>
        </section>

        {/* ── Live activity feed ─────────────────────────────── */}
        <ActivityFeed />

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="mx-auto mb-12 max-w-[1200px] text-center">
            <p className="section-marker mb-2">[03] · Get started</p>
          </div>
          <div className="glass-card relative z-10 mx-auto max-w-4xl border-[--color-primary]/20 p-12 text-center md:p-16">
            <CornerBrackets size="lg" />
            <h2 className="text-headline-xl mb-6 text-white">
              Ready to enter the dark pool?
            </h2>
            <p className="mb-10 text-lg text-zinc-400">
              Institutional-grade privacy is no longer a luxury. It is a
              requirement.
            </p>
            <Link href={"/faucet" as Route}>
              <button className="diam-btn-primary glow-on-hover px-12 py-5 text-base">
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    arrow_forward
                  </span>
                  Establish Secure Connection
                </span>
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-[1440px] px-8 py-12">
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="section-marker mb-3">DEPLOYED ON-CHAIN</p>
              <div className="space-y-2">
                <ContractRow
                  name="PrivateOTC"
                  address="0x5b2C0c83e41bF9ef072d742096C49DFDB814CEB4"
                />
                <ContractRow
                  name="cUSDC"
                  address="0x57736B816F6cb53c6B2c742D3A162E89Db162ADE"
                />
                <ContractRow
                  name="cETH"
                  address="0xCdD84bA9415DFE3Dd5c0c05077B1FE194Bcf695d"
                />
              </div>
            </div>
            <div>
              <p className="section-marker mb-3">RESOURCES</p>
              <div className="space-y-2 font-mono text-xs">
                <a
                  href="https://github.com/PugarHuda/diam"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-[--color-primary]"
                >
                  <span className="material-symbols-outlined text-sm">
                    code
                  </span>
                  GitHub repository
                </a>
                <a
                  href="https://docs.iex.ec/nox-protocol/getting-started/welcome"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-[--color-primary]"
                >
                  <span className="material-symbols-outlined text-sm">
                    description
                  </span>
                  iExec Nox docs
                </a>
                <a
                  href="https://chaingpt.org"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-[--color-primary]"
                >
                  <span className="material-symbols-outlined text-sm">
                    psychology
                  </span>
                  ChainGPT API
                </a>
                <a
                  href="https://dorahacks.io/hackathon/vibe-coding-iexec"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-[--color-primary]"
                >
                  <span className="material-symbols-outlined text-sm">
                    emoji_events
                  </span>
                  Vibe Coding Challenge
                </a>
              </div>
            </div>
            <div>
              <p className="section-marker mb-3">SYSTEM</p>
              <div className="space-y-2 font-mono text-xs text-zinc-500">
                <p className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[--color-primary] pulse-soft" />
                  TEE_ENCRYPTION_ACTIVE
                </p>
                <p>NETWORK: ARBITRUM_SEPOLIA</p>
                <p>CHAIN_ID: 421614</p>
                <p>NOX_VERSION: 0.1.0-beta.10</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between border-t border-zinc-900 pt-6 text-label-caps text-zinc-600 md:flex-row">
            <span>© 2026 DIAM PROTOCOL · CONFIDENTIAL LAYER ON IEXEC NOX</span>
            <span className="mt-2 md:mt-0">v0.1.0 · BUILT WITH CLAUDE CODE</span>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ─────────── Sub-components ─────────── */

function ContractRow({ name, address }: { name: string; address: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <a
        href={`https://sepolia.arbiscan.io/address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-[--color-primary]"
      >
        <span className="material-symbols-outlined text-sm">link</span>
        {name}
        <span className="text-zinc-700">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </a>
      <CopyButton value={address} />
    </div>
  );
}

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
