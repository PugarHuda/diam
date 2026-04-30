"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { SLIDES } from "./slides";
import { SlideShell } from "./SlideShell";

/**
 * Deck controller. Owns the active slide index and wires up keyboard +
 * click + URL navigation. The `?slide=N` param keeps the current slide
 * in the URL so reload / share-link behavior is sane.
 *
 * Keys:
 *   →  Space  PageDown  →  next
 *   ←  PageUp           →  prev
 *   Home / End          →  first / last
 *   1-9                 →  jump to that slide
 *   F                   →  toggle fullscreen
 *   ESC (when not in    →  back to "/"
 *   fullscreen)
 */
export function SlideShow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = clampSlide(Number(searchParams.get("slide")) || 1);
  const [index, setIndex] = useState(initial - 1);

  const total = SLIDES.length;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setIndex(clamped);
      const params = new URLSearchParams(searchParams.toString());
      params.set("slide", String(clamped + 1));
      router.replace(`/slides?${params.toString()}` as Route, { scroll: false });
    },
    [router, searchParams, total],
  );

  // Keyboard handlers
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Allow inputs / contenteditable to receive keystrokes normally.
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          goTo(index + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goTo(index - 1);
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(total - 1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (!document.fullscreenElement) {
            router.push("/");
          }
          break;
        default:
          if (/^[1-9]$/.test(e.key)) {
            const n = Number(e.key) - 1;
            if (n < total) goTo(n);
          }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, total, router]);

  const slide = SLIDES[index];
  if (!slide) return null;

  return (
    <main
      className="relative cursor-pointer select-none"
      onClick={(e) => {
        // Ignore clicks on links, buttons, anchors — they should keep their
        // native behavior. Only advance on bare-area clicks.
        const target = e.target as HTMLElement;
        if (target.closest("a, button, [role='button']")) return;
        goTo(index + 1);
      }}
    >
      <SlideShell index={index} total={total} marker={slide.marker}>
        {slide.render()}
      </SlideShell>
    </main>
  );
}

function clampSlide(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > SLIDES.length) return SLIDES.length;
  return n;
}

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}
