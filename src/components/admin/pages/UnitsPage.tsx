"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import NumberField from "../ui/NumberField";
import SelectField from "../ui/SelectField";
import { endpoints } from "@/lib/endpoints";
import { useAdminCrud } from "../hooks/useAdminCrud";
import { apiFetch } from "@/lib/apiFetch";
import { normalizeArray } from "@/components/admin/lib/normalize";

type Subject = { _id: string; name: string; standardId: string; deletedAt?: string | null };
type Unit = { _id: string; subjectId: string; name: string; orderIndex: number; deletedAt?: string | null };

export default function UnitsPage() {
  const crud = useAdminCrud<Unit>(endpoints.admin.units);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");

  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [q, setQ] = useState("");

  async function loadSubjects() {
    const res = await apiFetch<any>(endpoints.admin.subjects + "?includeDeleted=true&limit=5000", { auth: true });
    setSubjects(normalizeArray<Subject>(res));
  }

  useEffect(() => {
    loadSubjects().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjectOptions = useMemo(() => {
    return subjects
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((s) => ({
        value: s._id,
        label: `${s.name}${s.deletedAt ? " (deleted)" : ""}`,
        disabled: !!s.deletedAt,
      }));
  }, [subjects]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return crud.items
      .filter((u) => (subjectFilter ? u.subjectId === subjectFilter : true))
      .filter((u) => (t ? u.name.toLowerCase().includes(t) : true))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [crud.items, q, subjectFilter]);

  async function onCreate() {
    const sid = subjectId.trim();
    const n = name.trim();
    if (!sid || n.length < 2) return;
    await crud.create({ subjectId: sid, name: n, orderIndex: Number(orderIndex) || 0 });
    setName("");
    setOrderIndex(0);
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Create Unit"
        right={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => crud.list({ page: 1, limit: 2000, includeDeleted: true })}>
              Refresh
            </Button>
            <Button onClick={onCreate} disabled={crud.loading}>
              Create
            </Button>
          </div>
        }
      >
        <div className="grid md:grid-cols-3 gap-4">
          <SelectField label="Subject" value={subjectId} onChange={setSubjectId} options={subjectOptions} />
          <TextField label="Name" value={name} onChange={setName} placeholder="Real Numbers" />
          <NumberField label="Order Index" value={orderIndex} onChange={setOrderIndex} />
        </div>
        {crud.err && <div className="mt-3 text-sm text-red-300">{crud.err}</div>}
      </AdminCard>

      <AdminCard
        title="Units"
        right={
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-72">
              <SelectField
                label="Filter by Subject"
                value={subjectFilter}
                onChange={setSubjectFilter}
                options={subjectOptions.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="All Subjects"
              />
            </div>
            <div className="w-64">
              <TextField label="Search" value={q} onChange={setQ} placeholder="filter by name…" />
            </div>
            <Button variant="ghost" onClick={loadSubjects}>
              Reload Subjects
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
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Order</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const deleted = !!u.deletedAt;
                  return (
                    <tr key={u._id} className="border-b border-white/5">
                      <td className="py-2">{u.name}</td>
                      <td className="py-2">{u.orderIndex ?? 0}</td>
                      <td className="py-2">
                        {deleted ? <span className="text-red-300">Deleted</span> : <span className="text-green-300">OK</span>}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        {!deleted ? (
                          <>
                            <UnitEditRow unit={u} subjectOptions={subjectOptions} onSave={(id, payload) => crud.update(id, payload)} />
                            <Button variant="danger" onClick={() => crud.remove(u._id)}>Delete</Button>
                          </>
                        ) : (
                          <Button onClick={() => crud.restore(endpoints.admin.restoreUnit(u._id))}>Restore</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-white/60" colSpan={4}>
                      No units
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

function UnitEditRow({
  unit,
  subjectOptions,
  onSave,
}: {
  unit: Unit;
  subjectOptions: { value: string; label: string; disabled?: boolean }[];
  onSave: (id: string, payload: any) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(unit.subjectId);
  const [name, setName] = useState(unit.name);
  const [orderIndex, setOrderIndex] = useState(unit.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(unit._id, { subjectId, name: name.trim(), orderIndex: Number(orderIndex) || 0 });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <span className="inline-flex gap-2 items-center">
      <select className="rounded border border-white/10 bg-black/40 px-2 py-1" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
        {subjectOptions.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <input className="w-48 rounded border border-white/10 bg-black/40 px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
      <Button onClick={save} disabled={saving}>Save</Button>
      <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
    </span>
  );
}