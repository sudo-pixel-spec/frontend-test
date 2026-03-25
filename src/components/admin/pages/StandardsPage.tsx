"use client";

import { endpoints } from "@/lib/endpoints";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import { useAdminCrud } from "../hooks/useAdminCrud";
import { useMemo, useState } from "react";

type Standard = {
  _id: string;
  code: string;
  name: string;
  active?: boolean;
  deletedAt?: string | null;
};

export default function StandardsPage() {
  const crud = useAdminCrud<Standard>(endpoints.admin.standards);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return crud.items;
    return crud.items.filter((s) => (s.code + " " + s.name).toLowerCase().includes(t));
  }, [crud.items, q]);

  async function onCreate() {
    const c = code.trim();
    const n = name.trim();
    if (c.length < 2 || n.length < 2) return;
    await crud.create({ code: c, name: n, active: true });
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Create Standard"
        right={<Button onClick={onCreate} disabled={crud.loading}>Create</Button>}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <TextField label="Code" value={code} onChange={setCode} placeholder="STD-9" />
          <TextField label="Name" value={name} onChange={setName} placeholder="Class 9" />
        </div>
        {crud.err && <div className="mt-3 text-sm text-red-300">{crud.err}</div>}
      </AdminCard>

      <AdminCard
        title="Standards"
        right={
          <div className="flex gap-2 items-center">
            <div className="w-64">
              <TextField label="Search" value={q} onChange={setQ} placeholder="type to filter…" />
            </div>
            <Button variant="ghost" onClick={() => crud.list({ page: 1, limit: 50, includeDeleted: true })}>
              Refresh
            </Button>
          </div>
        }
      >
        {crud.loading ? (
          <div className="text-white/70 text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60">
                <tr className="border-b border-white/10">
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const deleted = !!s.deletedAt;
                  return (
                    <tr key={s._id} className="border-b border-white/5">
                      <td className="py-2">{s.code}</td>
                      <td className="py-2">{s.name}</td>
                      <td className="py-2">
                        {deleted ? (
                          <span className="text-red-300">Deleted</span>
                        ) : (
                          <span className="text-green-300">Active</span>
                        )}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        {!deleted ? (
                          <>
                            <InlineEdit
                              initial={{ code: s.code, name: s.name }}
                              onSave={(p) => crud.update(s._id, p)}
                            />
                            <Button variant="danger" onClick={() => crud.remove(s._id)}>
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => crud.restore(endpoints.admin.restoreStandard(s._id))}>
                            Restore
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-white/60" colSpan={4}>
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function InlineEdit({
  initial,
  onSave,
}: {
  initial: { code: string; name: string };
  onSave: (payload: any) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(initial.code);
  const [name, setName] = useState(initial.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({ code: code.trim(), name: name.trim() });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <span className="inline-flex gap-2 items-center">
      <input
        className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        className="w-48 rounded border border-white/10 bg-black/40 px-2 py-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button onClick={save} disabled={saving}>Save</Button>
      <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
    </span>
  );
}