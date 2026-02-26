"use client";
import React from "react";

export default function NebulaOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 opacity-[0.55] bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.10),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.08),transparent_45%),radial-gradient(circle_at_60%_30%,rgba(168,85,247,0.07),transparent_40%)]" />
      <div className="absolute -inset-24 opacity-[0.22] blur-3xl bg-[conic-gradient(from_180deg,rgba(56,189,248,0.10),rgba(249,115,22,0.08),rgba(168,85,247,0.08),rgba(56,189,248,0.10))] animate-[nebulaDrift_18s_ease-in-out_infinite]" />
    </div>
  );
}