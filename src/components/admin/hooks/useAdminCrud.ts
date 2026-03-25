"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { normalizeArray, unwrap } from "@/components/admin/lib/normalize";

type Paging = { page?: number; limit?: number; includeDeleted?: boolean };

export function useAdminCrud<T extends { _id: string; deletedAt?: string | null }>(basePath: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function list(p: Paging = {}) {
    setErr(null);
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (p.page) qs.set("page", String(p.page));
      if (p.limit) qs.set("limit", String(p.limit));
      if (typeof p.includeDeleted === "boolean") qs.set("includeDeleted", String(p.includeDeleted));

      const res = await apiFetch<any>(`${basePath}?${qs.toString()}`, { auth: true });
      setItems(normalizeArray<T>(res));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: any) {
    setErr(null);
    const res = await apiFetch<any>(basePath, { method: "POST", body: payload, auth: true });
    const created = unwrap(res) as T;
    setItems((prev) => [created, ...prev]);
    return created;
  }

  async function update(id: string, payload: any) {
    setErr(null);
    const res = await apiFetch<any>(`${basePath}/${id}`, { method: "PATCH", body: payload, auth: true });
    const updated = unwrap(res) as T;
    setItems((prev) => prev.map((x) => (x._id === id ? updated : x)));
    return updated;
  }

  async function remove(id: string) {
    setErr(null);
    await apiFetch(`${basePath}/${id}`, { method: "DELETE", auth: true });
    setItems((prev) =>
      prev.map((x) => (x._id === id ? ({ ...x, deletedAt: new Date().toISOString() } as any) : x))
    );
  }

  async function restore(restorePath: string) {
    setErr(null);
    const res = await apiFetch<any>(restorePath, { method: "POST", auth: true });
    const restored = unwrap(res) as T;
    setItems((prev) => prev.map((x) => (x._id === restored._id ? restored : x)));
    return restored;
  }

  useEffect(() => {
    list({ page: 1, limit: 200, includeDeleted: true });
  }, [basePath]);

  return { items, loading, err, list, create, update, remove, restore, setItems };
}