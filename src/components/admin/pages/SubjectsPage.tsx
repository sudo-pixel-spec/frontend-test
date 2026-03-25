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

type Standard = { _id: string; code: string; name: string; deletedAt?: string | null };
type Subject = { _id: string; standardId: string; name: string; orderIndex: number; deletedAt?: string | null };

export default function SubjectsPage() {
  const crud = useAdminCrud<Subject>(endpoints.admin.subjects);

  const [standards, setStandards] = useState<Standard[]>([]);
  const [stdFilter, setStdFilter] = useState("");

  const [standardId, setStandardId] = useState("");
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [q, setQ] = useState("");

  async function loadStandards() {
    const res = await apiFetch<any>(endpoints.admin.standards + "?includeDeleted=true&limit=2000", { auth: true });
    setStandards(normalizeArray<Standard>(res));
  }

  useEffect(() => {
    loadStandards().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const standardOptions = useMemo(() => {
    return standards
      .slice()
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
      .map((s) => ({
        value: s._id,
        label: `${s.code} — ${s.name}${s.deletedAt ? " (deleted)" : ""}`,
        disabled: !!s.deletedAt,
      }));
  }, [standards]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return crud.items
      .filter((s) => (stdFilter ? s.standardId === stdFilter : true))
      .filter((s) => (t ? s.name.toLowerCase().includes(t) : true))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [crud.items, q, stdFilter]);

  async function onCreate() {
    const sid = standardId.trim();
    const n = name.trim();
    if (!sid || n.length < 2) return;
    await crud.create({ standardId: sid, name: n, orderIndex: Number(orderIndex) || 0 });
    setName("");
    setOrderIndex(0);
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Create Subject"
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
          <SelectField label="Standard" value={standardId} onChange={setStandardId} options={standardOptions} />
          <TextField label="Name" value={name} onChange={setName} placeholder="Mathematics" />
          <NumberField label="Order Index" value={orderIndex} onChange={setOrderIndex} />
        </div>
        {crud.err && <div className="mt-3 text-sm text-red-300">{crud.err}</div>}
      </AdminCard>

      <AdminCard
        title="Subjects"
        right={
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-72">
              <SelectField
                label="Filter by Standard"
                value={stdFilter}
                onChange={setStdFilter}
                options={standardOptions.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="All Standards"
              />
            </div>
            <div className="w-64">
              <TextField label="Search" value={q} onChange={setQ} placeholder="filter by name…" />
            </div>
            <Button variant="ghost" onClick={loadStandards}>
              Reload Standards
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
                {filtered.map((s) => {
                  const deleted = !!s.deletedAt;
                  return (
                    <tr key={s._id} className="border-b border-white/5">
                      <td className="py-2">{s.name}</td>
                      <td className="py-2">{s.orderIndex ?? 0}</td>
                      <td className="py-2">
                        {deleted ? <span className="text-red-300">Deleted</span> : <span className="text-green-300">OK</span>}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        {!deleted ? (
                          <>
                            <SubjectEditRow
                              subject={s}
                              standardOptions={standardOptions}
                              onSave={(id, payload) => crud.update(id, payload)}
                            />
                            <Button variant="danger" onClick={() => crud.remove(s._id)}>
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => crud.restore(endpoints.admin.restoreSubject(s._id))}>Restore</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-white/60" colSpan={4}>
                      No subjects
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

function SubjectEditRow({
  subject,
  standardOptions,
  onSave,
}: {
  subject: Subject;
  standardOptions: { value: string; label: string; disabled?: boolean }[];
  onSave: (id: string, payload: any) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [standardId, setStandardId] = useState(subject.standardId);
  const [name, setName] = useState(subject.name);
  const [orderIndex, setOrderIndex] = useState(subject.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(subject._id, { standardId, name: name.trim(), orderIndex: Number(orderIndex) || 0 });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <span className="inline-flex gap-2 items-center">
      <select className="rounded border border-white/10 bg-black/40 px-2 py-1" value={standardId} onChange={(e) => setStandardId(e.target.value)}>
        {standardOptions.map((o) => (
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