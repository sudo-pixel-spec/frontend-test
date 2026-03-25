"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

export type ProfileData = {
  id: string;
  email: string;
  role: "admin" | "learner";
  profileComplete: boolean;

  profile: {
    fullName?: string;
    avatarUrl?: string;
    standard?: string;
    timezone?: string;
  };

  totalXP: number;
  level: number;
  streakCount: number;

  wallet: {
    coins: number;
    diamonds: number;
  };
};

export function useProfile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      const res = await apiFetch<ProfileData>(endpoints.user.me);

      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { data, loading, error, reload: load };
}