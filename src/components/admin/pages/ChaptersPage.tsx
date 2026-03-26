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

type Unit = { _id: string; name: string; subjectId: string; deletedAt?: string | null };
type Chapter = { _id: string; unitId: string; name: string; orderIndex: number; deletedAt?: string | null };

export default function ChaptersPage() {
  const crud = useAdminCrud<Chapter>(endpoints.admin.chapters);

  const [units, setUnits] = useState<Unit[]>([]);
  const [unitFilter, setUnitFilter] = useState("");

  const [unitId, setUnitId] = useState("");
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [q, setQ] = useState("");

  async function loadUnits() {
    const res = await apiFetch<any>(endpoints.admin.units + "?includeDeleted=true&limit=5000", { auth: true });
    setUnits(normalizeArray<Unit>(res));
  }

  useEffect(() => {
    loadUnits().catch(() => {});
  }, []);

  const unitOptions = useMemo(() => {
    return units
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((u) => ({
        value: u._id,
        label: `${u.name}${u.deletedAt ? " (deleted)" : ""}`,
        disabled: !!u.deletedAt,
      }));
  }, [units]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return crud.items
      .filter((c) => (unitFilter ? c.unitId === unitFilter : true))
      .filter((c) => (t ? c.name.toLowerCase().includes(t) : true))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [crud.items, q, unitFilter]);

  async function onCreate() {
    const uid = unitId.trim();
    const n = name.trim();
    if (!uid || n.length < 2) return;
    await crud.create({ unitId: uid, name: n, orderIndex: Number(orderIndex) || 0 });
    setName("");
    setOrderIndex(0);
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Create Chapter"
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
          <SelectField label="Unit" value={unitId} onChange={setUnitId} options={unitOptions} />
          <TextField label="Name" value={name} onChange={setName} placeholder="Chapter 1" />
          <NumberField label="Order Index" value={orderIndex} onChange={setOrderIndex} />
        </div>
        {crud.err && <div className="mt-3 text-sm text-red-300">{crud.err}</div>}
      </AdminCard>

      <AdminCard
        title="Chapters"
        right={
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-72">
              <SelectField
                label="Filter by Unit"
                value={unitFilter}
                onChange={setUnitFilter}
                options={unitOptions.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="All Units"
              />
            </div>
            <div className="w-64">
              <TextField label="Search" value={q} onChange={setQ} placeholder="filter by name…" />
            </div>
            <Button variant="ghost" onClick={loadUnits}>
              Reload Units
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
                {filtered.map((c) => {
                  const deleted = !!c.deletedAt;
                  return (
                    <tr key={c._id} className="border-b border-white/5">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2">{c.orderIndex ?? 0}</td>
                      <td className="py-2">
                        {deleted ? <span className="text-red-300">Deleted</span> : <span className="text-green-300">OK</span>}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        {!deleted ? (
                          <>
                            <ChapterEditRow chapter={c} unitOptions={unitOptions} onSave={(id, payload) => crud.update(id, payload)} />
                            <Button variant="danger" onClick={() => crud.remove(c._id)}>Delete</Button>
                          </>
                        ) : (
                          <Button onClick={() => crud.restore(endpoints.admin.restoreChapter(c._id))}>Restore</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-white/60" colSpan={4}>
                      No chapters
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

function ChapterEditRow({
  chapter,
  unitOptions,
  onSave,
}: {
  chapter: Chapter;
  unitOptions: { value: string; label: string; disabled?: boolean }[];
  onSave: (id: string, payload: any) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [unitId, setUnitId] = useState(chapter.unitId);
  const [name, setName] = useState(chapter.name);
  const [orderIndex, setOrderIndex] = useState(chapter.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(chapter._id, { unitId, name: name.trim(), orderIndex: Number(orderIndex) || 0 });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <span className="inline-flex gap-2 items-center">
      <select className="rounded border border-white/10 bg-black/40 px-2 py-1" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
        {unitOptions.map((o) => (
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