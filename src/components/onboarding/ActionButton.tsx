"use client";

import React from "react";

export default function ActionButton({
  children,
  loading,
  disabled,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "ghost";
}) {
  const base =
    "w-full rounded-xl px-4 py-3 font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-white/90 text-black hover:bg-white"
      : "border border-white/10 bg-black/20 text-white hover:bg-white/5";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${styles} ${props.className ?? ""}`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        ) : null}
        {children}
      </span>
    </button>
  );
}