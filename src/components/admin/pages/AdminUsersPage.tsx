"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";

type UserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  age: number | null;
  standard: string | null;
  school: string | null;
  joinDate: string;
  status: "active" | "banned" | "suspended";
  totalXP: number;
  level: number;
};

type UserProfile = {
  id: string;
  profile: any;
  email: string | null;
  phone: string | null;
  totalXP: number;
  level: number;
  streakCount: number;
  wallet: any;
  badges: string[];
  status: string;
  joinDate: string;
  stats: { lessonsCompleted: number; quizzesTaken: number; avgScore: number };
  recentAttempts: any[];
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-500/15 text-green-300 border-green-500/30",
  banned:    "bg-red-500/15 text-red-300 border-red-400/30",
  suspended: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
};

export default function AdminUsersPage() {
  const [users, setUsers]         = useState<UserRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res: any = await apiFetch(`${endpoints.admin.users}?${params}`, { auth: true });
      setUsers(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: any) { alert(e.message || "Failed to load users"); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openProfile = async (id: string) => {
    setSelectedId(id);
    setProfile(null);
    setProfileLoading(true);
    try {
      const res: any = await apiFetch(endpoints.admin.userProfile(id), { auth: true });
      setProfile(res);
    } catch (e: any) { alert(e.message || "Failed to load profile"); } finally { setProfileLoading(false); }
  };

  const closePanel = () => { setSelectedId(null); setProfile(null); };

  const handleStatusChange = async (id: string, status: "active" | "banned" | "suspended") => {
    setActionLoading(true);
    try {
      await apiFetch(endpoints.admin.userById(id), { method: "PATCH", auth: true, body: { status } });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status } : u));
      if (profile?.id === id) setProfile((p) => p ? { ...p, status } : p);
    } catch (e: any) { alert(e.message || "Failed to change status"); } finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this user account? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await apiFetch(endpoints.admin.userById(id), { method: "DELETE", auth: true });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      closePanel();
    } catch (e: any) { alert(e.message || "Failed to delete user"); } finally { setActionLoading(false); }
  };

  const handleAwardBadge = async (id: string) => {
    const badge = prompt("Enter badge name to award:");
    if (!badge?.trim()) return;
    setActionLoading(true);
    try {
      const res: any = await apiFetch(endpoints.admin.userBadges(id), { method: "POST", auth: true, body: { badge: badge.trim() } });
      if (profile?.id === id) setProfile((p) => p ? { ...p, badges: res.badges } : p);
    } catch (e: any) { alert(e.message || "Failed to award badge"); } finally { setActionLoading(false); }
  };
  const handleAwardXP = async (id: string) => {
    const amountStr = prompt("Enter amount of XP to award:");
    const amount = parseInt(amountStr || "0", 10);
    if (isNaN(amount) || amount <= 0) return;
    setActionLoading(true);
    try {
      const res: any = await apiFetch((endpoints.admin as any).userXP(id), { method: "POST", auth: true, body: { amount } });
      if (profile?.id === id) setProfile((p) => p ? { ...p, totalXP: res.totalXP, level: res.level } : p);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, totalXP: res.totalXP, level: res.level } : u));
    } catch (e: any) { alert(e.message || "Failed to award XP"); } finally { setActionLoading(false); }
  };

  const handleResetProgress = async (id: string) => {
    if (!confirm("Are you sure you want to reset all progress for this user? This includes XP, levels, streak, and quiz history.")) return;
    setActionLoading(true);
    try {
      await apiFetch((endpoints.admin as any).userResetProgress(id), { method: "POST", auth: true });
      if (profile?.id === id) {
        setProfile((p) => p ? { 
          ...p, 
          totalXP: 0, 
          level: 1, 
          streakCount: 0, 
          wallet: { coins: 0, diamonds: 0 }, 
          badges: [],
          stats: { lessonsCompleted: 0, quizzesTaken: 0, avgScore: 0 },
          recentAttempts: []
        } : p);
      }
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, totalXP: 0, level: 1 } : u));
    } catch (e: any) { alert(e.message || "Failed to reset progress"); } finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="mt-1 text-sm text-white/55">View, manage, and take actions on learner accounts.</p>
        </div>
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            placeholder="Search name, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
          />
          <Button onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
          <Button variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>Clear</Button>
        </div>
      </div>

      <AdminCard title={`Users (${loading ? "…" : total})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Contact</th>
                <th className="pb-3 pr-4">Age</th>
                <th className="pb-3 pr-4">Standard</th>
                <th className="pb-3 pr-4">School</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-white/40">Loading users…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-white/40">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="transition hover:bg-white/[0.03]">
                  <td className="py-3 pr-4 font-medium">{u.fullName ?? <span className="text-white/30">—</span>}</td>
                  <td className="py-3 pr-4 text-white/60">{u.email ?? u.phone ?? "—"}</td>
                  <td className="py-3 pr-4 text-white/60">{u.age ?? "—"}</td>
                  <td className="py-3 pr-4 text-white/60">{u.standard ?? "—"}</td>
                  <td className="py-3 pr-4 max-w-[140px] truncate text-white/60">{u.school ?? "—"}</td>
                  <td className="py-3 pr-4 text-white/50 text-xs">{new Date(u.joinDate).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[u.status] ?? STATUS_STYLES.active}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openProfile(u.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs transition hover:bg-white/10"
                      >View</button>
                      {u.status === "active" ? (
                        <button
                          onClick={() => handleStatusChange(u.id, "banned")}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                        >Ban</button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u.id, "active")}
                          className="rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs text-green-300 transition hover:bg-green-500/20"
                        >Restore</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-white/40">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </AdminCard>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={closePanel} />

          <div className="w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#0d0f18] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Profile</h2>
              <button onClick={closePanel} className="text-white/40 transition hover:text-white">✕</button>
            </div>

            {profileLoading ? (
              <div className="py-20 text-center text-white/40">Loading profile…</div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-lg font-semibold">{profile.profile?.fullName ?? "Unknown"}</div>
                  <div className="mt-1 text-sm text-white/50">{profile.email ?? profile.phone ?? "No contact"}</div>
                  <div className="mt-1 text-xs text-white/35">Standard: {profile.profile?.standard ?? "—"} · School: {profile.profile?.school ?? "—"} · Age: {profile.profile?.age ?? "—"}</div>
                  <div className="mt-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[profile.status] ?? STATUS_STYLES.active}`}>
                      {profile.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
                    <div className="text-xl font-bold text-purple-300">{profile.totalXP.toLocaleString()}</div>
                    <div className="text-xs text-white/40">Total XP</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
                    <div className="text-xl font-bold text-yellow-300">Lv {profile.level}</div>
                    <div className="text-xs text-white/40">Level</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
                    <div className="text-xl font-bold text-orange-300">{profile.streakCount}</div>
                    <div className="text-xs text-white/40">Streak</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
                    <div className="text-xl font-bold text-teal-300">{profile.stats.lessonsCompleted}</div>
                    <div className="text-xs text-white/40">Lessons Done</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
                    <div className="text-xl font-bold text-blue-300">{profile.stats.quizzesTaken}</div>
                    <div className="text-xs text-white/40">Quizzes</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
                    <div className="text-xl font-bold text-green-300">{profile.stats.avgScore}%</div>
                    <div className="text-xs text-white/40">Avg Score</div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Wallet</div>
                  <div className="flex gap-4">
                    <span className="text-sm">🪙 {profile.wallet?.coins ?? 0} coins</span>
                    <span className="text-sm">💎 {profile.wallet?.diamonds ?? 0} diamonds</span>
                  </div>
                </div>

                {profile.badges.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Badges</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.badges.map((b) => (
                        <span key={b} className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">{b}</span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.recentAttempts.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Recent Quiz Attempts</div>
                    <div className="space-y-2">
                      {profile.recentAttempts.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/60 truncate max-w-[200px]">Lesson {String(a.lessonId).slice(-6)}</span>
                          <span className="font-medium">{a.score}/{a.totalQuestions} · +{a.xpAwarded} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Admin Actions</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.status === "active" ? (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleStatusChange(profile.id, "suspended")}
                          className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-300 transition hover:bg-yellow-500/20 disabled:opacity-50"
                        >Suspend</button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleStatusChange(profile.id, "banned")}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                        >Ban</button>
                      </>
                    ) : (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleStatusChange(profile.id, "active")}
                        className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 transition hover:bg-green-500/20 disabled:opacity-50"
                      >Restore Account</button>
                    )}
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAwardBadge(profile.id)}
                      className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300 transition hover:bg-purple-500/20 disabled:opacity-50"
                    >Award Badge</button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAwardXP(profile.id)}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >Award XP</button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleResetProgress(profile.id)}
                      className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
                    >Reset Progress</button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleDelete(profile.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                    >Delete Account</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-white/40">Could not load profile.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
