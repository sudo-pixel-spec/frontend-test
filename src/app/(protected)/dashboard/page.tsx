"use client";

import { useEffect, useRef } from "react";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const mx = (x - 0.5) * 2;
      const my = (y - 0.5) * 2;
      el.style.setProperty("--mx", mx.toFixed(4));
      el.style.setProperty("--my", my.toFixed(4));
    };

    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove as any);
      window.removeEventListener("pointerleave", onLeave as any);
    };
  }, []);

  return (
    <main
      ref={rootRef}
      className={`relative min-h-screen overflow-hidden bg-[#03040a] text-white flex items-center justify-center ${styles.root}`}
    >
      <div className={`absolute inset-0 ${styles.stars} ${styles.parallax1}`} />
      <div className={`absolute inset-0 ${styles.stars2} ${styles.parallax2}`} />
      <div className={`absolute inset-0 ${styles.stars3} ${styles.parallax3}`} />

      <div className="absolute inset-0 pointer-events-none">
        <span className={`${styles.shootingStar} ${styles.s1}`} />
        <span className={`${styles.shootingStar} ${styles.s2}`} />
        <span className={`${styles.shootingStar} ${styles.s3}`} />
      </div>

      <div className={`absolute ${styles.nebulaA}`} />
      <div className={`absolute ${styles.nebulaB}`} />
      <div className={`absolute ${styles.nebulaC}`} />

      <div className={`absolute inset-0 ${styles.noise}`} />

      <div className={`absolute right-[6%] top-[14%] hidden lg:block ${styles.astronautWrap}`}>
        <div className={styles.astronautFloat} aria-hidden="true">
          <svg width="160" height="160" viewBox="0 0 200 200" fill="none">
            <defs>
              <filter id="g" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M30 140 C60 120, 80 110, 110 90 C140 70, 170 65, 190 55"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="2"
              strokeDasharray="6 10"
            />
            <g filter="url(#g)">
              <circle cx="105" cy="80" r="34" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)" />
              <circle cx="105" cy="80" r="22" fill="rgba(0,0,0,0.25)" stroke="rgba(34,211,238,0.35)" />
              <rect x="78" y="112" width="54" height="52" rx="18" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)" />
              <rect x="92" y="124" width="26" height="18" rx="6" fill="rgba(34,211,238,0.18)" stroke="rgba(34,211,238,0.35)" />
              <path d="M78 126 C60 128, 54 140, 52 150" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
              <path d="M132 126 C150 128, 158 140, 164 152" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
              <path d="M92 164 C88 178, 86 186, 84 192" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
              <path d="M118 164 C122 178, 124 186, 126 192" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
              <circle cx="150" cy="55" r="3" fill="rgba(34,211,238,0.95)" />
            </g>
          </svg>
        </div>
        <div className="mt-2 text-xs opacity-60 tracking-wider text-center">
          EVA UNIT • STABILIZING ORBIT
        </div>
      </div>
      <div className="absolute left-[8%] top-[18%] hidden lg:block">
        <div className={styles.droneFloat}>
          <div className="relative w-16 h-16 rounded-full bg-white/10 border border-white/15 backdrop-blur">
            <div className="absolute inset-0 rounded-full ring-1 ring-cyan-400/20" />
            <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.9)]" />
            <div className={`absolute inset-0 rounded-full ${styles.dronePulse}`} />
          </div>
          <p className="mt-3 text-xs opacity-60 tracking-wider text-center">
            REPAIR DRONE • CALIBRATING
          </p>
        </div>
      </div>

      <section className={`relative z-10 w-[min(1100px,92vw)] ${styles.parallaxHud}`}>
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className={`${styles.holoRing} ${styles.r1}`} />
          <div className={`${styles.holoRing} ${styles.r2}`} />
          <div className={`${styles.holoRing} ${styles.r3}`} />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
          <div className={`absolute inset-0 ${styles.scanline}`} />
          <div className="absolute -top-20 left-0 right-0 h-40 bg-gradient-to-b from-cyan-400/20 via-purple-500/10 to-transparent blur-2xl" />
          <div className={`absolute inset-x-0 top-0 ${styles.topEdgeGlow}`} />

          <div className={`px-6 md:px-10 py-3 border-b border-white/10 ${styles.telemetry}`}>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] tracking-widest uppercase text-white/60">
              <span>
                UPLINK: <span className="text-green-300">STABLE</span>
              </span>
              <span>
                AUTH: <span className="text-green-300">VALID</span>
              </span>
              <span>
                UI REBUILD: <span className="text-yellow-300">IN PROGRESS</span>
              </span>
              <span className={styles.telemetryMarquee}>
                ⟡ Installing modules • Aligning nav grid • Deploying HUD widgets •
                Calibrating XP counters •
              </span>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]" />
                  Mission Control Online
                </div>

                <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">
                  🛰️ Space Station Dashboard
                  <span className="block mt-2 text-white/70 text-2xl md:text-3xl font-semibold">
                    Under Repair • Work In Progress
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-white/75 leading-relaxed">
                  You’re logged in, tokens are persistent, and the station is alive.
                  We’re just awaiting Frontend Devs to complete Development.
                </p>

                <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5 font-mono text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3 text-xs text-white/55 mb-3">
                    <span>CONSOLE</span>
                    <span className="opacity-70">v0.3 — level-3 patch</span>
                  </div>
                  <div className="leading-relaxed">
                    <div>
                      <span className="text-cyan-300">[OK]</span> Session persistence verified ✅
                    </div>
                    <div>
                      <span className="text-yellow-300">[WIP]</span> Entire Frontend
                    </div>
                    <div>
                      <span className="text-purple-300">[TASK]</span> Complete Backend Integration to Frontend
                      <span className={styles.cursor}>▍</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 ${styles.widget}`}>
                    <div className="text-xs tracking-widest uppercase text-white/55">XP Core</div>
                    <div className="mt-3 text-3xl font-bold">
                      1,240 <span className="text-white/60 text-base font-semibold">XP</span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full w-[72%] ${styles.barGlow}`} />
                    </div>
                    <div className="mt-3 text-xs text-white/55">Level 8 • 72% to Level 9</div>
                  </div>

                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 ${styles.widget}`}>
                    <div className="text-xs tracking-widest uppercase text-white/55">Streak Drive</div>
                    <div className="mt-3 text-3xl font-bold">
                      5 <span className="text-white/60 text-base font-semibold">days</span>
                    </div>
                    <div className="mt-3 text-xs text-white/55">
                      Keep orbit stable — complete 1 lesson today.
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className={`${styles.dot} ${styles.delay200}`} />
                      <span className={`${styles.dot} ${styles.delay400}`} />
                      <span className={styles.dot} />
                      <span className="text-xs text-white/55 ml-2">charging…</span>
                    </div>
                  </div>

                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:col-span-2 lg:col-span-1 ${styles.widget}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs tracking-widest uppercase text-white/55">Next Mission</div>
                        <div className="mt-2 text-lg font-semibold">Complete Frontend: Awaiting Frontend”</div>
                        <div className="mt-2 text-sm text-white/60">
                          Reward: <span className="text-cyan-300">+120 XP</span> • Bonus streak stability
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border border-white/10 bg-black/25 ${styles.pill}`}>
                        Std 8 • Active
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                      <div className={`rounded-xl border border-white/10 bg-black/20 p-3 ${styles.micro}`}>
                        <div className="text-xs text-white/55">Lessons</div>
                        <div className="mt-1 text-lg font-bold">1</div>
                      </div>
                      <div className={`rounded-xl border border-white/10 bg-black/20 p-3 ${styles.micro}`}>
                        <div className="text-xs text-white/55">Quizzes</div>
                        <div className="mt-1 text-lg font-bold">4</div>
                      </div>
                      <div className={`rounded-xl border border-white/10 bg-black/20 p-3 ${styles.micro}`}>
                        <div className="text-xs text-white/55">Rank</div>
                        <div className="mt-1 text-lg font-bold">#11</div>
                      </div>
                    </div>

                    <div className="mt-5 text-xs text-white/50">
                      All backend systems operational. Developer got bored waiting.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        </div>
      </section>
    </main>
  );
}