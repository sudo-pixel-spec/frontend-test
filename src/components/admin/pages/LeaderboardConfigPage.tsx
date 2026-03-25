"use client";

import { useEffect, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import SelectField from "../ui/SelectField";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

export default function LeaderboardConfigPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{ period: string; lastReset: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadConfig() {
    setLoading(true);
    try {
      const res: any = await apiFetch((endpoints.admin as any).system.leaderboard, { auth: true });
      setConfig(res);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { loadConfig(); }, []);

  const handleUpdate = async (period: string) => {
    setSaving(true);
    try {
      await apiFetch((endpoints.admin as any).system.leaderboard, {
        method: "PATCH",
        auth: true,
        body: { period }
      });
      loadConfig();
    } catch (e: any) { alert(e.message || "Failed to update config"); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm("Reset the global leaderboard now? This will clear weekly scores for all users.")) return;
    setSaving(true);
    try {
      await apiFetch((endpoints.admin as any).system.resetLeaderboard, { method: "POST", auth: true });
      loadConfig();
    } catch (e: any) { alert(e.message || "Reset failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard Management</h1>
        <p className="mt-1 text-sm text-white/55">Configure leaderboard reset periods and perform manual resets.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminCard title="Configuration">
          <div className="space-y-6">
            <SelectField
              label="Reset Period"
              value={config?.period || "weekly"}
              onChange={(v) => handleUpdate(v)}
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
              ]}
              disabled={loading || saving}
            />
            <p className="text-xs text-white/40">
              The reset period determines how often learner scores are archived and the board is cleared automatically.
            </p>
          </div>
        </AdminCard>

        <AdminCard title="Force Reset">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Global Reset</div>
              <div className="mt-1 text-sm text-white/50">
                Immediately archive current scores and start a new period.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200">
              Last reset: {config?.lastReset ? new Date(config.lastReset).toLocaleString() : "Never"}
            </div>
            <Button variant="ghost" onClick={handleReset} disabled={loading || saving} className="w-full">
              {saving ? "Resetting..." : "Reset Leaderboard Now"}
            </Button>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
