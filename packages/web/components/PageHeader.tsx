import type { ReactNode } from "react";

export function PageHeader({
  icon,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center border border-[--color-primary]/40 bg-[--color-primary]/10">
          <span className="material-symbols-outlined text-[--color-primary]">
            {icon}
          </span>
        </div>
        <div>
          <h1 className="text-headline-xl text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 font-mono text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>
      {(badge || action) && (
        <div className="flex items-center gap-3">
          {badge}
          {action}
        </div>
      )}
    </header>
  );
}

export function SectionHeader({
  icon,
  title,
  right,
}: {
  icon?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h3 className="text-label-caps flex items-center gap-2 text-zinc-400">
        {icon ? (
          <span className="material-symbols-outlined text-base text-[--color-primary]">
            {icon}
          </span>
        ) : (
          <span className="h-1.5 w-1.5 bg-[--color-primary]" />
        )}
        {title}
      </h3>
      {right}
    </div>
  );
}
