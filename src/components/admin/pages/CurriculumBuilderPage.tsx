"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import { normalizeArray, unwrap } from "@/components/admin/lib/normalize";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import NumberField from "../ui/NumberField";
import TextAreaField from "../ui/TextAreaField";
import Toggle from "../ui/Toggle";

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
  orderIndex: number;
  deletedAt?: string | null;
};

type Unit = {
  _id: string;
  subjectId: string;
  name: string;
  orderIndex: number;
  deletedAt?: string | null;
};

type Chapter = {
  _id: string;
  unitId: string;
  name: string;
  orderIndex: number;
  deletedAt?: string | null;
};

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

type Quiz = {
  _id: string;
  lessonId: string;
  version: number;
  source?: "seed" | "ai";
  difficulty?: "easy" | "medium" | "hard";
  published?: boolean;
  deletedAt?: string | null;
  questions?: any[];
};

function linesToArray(s: string) {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrayToLines(arr?: string[]) {
  return (arr ?? []).join("\n");
}

export default function CurriculumBuilderPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [standards, setStandards] = useState<Standard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [stdSearch, setStdSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");

  const selectedStandard = standards.find((x) => x._id === selectedStandardId) ?? null;
  const selectedSubject = subjects.find((x) => x._id === selectedSubjectId) ?? null;
  const selectedUnit = units.find((x) => x._id === selectedUnitId) ?? null;
  const selectedChapter = chapters.find((x) => x._id === selectedChapterId) ?? null;
  const selectedLesson = lessons.find((x) => x._id === selectedLessonId) ?? null;

  async function loadStandards() {
    const res = await apiFetch<any>(`${endpoints.admin.standards}?includeDeleted=true&limit=5000`, { auth: true });
    const list = normalizeArray<Standard>(res).sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    setStandards(list);
  }

  async function loadSubjects(standardId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.subjects}?includeDeleted=true&limit=5000`, { auth: true });
    const list = normalizeArray<Subject>(res)
      .filter((x) => x.standardId === standardId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setSubjects(list);
  }

  async function loadUnits(subjectId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.units}?includeDeleted=true&limit=5000`, { auth: true });
    const list = normalizeArray<Unit>(res)
      .filter((x) => x.subjectId === subjectId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setUnits(list);
  }

  async function loadChapters(unitId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.chapters}?includeDeleted=true&limit=5000`, { auth: true });
    const list = normalizeArray<Chapter>(res)
      .filter((x) => x.unitId === unitId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setChapters(list);
  }

  async function loadLessons(chapterId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.lessons}?includeDeleted=true&limit=5000`, { auth: true });
    const list = normalizeArray<Lesson>(res)
      .filter((x) => x.chapterId === chapterId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setLessons(list);
  }

  async function loadLatestQuiz(lessonId: string) {
    setQuiz(null);
    if (!lessonId) return;
    setQuizLoading(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.latestQuizForLessonUrl(lessonId), { auth: true });
      setQuiz(unwrap(res) as Quiz);
    } catch {
      setQuiz(null);
    } finally {
      setQuizLoading(false);
    }
  }

  async function refreshAll() {
    setErr(null);
    setLoading(true);
    try {
      await loadStandards();

      if (selectedStandardId) await loadSubjects(selectedStandardId);
      if (selectedSubjectId) await loadUnits(selectedSubjectId);
      if (selectedUnitId) await loadChapters(selectedUnitId);
      if (selectedChapterId) await loadLessons(selectedChapterId);
      if (selectedLessonId) await loadLatestQuiz(selectedLessonId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll().catch(() => {});
  }, []);

  async function selectStandard(id: string) {
    setSelectedStandardId(id);
    setSelectedSubjectId("");
    setSelectedUnitId("");
    setSelectedChapterId("");
    setSelectedLessonId("");
    setSubjects([]);
    setUnits([]);
    setChapters([]);
    setLessons([]);
    setQuiz(null);
    await loadSubjects(id);
  }

  async function selectSubject(id: string) {
    setSelectedSubjectId(id);
    setSelectedUnitId("");
    setSelectedChapterId("");
    setSelectedLessonId("");
    setUnits([]);
    setChapters([]);
    setLessons([]);
    setQuiz(null);
    await loadUnits(id);
  }

  async function selectUnit(id: string) {
    setSelectedUnitId(id);
    setSelectedChapterId("");
    setSelectedLessonId("");
    setChapters([]);
    setLessons([]);
    setQuiz(null);
    await loadChapters(id);
  }

  async function selectChapter(id: string) {
    setSelectedChapterId(id);
    setSelectedLessonId("");
    setLessons([]);
    setQuiz(null);
    await loadLessons(id);
  }

  async function selectLesson(id: string) {
    setSelectedLessonId(id);
    await loadLatestQuiz(id);
  }

  const visibleStandards = useMemo(() => {
    const q = stdSearch.trim().toLowerCase();
    return standards.filter((x) => !q || `${x.code} ${x.name}`.toLowerCase().includes(q));
  }, [standards, stdSearch]);

  const visibleSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return subjects.filter((x) => !q || x.name.toLowerCase().includes(q));
  }, [subjects, subjectSearch]);

  const visibleUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    return units.filter((x) => !q || x.name.toLowerCase().includes(q));
  }, [units, unitSearch]);

  const visibleChapters = useMemo(() => {
    const q = chapterSearch.trim().toLowerCase();
    return chapters.filter((x) => !q || x.name.toLowerCase().includes(q));
  }, [chapters, chapterSearch]);

  const visibleLessons = useMemo(() => {
    const q = lessonSearch.trim().toLowerCase();
    return lessons.filter((x) => !q || x.title.toLowerCase().includes(q));
  }, [lessons, lessonSearch]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-white/45">Admin</div>
            <h1 className="text-2xl font-semibold mt-1">Curriculum Builder</h1>
            <div className="text-sm text-white/60 mt-1">
              Build the full learning path from standard to lesson in one workflow.
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => refreshAll()} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
          <span className="text-white/50">Path:</span>{" "}
          {selectedStandard ? selectedStandard.code || selectedStandard.name : "—"}{" "}
          / {selectedSubject?.name ?? "—"} / {selectedUnit?.name ?? "—"} / {selectedChapter?.name ?? "—"} /{" "}
          {selectedLesson?.title ?? "—"}
        </div>

        {err && <div className="mt-4 text-sm text-red-300">{err}</div>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1.15fr_1.15fr_1.15fr_1.2fr_1.8fr]">
        <BuilderColumn
          title="Standards"
          search={stdSearch}
          setSearch={setStdSearch}
          createSlot={
            <CreateStandardBox
              onCreated={async (created) => {
                await loadStandards();
                await selectStandard(created._id);
              }}
            />
          }
          emptyText="No standards yet."
        >
          {visibleStandards.map((item) => (
            <SelectableRow
              key={item._id}
              active={selectedStandardId === item._id}
              title={item.code ? `${item.code} — ${item.name}` : item.name}
              deleted={!!item.deletedAt}
              onClick={() => selectStandard(item._id)}
            />
          ))}
        </BuilderColumn>

        <BuilderColumn
          title="Subjects"
          search={subjectSearch}
          setSearch={setSubjectSearch}
          createSlot={
            <CreateSubjectBox
              disabled={!selectedStandardId}
              standardId={selectedStandardId}
              onCreated={async (created) => {
                await loadSubjects(selectedStandardId);
                await selectSubject(created._id);
              }}
            />
          }
          emptyText={selectedStandardId ? "No subjects in this standard." : "Select a standard first."}
        >
          {visibleSubjects.map((item) => (
            <SelectableRow
              key={item._id}
              active={selectedSubjectId === item._id}
              title={item.name}
              subtitle={`Order ${item.orderIndex ?? 0}`}
              deleted={!!item.deletedAt}
              onClick={() => selectSubject(item._id)}
            />
          ))}
        </BuilderColumn>

        <BuilderColumn
          title="Units"
          search={unitSearch}
          setSearch={setUnitSearch}
          createSlot={
            <CreateUnitBox
              disabled={!selectedSubjectId}
              subjectId={selectedSubjectId}
              onCreated={async (created) => {
                await loadUnits(selectedSubjectId);
                await selectUnit(created._id);
              }}
            />
          }
          emptyText={selectedSubjectId ? "No units in this subject." : "Select a subject first."}
        >
          {visibleUnits.map((item) => (
            <SelectableRow
              key={item._id}
              active={selectedUnitId === item._id}
              title={item.name}
              subtitle={`Order ${item.orderIndex ?? 0}`}
              deleted={!!item.deletedAt}
              onClick={() => selectUnit(item._id)}
            />
          ))}
        </BuilderColumn>

        <BuilderColumn
          title="Chapters"
          search={chapterSearch}
          setSearch={setChapterSearch}
          createSlot={
            <CreateChapterBox
              disabled={!selectedUnitId}
              unitId={selectedUnitId}
              onCreated={async (created) => {
                await loadChapters(selectedUnitId);
                await selectChapter(created._id);
              }}
            />
          }
          emptyText={selectedUnitId ? "No chapters in this unit." : "Select a unit first."}
        >
          {visibleChapters.map((item) => (
            <SelectableRow
              key={item._id}
              active={selectedChapterId === item._id}
              title={item.name}
              subtitle={`Order ${item.orderIndex ?? 0}`}
              deleted={!!item.deletedAt}
              onClick={() => selectChapter(item._id)}
            />
          ))}
        </BuilderColumn>

        <BuilderColumn
          title="Lessons"
          search={lessonSearch}
          setSearch={setLessonSearch}
          createSlot={
            <CreateLessonBox
              disabled={!selectedChapterId}
              chapterId={selectedChapterId}
              onCreated={async (created) => {
                await loadLessons(selectedChapterId);
                await selectLesson(created._id);
              }}
            />
          }
          emptyText={selectedChapterId ? "No lessons in this chapter." : "Select a chapter first."}
        >
          {visibleLessons.map((item) => (
            <SelectableRow
              key={item._id}
              active={selectedLessonId === item._id}
              title={item.title}
              subtitle={`Order ${item.orderIndex ?? 0}${item.published ? " • Published" : ""}`}
              deleted={!!item.deletedAt}
              onClick={() => selectLesson(item._id)}
            />
          ))}
        </BuilderColumn>

        <DetailPanel
          standard={selectedStandard}
          subject={selectedSubject}
          unit={selectedUnit}
          chapter={selectedChapter}
          lesson={selectedLesson}
          quiz={quiz}
          quizLoading={quizLoading}
          onReloadStandards={loadStandards}
          onReloadSubjects={() => (selectedStandardId ? loadSubjects(selectedStandardId) : Promise.resolve())}
          onReloadUnits={() => (selectedSubjectId ? loadUnits(selectedSubjectId) : Promise.resolve())}
          onReloadChapters={() => (selectedUnitId ? loadChapters(selectedUnitId) : Promise.resolve())}
          onReloadLessons={() => (selectedChapterId ? loadLessons(selectedChapterId) : Promise.resolve())}
          onReloadQuiz={() => (selectedLessonId ? loadLatestQuiz(selectedLessonId) : Promise.resolve())}
          onSelectStandard={setSelectedStandardId}
          onSelectSubject={setSelectedSubjectId}
          onSelectUnit={setSelectedUnitId}
          onSelectChapter={setSelectedChapterId}
          onSelectLesson={setSelectedLessonId}
        />
      </div>
    </div>
  );
}

function BuilderColumn({
  title,
  search,
  setSearch,
  createSlot,
  children,
  emptyText,
}: {
  title: string;
  search: string;
  setSearch: (v: string) => void;
  createSlot: React.ReactNode;
  children: React.ReactNode;
  emptyText: string;
}) {
  const hasChildren = Array.isArray((children as any)) ? (children as any).length > 0 : !!children;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] min-h-[560px] flex flex-col">
      <div className="border-b border-white/10 p-3">
        <div className="font-medium">{title}</div>
        <div className="mt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
          />
        </div>
        <div className="mt-3">{createSlot}</div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {hasChildren ? children : <div className="text-sm text-white/45 p-3">{emptyText}</div>}
      </div>
    </section>
  );
}

function SelectableRow({
  title,
  subtitle,
  active,
  deleted,
  onClick,
}: {
  title: string;
  subtitle?: string;
  active?: boolean;
  deleted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-xl border text-left p-3 mb-2 transition",
        active ? "border-white/25 bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          {subtitle && <div className="text-xs text-white/50 mt-1">{subtitle}</div>}
        </div>
        {deleted && (
          <span className="shrink-0 rounded-full border border-red-400/20 px-2 py-0.5 text-[10px] text-red-300">
            deleted
          </span>
        )}
      </div>
    </button>
  );
}

function CreateStandardBox({
  onCreated,
}: {
  onCreated: (created: Standard) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.standards, {
        method: "POST",
        auth: true,
        body: { code: code.trim(), name: name.trim(), active: true },
      });
      const created = unwrap(res) as Standard;
      setCode("");
      setName("");
      setOpen(false);
      await onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ Add Standard</Button>;

  return (
    <div className="space-y-2">
      <TextField label="Code" value={code} onChange={setCode} placeholder="STD-8" />
      <TextField label="Name" value={name} onChange={setName} placeholder="Class 8" />
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>Create</Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

function CreateSubjectBox({
  disabled,
  standardId,
  onCreated,
}: {
  disabled: boolean;
  standardId: string;
  onCreated: (created: Subject) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!standardId || !name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.subjects, {
        method: "POST",
        auth: true,
        body: { standardId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      const created = unwrap(res) as Subject;
      setName("");
      setOrderIndex(0);
      setOpen(false);
      await onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)} disabled={disabled}>+ Add Subject</Button>;

  return (
    <div className="space-y-2">
      <TextField label="Name" value={name} onChange={setName} placeholder="Mathematics" />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>Create</Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

function CreateUnitBox({
  disabled,
  subjectId,
  onCreated,
}: {
  disabled: boolean;
  subjectId: string;
  onCreated: (created: Unit) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!subjectId || !name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.units, {
        method: "POST",
        auth: true,
        body: { subjectId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      const created = unwrap(res) as Unit;
      setName("");
      setOrderIndex(0);
      setOpen(false);
      await onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)} disabled={disabled}>+ Add Unit</Button>;

  return (
    <div className="space-y-2">
      <TextField label="Name" value={name} onChange={setName} placeholder="Algebra" />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>Create</Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

function CreateChapterBox({
  disabled,
  unitId,
  onCreated,
}: {
  disabled: boolean;
  unitId: string;
  onCreated: (created: Chapter) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!unitId || !name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.chapters, {
        method: "POST",
        auth: true,
        body: { unitId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      const created = unwrap(res) as Chapter;
      setName("");
      setOrderIndex(0);
      setOpen(false);
      await onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)} disabled={disabled}>+ Add Chapter</Button>;

  return (
    <div className="space-y-2">
      <TextField label="Name" value={name} onChange={setName} placeholder="Chapter 1" />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>Create</Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

function CreateLessonBox({
  disabled,
  chapterId,
  onCreated,
}: {
  disabled: boolean;
  chapterId: string;
  onCreated: (created: Lesson) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!chapterId || !title.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.lessons, {
        method: "POST",
        auth: true,
        body: {
          chapterId,
          title: title.trim(),
          orderIndex: Number(orderIndex) || 0,
          published: false,
          bullets: [],
          tags: [],
        },
      });
      const created = unwrap(res) as Lesson;
      setTitle("");
      setOrderIndex(0);
      setOpen(false);
      await onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)} disabled={disabled}>+ Add Lesson</Button>;

  return (
    <div className="space-y-2">
      <TextField label="Title" value={title} onChange={setTitle} placeholder="Introduction to Algebra" />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>Create</Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

function DetailPanel({
  standard,
  subject,
  unit,
  chapter,
  lesson,
  quiz,
  quizLoading,
  onReloadStandards,
  onReloadSubjects,
  onReloadUnits,
  onReloadChapters,
  onReloadLessons,
  onReloadQuiz,
  onSelectStandard,
  onSelectSubject,
  onSelectUnit,
  onSelectChapter,
  onSelectLesson,
}: {
  standard: Standard | null;
  subject: Subject | null;
  unit: Unit | null;
  chapter: Chapter | null;
  lesson: Lesson | null;
  quiz: Quiz | null;
  quizLoading: boolean;
  onReloadStandards: () => Promise<void>;
  onReloadSubjects: () => Promise<void>;
  onReloadUnits: () => Promise<void>;
  onReloadChapters: () => Promise<void>;
  onReloadLessons: () => Promise<void>;
  onReloadQuiz: () => Promise<void>;
  onSelectStandard: (id: string) => void;
  onSelectSubject: (id: string) => void;
  onSelectUnit: (id: string) => void;
  onSelectChapter: (id: string) => void;
  onSelectLesson: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] min-h-[560px] flex flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="font-medium">Details</div>
        <div className="text-sm text-white/50 mt-1">
          Edit the currently selected item.
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {lesson ? (
          <>
            <LessonEditorCard lesson={lesson} onSaved={onReloadLessons} onClear={() => onSelectLesson("")} />
            <QuizCard lesson={lesson} quiz={quiz} loading={quizLoading} onReload={onReloadQuiz} />
          </>
        ) : chapter ? (
          <ChapterEditorCard chapter={chapter} onSaved={onReloadChapters} onClear={() => onSelectChapter("")} />
        ) : unit ? (
          <UnitEditorCard unit={unit} onSaved={onReloadUnits} onClear={() => onSelectUnit("")} />
        ) : subject ? (
          <SubjectEditorCard subject={subject} onSaved={onReloadSubjects} onClear={() => onSelectSubject("")} />
        ) : standard ? (
          <StandardEditorCard standard={standard} onSaved={onReloadStandards} onClear={() => onSelectStandard("")} />
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/45">
            Select something from the builder to edit it here.
          </div>
        )}
      </div>
    </section>
  );
}

function StandardEditorCard({
  standard,
  onSaved,
  onClear,
}: {
  standard: Standard;
  onSaved: () => Promise<void>;
  onClear: () => void;
}) {
  const [code, setCode] = useState(standard.code);
  const [name, setName] = useState(standard.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCode(standard.code);
    setName(standard.name);
  }, [standard]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch<any>(`${endpoints.admin.standards}/${standard._id}`, {
        method: "PATCH",
        auth: true,
        body: { code: code.trim(), name: name.trim() },
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (standard.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreStandard(standard._id), { method: "POST", auth: true });
      } else {
        await apiFetch<any>(`${endpoints.admin.standards}/${standard._id}`, { method: "DELETE", auth: true });
      }
      await onSaved();
      onClear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Standard"
      deleted={!!standard.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant={standard.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {standard.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <TextField label="Code" value={code} onChange={setCode} />
      <TextField label="Name" value={name} onChange={setName} />
    </EditorCard>
  );
}

function SubjectEditorCard({
  subject,
  onSaved,
  onClear,
}: {
  subject: Subject;
  onSaved: () => Promise<void>;
  onClear: () => void;
}) {
  const [name, setName] = useState(subject.name);
  const [orderIndex, setOrderIndex] = useState(subject.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(subject.name);
    setOrderIndex(subject.orderIndex ?? 0);
  }, [subject]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch<any>(`${endpoints.admin.subjects}/${subject._id}`, {
        method: "PATCH",
        auth: true,
        body: { standardId: subject.standardId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (subject.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreSubject(subject._id), { method: "POST", auth: true });
      } else {
        await apiFetch<any>(`${endpoints.admin.subjects}/${subject._id}`, { method: "DELETE", auth: true });
      }
      await onSaved();
      onClear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Subject"
      deleted={!!subject.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant={subject.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {subject.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <TextField label="Name" value={name} onChange={setName} />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
    </EditorCard>
  );
}

function UnitEditorCard({
  unit,
  onSaved,
  onClear,
}: {
  unit: Unit;
  onSaved: () => Promise<void>;
  onClear: () => void;
}) {
  const [name, setName] = useState(unit.name);
  const [orderIndex, setOrderIndex] = useState(unit.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(unit.name);
    setOrderIndex(unit.orderIndex ?? 0);
  }, [unit]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch<any>(`${endpoints.admin.units}/${unit._id}`, {
        method: "PATCH",
        auth: true,
        body: { subjectId: unit.subjectId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (unit.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreUnit(unit._id), { method: "POST", auth: true });
      } else {
        await apiFetch<any>(`${endpoints.admin.units}/${unit._id}`, { method: "DELETE", auth: true });
      }
      await onSaved();
      onClear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Unit"
      deleted={!!unit.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant={unit.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {unit.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <TextField label="Name" value={name} onChange={setName} />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
    </EditorCard>
  );
}

function ChapterEditorCard({
  chapter,
  onSaved,
  onClear,
}: {
  chapter: Chapter;
  onSaved: () => Promise<void>;
  onClear: () => void;
}) {
  const [name, setName] = useState(chapter.name);
  const [orderIndex, setOrderIndex] = useState(chapter.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(chapter.name);
    setOrderIndex(chapter.orderIndex ?? 0);
  }, [chapter]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch<any>(`${endpoints.admin.chapters}/${chapter._id}`, {
        method: "PATCH",
        auth: true,
        body: { unitId: chapter.unitId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (chapter.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreChapter(chapter._id), { method: "POST", auth: true });
      } else {
        await apiFetch<any>(`${endpoints.admin.chapters}/${chapter._id}`, { method: "DELETE", auth: true });
      }
      await onSaved();
      onClear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Chapter"
      deleted={!!chapter.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant={chapter.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {chapter.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <TextField label="Name" value={name} onChange={setName} />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
    </EditorCard>
  );
}

function LessonEditorCard({
  lesson,
  onSaved,
  onClear,
}: {
  lesson: Lesson;
  onSaved: () => Promise<void>;
  onClear: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [orderIndex, setOrderIndex] = useState(lesson.orderIndex ?? 0);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? "");
  const [bulletsText, setBulletsText] = useState(arrayToLines(lesson.bullets));
  const [contentText, setContentText] = useState(lesson.contentText ?? "");
  const [published, setPublished] = useState(!!lesson.published);
  const [tagsText, setTagsText] = useState(arrayToLines(lesson.tags));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(lesson.title);
    setOrderIndex(lesson.orderIndex ?? 0);
    setVideoUrl(lesson.videoUrl ?? "");
    setBulletsText(arrayToLines(lesson.bullets));
    setContentText(lesson.contentText ?? "");
    setPublished(!!lesson.published);
    setTagsText(arrayToLines(lesson.tags));
  }, [lesson]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch<any>(`${endpoints.admin.lessons}/${lesson._id}`, {
        method: "PATCH",
        auth: true,
        body: {
          chapterId: lesson.chapterId,
          title: title.trim(),
          orderIndex: Number(orderIndex) || 0,
          videoUrl: videoUrl.trim() || undefined,
          bullets: linesToArray(bulletsText),
          contentText: contentText.trim() || undefined,
          published: !!published,
          tags: linesToArray(tagsText),
        },
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (lesson.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreLesson(lesson._id), { method: "POST", auth: true });
      } else {
        await apiFetch<any>(`${endpoints.admin.lessons}/${lesson._id}`, { method: "DELETE", auth: true });
      }
      await onSaved();
      onClear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Lesson"
      deleted={!!lesson.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant={lesson.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {lesson.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <TextField label="Title" value={title} onChange={setTitle} />
      <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      <TextField label="Video URL" value={videoUrl} onChange={setVideoUrl} />
      <Toggle label="Published" value={published} onChange={setPublished} />
      <TextAreaField label="Bullets (one per line)" value={bulletsText} onChange={setBulletsText} rows={5} />
      <TextAreaField label="Tags (one per line)" value={tagsText} onChange={setTagsText} rows={4} />
      <TextAreaField label="Content Text" value={contentText} onChange={setContentText} rows={10} />
    </EditorCard>
  );
}

function QuizCard({
  lesson,
  quiz,
  loading,
  onReload,
}: {
  lesson: Lesson;
  quiz: Quiz | null;
  loading: boolean;
  onReload: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function newVersion() {
    setSaving(true);
    try {
      await apiFetch<any>(endpoints.admin.createQuizVersionUrl(lesson._id), {
        method: "POST",
        auth: true,
        body: {},
      });
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  async function publishExclusive() {
    setSaving(true);
    try {
      await apiFetch<any>(endpoints.admin.publishQuizExclusive(lesson._id), {
        method: "POST",
        auth: true,
      });
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  async function setPublished(published: boolean) {
    if (!quiz?._id) return;
    setSaving(true);
    try {
      await apiFetch<any>(endpoints.admin.setQuizPublished(quiz._id), {
        method: "POST",
        auth: true,
        body: { published },
      });
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Quiz"
      actions={
        <>
          <Button variant="ghost" onClick={onReload} disabled={loading || saving}>Reload</Button>
          <Button onClick={newVersion} disabled={saving}>New Version</Button>
          <Button variant="ghost" onClick={publishExclusive} disabled={saving}>Publish Exclusive</Button>
        </>
      }
    >
      {loading ? (
        <div className="text-sm text-white/50">Loading latest quiz...</div>
      ) : !quiz ? (
        <div className="text-sm text-white/50">No quiz found for this lesson yet.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Version" value={String(quiz.version)} />
            <Info label="Published" value={quiz.published ? "Yes" : "No"} />
            <Info label="Source" value={quiz.source ?? "-"} />
            <Info label="Difficulty" value={quiz.difficulty ?? "-"} />
            <Info label="Questions" value={String(Array.isArray(quiz.questions) ? quiz.questions.length : 0)} />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setPublished(true)} disabled={saving}>Publish</Button>
            <Button variant="ghost" onClick={() => setPublished(false)} disabled={saving}>Unpublish</Button>
          </div>
        </div>
      )}
    </EditorCard>
  );
}

function EditorCard({
  title,
  deleted,
  children,
  actions,
}: {
  title: string;
  deleted?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25">
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="font-medium">{title}</div>
          {deleted && (
            <span className="rounded-full border border-red-400/20 px-2 py-0.5 text-[10px] text-red-300">
              deleted
            </span>
          )}
        </div>
        <div className="flex gap-2">{actions}</div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}