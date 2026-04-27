import Link from "next/link";
import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="space-y-8 text-center">
          <p className="text-sm font-mono text-[--color-muted] uppercase tracking-widest">
            Built on iExec Nox · Arbitrum Sepolia
          </p>
          <h1 className="text-balance text-5xl font-bold leading-tight md:text-7xl">
            Your trade. Their guess.
            <br />
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
              Nobody knows.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-lg text-[--color-muted]">
            On-chain OTC desk with hidden amounts and Vickrey-fair price
            discovery. Trade institutional-size without leaking intent to MEV
            bots, competitors, or public order books.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Link
              href="/intents"
              className="rounded-md bg-[--color-accent] px-6 py-3 font-medium text-[--color-accent-fg] transition hover:bg-[--color-accent-hover]"
            >
              Browse intents
            </Link>
            <Link
              href="/create"
              className="rounded-md border border-[--color-border] px-6 py-3 font-medium transition hover:border-[--color-accent]"
            >
              Create intent →
            </Link>
          </div>
        </section>

        <section className="mt-32 grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Hidden amounts"
            body="Sell size and bid prices encrypted on-chain via Nox confidential computing. Public sees the trade — not the numbers."
          />
          <FeatureCard
            title="Vickrey-fair RFQ"
            body="Multiple takers submit sealed bids. Highest wins, pays second-highest. Mathematically optimal pricing."
          />
          <FeatureCard
            title="AI-native"
            body="Compound Engineering agents and MCP plugins let Claude, Cursor, and ChainGPT trade on your behalf — privately."
          />
        </section>
      </main>
    </>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[--color-muted]">{body}</p>
    </div>
  );
}
