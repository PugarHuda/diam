"use client";

import { useState, type ReactNode } from "react";

/**
 * Minimal tooltip — appears on hover/focus, keyboard-accessible.
 * No portal (fits within parent z-stack). For dense terminal UI.
 */
export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 border border-[--color-primary]/40 bg-zinc-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-300 shadow-[0_0_15px_rgba(0,255,65,0.1)] ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

/**
 * Help icon with tooltip. Use anywhere a term needs explanation.
 */
export function HelpHint({ content }: { content: string }) {
  return (
    <Tooltip content={content}>
      <span className="material-symbols-outlined text-sm text-zinc-600 transition-colors hover:text-[--color-primary]">
        help
      </span>
    </Tooltip>
  );
}
