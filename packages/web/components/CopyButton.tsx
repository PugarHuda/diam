"use client";

import { useState } from "react";

/**
 * Inline copy-to-clipboard button. Shows checkmark for 1.5s on success.
 * Used for addresses, tx hashes, handles — anything user might want
 * to paste into Etherscan or another tool.
 */
export function CopyButton({
  value,
  label,
  size = "sm",
}: {
  value: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied — fallback noop
    }
  }

  const iconSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label ?? value.slice(0, 14)}…`}
      className={`inline-flex items-center gap-1 text-zinc-500 transition-colors hover:text-[--color-primary] ${
        copied ? "text-[--color-primary]" : ""
      }`}
    >
      <span className={`material-symbols-outlined ${iconSize}`}>
        {copied ? "check_circle" : "content_copy"}
      </span>
      {label && (
        <span className="font-mono text-[10px]">
          {copied ? "COPIED" : label}
        </span>
      )}
    </button>
  );
}
