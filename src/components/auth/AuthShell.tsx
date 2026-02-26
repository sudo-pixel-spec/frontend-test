import React from "react";
import Image from "next/image";
import StarfieldBackground from "../fx/StarfieldBackground";
import NebulaOverlay from "../fx/NebulaOverlay";
import CursorGlow from "../fx/CursorGlow";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white overflow-hidden">
      <StarfieldBackground />
``
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.08),transparent_45%),radial-gradient(circle_at_75%_75%,rgba(249,115,22,0.07),transparent_45%)]" />

      <div className="w-full flex flex-col items-center gap-6 py-16">
        <div className="flex flex-col items-center gap-3 select-none animate-[fadeDown_650ms_ease-out]">
          <div className="group relative">
            <div className="pointer-events-none absolute -inset-[10px] rounded-[26px] bg-[conic-gradient(from_180deg,rgba(56,189,248,0.45),rgba(249,115,22,0.45),rgba(56,189,248,0.45))] blur-xl opacity-45 animate-[spinSlow_10s_linear_infinite]" />

            <div className="pointer-events-none absolute -inset-[2px] rounded-2xl bg-white/10 opacity-40" />

            <div className="relative h-16 w-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.55)] flex items-center justify-center overflow-hidden animate-[logoFloat_6s_ease-in-out_infinite] transition group-hover:scale-[1.03]">
              <Image
                src="/logo.png"
                alt="Gamified Learn"
                width={44}
                height={44}
                priority
                className="object-contain select-none pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)]"
              />

              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.10),transparent)] [background-size:200%_100%] animate-[shimmer_1.2s_linear_infinite]" />
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight animate-[fadeUp_700ms_ease-out]">
            Gamified
          </h1>
          <p className="text-sm text-white/60 -mt-1 animate-[fadeUp_850ms_ease-out]">
            Launch your learning journey today
          </p>
        </div>

        <div className="animate-[fadeUp_650ms_ease-out]">{children}</div>
      </div>
    </div>
  );
}