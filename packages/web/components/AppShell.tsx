"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useAccount } from "wagmi";
import { Header } from "./Header";
import { NetworkGuard } from "./NetworkGuard";
import { BalanceWidget } from "./BalanceWidget";
import { shortAddress } from "@/lib/utils";

type NavItem = { href: Route; label: string; icon: string };

const NAV: NavItem[] = [
  { href: "/intents", label: "Active Intents", icon: "grid_view" },
  { href: "/create", label: "Create Intent", icon: "swap_horiz" },
  { href: "/activity" as Route, label: "My Activity", icon: "history" },
  { href: "/portfolio", label: "Portfolio", icon: "account_balance_wallet" },
  { href: "/faucet", label: "Faucet", icon: "water_drop" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  return (
    <>
      <Header />
      <div className="pt-16">
        <NetworkGuard />
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-zinc-800/80 bg-zinc-950/60 pb-8 pt-20 backdrop-blur-2xl lg:flex">
        <div className="mb-8 flex items-center gap-3 px-6">
          <div className="grid h-10 w-10 place-items-center border border-zinc-800 bg-zinc-900">
            <span
              className="material-symbols-outlined text-xl text-[--color-primary]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              security
            </span>
          </div>
          <div>
            <p className="text-label-caps text-[--color-primary]">
              {isConnected && address
                ? `NODE_${address.slice(2, 6).toUpperCase()}`
                : "NODE_OFFLINE"}
            </p>
            <p className="font-mono text-[10px] text-zinc-500">
              {isConnected ? "Verified Agent" : "Connect Wallet"}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4">
          {NAV.map(({ href, label, icon }) => {
            const active =
              href === "/intents"
                ? pathname.startsWith("/intents") ||
                  pathname.startsWith("/rfq")
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 text-label-caps transition-all ${
                  active
                    ? "border-l-2 border-[--color-primary] bg-[--color-primary-soft] text-[--color-primary]"
                    : "border-l-2 border-transparent text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 px-4">
          <Link href={"/create" as Route} className="block">
            <button className="w-full diam-btn-primary">New Intent</button>
          </Link>
          <div className="flex justify-between px-2">
            <a
              href="https://docs.iex.ec/nox-protocol/getting-started/welcome"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-label-caps text-zinc-600 hover:text-[--color-primary]"
            >
              <span className="material-symbols-outlined text-xs">
                description
              </span>
              Docs
            </a>
            <a
              href="https://github.com/PugarHuda/diam"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-label-caps text-zinc-600 hover:text-[--color-primary]"
            >
              <span className="material-symbols-outlined text-xs">code</span>
              Source
            </a>
          </div>
          {isConnected && address && (
            <div className="border-t border-zinc-800 pt-3 font-mono text-[10px] text-zinc-600">
              <span>{shortAddress(address, 6)}</span>
            </div>
          )}
        </div>
      </aside>

      <main className="relative w-full pt-4 pb-16 lg:ml-64 lg:px-8">
        <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-10" />
        <div className="mx-auto max-w-[1200px] px-6 lg:px-0">{children}</div>
      </main>

      <BalanceWidget />
    </>
  );
}
