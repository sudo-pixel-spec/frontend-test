"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth.store";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  weeklyXP: number;
  level: number;
  streak: number;
  isMe?: boolean;
};

const medalColor = (rank: number) => {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return "rgba(255,255,255,0.3)";
};

const medalIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

export default function LeaderboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-weekly"],
    queryFn: () => apiFetch<{ entries: LeaderboardEntry[]; myRank: number; weeklyXP: number; weekEnds: string }>(
      `${endpoints.leaderboard.weekly}?limit=50`
    ),
    staleTime: 5 * 60_000
  });

  const entries = data?.entries ?? [];
  const myRank = data?.myRank;
  const weeklyXP = data?.weeklyXP ?? 0;
  const weekEnds = data?.weekEnds ? new Date(data.weekEnds).toLocaleDateString() : "";

  return (
    <div className="max-w-3xl mx-auto animate-fadeUp">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">🏆 Leaderboard</h1>
        <p className="text-white/40 text-sm mt-1">Weekly rankings · Reset every Sunday{weekEnds ? ` · Week ends ${weekEnds}` : ""}</p>
      </div>

      {myRank && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-5 mb-6 flex items-center justify-between"
          style={{ borderColor: "rgba(168,85,247,0.3)" }}>
          <div>
            <p className="text-xs text-white/40 font-medium">Your rank this week</p>
            <p className="text-3xl font-black text-purple-400 mt-0.5">#{myRank}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Weekly XP</p>
            <p className="text-2xl font-black text-cyan-400">{weeklyXP.toLocaleString()}</p>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          Array(10).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="flex-1">
                <div className="h-4 w-1/3 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-3 w-1/4 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
            </div>
          ))
        ) : (
          entries.map((entry, idx) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
              className="glass-card p-4 flex items-center gap-4 transition-all"
              style={{
                borderColor: entry.isMe ? "rgba(34,211,238,0.3)" : undefined,
                background: entry.isMe ? "rgba(34,211,238,0.05)" : undefined
              }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${medalColor(entry.rank)}22`, color: medalColor(entry.rank) }}>
                {typeof medalIcon(entry.rank) === "string" && entry.rank <= 3 
                  ? <span className="text-xl">{medalIcon(entry.rank)}</span>
                  : <span>{entry.rank}</span>
                }
              </div>

              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#a855f7,#22d3ee)" }}>
                {entry.name?.[0]?.toUpperCase() ?? "?"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{entry.name}</p>
                  {entry.isMe && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee" }}>You</span>}
                </div>
                <p className="text-xs text-white/40">Lv {entry.level} · 🔥 {entry.streak} day streak</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-black text-white">{entry.weeklyXP.toLocaleString()}</p>
                <p className="text-xs text-white/30">XP</p>
              </div>
            </motion.div>
          ))
        )}

        {!isLoading && entries.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-white/60 font-semibold">No entries yet this week</p>
            <p className="text-white/30 text-sm mt-1">Complete lessons to earn XP and climb the ranks!</p>
          </div>
        )}
      </div>
    </div>
  );
}
