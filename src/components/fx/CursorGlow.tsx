"use client";
import React, { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--x", `${e.clientX}px`);
      el.style.setProperty("--y", `${e.clientY}px`);
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 opacity-70"
      style={{
        background:
          "radial-gradient(220px circle at var(--x) var(--y), rgba(56,189,248,0.12), transparent 55%)",
      }}
    />
  );
}