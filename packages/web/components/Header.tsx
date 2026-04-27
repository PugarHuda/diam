"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV: { href: Route; label: string }[] = [
  { href: "/intents", label: "Trade" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/faucet", label: "Faucet" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-6 backdrop-blur-xl shadow-[0_0_15px_rgba(0,255,65,0.05)]">
      <Link href={"/" as Route} className="flex items-center gap-2">
        <span className="font-display text-xl font-bold tracking-tighter text-[--color-primary]">
          DIAM
        </span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {NAV.map(({ href, label }) => {
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
              className={`text-label-caps transition-colors ${
                active
                  ? "border-b border-[--color-primary] pb-1 text-[--color-primary]"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="[&_button]:!bg-[--color-primary] [&_button]:!text-[--color-primary-fg] [&_button]:!font-display [&_button]:!font-bold [&_button]:!tracking-widest [&_button]:!text-xs [&_button]:!uppercase">
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </nav>
  );
}
