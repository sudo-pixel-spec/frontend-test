"use client";

import React from "react";
import { cn } from "@/lib/motion";

export default function PrimaryButton(props: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}) {
  const { children, type = "button", disabled, loading } = props;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "relative w-full h-12 rounded-xl font-semibold text-sm overflow-hidden",
        "bg-orange-500 hover:bg-orange-500/95 active:scale-[0.99]",
        "shadow-[0_12px_28px_rgba(249,115,22,0.35)]",
        "transition disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-orange-400/40"
      )}
    >
      {loading ? (
        <span className="absolute inset-0 animate-[shimmer_1.1s_linear_infinite] bg-[linear-gradient(110deg,rgba(255,255,255,0.0),rgba(255,255,255,0.22),rgba(255,255,255,0.0))] [background-size:200%_100%]" />
      ) : null}

      <span className={cn("relative z-10", loading ? "opacity-90" : "")}>
        {loading ? "Please wait..." : children}
      </span>
    </button>
  );
}