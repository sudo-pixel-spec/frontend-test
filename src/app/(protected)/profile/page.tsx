"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth.store";

const ALL_BADGES = [
  { id: "first-lesson",  label: "First Step",    icon: "🎯", desc: "Complete your first lesson",       check: (d: any) => (d?.lessonsCompleted ?? 0) >= 1 },
  { id: "streak-3",      label: "3-Day Streak",  icon: "🔥", desc: "Maintain a 3-day streak",          check: (d: any) => (d?.streakCount ?? 0) >= 3 },
  { id: "streak-7",      label: "Week Warrior",  icon: "⚔️",  desc: "Maintain a 7-day streak",          check: (d: any) => (d?.streakCount ?? 0) >= 7 },
  { id: "streak-30",     label: "Iron Will",     icon: "🛡️",  desc: "Maintain a 30-day streak",         check: (d: any) => (d?.streakCount ?? 0) >= 30 },
  { id: "level-5",       label: "Rising Star",   icon: "⭐",  desc: "Reach Level 5",                    check: (d: any) => (d?.level ?? 1) >= 5 },
  { id: "level-10",      label: "Expert",        icon: "💡", desc: "Reach Level 10",                   check: (d: any) => (d?.level ?? 1) >= 10 },
  { id: "lessons-10",    label: "Scholar",       icon: "📚", desc: "Complete 10 lessons",              check: (d: any) => (d?.lessonsCompleted ?? 0) >= 10 },
  { id: "lessons-50",    label: "Knowledge Master", icon: "🎓",desc: "Complete 50 lessons",            check: (d: any) => (d?.lessonsCompleted ?? 0) >= 50 },
  { id: "xp-1000",       label: "XP Chaser",     icon: "⚡", desc: "Earn 1,000 XP",                   check: (d: any) => (d?.totalXP ?? 0) >= 1000 },
  { id: "xp-5000",       label: "XP Legend",     icon: "🌟", desc: "Earn 5,000 XP",                   check: (d: any) => (d?.totalXP ?? 0) >= 5000 },
  { id: "coins-100",     label: "Coin Collector", icon: "🪙", desc: "Earn 100 coins",                  check: (d: any) => (d?.wallet?.coins ?? 0) >= 100 },
  { id: "top-10",        label: "Top 10",        icon: "🏆", desc: "Reach top 10 on leaderboard",     check: (_: any) => false }, // requires leaderboard rank check
];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>(endpoints.user.me),
    staleTime: 30_000
  });

  const profile = me?.profile ?? user?.profile;
  const xp       = me?.totalXP  ?? user?.totalXP  ?? 0;
  const level    = me?.level     ?? user?.level    ?? 1;
  const streak   = me?.streakCount ?? user?.streakCount ?? 0;
  const coins    = me?.wallet?.coins    ?? user?.wallet?.coins    ?? 0;
  const diamonds = me?.wallet?.diamonds ?? user?.wallet?.diamonds ?? 0;
  const phone    = me?.phone;
  const xpToNext = level * 500;
  const xpPct    = Math.min(100, ((xp % xpToNext) / xpToNext) * 100);

  const badges = ALL_BADGES.map(b => ({ ...b, earned: b.check(me ?? user) }));
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="max-w-3xl mx-auto animate-fadeUp">
      <h1 className="text-3xl font-black text-white mb-8">👤 Profile</h1>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black flex-shrink-0"
             style={{ background: "linear-gradient(135deg,#a855f7,#22d3ee)", boxShadow: "0 0 32px rgba(168,85,247,0.4)" }}>
          {profile?.fullName?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white">{profile?.fullName ?? "Student"}</h2>
          {phone && <p className="text-white/40 text-sm mt-0.5">{phone}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee" }}>
              Level {level}
            </span>
            <span className="text-sm text-white/40">🔥 {streak} day streak</span>
            <span className="text-sm text-white/40">⚡ {xp.toLocaleString()} XP</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0 space-y-1.5">
          <div><p className="text-lg font-black text-yellow-400">🪙 {coins}</p><p className="text-xs text-white/30">Coins</p></div>
          <div><p className="text-lg font-black text-blue-400">💎 {diamonds}</p><p className="text-xs text-white/30">Diamonds</p></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/50">Level {level} Progress</span>
          <span className="text-cyan-400 font-semibold">{xp % xpToNext} / {xpToNext} XP</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)" }} />
        </div>
        <p className="text-xs text-white/30 mt-2">{xpToNext - (xp % xpToNext)} XP to Level {level + 1}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-6 mb-6">
        <h2 className="text-sm font-semibold text-white/50 mb-4">Student Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "School",    value: profile?.school   ?? "Not set" },
            { label: "Standard",  value: profile?.standard ? profile.standard.replace("CBSE_", "").replace("_", " ") : "Not set" },
            { label: "Timezone",  value: profile?.timezone ?? "Not set" },
            { label: "Lessons Done", value: me?.lessonsCompleted ?? 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-white/30">{label}</p>
              <p className="text-sm font-semibold text-white/80 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-white/50">Achievements & Badges</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
            {earnedCount}/{badges.length} unlocked
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((badge) => (
              <motion.div key={badge.id}
                whileHover={badge.earned ? { scale: 1.04 } : {}}
                className="flex flex-col items-center text-center p-3 rounded-2xl transition-all"
                style={{
                  background: badge.earned ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)",
                  border:     `1px solid ${badge.earned ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.06)"}`,
                  opacity:    badge.earned ? 1 : 0.4
                }}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <p className="text-xs font-bold text-white">{badge.label}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{badge.desc}</p>
                {badge.earned && (
                  <span className="mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>
                    EARNED
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
