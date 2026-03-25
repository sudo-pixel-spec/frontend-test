"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import { useAuthStore, type User } from "@/lib/auth.store";

type MeResponse = {
  ok?: boolean;
  data?: User;
};

export function useMe() {
  const [user, setUser] = useState<User | null>(useAuthStore.getState().user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useAuthStore((s) => s.updateUser);
  const clear = useAuthStore((s) => s.clear);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<MeResponse>(endpoints.user.me, {
        method: "GET",
      });

      const payload = res?.data ?? null;

      setUser(payload);
      if (payload) updateUser(payload);
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to load profile.";

      setError(message);

      if (
        message === "Not authenticated" ||
        err?.status === 401 ||
        err?.response?.status === 401
      ) {
        clear();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { user, loading, error, reload: load };
}