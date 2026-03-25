"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import { normalizeArray } from "@/components/admin/lib/normalize";

type Standard = {
  _id: string;
  code: string;
  name: string;
  deletedAt?: string | null;
};

type Subject = {
  _id: string;
  standardId: string;
  name: string;
  orderIndex?: number;
  deletedAt?: string | null;
};

type Unit = {
  _id: string;
  subjectId: string;
  name: string;
  orderIndex?: number;
  deletedAt?: string | null;
};

type Chapter = {
  _id: string;
  unitId: string;
  name: string;
  orderIndex?: number;
  deletedAt?: string | null;
};

type Lesson = {
  _id: string;
  chapterId: string;
  title: string;
  orderIndex?: number;
  published?: boolean;
  deletedAt?: string | null;
};

type Quiz = {
  _id: string;
  lessonId: string;
  version: number;
  difficulty?: "easy" | "medium" | "hard";
  published?: boolean;
  deletedAt?: string | null;
};

type ToastTone = "success" | "error" | "info";

function getErrorMessage(e: any, fallback: string) {
  return e?.message || e?.response?.data?.message || fallback;
}

function formatDeletedAt(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function TrashPage() {
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);

  const [standards, setStandards] = useState<Standard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  function notify(message: string, tone: ToastTone = "success") {
    setToast({ tone, message });
    window.clearTimeout((notify as any)._t);
    (notify as any)._t = window.setTimeout(() => setToast(null), 2600);
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [
        standardsRes,
        subjectsRes,
        unitsRes,
        chaptersRes,
        lessonsRes,
      ] = await Promise.all([
        apiFetch<any>(`${endpoints.admin.standards}?includeDeleted=true&limit=5000`, { auth: true }),
        apiFetch<any>(`${endpoints.admin.subjects}?includeDeleted=true&limit=5000`, { auth: true }),
        apiFetch<any>(`${endpoints.admin.units}?includeDeleted=true&limit=5000`, { auth: true }),
        apiFetch<any>(`${endpoints.admin.chapters}?includeDeleted=true&limit=5000`, { auth: true }),
        apiFetch<any>(`${endpoints.admin.lessons}?includeDeleted=true&limit=5000`, { auth: true }),
      ]);

      setStandards(normalizeArray<Standard>(standardsRes));
      setSubjects(normalizeArray<Subject>(subjectsRes));
      setUnits(normalizeArray<Unit>(unitsRes));
      setChapters(normalizeArray<Chapter>(chaptersRes));
      setLessons(normalizeArray<Lesson>(lessonsRes));

      const lessonList = normalizeArray<Lesson>(lessonsRes);
      const quizFetches = await Promise.all(
        lessonList.map(async (lesson) => {
          try {
            const res = await apiFetch<any>(
              `${endpoints.admin.latestQuizForLesson}?lessonId=${encodeURIComponent(lesson._id)}`,
              { auth: true }
            );
            const data = res && typeof res === "object" && "data" in res ? res.data : res;
            return data as Quiz;
          } catch {
            return null;
          }
        })
      );

      setQuizzes(quizFetches.filter(Boolean) as Quiz[]);
    } catch (e: any) {
      setErr(getErrorMessage(e, "Could not load trash."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll().catch(() => {});
    return () => window.clearTimeout((notify as any)._t);
  }, []);

  const deletedStandards = useMemo(
    () => standards.filter((x) => !!x.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt))),
    [standards]
  );
  const deletedSubjects = useMemo(
    () => subjects.filter((x) => !!x.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt))),
    [subjects]
  );
  const deletedUnits = useMemo(
    () => units.filter((x) => !!x.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt))),
    [units]
  );
  const deletedChapters = useMemo(
    () => chapters.filter((x) => !!x.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt))),
    [chapters]
  );
  const deletedLessons = useMemo(
    () => lessons.filter((x) => !!x.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt))),
    [lessons]
  );
  const deletedQuizzes = useMemo(
    () => quizzes.filter((x) => !!x.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt))),
    [quizzes]
  );

  function standardLabel(id: string) {
    const s = standards.find((x) => x._id === id);
    return s ? `${s.code} — ${s.name}` : "Unknown standard";
  }

  function subjectLabel(id: string) {
    const s = subjects.find((x) => x._id === id);
    return s ? s.name : "Unknown subject";
  }

  function unitLabel(id: string) {
    const u = units.find((x) => x._id === id);
    return u ? u.name : "Unknown unit";
  }

  function chapterLabel(id: string) {
    const c = chapters.find((x) => x._id === id);
    return c ? c.name : "Unknown chapter";
  }

  function lessonLabel(id: string) {
    const l = lessons.find((x) => x._id === id);
    return l ? l.title : "Unknown lesson";
  }

  async function restoreItem(kind: "standard" | "subject" | "unit" | "chapter" | "lesson" | "quiz", id: string) {
    setRestoringId(id);
    try {
      const url =
        kind === "standard"
          ? endpoints.admin.restoreStandard(id)
          : kind === "subject"
          ? endpoints.admin.restoreSubject(id)
          : kind === "unit"
          ? endpoints.admin.restoreUnit(id)
          : kind === "chapter"
          ? endpoints.admin.restoreChapter(id)
          : kind === "lesson"
          ? endpoints.admin.restoreLesson(id)
          : endpoints.admin.restoreQuiz(id);

      await apiFetch<any>(url, { method: "PATCH", auth: true });
      await loadAll();
      notify(`${capitalize(kind)} restored.`);
    } catch (e: any) {
      notify(getErrorMessage(e, `Could not restore ${kind}.`), "error");
    } finally {
      setRestoringId(null);
    }
  }

  const totalDeleted =
    deletedStandards.length +
    deletedSubjects.length +
    deletedUnits.length +
    deletedChapters.length +
    deletedLessons.length +
    deletedQuizzes.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-2xl font-semibold">Trash</div>
          <div className="mt-1 text-sm text-white/55">
            Restore soft-deleted curriculum and quiz records from one place.
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => loadAll()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Deleted" value={totalDeleted} loading={loading} />
        <StatCard label="Standards" value={deletedStandards.length} loading={loading} />
        <StatCard label="Subjects" value={deletedSubjects.length} loading={loading} />
        <StatCard label="Units" value={deletedUnits.length} loading={loading} />
        <StatCard label="Chapters" value={deletedChapters.length} loading={loading} />
        <StatCard label="Lessons" value={deletedLessons.length} loading={loading} />
      </div>

      <TrashSection
        title="Deleted Standards"
        emptyText="No deleted standards."
        loading={loading}
        items={deletedStandards.map((item) => ({
          id: item._id,
          title: `${item.code} — ${item.name}`,
          meta: `Deleted: ${formatDeletedAt(item.deletedAt)}`,
          actionLabel: "Restore",
          onAction: () => restoreItem("standard", item._id),
          busy: restoringId === item._id,
        }))}
      />

      <TrashSection
        title="Deleted Subjects"
        emptyText="No deleted subjects."
        loading={loading}
        items={deletedSubjects.map((item) => ({
          id: item._id,
          title: item.name,
          meta: `${standardLabel(item.standardId)} • Deleted: ${formatDeletedAt(item.deletedAt)}`,
          actionLabel: "Restore",
          onAction: () => restoreItem("subject", item._id),
          busy: restoringId === item._id,
        }))}
      />

      <TrashSection
        title="Deleted Units"
        emptyText="No deleted units."
        loading={loading}
        items={deletedUnits.map((item) => ({
          id: item._id,
          title: item.name,
          meta: `${subjectLabel(item.subjectId)} • Deleted: ${formatDeletedAt(item.deletedAt)}`,
          actionLabel: "Restore",
          onAction: () => restoreItem("unit", item._id),
          busy: restoringId === item._id,
        }))}
      />

      <TrashSection
        title="Deleted Chapters"
        emptyText="No deleted chapters."
        loading={loading}
        items={deletedChapters.map((item) => ({
          id: item._id,
          title: item.name,
          meta: `${unitLabel(item.unitId)} • Deleted: ${formatDeletedAt(item.deletedAt)}`,
          actionLabel: "Restore",
          onAction: () => restoreItem("chapter", item._id),
          busy: restoringId === item._id,
        }))}
      />

      <TrashSection
        title="Deleted Lessons"
        emptyText="No deleted lessons."
        loading={loading}
        items={deletedLessons.map((item) => ({
          id: item._id,
          title: item.title,
          meta: `${chapterLabel(item.chapterId)} • ${item.published ? "Published" : "Draft"} • Deleted: ${formatDeletedAt(item.deletedAt)}`,
          actionLabel: "Restore",
          onAction: () => restoreItem("lesson", item._id),
          busy: restoringId === item._id,
        }))}
      />

      <TrashSection
        title="Deleted Quizzes"
        emptyText="No deleted quizzes found in latest lesson versions."
        loading={loading}
        items={deletedQuizzes.map((item) => ({
          id: item._id,
          title: `Quiz v${item.version}`,
          meta: `${lessonLabel(item.lessonId)} • ${item.difficulty ?? "-"} • ${item.published ? "Published" : "Draft"} • Deleted: ${formatDeletedAt(item.deletedAt)}`,
          actionLabel: "Restore",
          onAction: () => restoreItem("quiz", item._id),
          busy: restoringId === item._id,
        }))}
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`rounded-xl border px-4 py-3 text-sm shadow-xl ${
              toast.tone === "success"
                ? "border-green-400/20 bg-green-500/10 text-green-200"
                : toast.tone === "error"
                ? "border-red-400/20 bg-red-500/10 text-red-200"
                : "border-white/15 bg-white/10 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{loading ? "..." : value}</div>
    </div>
  );
}

function TrashSection({
  title,
  loading,
  emptyText,
  items,
}: {
  title: string;
  loading: boolean;
  emptyText: string;
  items: {
    id: string;
    title: string;
    meta: string;
    actionLabel: string;
    onAction: () => void;
    busy?: boolean;
  }[];
}) {
  return (
    <AdminCard title={title}>
      {loading ? (
        <div className="text-sm text-white/55">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/50">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.title}</div>
                <div className="mt-1 text-sm text-white/50">{item.meta}</div>
              </div>

              <div className="flex shrink-0">
                <Button onClick={item.onAction} disabled={item.busy}>
                  {item.busy ? "Restoring..." : item.actionLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}