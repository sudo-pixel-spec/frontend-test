"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth.store";

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="glass-card p-6 flex items-start gap-4"
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-white/50 font-medium">{label}</p>
        <p className="text-2xl font-black mt-0.5" style={{ color }}>{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-4 w-1/3 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="h-8 w-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<any>(endpoints.dashboard.home),
    retry: 2,
    staleTime: 60_000
  });

  const xp = data?.xp ?? user?.totalXP ?? 0;
  const level = data?.level ?? user?.level ?? 1;
  const streak = data?.streak ?? user?.streakCount ?? 0;
  const coins = data?.coins ?? user?.wallet?.coins ?? 0;
  const diamonds = data?.diamonds ?? user?.wallet?.diamonds ?? 0;
  const lessonsCompleted = data?.lessonsCompleted ?? 0;
  const weeklyXP = data?.weeklyXP ?? 0;
  const rank = data?.rank ?? "--";

  const xpToNext = level * 500;
  const xpProgress = Math.min(100, ((xp % xpToNext) / xpToNext) * 100);

  return (
    <div className="max-w-6xl mx-auto animate-fadeUp">
      <div className="mb-8">
        <p className="text-sm text-white/40 font-medium">Welcome back 👋</p>
        <h1 className="text-3xl font-black text-white mt-1">
          {user?.profile?.fullName ?? "Student"}
        </h1>
        <p className="text-white/40 text-sm mt-1">Keep the streak alive — consistency beats talent.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total XP" value={xp.toLocaleString()} icon="⚡" color="#22d3ee" sub={`Level ${level}`} />
            <StatCard label="Streak" value={`${streak} days`} icon="🔥" color="#f97316" />
            <StatCard label="Weekly Rank" value={`#${rank}`} icon="🏆" color="#a855f7" sub={`${weeklyXP} XP this week`} />
            <StatCard label="Lessons Done" value={lessonsCompleted} icon="📘" color="#3b82f6" />
          </>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-white/50">XP Progress — Level {level}</p>
            <p className="text-xl font-black text-cyan-400 mt-0.5">{xp % xpToNext} <span className="text-sm text-white/30 font-normal">/ {xpToNext} XP</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/30">Next level</p>
            <p className="text-lg font-bold text-purple-400">Lv {level + 1}</p>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)" }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white/50 mb-4">Wallet</h2>
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-black text-yellow-400">🪙 {coins.toLocaleString()}</p>
              <p className="text-xs text-white/30 mt-1">Coins</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400">💎 {diamonds}</p>
              <p className="text-xs text-white/30 mt-1">Diamonds</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white/50 mb-4">Daily Target</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array(2).fill(0).map((_, i) => <div key={i} className="h-4 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.missions ?? [{ title: "Complete a lesson", done: false }, { title: "Score 80%+ on a quiz", done: false }]).slice(0, 3).map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
                    ${m.done ? "border-cyan-400 bg-cyan-400/20" : "border-white/20"}`}>
                    {m.done ? "✓" : ""}
                  </div>
                  <p className={`text-sm ${m.done ? "text-white/30 line-through" : "text-white/70"}`}>{m.title}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
