"use client";

import Link from "next/link";
import type { Route } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NetworkBadge } from "./NetworkBadge";
import { MobileMenu } from "./MobileMenu";
import { DiamLogo } from "./DiamLogo";

// Top bar = brand + wallet + network only. Page navigation lives in the
// left sidebar (AppShell) on desktop and MobileMenu on small screens —
// duplicating them here would just make the chrome noisier.
export function Header() {
  return (
    <nav className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-6 backdrop-blur-xl shadow-[0_0_15px_rgba(0,255,65,0.05)]">
      <Link
        href={"/" as Route}
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <DiamLogo size={26} className="text-[--color-primary]" />
        <span className="font-display text-xl font-bold tracking-tighter text-[--color-primary]">
          DIAM
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <NetworkBadge />
        <div className="[&_button]:!bg-[--color-primary] [&_button]:!text-[--color-primary-fg] [&_button]:!font-display [&_button]:!font-bold [&_button]:!tracking-widest [&_button]:!text-xs [&_button]:!uppercase">
          <ConnectButton
            accountStatus="address"
            chainStatus="icon"
            showBalance={false}
          />
        </div>
        <MobileMenu />
      </div>
    </nav>
  );
}
