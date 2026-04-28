/**
 * Reusable shimmer loader. Use width/height props or Tailwind classes for layout.
 * Stylistic: matches matrix theme — green-tinted shimmer over zinc surface.
 */
export function Skeleton({
  className = "",
  variant = "block",
}: {
  className?: string;
  variant?: "block" | "text" | "circle";
}) {
  const base =
    "relative overflow-hidden bg-zinc-900/60 border border-zinc-800/50";
  const shape =
    variant === "circle"
      ? "rounded-full"
      : variant === "text"
        ? "h-3"
        : "";

  return (
    <div className={`${base} ${shape} ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,255,65,0.08) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/50">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7" variant="circle" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-7 w-7" variant="circle" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-32" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-16 ml-auto" />
      </td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card space-y-4 p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
