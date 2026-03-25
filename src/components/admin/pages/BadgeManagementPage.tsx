"use client";

import { useEffect, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import SelectField from "../ui/SelectField";
import TextAreaField from "../ui/TextAreaField";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

type Badge = {
  _id: string;
  name: string;
  code: string;
  description: string;
  iconUrl: string;
  criteria: {
    type: "total_xp" | "quizzes_completed" | "streak_days" | "manual";
    value: number;
  };
  isActive: boolean;
};

export default function BadgeManagementPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Badge>>({
    name: "",
    code: "",
    description: "",
    iconUrl: "",
    criteria: { type: "total_xp", value: 1000 },
    isActive: true
  });

  async function loadBadges() {
    setLoading(true);
    try {
      const res: any = await apiFetch(endpoints.admin.badges as string, { auth: true });
      setBadges(Array.isArray(res) ? res : []);
    } catch (e: any) { alert(e.message || "Failed to load badges"); } finally { setLoading(false); }
  }

  useEffect(() => { loadBadges(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      iconUrl: "",
      criteria: { type: "total_xp", value: 1000 },
      isActive: true
    });
    setModalOpen(true);
  };

  const openEdit = (badge: Badge) => {
    setEditingId(badge._id);
    setFormData(badge);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? (endpoints.admin as any).badgeById(editingId) : endpoints.admin.badges;

    try {
      await apiFetch(url, {
        method,
        auth: true,
        body: formData
      });
      setModalOpen(false);
      loadBadges();
    } catch (err: any) {
      alert(err.message || "Failed to save badge");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this badge?")) return;
    try {
      await apiFetch((endpoints.admin as any).badgeById(id), { method: "DELETE", auth: true });
      loadBadges();
    } catch (err: any) {
      alert(err.message || "Failed to delete badge");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Badge Management</h1>
          <p className="mt-1 text-sm text-white/55">Create and manage gamification badges and unlock criteria.</p>
        </div>
        <Button onClick={openCreate}>Create Badge</Button>
      </div>

      <AdminCard title={`All Badges (${badges.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                <th className="pb-3 pr-4">Icon</th>
                <th className="pb-3 pr-4">Name / Code</th>
                <th className="pb-3 pr-4">Criteria</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">Loading badges…</td></tr>
              ) : badges.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">No badges defined yet.</td></tr>
              ) : badges.map((b) => (
                <tr key={b._id}>
                  <td className="py-3 pr-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-xl">
                      {b.iconUrl ? <img src={b.iconUrl} alt="" className="h-full w-full object-contain" /> : "🏆"}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-white/40">{b.code}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-xs text-white/60 capitalize">{b.criteria.type.replace("_", " ")}</div>
                    <div className="text-sm font-medium">{b.criteria.value}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${b.isActive ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                      {b.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(b)}>Edit</Button>
                      <Button variant="ghost" onClick={() => handleDelete(b._id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0f18] p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold">{editingId ? "Edit Badge" : "Create New Badge"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Badge Name" value={formData.name ?? ""} onChange={(v) => setFormData({ ...formData, name: v })} required />
                <TextField label="Code (Unique)" value={formData.code ?? ""} onChange={(v) => setFormData({ ...formData, code: v })} required />
              </div>
              <TextAreaField label="Description" value={formData.description ?? ""} onChange={(v) => setFormData({ ...formData, description: v })} />
              <TextField label="Icon URL or Emoji" value={formData.iconUrl ?? ""} onChange={(v) => setFormData({ ...formData, iconUrl: v })} placeholder="e.g. 🥇" />
              
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Criteria Type"
                  value={formData.criteria?.type ?? "total_xp"}
                  onChange={(v) => setFormData({ ...formData, criteria: { ...(formData.criteria ?? { type: "total_xp", value: 0 }), type: v as any } })}
                  options={[
                    { label: "Total XP", value: "total_xp" },
                    { label: "Quizzes Completed", value: "quizzes_completed" },
                    { label: "Streak Days", value: "streak_days" },
                    { label: "Manual Award", value: "manual" },
                  ]}
                />
                <TextField
                  label="Target Value"
                  type="number"
                  value={String(formData.criteria?.value ?? 0)}
                  onChange={(v) => setFormData({ ...formData, criteria: { ...(formData.criteria ?? { type: "total_xp", value: 0 }), value: parseInt(v) || 0 } })}
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-white/5"
                />
                <label htmlFor="isActive" className="text-sm text-white/70">Badge is Active</label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Badge</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
