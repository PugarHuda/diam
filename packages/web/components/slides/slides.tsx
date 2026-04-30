"use client";

import Link from "next/link";
import type { Route } from "next";
import { DiamLogo } from "@/components/DiamLogo";

/**
 * The deck content. Each entry is { marker, render } — `render` returns the
 * slide body JSX (centered inside SlideShell). Keep one idea per slide,
 * minimum text, maximum visual hierarchy.
 *
 * The order here defines the navigation order. To insert / reorder: shuffle
 * this array, that's it.
 */
export type Slide = {
  marker: string;
  render: () => React.ReactNode;
};

export const SLIDES: Slide[] = [
  // ─────────── 01 · Title ─────────────────────────────────────────
  {
    marker: "TITLE",
    render: () => (
      <div className="flex flex-col items-center text-center">
        <DiamLogo
          size={140}
          variant="full"
          className="mb-10 text-[--color-primary] fade-up"
        />
        <h1 className="font-display text-[clamp(3rem,8vw,6rem)] font-bold leading-none tracking-tighter text-[--color-primary] fade-up fade-up-1">
          DIAM
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.4em] text-zinc-500 fade-up fade-up-2">
          Confidential · OTC · Desk
        </p>
        <p className="mt-12 max-w-2xl text-2xl font-light tracking-wide text-zinc-200 fade-up fade-up-3">
          Your trade. <span className="text-[--color-primary]">Their guess.</span>{" "}
          Nobody knows.
        </p>
        <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600 fade-up fade-up-4">
          iExec Vibe Coding Challenge · April 2026 · Built solo with Claude Code
        </p>
      </div>
    ),
  },

  // ─────────── 02 · The problem ───────────────────────────────────
  {
    marker: "01 · PROBLEM",
    render: () => (
      <div className="space-y-12">
        <p className="section-marker fade-up">[ 01 ] · The problem</p>
        <h2 className="text-headline-xl text-white fade-up fade-up-1">
          On-chain OTC{" "}
          <span className="text-[--color-danger]">leaks everything.</span>
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 fade-up fade-up-2">
          {["Order size", "Side", "Counterparty", "Price"].map((field) => (
            <div
              key={field}
              className="border border-[--color-danger]/40 bg-[--color-danger]/5 p-5"
            >
              <div className="text-label-caps mb-2 text-[--color-danger]">
                EXPOSED
              </div>
              <div className="font-display text-xl text-white">{field}</div>
              <div className="mt-3 font-mono text-[10px] tracking-widest text-zinc-500">
                · plaintext on-chain ·
              </div>
            </div>
          ))}
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-zinc-400 fade-up fade-up-3">
          The moment your trade lands, every MEV bot, market maker, and
          competing desk reads your hand. That is why{" "}
          <span className="text-[--color-primary]">
            &gt;95% of institutional OTC volume
          </span>{" "}
          still happens off-chain — Telegram chats, Genesis, Cumberland,
          FalconX.
        </p>
      </div>
    ),
  },

  // ─────────── 03 · The cost ──────────────────────────────────────
  {
    marker: "02 · COST",
    render: () => (
      <div className="space-y-10">
        <p className="section-marker fade-up">[ 02 ] · What it costs</p>
        <div className="fade-up fade-up-1">
          <div className="font-display text-[clamp(3rem,9vw,7rem)] font-bold leading-none tracking-tighter text-[--color-primary]">
            $50M
          </div>
          <p className="mt-4 max-w-2xl text-2xl text-zinc-200">
            sell order moves the market{" "}
            <span className="text-[--color-danger]">2% against the maker</span>{" "}
            before they execute.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-zinc-900 pt-8 md:grid-cols-3 fade-up fade-up-2">
          {[
            {
              k: "MEV bots",
              v: "Read mempool intents, sandwich the fill",
            },
            {
              k: "Competing desks",
              v: "Front-run with smaller orders",
            },
            {
              k: "Counterparties",
              v: "Negotiate from a position of perfect information",
            },
          ].map(({ k, v }) => (
            <div key={k} className="space-y-2">
              <div className="text-label-caps text-[--color-primary]">{k}</div>
              <p className="text-zinc-400">{v}</p>
            </div>
          ))}
        </div>

        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-600 fade-up fade-up-3">
          → That is the institutional moat. We close it.
        </p>
      </div>
    ),
  },

  // ─────────── 04 · The idea ──────────────────────────────────────
  {
    marker: "03 · IDEA",
    render: () => (
      <div className="space-y-12 text-center">
        <p className="section-marker fade-up">[ 03 ] · The idea</p>
        <h2 className="text-headline-xl text-white fade-up fade-up-1">
          What if the amount was{" "}
          <span className="text-[--color-primary]">sealed on-chain</span>?
        </h2>

        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 fade-up fade-up-2">
          {/* Maker */}
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-20 w-20 place-items-center border border-[--color-primary]/40 bg-[--color-primary]/5">
              <span className="material-symbols-outlined text-3xl text-[--color-primary]">
                account_balance
              </span>
            </div>
            <span className="text-label-caps text-zinc-400">MAKER</span>
          </div>

          {/* Arrow with sealed handle */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-5 w-2 ${
                    i === 3 ? "" : "bg-[--color-primary]/40"
                  }`}
                />
              ))}
            </div>
            <div className="text-label-caps text-[10px] text-[--color-primary]">
              euint256 handle · TEE-sealed
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[--color-primary]/40 to-transparent" />
          </div>

          {/* Contract */}
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-20 w-20 place-items-center border border-[--color-primary]/40 bg-[--color-primary]/5">
              <span className="material-symbols-outlined text-3xl text-[--color-primary]">
                deployed_code
              </span>
            </div>
            <span className="text-label-caps text-zinc-400">CONTRACT</span>
          </div>

          {/* Arrow */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-5 w-2 ${
                    i === 3 ? "" : "bg-[--color-primary]/40"
                  }`}
                />
              ))}
            </div>
            <div className="text-label-caps text-[10px] text-[--color-primary]">
              still sealed
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[--color-primary]/40 to-transparent" />
          </div>

          {/* Taker */}
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-20 w-20 place-items-center border border-[--color-primary]/40 bg-[--color-primary]/5">
              <span className="material-symbols-outlined text-3xl text-[--color-primary]">
                handshake
              </span>
            </div>
            <span className="text-label-caps text-zinc-400">TAKER</span>
          </div>
        </div>

        <p className="mx-auto max-w-2xl text-base text-zinc-400 fade-up fade-up-3">
          Maker posts intent → contract holds an encrypted handle → taker fills
          blind. Nobody — not even the chain — sees the size.
        </p>
      </div>
    ),
  },

  // ─────────── 05 · How (3 pillars) ───────────────────────────────
  {
    marker: "04 · HOW",
    render: () => (
      <div className="space-y-10">
        <p className="section-marker fade-up">[ 04 ] · How it works</p>
        <h2 className="text-headline-lg text-white fade-up fade-up-1">
          Three primitives borrowed from iExec Nox:
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              i: "01",
              title: "TEE-backed encryption",
              body: "Every amount lives as an `euint256` handle. The plaintext only exists inside iExec's TEE precompile — never on the public ledger, never in mempool, never in event logs.",
              delay: "fade-up-1",
            },
            {
              i: "02",
              title: "Sealed-bid Vickrey RFQ",
              body: "Bids stay encrypted. The contract loops `Nox.gt` + `Nox.select` to pick winner + second-price entirely on encrypted handles. Only the result is revealed.",
              delay: "fade-up-2",
            },
            {
              i: "03",
              title: "Atomic settlement",
              body: "`Nox.safeSub` + `Nox.select` make the trade all-or-nothing. No partial fills, no intermediate balances leaked, no failure mode that exposes size.",
              delay: "fade-up-3",
            },
          ].map((p) => (
            <div
              key={p.i}
              className={`flex flex-col gap-3 border border-[--color-primary]/30 bg-[--color-primary]/5 p-6 fade-up ${p.delay}`}
            >
              <div className="font-mono text-xs tracking-widest text-[--color-primary]/70">
                {p.i}
              </div>
              <div className="font-display text-xl font-semibold text-white">
                {p.title}
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────── 06 · Architecture ──────────────────────────────────
  {
    marker: "05 · ARCHITECTURE",
    render: () => (
      <div className="space-y-10">
        <p className="section-marker fade-up">[ 05 ] · System</p>
        <h2 className="text-headline-lg text-white fade-up fade-up-1">
          End-to-end on Arbitrum Sepolia · 4 packages, one repo.
        </h2>

        <div className="grid grid-cols-1 gap-3 font-mono text-sm md:grid-cols-2 fade-up fade-up-2">
          {[
            {
              label: "contracts/",
              desc: "PrivateOTC.sol + DiamCToken (ERC-7984) · Foundry tests · Slither audit · 100% line coverage",
            },
            {
              label: "web/",
              desc: "Next.js 16 + wagmi v2 + RainbowKit · server components · React 19",
            },
            {
              label: "agents/",
              desc: "4 autonomous workers: market-maker · RFQ sweeper · settlement monitor · strategy coach",
            },
            {
              label: "mcp-server/",
              desc: "Exposes the desk as 3 AI-callable tools (createIntent · browseIntents · decryptBalance)",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 border border-zinc-800 bg-zinc-950/40 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-[--color-primary]">▸</span>
                <span className="font-display text-base font-bold text-[--color-primary]">
                  {row.label}
                </span>
              </div>
              <p className="pl-5 text-xs leading-relaxed text-zinc-400">
                {row.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-zinc-900 pt-6 font-mono text-xs md:grid-cols-3 fade-up fade-up-3">
          {[
            { k: "Network", v: "Arbitrum Sepolia · Chain 421614" },
            { k: "Encryption", v: "iExec Nox · @iexec-nox/handle" },
            { k: "AI", v: "ChainGPT API · MCP · Claude Code" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-label-caps text-zinc-500">{s.k}</div>
              <div className="mt-1 text-zinc-300">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────── 07 · Demo (live) ───────────────────────────────────
  {
    marker: "06 · DEMO",
    render: () => (
      <div className="space-y-10 text-center">
        <p className="section-marker fade-up">[ 06 ] · Live</p>
        <h2 className="text-headline-xl text-white fade-up fade-up-1">
          Live on{" "}
          <span className="text-[--color-primary]">Arbitrum Sepolia</span> right
          now.
        </h2>

        <div className="mx-auto max-w-2xl space-y-4 fade-up fade-up-2">
          <a
            href="https://private-otc.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="glass-card glow-on-hover block border border-[--color-primary]/30 px-8 py-6 transition"
          >
            <div className="text-label-caps text-[--color-primary]">
              OPEN THE DAPP
            </div>
            <div className="mt-2 font-mono text-2xl tracking-wider text-white">
              private-otc.vercel.app
            </div>
          </a>

          <div className="grid grid-cols-1 gap-2 font-mono text-[11px] md:grid-cols-3">
            {[
              { k: "PrivateOTC", v: "0xBD27…A563" },
              { k: "cUSDC", v: "0xb690…B3F" },
              { k: "cETH", v: "0xeB3A…14d1" },
            ].map((c) => (
              <div
                key={c.k}
                className="border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-left"
              >
                <div className="text-label-caps text-zinc-500">{c.k}</div>
                <div className="mt-1 tracking-widest text-zinc-300">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href={"/intents" as Route}
          className="diam-btn-primary glow-on-hover inline-flex items-center gap-2 px-8 py-4 fade-up fade-up-3"
        >
          <span className="material-symbols-outlined text-base">
            play_arrow
          </span>
          TRY THE VICKREY REVEAL
        </Link>
      </div>
    ),
  },

  // ─────────── 08 · Engineering credibility ───────────────────────
  {
    marker: "07 · CRAFT",
    render: () => (
      <div className="space-y-10">
        <p className="section-marker fade-up">[ 07 ] · Engineering</p>
        <h2 className="text-headline-lg text-white fade-up fade-up-1">
          Caught a real Vickrey bug{" "}
          <span className="text-[--color-primary]">before mainnet ever saw it.</span>
        </h2>

        <div className="border border-[--color-primary]/30 bg-[--color-primary]/5 p-6 font-mono text-sm fade-up fade-up-2">
          <p className="mb-3 text-zinc-300">
            Wrote a pure-Solidity mirror of the encrypted Vickrey algorithm.
            Fuzzed it with 256 runs.
          </p>
          <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed text-[--color-primary]">
{`bids = [100, 300, 200]
expected second-price = 200
got                    = 100   ← BUG`}
          </pre>
          <p className="mt-3 text-zinc-300">
            Three-case formula in `_computeSecondPrice` was missing the middle
            case where a bid lands{" "}
            <em className="text-[--color-primary]">between</em> the current
            highest and second. Fixed with a nested{" "}
            <code className="text-[--color-primary]">Nox.select</code>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 fade-up fade-up-3">
          {[
            { k: "100%", v: "line coverage on logic modules" },
            { k: "30+", v: "Foundry tests · fork mode" },
            { k: "32×20", v: "stateful invariant runs × depth" },
            { k: "0", v: "Slither high/medium findings" },
          ].map((s) => (
            <div
              key={s.k}
              className="border border-zinc-800 bg-zinc-950/40 p-4 text-center"
            >
              <div className="font-display text-2xl font-bold text-[--color-primary]">
                {s.k}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────── 09 · Built with ────────────────────────────────────
  {
    marker: "08 · BUILT",
    render: () => (
      <div className="space-y-10">
        <p className="section-marker fade-up">[ 08 ] · How it was built</p>
        <h2 className="text-headline-lg text-white fade-up fade-up-1">
          One developer.{" "}
          <span className="text-[--color-primary]">5 days.</span>
          <br />4 packages. 30+ tests. Zero shortcuts.
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 fade-up fade-up-2">
          {[
            {
              icon: "edit",
              title: "Claude Code Opus 4.7",
              body: "Pair-programmer for Solidity, TS, tests, docs. London-school TDD throughout.",
            },
            {
              icon: "memory",
              title: "iExec Nox precompiles",
              body: "TEE-backed `euint256` arithmetic + `Nox.select` branching on encrypted booleans.",
            },
            {
              icon: "rocket_launch",
              title: "Vercel + Arbitrum Sepolia",
              body: "Auto-deploy on push, env-driven contract addresses, zero infra babysitting.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="space-y-3 border border-zinc-800 bg-zinc-950/40 p-5"
            >
              <span className="material-symbols-outlined text-3xl text-[--color-primary]">
                {b.icon}
              </span>
              <div className="font-display text-base font-semibold text-white">
                {b.title}
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{b.body}</p>
            </div>
          ))}
        </div>

        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-600 fade-up fade-up-3">
          → Pugar Huda Mantoro · solo build · April 2026
        </p>
      </div>
    ),
  },

  // ─────────── 10 · Thank you / CTA ───────────────────────────────
  {
    marker: "FIN",
    render: () => (
      <div className="flex flex-col items-center text-center">
        <DiamLogo
          size={96}
          variant="full"
          className="mb-8 text-[--color-primary] fade-up"
        />
        <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-none tracking-tighter text-white fade-up fade-up-1">
          Your trade.
          <br />
          <span className="text-[--color-primary]">Their guess.</span>
          <br />
          Nobody knows.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-3 font-mono text-xs md:grid-cols-3 fade-up fade-up-2">
          {[
            { k: "Demo", v: "private-otc.vercel.app" },
            { k: "Source", v: "github.com/PugarHuda/diam" },
            { k: "BUIDL", v: "dorahacks.io · iexec-vibe-coding" },
          ].map((c) => (
            <div
              key={c.k}
              className="border border-[--color-primary]/30 bg-[--color-primary]/5 px-4 py-3"
            >
              <div className="text-label-caps text-[--color-primary]">{c.k}</div>
              <div className="mt-1 tracking-widest text-zinc-300">{c.v}</div>
            </div>
          ))}
        </div>

        <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600 fade-up fade-up-3">
          Thank you · iExec · ChainGPT · Claude Code
        </p>
      </div>
    ),
  },
];
