"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import NumberField from "../ui/NumberField";
import SelectField from "../ui/SelectField";
import TextAreaField from "../ui/TextAreaField";
import Toggle from "../ui/Toggle";
import { endpoints } from "@/lib/endpoints";
import { useAdminCrud } from "../hooks/useAdminCrud";
import { apiFetch } from "@/lib/apiFetch";
import { normalizeArray } from "@/components/admin/lib/normalize";

type Chapter = { _id: string; name: string; unitId: string; deletedAt?: string | null };

type Lesson = {
  _id: string;
  chapterId: string;
  title: string;
  orderIndex: number;
  videoUrl?: string;
  bullets?: string[];
  contentText?: string;
  published: boolean;
  tags?: string[];
  deletedAt?: string | null;
};

function linesToArray(s: string) {
  return s.split("\n").map((x) => x.trim()).filter(Boolean);
}
function arrayToLines(arr?: string[]) {
  return (arr ?? []).join("\n");
}

export default function LessonsPage() {
  const crud = useAdminCrud<Lesson>(endpoints.admin.lessons);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterFilter, setChapterFilter] = useState("");

  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [bulletsText, setBulletsText] = useState("");
  const [contentText, setContentText] = useState("");
  const [published, setPublished] = useState(false);
  const [tagsText, setTagsText] = useState("");
  const [q, setQ] = useState("");

  async function loadChapters() {
    const res = await apiFetch<any>(endpoints.admin.chapters + "?includeDeleted=true&limit=10000", { auth: true });
    setChapters(normalizeArray<Chapter>(res));
  }

  useEffect(() => {
    loadChapters().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapterOptions = useMemo(() => {
    return chapters
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((c) => ({
        value: c._id,
        label: `${c.name}${c.deletedAt ? " (deleted)" : ""}`,
        disabled: !!c.deletedAt,
      }));
  }, [chapters]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return crud.items
      .filter((l) => (chapterFilter ? l.chapterId === chapterFilter : true))
      .filter((l) => (t ? l.title.toLowerCase().includes(t) : true))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [crud.items, q, chapterFilter]);

  async function onCreate() {
    const cid = chapterId.trim();
    const t = title.trim();
    if (!cid || t.length < 2) return;

    await crud.create({
      chapterId: cid,
      title: t,
      orderIndex: Number(orderIndex) || 0,
      videoUrl: videoUrl.trim() || undefined,
      bullets: linesToArray(bulletsText),
      contentText: contentText.trim() || undefined,
      published: !!published,
      tags: linesToArray(tagsText),
    });

    setTitle("");
    setOrderIndex(0);
    setVideoUrl("");
    setBulletsText("");
    setContentText("");
    setPublished(false);
    setTagsText("");
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Create Lesson"
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
          <SelectField label="Chapter" value={chapterId} onChange={setChapterId} options={chapterOptions} />
          <TextField label="Title" value={title} onChange={setTitle} placeholder="Introduction to…" />
          <NumberField label="Order Index" value={orderIndex} onChange={setOrderIndex} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <TextField label="Video URL (optional)" value={videoUrl} onChange={setVideoUrl} placeholder="https://…" />
          <Toggle label="Published" value={published} onChange={setPublished} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <TextAreaField label="Bullets (one per line)" value={bulletsText} onChange={setBulletsText} rows={6} />
          <TextAreaField label="Tags (one per line)" value={tagsText} onChange={setTagsText} rows={6} />
        </div>

        <div className="mt-4">
          <TextAreaField label="Content Text (optional)" value={contentText} onChange={setContentText} rows={10} />
        </div>

        {crud.err && <div className="mt-3 text-sm text-red-300">{crud.err}</div>}
      </AdminCard>

      <AdminCard
        title="Lessons"
        right={
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-72">
              <SelectField
                label="Filter by Chapter"
                value={chapterFilter}
                onChange={setChapterFilter}
                options={chapterOptions.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="All Chapters"
              />
            </div>
            <div className="w-64">
              <TextField label="Search" value={q} onChange={setQ} placeholder="filter by title…" />
            </div>
            <Button variant="ghost" onClick={loadChapters}>
              Reload Chapters
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
                  <th className="text-left py-2">Title</th>
                  <th className="text-left py-2">Order</th>
                  <th className="text-left py-2">Published</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const deleted = !!l.deletedAt;
                  return (
                    <tr key={l._id} className="border-b border-white/5">
                      <td className="py-2">{l.title}</td>
                      <td className="py-2">{l.orderIndex ?? 0}</td>
                      <td className="py-2">{l.published ? <span className="text-green-300">Yes</span> : <span className="text-white/60">No</span>}</td>
                      <td className="py-2">{deleted ? <span className="text-red-300">Deleted</span> : <span className="text-green-300">OK</span>}</td>
                      <td className="py-2 text-right space-x-2">
                        {!deleted ? (
                          <>
                            <LessonEditDrawer lesson={l} chapterOptions={chapterOptions} onSave={(id, payload) => crud.update(id, payload)} />
                            <Button variant="danger" onClick={() => crud.remove(l._id)}>Delete</Button>
                          </>
                        ) : (
                          <Button onClick={() => crud.restore(endpoints.admin.restoreLesson(l._id))}>Restore</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-white/60" colSpan={5}>
                      No lessons
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

function LessonEditDrawer({
  lesson,
  chapterOptions,
  onSave,
}: {
  lesson: Lesson;
  chapterOptions: { value: string; label: string; disabled?: boolean }[];
  onSave: (id: string, payload: any) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [chapterId, setChapterId] = useState(lesson.chapterId);
  const [title, setTitle] = useState(lesson.title);
  const [orderIndex, setOrderIndex] = useState(lesson.orderIndex ?? 0);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? "");
  const [bulletsText, setBulletsText] = useState(arrayToLines(lesson.bullets));
  const [contentText, setContentText] = useState(lesson.contentText ?? "");
  const [published, setPublished] = useState(!!lesson.published);
  const [tagsText, setTagsText] = useState(arrayToLines(lesson.tags));

  async function save() {
    setSaving(true);
    try {
      await onSave(lesson._id, {
        chapterId,
        title: title.trim(),
        orderIndex: Number(orderIndex) || 0,
        videoUrl: videoUrl.trim() || undefined,
        bullets: linesToArray(bulletsText),
        contentText: contentText.trim() || undefined,
        published: !!published,
        tags: linesToArray(tagsText),
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <div className="inline-block text-left">
      <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full md:w-[620px] bg-black border-l border-white/10 z-50 overflow-auto">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="font-semibold">Edit Lesson</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Close</Button>
            <Button onClick={save} disabled={saving}>Save</Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <SelectField label="Chapter" value={chapterId} onChange={setChapterId} options={chapterOptions} />
          <TextField label="Title" value={title} onChange={setTitle} />
          <NumberField label="Order Index" value={orderIndex} onChange={setOrderIndex} />
          <TextField label="Video URL" value={videoUrl} onChange={setVideoUrl} />
          <Toggle label="Published" value={published} onChange={setPublished} />
          <TextAreaField label="Bullets (one per line)" value={bulletsText} onChange={setBulletsText} rows={6} />
          <TextAreaField label="Tags (one per line)" value={tagsText} onChange={setTagsText} rows={6} />
          <TextAreaField label="Content Text" value={contentText} onChange={setContentText} rows={12} />
        </div>
      </div>
    </div>
  );
}