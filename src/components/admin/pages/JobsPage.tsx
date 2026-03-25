"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

type JobsStatusResponse = {
  enabled?: boolean;
  name?: string;
};

type Job = {
  _id: string;
  name: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastFinishedAt: string | null;
  failReason: string | null;
  lockedAt: string | null;
};

type UiState = "enabled" | "disabled" | "not_ready";

function getErrorMessage(e: any, fallback: string) {
  return e?.message || e?.response?.data?.message || fallback;
}

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<JobsStatusResponse | null>(null);
  const [uiState, setUiState] = useState<UiState>("disabled");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadStatus() {
    setLoading(true);
    setErr(null);

    try {
      const res = await apiFetch<any>(endpoints.admin.jobsStatus, { auth: true });
      setStatus(res ?? null);

      if (res?.enabled === true) {
        setUiState("enabled");
      } else {
        setUiState("disabled");
      }
    } catch (e: any) {
      const msg = getErrorMessage(e, "Could not load jobs status.");
      setErr(msg);
      setStatus(null);

      if (msg.includes("JOBS_NOT_READY") || msg.toLowerCase().includes("not initialized")) {
        setUiState("not_ready");
      } else {
        setUiState("not_ready");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const res: any = await apiFetch((endpoints.admin as any).jobs.list, { auth: true });
      setJobs(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) { alert(getErrorMessage(e, "Failed to load jobs")); } finally { setJobsLoading(false); }
  }

  useEffect(() => {
    loadStatus().catch(() => {});
    loadJobs().catch(() => {});
  }, []);

  async function handleRetry(id: string) {
    setActionLoading(true);
    try {
      await apiFetch((endpoints.admin as any).jobs.retry(id), { method: "POST", auth: true });
      loadJobs();
    } catch (e: any) { alert(getErrorMessage(e, "Retry failed")); }
    finally { setActionLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this job from queue?")) return;
    setActionLoading(true);
    try {
      await apiFetch((endpoints.admin as any).jobs.delete(id), { method: "DELETE", auth: true });
      loadJobs();
    } catch (e: any) { alert(getErrorMessage(e, "Delete failed")); }
    finally { setActionLoading(false); }
  }

  const derived = useMemo(() => {
    const schedulerName = status?.name || "Agenda";

    if (uiState === "enabled") {
      return {
        jobsEnabledLabel: "Yes",
        readinessLabel: "Running",
        modeLabel: "Background processing ON",
        description: "Background jobs are enabled and the scheduler is available.",
      };
    }

    if (uiState === "not_ready") {
      return {
        jobsEnabledLabel: "Broken",
        readinessLabel: "Not Ready",
        modeLabel: "Initialization failed",
        description:
          "Jobs appear to be enabled in configuration, but the scheduler was not initialized successfully.",
      };
    }

    return {
      jobsEnabledLabel: "No",
      readinessLabel: "Disabled",
      modeLabel: "Background processing OFF",
      description: "Background jobs are currently disabled for this environment.",
    };
  }, [status, uiState]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-2xl font-semibold">Jobs</div>
          <div className="mt-1 text-sm text-white/55">
            Monitor background processing and scheduler availability.
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => loadStatus()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          label="Jobs Enabled"
          value={loading ? "..." : derived.jobsEnabledLabel}
          tone={uiState}
        />
        <StatusCard
          label="Scheduler"
          value={loading ? "..." : status?.name || "Agenda"}
          tone={uiState}
        />
        <StatusCard
          label="Readiness"
          value={loading ? "..." : derived.readinessLabel}
          tone={uiState}
        />
        <StatusCard
          label="Mode"
          value={loading ? "..." : derived.modeLabel}
          tone={uiState}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard title="Current Status">
          {loading ? (
            <div className="text-sm text-white/55">Loading jobs status...</div>
          ) : (
            <div className="space-y-4">
              <JobStateRow
                label="UI state"
                value={uiState}
              />
              <JobStateRow
                label="Scheduler name"
                value={status?.name || "Agenda"}
              />
              <JobStateRow
                label="System state"
                value={derived.description}
              />
            </div>
          )}
        </AdminCard>

        <AdminCard title="What this means">
          <div className="space-y-3 text-sm text-white/60">
            <div>
              <strong className="text-white">Enabled</strong> means the scheduler is initialized and background jobs can run.
            </div>
            <div>
              <strong className="text-white">Disabled</strong> means jobs are intentionally off for this environment.
            </div>
            <div>
              <strong className="text-white">Not Ready</strong> means jobs look enabled in config, but the scheduler was not initialized correctly.
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Background Jobs Queue">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                <th className="pb-3 pr-4">Job Name</th>
                <th className="pb-3 pr-4">Next Run</th>
                <th className="pb-3 pr-4">Last Finished</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobsLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">Loading queue...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">No jobs in queue.</td></tr>
              ) : jobs.map((job) => (
                <tr key={job._id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{job.name}</div>
                    <div className="text-[10px] text-white/30 truncate max-w-[150px]">{job._id}</div>
                  </td>
                  <td className="py-3 pr-4 text-white/60">
                    {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 pr-4 text-white/60">
                    {job.lastFinishedAt ? new Date(job.lastFinishedAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {job.failReason ? (
                      <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">Failed</span>
                    ) : job.lockedAt ? (
                      <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">Locked</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Queued</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleRetry(job._id)} disabled={actionLoading}>Retry</Button>
                      <Button variant="ghost" onClick={() => handleDelete(job._id)} disabled={actionLoading}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

    </div>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: UiState;
}) {
  const toneClass =
    tone === "enabled"
      ? "border-green-400/20 bg-green-500/10"
      : tone === "not_ready"
      ? "border-red-400/20 bg-red-500/10"
      : "border-white/10 bg-black/25";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function JobStateRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="text-sm text-white/55">{label}</div>
      <div className="max-w-[60%] text-right text-sm font-medium text-white/85">{value}</div>
    </div>
  );
}

function GuidanceCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-2 text-sm text-white/55">{body}</div>
    </div>
  );
}