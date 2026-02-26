"use client";

import React from "react";

export default function SocialButton(props: {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { label, icon, onClick, disabled } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-11 flex-1 rounded-xl bg-white/5 border border-white/10",
        "hover:bg-white/7 transition flex items-center justify-center gap-2",
        "text-sm text-white/80 disabled:opacity-50",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}