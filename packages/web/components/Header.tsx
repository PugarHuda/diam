"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NetworkBadge } from "./NetworkBadge";
import { MobileMenu } from "./MobileMenu";
import { DiamLogo } from "./DiamLogo";

const NAV: { href: Route; label: string; icon: string }[] = [
  { href: "/intents", label: "Trade", icon: "swap_horiz" },
  { href: "/portfolio", label: "Portfolio", icon: "account_balance_wallet" },
  { href: "/faucet", label: "Faucet", icon: "water_drop" },
];

export function Header() {
  const pathname = usePathname();

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

      <div className="hidden items-center gap-6 md:flex">
        {NAV.map(({ href, label, icon }) => {
          const active =
            href === "/intents"
              ? pathname.startsWith("/intents") ||
                pathname.startsWith("/create") ||
                pathname.startsWith("/rfq")
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-label-caps flex items-center gap-1.5 transition-colors ${
                active
                  ? "border-b border-[--color-primary] pb-1 text-[--color-primary]"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </div>

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
