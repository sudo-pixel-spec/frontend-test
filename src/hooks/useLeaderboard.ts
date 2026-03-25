"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  lvl: number;
  bio?: string;
  isMe?: boolean;
};

export function useLeaderboard(type: "weekly" | "monthly" | "root" = "weekly") {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const url = type === "root" ? endpoints.leaderboard.root : endpoints.leaderboard[type];
      const res = await apiFetch<LeaderboardEntry[]>(url);
      setData(res || []);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type]);

  return { data, loading, error, reload: load };
}
