"use client";

import { DiamLogo } from "@/components/DiamLogo";

type Props = {
  index: number;
  total: number;
  marker?: string;
  children: React.ReactNode;
  /** Background variant. Default = grid + scanline. */
  bg?: "default" | "plain";
};

/**
 * Shared chrome for every slide: progress bar, slide counter, brand mark,
 * and a `[ ## / ## · MARKER ]` ribbon at the top-right.
 *
 * Slide content lives in `children` and is centered in a 16:9-ish viewport.
 * Each slide author only writes the actual content; layout + nav lives here.
 */
export function SlideShell({
  index,
  total,
  marker,
  children,
  bg = "default",
}: Props) {
  const progress = ((index + 1) / total) * 100;

  return (
    <section
      className="relative grid h-screen w-screen place-items-center overflow-hidden bg-[--color-bg] px-8 py-16 md:px-16"
      data-slide={index}
    >
      {bg === "default" && (
        <>
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
          <div className="scanline pointer-events-none absolute inset-0 opacity-30" />
        </>
      )}

      <div className="pointer-events-none absolute left-0 top-0 z-30 h-[2px] w-full bg-zinc-900">
        <div
          className="h-full bg-[--color-primary] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute left-8 top-6 z-20 flex items-center gap-2.5 md:left-12">
        <DiamLogo size={20} className="text-[--color-primary]" />
        <span className="font-display text-sm font-bold tracking-tighter text-[--color-primary]">
          DIAM
        </span>
      </div>

      <div className="absolute right-8 top-6 z-20 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-zinc-500 md:right-12">
        <span data-numeric>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        {marker && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-[--color-primary]/70">{marker}</span>
          </>
        )}
      </div>

      <div className="z-10 mx-auto w-full max-w-[1100px]">{children}</div>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-4 font-mono text-[10px] tracking-[0.25em] text-zinc-700">
        <span>← PREV</span>
        <span className="text-zinc-800">·</span>
        <span>SPACE / → NEXT</span>
        <span className="text-zinc-800">·</span>
        <span>F FULLSCREEN</span>
        <span className="text-zinc-800">·</span>
        <span>ESC EXIT</span>
      </div>
    </section>
  );
}
