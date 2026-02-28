"use client";

import React from "react";
import StarfieldBackground from "@/components/fx/StarfieldBackground";
import NebulaOverlay from '@/components/fx/NebulaOverlay'

export default function OnboardingShell({
  title,
  subtitle,
  step,
  total,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const progress = Math.round((step / total) * 100);

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <StarfieldBackground />
      <NebulaOverlay />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.72)_60%,rgba(0,0,0,0.92))]" />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-orange-500/10 animate-blob" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full blur-3xl bg-indigo-500/10 animate-blob2" />
        <div className="absolute -bottom-52 left-1/4 h-[620px] w-[620px] rounded-full blur-3xl bg-cyan-500/10 animate-blob3" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs tracking-wide text-white/60">
            Mission Setup • Step {step}/{total}
          </div>
          <div className="text-xs text-white/60">{progress}%</div>
        </div>

        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400/80 via-orange-300/70 to-white/50 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_120px_rgba(0,0,0,0.65)] overflow-hidden animate-fadeUp">
          <div className="p-6">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-white/60">{subtitle}</p> : null}

            <div className="mt-6">{children}</div>
          </div>

          {footer ? (
            <div className="border-t border-white/10 bg-white/[0.02] p-4">{footer}</div>
          ) : null}
        </div>

        <div className="mt-5 text-center text-xs text-white/45">
          Tip: Your profile powers XP, streaks, and personalized lessons.
        </div>
      </div>
    </main>
  );
}