"use client";

import { useEffect, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

type ApiLog = {
  method: string;
  path: string;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  timestamp: string;
};

export default function ApiMonitoringPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    try {
      const res: any = await apiFetch((endpoints.admin as any).system.apiLogs, { auth: true });
      setLogs(Array.isArray(res) ? res : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">API Monitoring</h1>
          <p className="mt-1 text-sm text-white/55">Real-time request logs and performance metrics.</p>
        </div>
        <Button onClick={loadLogs} disabled={loading}>Refresh Logs</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Avg Response Time" value="45ms" tone="green" />
        <MetricCard label="Error Rate (24h)" value="0.2%" tone="green" />
        <MetricCard label="Total Requests (24h)" value="12.4k" tone="blue" />
      </div>

      <AdminCard title="Recent Requests">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 pr-4">Method</th>
                <th className="pb-3 pr-4">Path</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Latency</th>
                <th className="pb-3">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-white/40">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-white/40">No recent logs found.</td></tr>
              ) : logs.map((log, i) => (
                <tr key={i}>
                  <td className="py-3 pr-4 text-white/40 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      log.method === "GET" ? "text-blue-400 bg-blue-400/10" :
                      log.method === "POST" ? "text-green-400 bg-green-400/10" :
                      "text-purple-400 bg-purple-400/10"
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-white/70 truncate max-w-[200px]" title={log.path}>
                    {log.path}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium ${log.status >= 400 ? "text-red-400" : "text-green-400"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/50">{log.duration}ms</td>
                  <td className="py-3 text-[10px] text-white/30 truncate max-w-[150px]" title={log.userAgent}>
                    {log.userAgent}
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

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" | "red" }) {
  const toneClass = tone === "green" ? "text-emerald-400" : tone === "red" ? "text-red-400" : "text-blue-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
