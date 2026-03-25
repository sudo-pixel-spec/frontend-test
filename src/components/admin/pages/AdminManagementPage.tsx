"use client";

import { useEffect, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

type AdminAccount = {
  id: string;
  phone?: string;
  email?: string;
  fullName: string;
  allocatedStandards: string[];
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [standards, setStandards] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    allocatedStandards: [] as string[]
  });

  async function loadData() {
    setLoading(true);
    try {
      const sRes: any = await apiFetch(endpoints.admin.standards, { auth: true });
      setStandards(Array.isArray(sRes?.items) ? sRes.items : []);
    } catch (e: any) { alert(e.message || "Failed to load standards"); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch((endpoints.admin as any).admins, {
        method: "POST",
        auth: true,
        body: formData
      });
      setModalOpen(false);
      alert("Admin account created successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create admin");
    }
  };

  const toggleStandard = (id: string) => {
    setFormData(prev => ({
      ...prev,
      allocatedStandards: prev.allocatedStandards.includes(id)
        ? prev.allocatedStandards.filter(s => s !== id)
        : [...prev.allocatedStandards, id]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Management</h1>
          <p className="mt-1 text-sm text-white/55">Provision and manage regular administrator accounts.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add New Admin</Button>
      </div>

      <AdminCard title="About Admin Scoping">
        <div className="space-y-4 text-sm text-white/60">
          <p>
            Regular admins are restricted to the <strong className="text-white">Allocated Standards</strong> you assign them. 
            They can only view learners, curriculum, and metrics for those specific grades.
          </p>
          <p>
            Super Admins have full access and should only be created via backend seed scripts for security.
          </p>
        </div>
      </AdminCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0f18] p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold">Create Regular Admin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField label="Full Name" value={formData.fullName} onChange={(v) => setFormData({ ...formData, fullName: v })} required />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Phone Number" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} placeholder="e.g. +91 99..." />
                <TextField label="Email Address" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} placeholder="admin@example.com" />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-white/40">Allocated Standards</label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border border-white/10 rounded-xl bg-black/25">
                  {standards.map(s => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => toggleStandard(s._id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        formData.allocatedStandards.includes(s._id) ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-white/50 border-white/10"
                      } border`}
                    >
                      <span className="truncate">{s.name} ({s.code})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Provision Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
