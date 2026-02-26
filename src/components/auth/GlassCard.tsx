"use client";

import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/motion";

export default function GlassCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -6;
    const ry = (px - 0.5) * 8;
    el.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `translateY(0px) rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div className="relative w-[520px] max-w-[92vw]">
      <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.18),transparent_45%)] blur-2xl" />

      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn(
          "relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl",
          "shadow-[0_20px_90px_rgba(0,0,0,0.6)]",
          "transition-transform duration-200 will-change-transform",
          "animate-[cardIn_600ms_ease-out]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10 [mask-image:linear-gradient(black,transparent)]" />

        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}