import Link from "next/link";
import { Header } from "@/components/Header";

export default function CreatePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Create Intent</h1>
        <p className="mt-2 text-[--color-muted]">
          Pick a mode for your confidential trade.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <ModeCard
            href="/create/direct"
            title="Direct OTC"
            tagline="One maker, one taker"
            description="Best when you have a known counterparty. Atomic bilateral settlement. Specify a min buy price; first qualifying taker fills."
            badge="Simple"
          />
          <ModeCard
            href="/create/rfq"
            title="RFQ Mode"
            tagline="Multiple takers, Vickrey pricing"
            description="Open the trade to N takers. Highest sealed bid wins, pays second-highest price. Best execution for institutional size."
            badge="Best price"
          />
        </div>
      </main>
    </>
  );
}

function ModeCard({
  href,
  title,
  tagline,
  description,
  badge,
}: {
  href: string;
  title: string;
  tagline: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[--color-border] bg-[--color-surface] p-6 transition hover:border-[--color-accent]"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[--color-muted]">{tagline}</p>
        </div>
        <span className="rounded-md bg-[--color-accent]/10 px-2 py-1 text-xs font-medium text-[--color-accent]">
          {badge}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[--color-muted]">
        {description}
      </p>
      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[--color-accent] transition group-hover:gap-2">
        Continue →
      </span>
    </Link>
  );
}
