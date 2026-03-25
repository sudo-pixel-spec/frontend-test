"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import TextAreaField from "../ui/TextAreaField";
import SelectField from "../ui/SelectField";

type Event = {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: "challenge" | "competition";
  rewards: { xp: number; badges: string[] };
  status: "draft" | "published" | "expired";
  standardIds: string[];
};

type Standard = { _id: string; name: string };

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evRes, stdRes]: any[] = await Promise.all([
        apiFetch(endpoints.admin.events, { auth: true }),
        apiFetch(endpoints.admin.standards, { auth: true })
      ]);
      setEvents(evRes?.data ?? evRes ?? []);
      const stdData = stdRes?.data ?? stdRes ?? [];
      setStandards(Array.isArray(stdData) ? stdData : (stdData.items ?? []));
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = () => {
    setEditingEvent({
      title: "",
      description: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      type: "challenge",
      rewards: { xp: 100, badges: [] },
      status: "draft",
      standardIds: []
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    try {
      const isNew = !editingEvent._id;
      const method = isNew ? "POST" : "PATCH";
      const url = isNew ? endpoints.admin.events : endpoints.admin.eventById(editingEvent._id!);
      
      const payload = {
        ...editingEvent,
        startDate: new Date(editingEvent.startDate!).toISOString(),
        endDate: new Date(editingEvent.endDate!).toISOString(),
      };

      await apiFetch(url, { method, auth: true, body: payload });
      await loadData();
      setEditingEvent(null);
    } catch (err) {
      alert("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(endpoints.admin.eventById(id), { method: "DELETE", auth: true });
      setEvents(prev => prev.filter(ev => ev._id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Challenges & Events</h1>
          <p className="mt-1 text-sm text-white/55">Create and manage platform-wide or grade-specific events.</p>
        </div>
        <Button onClick={handleCreate}>Create Event</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-white/40">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-white/40 text-sm">No events found. Create your first challenge!</div>
          ) : (
            events.map(ev => (
              <AdminCard key={ev._id} className="relative overflow-hidden group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ev.type === "competition" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"}`}>
                         {ev.type}
                       </span>
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ev.status === "published" ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/40"}`}>
                         {ev.status}
                       </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{ev.title}</h3>
                    <p className="mt-1 text-sm text-white/50 line-clamp-2">{ev.description}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/40">
                       <div className="flex items-center gap-1">📅 {new Date(ev.startDate).toLocaleDateString()} - {new Date(ev.endDate).toLocaleDateString()}</div>
                       <div className="flex items-center gap-1">🏆 {ev.rewards.xp} XP {ev.rewards.badges.length > 0 && `+ ${ev.rewards.badges.length} badges`}</div>
                       <div className="flex items-center gap-1">📍 {ev.standardIds.length} Grades</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                     <Button variant="ghost" onClick={() => setEditingEvent({...ev, startDate: new Date(ev.startDate).toISOString().slice(0, 16), endDate: new Date(ev.endDate).toISOString().slice(0, 16)})}>Edit</Button>
                     <Button variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(ev._id)}>Delete</Button>
                  </div>
                </div>
              </AdminCard>
            ))
          )}
        </div>

        <div className="space-y-6">
          {editingEvent ? (
            <AdminCard title={editingEvent._id ? "Edit Event" : "New Event"}>
              <form onSubmit={handleSave} className="space-y-4">
                <TextField label="Title" value={editingEvent.title ?? ""} onChange={v => setEditingEvent({...editingEvent, title: v})} required />
                <TextAreaField label="Description" value={editingEvent.description ?? ""} onChange={v => setEditingEvent({...editingEvent, description: v})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <TextField label="Start Date" type="datetime-local" value={editingEvent.startDate ?? ""} onChange={v => setEditingEvent({...editingEvent, startDate: v})} required />
                  <TextField label="End Date" type="datetime-local" value={editingEvent.endDate ?? ""} onChange={v => setEditingEvent({...editingEvent, endDate: v})} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Type"
                    value={editingEvent.type ?? "challenge"}
                    onChange={v => setEditingEvent({...editingEvent, type: v as any})}
                    options={[{label: "Challenge", value: "challenge"}, {label: "Competition", value: "competition"}]}
                  />
                  <SelectField
                    label="Status"
                    value={editingEvent.status ?? "draft"}
                    onChange={v => setEditingEvent({...editingEvent, status: v as any})}
                    options={[{label: "Draft", value: "draft"}, {label: "Published", value: "published"}]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/60">Target Grades</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded border border-white/10 bg-black/20 text-xs">
                    {standards.map(s => (
                      <label key={s._id} className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={editingEvent.standardIds?.includes(s._id) ?? false}
                          onChange={e => {
                            const ids = [...(editingEvent.standardIds || [])];
                            if (e.target.checked) ids.push(s._id);
                            else {
                              const i = ids.indexOf(s._id);
                              if (i > -1) ids.splice(i, 1);
                            }
                            setEditingEvent({...editingEvent, standardIds: ids});
                          }}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex gap-2">
                  <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Saving..." : "Save Event"}</Button>
                  <Button variant="ghost" onClick={() => setEditingEvent(null)} type="button">Cancel</Button>
                </div>
              </form>
            </AdminCard>
          ) : (
            <AdminCard title="About Events">
              <div className="text-sm text-white/50 space-y-3">
                <p>Events create engagement by offering time-limited rewards.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="text-white/80">Challenges</span> are shorter tasks.</li>
                  <li><span className="text-white/80">Competitions</span> involve leaderboards.</li>
                </ul>
                <p>Rewards will be automatically distributed to users who meet completion criteria (Implementation pending).</p>
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
