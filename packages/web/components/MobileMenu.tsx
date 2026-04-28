"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

const NAV: { href: Route; label: string; icon: string }[] = [
  { href: "/intents", label: "Active Intents", icon: "grid_view" },
  { href: "/create", label: "Create Intent", icon: "add_circle" },
  { href: "/portfolio", label: "Portfolio", icon: "account_balance_wallet" },
  { href: "/faucet", label: "Faucet", icon: "water_drop" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center border border-zinc-800 bg-zinc-900/50 text-zinc-300 transition-colors hover:border-[--color-primary] hover:text-[--color-primary] md:hidden"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-base">
          {open ? "close" : "menu"}
        </span>
      </button>

      {open && (
        <div className="slide-down fixed inset-x-0 top-16 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 p-4">
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
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-label-caps transition-all ${
                    active
                      ? "border-l-2 border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]"
                      : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {icon}
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
