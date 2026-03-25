"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

type AuditItem = {
  _id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  payload?: any;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
  updatedAt?: string;
};

function getErrorMessage(e: any, fallback: string) {
  return e?.message || e?.response?.data?.message || fallback;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function prettyPayload(payload: any) {
  if (!payload) return "-";
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");

  async function loadAudit() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "100");
      if (actionFilter !== "ALL") qs.set("action", actionFilter);
      if (entityFilter !== "ALL") qs.set("entity", entityFilter);

      const res = await apiFetch<any>(`${endpoints.admin.audit}?${qs.toString()}`, {
        auth: true,
      });

      const data = res && typeof res === "object" && "data" in res ? res.data : res;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setErr(getErrorMessage(e, "Could not load audit logs."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAudit().catch(() => {});
  }, [actionFilter, entityFilter]);

  const actionOptions = useMemo(() => {
    const base = ["ALL", "CREATE", "UPDATE", "DELETE", "RESTORE", "PUBLISH"];
    return base;
  }, []);

  const entityOptions = useMemo(() => {
    const base = ["ALL", "Standard", "Subject", "Unit", "Chapter", "Lesson", "Quiz"];
    return base;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-2xl font-semibold">Audit Log</div>
          <div className="mt-1 text-sm text-white/55">
            Review admin actions across curriculum and quiz management.
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => loadAudit()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <AdminCard title="Filters">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/70">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-white/20"
            >
              {actionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-white/20"
            >
              {entityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminCard>

      <AdminCard title={`Entries (${loading ? "..." : items.length})`}>
        {loading ? (
          <div className="text-sm text-white/55">Loading audit logs...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/50">
            No audit entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item._id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                        {item.action}
                      </span>
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/70">
                        {item.entity}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-white/80">
                      Entity ID: <span className="font-mono text-white/65">{item.entityId}</span>
                    </div>

                    <div className="mt-1 text-sm text-white/50">
                      Time: {formatDate(item.createdAt)}
                    </div>

                    <div className="mt-1 text-sm text-white/50">
                      Admin ID: {item.adminId || "-"}
                    </div>

                    <div className="mt-1 text-sm text-white/50">
                      Request ID: {item.requestId || "-"}
                    </div>

                    <div className="mt-1 text-sm text-white/50">
                      IP: {item.ip || "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-white/45">Payload</div>
                  <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/35 p-4 text-xs text-white/70">
                    {prettyPayload(item.payload)}
                  </pre>
                </div>

                {item.userAgent && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs uppercase tracking-wide text-white/45">User Agent</div>
                    <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-white/60 break-all">
                      {item.userAgent}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}