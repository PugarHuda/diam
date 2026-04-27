"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[--color-border] bg-[--color-bg]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-sm font-bold text-white">
            D
          </span>
          Diam
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[--color-muted]">
          <Link className="transition hover:text-[--color-foreground]" href="/intents">
            Intents
          </Link>
          <Link className="transition hover:text-[--color-foreground]" href="/create">
            Create
          </Link>
          <Link className="transition hover:text-[--color-foreground]" href="/portfolio">
            Portfolio
          </Link>
          <Link className="transition hover:text-[--color-foreground]" href="/faucet">
            Faucet
          </Link>
        </nav>
        <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
      </div>
    </header>
  );
}
