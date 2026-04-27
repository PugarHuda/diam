import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-zinc-800 bg-zinc-950/40 p-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center border border-zinc-800 bg-zinc-900/40">
        <span
          className="material-symbols-outlined text-zinc-600"
          style={{ fontSize: "2rem" }}
        >
          {icon}
        </span>
      </div>
      <p className="font-mono text-sm text-zinc-400">⟨ {title} ⟩</p>
      {body && (
        <p className="mt-2 font-mono text-[11px] text-zinc-600">{body}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
