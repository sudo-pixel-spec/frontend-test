"use client";

import React, { useId, useMemo, useState } from "react";
import { cn } from "@/lib/motion";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput(props: {
  label: string;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  error?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  allowReveal?: boolean;
}) {
  const {
    label,
    placeholder,
    type = "text",
    icon,
    right,
    error,
    inputProps,
    allowReveal,
  } = props;

  const id = useId();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  const actualType =
    allowReveal && (type === "password" || type === "text")
      ? (reveal ? "text" : type)
      : type;

  const shake = error ? "animate-[shake_250ms_ease-in-out]" : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className={cn(
            "text-xs transition",
            focused ? "text-white/80" : "text-white/65"
          )}
        >
          {label}
        </label>
        {right}
      </div>

      <div className={cn("relative", shake)}>
        <div
          className={cn(
            "pointer-events-none absolute -inset-1 rounded-2xl blur-xl transition-opacity duration-200",
            focused ? "opacity-100" : "opacity-0",
            "bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.18),transparent_60%)]"
          )}
        />

        <div
          className={cn(
            "relative flex items-center h-11 rounded-xl border bg-white/5 transition",
            focused ? "border-white/25 bg-white/7" : "border-white/10",
            error ? "border-red-300/40" : ""
          )}
        >
          {icon ? (
            <div className="pl-3 text-white/40">{icon}</div>
          ) : (
            <div className="pl-3" />
          )}

          <input
            id={id}
            type={actualType}
            placeholder={placeholder}
            className={cn(
              "w-full h-full bg-transparent px-3 text-sm text-white placeholder:text-white/35 outline-none"
            )}
            {...inputProps}
            onFocus={(e) => {
              setFocused(true);
              inputProps?.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              inputProps?.onBlur?.(e);
            }}
          />

          {allowReveal && type === "password" ? (
            <button
              type="button"
              onClick={() => setReveal((s) => !s)}
              className="mr-2 grid place-items-center h-9 w-9 rounded-lg hover:bg-white/5 transition text-white/55 hover:text-white/80"
              aria-label={reveal ? "Hide" : "Show"}
            >
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-xs text-red-300/90">{error}</p> : null}
    </div>
  );
}