"use client";

import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "default" | "danger" | "ghost";
  className?: string;
}) {
  const cls =
    variant === "danger"
      ? "border-red-400/30 hover:bg-red-500/10"
      : variant === "ghost"
      ? "border-white/10 hover:bg-white/5"
      : "border-white/20 hover:bg-white/10";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-lg border ${cls} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}