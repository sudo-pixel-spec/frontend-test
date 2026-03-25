"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth.store";
import { useState } from "react";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StreakHeatmap({ data }: { data: { date: string; xp: number }[] }) {
  const max = Math.max(...data.map(d => d.xp), 1);
  return (
    <div className="flex gap-1.5 items-end mt-3">
      {data.slice(-28).map((d, i) => {
        const pct = d.xp / max;
        return (
          <motion.div key={i}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.02, duration: 0.4 }}
            className="flex-1 rounded-sm min-h-1"
            style={{
              height: `${Math.max(4, pct * 48)}px`,
              background: pct > 0.7 ? "#22d3ee" : pct > 0.3 ? "#a855f7" : pct > 0 ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)",
              transformOrigin: "bottom"
            }}
            title={`${d.date}: ${d.xp} XP`}
          />
        );
      })}
    </div>
  );
}

function SubjectBar({ subject, score, color }: { subject: string; score: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{subject}</span>
        <span className="font-semibold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }}
        />
      </div>
    </div>
  );
}

const TABS = ["Overview", "Streak", "Strengths"];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("Overview");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => apiFetch<any>("/analytics"),
    staleTime: 60_000,
    retry: 1
  });

  const xpHistory = data?.xpHistory ?? [];
  const subjects = data?.subjectStrengths ?? [];

  const COLORS = ["#22d3ee", "#a855f7", "#f97316", "#3b82f6"];

  const streak = user?.streakCount ?? 0;
  const totalXP = user?.totalXP ?? 0;
  const lessonsCompleted = data?.lessonsCompleted ?? 0;
  const avgScore = data?.avgScore ?? 0;

  return (
    <div className="max-w-3xl mx-auto animate-fadeUp">
      <h1 className="text-3xl font-black text-white mb-6">📊 Analytics</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
              color: tab === t ? "#22d3ee" : "rgba(255,255,255,0.4)",
              border: `1px solid ${tab === t ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.07)"}`
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: "⚡", color: "#22d3ee" },
              { label: "Lessons Completed", value: lessonsCompleted, icon: "📘", color: "#3b82f6" },
              { label: "Best Streak", value: `${streak} days`, icon: "🔥", color: "#f97316" },
              { label: "Avg Quiz Score", value: `${avgScore}%`, icon: "🎯", color: "#a855f7" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass-card p-5">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white/50 mb-1">XP Earned — Last 28 Days</h2>
            <StreakHeatmap data={xpHistory} />
            <div className="flex justify-between text-xs text-white/20 mt-2">
              <span>28 days ago</span><span>Today</span>
            </div>
          </motion.div>
        </div>
      )}

      {tab === "Streak" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-3 animate-fire inline-block">🔥</div>
            <p className="text-5xl font-black text-orange-400">{streak}</p>
            <p className="text-white/50 text-lg mt-1">Day Streak</p>
            <p className="text-white/30 text-sm mt-3">Complete at least one lesson every day to maintain your streak!</p>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white/50 mb-3">Activity — 28 Days</h2>
            <StreakHeatmap data={xpHistory} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Current Streak", val: `${streak} days` },
              { label: "Longest Streak", val: `${Math.max(streak, data?.longestStreak ?? 7)} days` },
              { label: "Active Days", val: `${data?.activeDays ?? 0} days` }
            ].map(s => (
              <div key={s.label} className="glass-card p-4 text-center">
                <p className="text-xl font-black text-orange-400">{s.val}</p>
                <p className="text-xs text-white/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === "Strengths" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white/50 mb-4">Subject Strengths (Avg Quiz Score)</h2>
          <div>
            {subjects.map((s: any, i: number) => (
              <SubjectBar key={s.subject} subject={s.subject} score={s.avgScore} color={COLORS[i % COLORS.length]} />
            ))}
          </div>
          {subjects.length === 0 && (
            <div className="text-center py-8 text-white/30">
              <p className="text-4xl mb-2">📊</p>
              <p>Complete some quizzes to see your strengths!</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
