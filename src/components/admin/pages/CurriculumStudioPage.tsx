"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  questions?: any[];
  deletedAt?: string | null;
};

type StudioLevel = "standard" | "subject" | "unit" | "chapter" | "lesson";
type ToastTone = "success" | "error" | "info";
type LessonTab = "content" | "quiz" | "publish";

function linesToArray(s: string) {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrayToLines(arr?: string[]) {
  return (arr ?? []).join("\n");
}

function getErrorMessage(e: any, fallback: string) {
  return e?.message || e?.response?.data?.message || fallback;
}

export default function CurriculumStudioPage() {
  const router = useRouter();

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

  const [activeLevel, setActiveLevel] = useState<StudioLevel>("standard");
  const [lessonTab, setLessonTab] = useState<LessonTab>("content");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const selectedStandard = standards.find((x) => x._id === selectedStandardId) ?? null;
  const selectedSubject = subjects.find((x) => x._id === selectedSubjectId) ?? null;
  const selectedUnit = units.find((x) => x._id === selectedUnitId) ?? null;
  const selectedChapter = chapters.find((x) => x._id === selectedChapterId) ?? null;
  const selectedLesson = lessons.find((x) => x._id === selectedLessonId) ?? null;

  function notify(message: string, tone: ToastTone = "success") {
    setToast({ message, tone });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }

  async function loadStandards() {
    const res = await apiFetch<any>(`${endpoints.admin.standards}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const list = normalizeArray<Standard>(res).sort((a, b) =>
      `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`)
    );
    setStandards(list);
  }

  async function loadSubjects(standardId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.subjects}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const list = normalizeArray<Subject>(res)
      .filter((x) => x.standardId === standardId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setSubjects(list);
  }

  async function loadUnits(subjectId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.units}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const list = normalizeArray<Unit>(res)
      .filter((x) => x.subjectId === subjectId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setUnits(list);
  }

  async function loadChapters(unitId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.chapters}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const list = normalizeArray<Chapter>(res)
      .filter((x) => x.unitId === unitId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setChapters(list);
  }

  async function loadLessons(chapterId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.lessons}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const list = normalizeArray<Lesson>(res)
      .filter((x) => x.chapterId === chapterId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setLessons(list);
  }

  async function loadLatestQuiz(lessonId: string) {
    setQuiz(null);
    setQuizError(null);
    if (!lessonId) return;

    setQuizLoading(true);
    try {
      const res = await apiFetch<any>(
        `${endpoints.admin.latestQuizForLesson}?lessonId=${encodeURIComponent(lessonId)}`,
        { auth: true }
      );
      const q = unwrap(res) as Quiz;
      setQuiz(q);
    } catch (e: any) {
      setQuiz(null);
      setQuizError(getErrorMessage(e, "Could not load quiz."));
    } finally {
      setQuizLoading(false);
    }
  }

  async function refreshVisible() {
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
      setErr(getErrorMessage(e, "Failed to load curriculum"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshVisible().catch(() => {});
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setQuizError(null);
    setActiveLevel("subject");
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
    setQuizError(null);
    setActiveLevel("unit");
    await loadUnits(id);
  }

  async function selectUnit(id: string) {
    setSelectedUnitId(id);
    setSelectedChapterId("");
    setSelectedLessonId("");
    setChapters([]);
    setLessons([]);
    setQuiz(null);
    setQuizError(null);
    setActiveLevel("chapter");
    await loadChapters(id);
  }

  async function selectChapter(id: string) {
    setSelectedChapterId(id);
    setSelectedLessonId("");
    setLessons([]);
    setQuiz(null);
    setQuizError(null);
    setActiveLevel("lesson");
    setLessonTab("content");
    await loadLessons(id);
  }

  async function selectLesson(id: string) {
    setSelectedLessonId(id);
    setActiveLevel("lesson");
    setLessonTab("content");
    await loadLatestQuiz(id);
  }

  const pathText = [
    selectedStandard ? selectedStandard.code || selectedStandard.name : "Select Standard",
    selectedSubject?.name ?? "Subject",
    selectedUnit?.name ?? "Unit",
    selectedChapter?.name ?? "Chapter",
    selectedLesson?.title ?? "Lesson",
  ].join("  ›  ");

  return (
    <div className="space-y-5">
      <StudioTopBar
        pathText={pathText}
        onRefresh={refreshVisible}
        loading={loading}
        activeLevel={activeLevel}
        onSetLevel={setActiveLevel}
      />

      {err && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <StudioSidebar
          standards={standards}
          subjects={subjects}
          units={units}
          chapters={chapters}
          lessons={lessons}
          selectedStandardId={selectedStandardId}
          selectedSubjectId={selectedSubjectId}
          selectedUnitId={selectedUnitId}
          selectedChapterId={selectedChapterId}
          selectedLessonId={selectedLessonId}
          onSelectStandard={selectStandard}
          onSelectSubject={selectSubject}
          onSelectUnit={selectUnit}
          onSelectChapter={selectChapter}
          onSelectLesson={selectLesson}
          onActivate={setActiveLevel}
        />

        <StudioWorkspace
          router={router}
          activeLevel={activeLevel}
          lessonTab={lessonTab}
          setLessonTab={setLessonTab}
          standards={standards}
          subjects={subjects}
          units={units}
          chapters={chapters}
          lessons={lessons}
          selectedStandard={selectedStandard}
          selectedSubject={selectedSubject}
          selectedUnit={selectedUnit}
          selectedChapter={selectedChapter}
          selectedLesson={selectedLesson}
          quiz={quiz}
          quizLoading={quizLoading}
          quizError={quizError}
          notify={notify}
          onReloadStandards={loadStandards}
          onReloadSubjects={() => (selectedStandardId ? loadSubjects(selectedStandardId) : Promise.resolve())}
          onReloadUnits={() => (selectedSubjectId ? loadUnits(selectedSubjectId) : Promise.resolve())}
          onReloadChapters={() => (selectedUnitId ? loadChapters(selectedUnitId) : Promise.resolve())}
          onReloadLessons={() => (selectedChapterId ? loadLessons(selectedChapterId) : Promise.resolve())}
          onReloadQuiz={() => (selectedLessonId ? loadLatestQuiz(selectedLessonId) : Promise.resolve())}
          onSelectStandard={selectStandard}
          onSelectSubject={selectSubject}
          onSelectUnit={selectUnit}
          onSelectChapter={selectChapter}
          onSelectLesson={selectLesson}
        />
      </div>

      <ToastView toast={toast} />
    </div>
  );
}

function StudioTopBar({
  pathText,
  onRefresh,
  loading,
  activeLevel,
  onSetLevel,
}: {
  pathText: string;
  onRefresh: () => Promise<void>;
  loading: boolean;
  activeLevel: StudioLevel;
  onSetLevel: (level: StudioLevel) => void;
}) {
  const tabs: StudioLevel[] = ["standard", "subject", "unit", "chapter", "lesson"];

  return (
    <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">Curriculum Studio</div>
            <div className="mt-2 text-sm text-white/75">{pathText}</div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onRefresh()} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onSetLevel(tab)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs capitalize transition",
                activeLevel === tab
                  ? "border-white/25 bg-white/10"
                  : "border-white/10 bg-black/25 hover:bg-white/5",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioSidebar({
  standards,
  subjects,
  units,
  chapters,
  lessons,
  selectedStandardId,
  selectedSubjectId,
  selectedUnitId,
  selectedChapterId,
  selectedLessonId,
  onSelectStandard,
  onSelectSubject,
  onSelectUnit,
  onSelectChapter,
  onSelectLesson,
  onActivate,
}: {
  standards: Standard[];
  subjects: Subject[];
  units: Unit[];
  chapters: Chapter[];
  lessons: Lesson[];
  selectedStandardId: string;
  selectedSubjectId: string;
  selectedUnitId: string;
  selectedChapterId: string;
  selectedLessonId: string;
  onSelectStandard: (id: string) => void | Promise<void>;
  onSelectSubject: (id: string) => void | Promise<void>;
  onSelectUnit: (id: string) => void | Promise<void>;
  onSelectChapter: (id: string) => void | Promise<void>;
  onSelectLesson: (id: string) => void | Promise<void>;
  onActivate: (level: StudioLevel) => void;
}) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="font-medium">Selection Panel</div>
        <div className="mt-1 text-sm text-white/50">Pick the current path. No extra open clicks.</div>
      </div>

      <div className="p-3 space-y-3">
        <SelectionBlock
          label="Standard"
          value={selectedStandardId}
          options={standards.map((x) => ({
            id: x._id,
            label: `${x.code} — ${x.name}${x.deletedAt ? " (deleted)" : ""}`,
          }))}
          onPick={(id) => onSelectStandard(id)}
          onEdit={() => onActivate("standard")}
        />

        <SelectionBlock
          label="Subject"
          value={selectedSubjectId}
          options={subjects.map((x) => ({
            id: x._id,
            label: `${x.name}${x.deletedAt ? " (deleted)" : ""}`,
          }))}
          onPick={(id) => onSelectSubject(id)}
          onEdit={() => onActivate("subject")}
          disabled={!selectedStandardId}
        />

        <SelectionBlock
          label="Unit"
          value={selectedUnitId}
          options={units.map((x) => ({
            id: x._id,
            label: `${x.name}${x.deletedAt ? " (deleted)" : ""}`,
          }))}
          onPick={(id) => onSelectUnit(id)}
          onEdit={() => onActivate("unit")}
          disabled={!selectedSubjectId}
        />

        <SelectionBlock
          label="Chapter"
          value={selectedChapterId}
          options={chapters.map((x) => ({
            id: x._id,
            label: `${x.name}${x.deletedAt ? " (deleted)" : ""}`,
          }))}
          onPick={(id) => onSelectChapter(id)}
          onEdit={() => onActivate("chapter")}
          disabled={!selectedUnitId}
        />

        <SelectionBlock
          label="Lesson"
          value={selectedLessonId}
          options={lessons.map((x) => ({
            id: x._id,
            label: `${x.title}${x.deletedAt ? " (deleted)" : ""}`,
          }))}
          onPick={(id) => onSelectLesson(id)}
          onEdit={() => onActivate("lesson")}
          disabled={!selectedChapterId}
        />
      </div>
    </aside>
  );
}

function SelectionBlock({
  label,
  value,
  options,
  onPick,
  onEdit,
  disabled,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onPick: (id: string) => void | Promise<void>;
  onEdit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-xl border ${disabled ? "border-white/5 opacity-50" : "border-white/10"} bg-black/25 p-3`}>
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>

      <div className="mt-2">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            if (next) onPick(next);
          }}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
        >
          <option value="">{disabled ? "Select previous level first" : `Choose ${label.toLowerCase()}`}</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <Button variant="ghost" onClick={onEdit} disabled={disabled}>
          Edit current
        </Button>
      </div>
    </div>
  );
}

function StudioWorkspace(props: {
  router: ReturnType<typeof useRouter>;
  activeLevel: StudioLevel;
  lessonTab: LessonTab;
  setLessonTab: (tab: LessonTab) => void;
  standards: Standard[];
  subjects: Subject[];
  units: Unit[];
  chapters: Chapter[];
  lessons: Lesson[];
  selectedStandard: Standard | null;
  selectedSubject: Subject | null;
  selectedUnit: Unit | null;
  selectedChapter: Chapter | null;
  selectedLesson: Lesson | null;
  quiz: Quiz | null;
  quizLoading: boolean;
  quizError: string | null;
  notify: (message: string, tone?: ToastTone) => void;
  onReloadStandards: () => Promise<void>;
  onReloadSubjects: () => Promise<void>;
  onReloadUnits: () => Promise<void>;
  onReloadChapters: () => Promise<void>;
  onReloadLessons: () => Promise<void>;
  onReloadQuiz: () => Promise<void>;
  onSelectStandard: (id: string) => Promise<void>;
  onSelectSubject: (id: string) => Promise<void>;
  onSelectUnit: (id: string) => Promise<void>;
  onSelectChapter: (id: string) => Promise<void>;
  onSelectLesson: (id: string) => Promise<void>;
}) {
  const {
    router,
    activeLevel,
    lessonTab,
    setLessonTab,
    standards,
    subjects,
    units,
    chapters,
    lessons,
    selectedStandard,
    selectedSubject,
    selectedUnit,
    selectedChapter,
    selectedLesson,
    quiz,
    quizLoading,
    quizError,
    notify,
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
  } = props;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="font-medium">Workspace</div>
        <div className="mt-1 text-sm text-white/50">
          Manage structure, lesson content, and publishing. Quiz creation now happens from the Quizzes page.
        </div>
      </div>

      <div className="p-5">
        {activeLevel === "standard" && (
          <StandardWorkspace
            standards={standards}
            selectedStandard={selectedStandard}
            onReload={onReloadStandards}
            onSelect={onSelectStandard}
            notify={notify}
          />
        )}

        {activeLevel === "subject" && (
          <SubjectWorkspace
            selectedStandard={selectedStandard}
            subjects={subjects}
            selectedSubject={selectedSubject}
            onReload={onReloadSubjects}
            onSelect={onSelectSubject}
            notify={notify}
          />
        )}

        {activeLevel === "unit" && (
          <UnitWorkspace
            selectedSubject={selectedSubject}
            units={units}
            selectedUnit={selectedUnit}
            onReload={onReloadUnits}
            onSelect={onSelectUnit}
            notify={notify}
          />
        )}

        {activeLevel === "chapter" && (
          <ChapterWorkspace
            selectedUnit={selectedUnit}
            chapters={chapters}
            selectedChapter={selectedChapter}
            onReload={onReloadChapters}
            onSelect={onSelectChapter}
            notify={notify}
          />
        )}

        {activeLevel === "lesson" && (
          <LessonWorkspace
            router={router}
            lessonTab={lessonTab}
            setLessonTab={setLessonTab}
            selectedChapter={selectedChapter}
            lessons={lessons}
            selectedLesson={selectedLesson}
            quiz={quiz}
            quizLoading={quizLoading}
            quizError={quizError}
            notify={notify}
            onReloadLessons={onReloadLessons}
            onReloadQuiz={onReloadQuiz}
            onSelectLesson={onSelectLesson}
          />
        )}
      </div>
    </section>
  );
}

function StandardWorkspace({
  standards,
  selectedStandard,
  onReload,
  onSelect,
  notify,
}: {
  standards: Standard[];
  selectedStandard: Standard | null;
  onReload: () => Promise<void>;
  onSelect: (id: string) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Standards" subtitle="Create and manage standards." />
      <CreateStandardInline
        notify={notify}
        onCreated={async (created) => {
          await onReload();
          await onSelect(created._id);
        }}
      />
      <EntityListGrid
        items={standards.map((x) => ({
          id: x._id,
          title: `${x.code} — ${x.name}`,
          deleted: !!x.deletedAt,
          active: selectedStandard?._id === x._id,
        }))}
        onSelect={onSelect}
      />
      {selectedStandard && (
        <StandardEditorCard standard={selectedStandard} onSaved={onReload} onClear={() => {}} notify={notify} />
      )}
    </div>
  );
}

function SubjectWorkspace({
  selectedStandard,
  subjects,
  selectedSubject,
  onReload,
  onSelect,
  notify,
}: {
  selectedStandard: Standard | null;
  subjects: Subject[];
  selectedSubject: Subject | null;
  onReload: () => Promise<void>;
  onSelect: (id: string) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  if (!selectedStandard) return <EmptyWorkspace text="Select a standard first." />;

  return (
    <div className="space-y-5">
      <SectionTitle
        title={`Subjects in ${selectedStandard.code || selectedStandard.name}`}
        subtitle="Add and manage subjects."
      />
      <CreateSubjectInline
        standardId={selectedStandard._id}
        notify={notify}
        onCreated={async (created) => {
          await onReload();
          await onSelect(created._id);
        }}
      />
      <EntityListGrid
        items={subjects.map((x) => ({
          id: x._id,
          title: x.name,
          subtitle: `Order ${x.orderIndex ?? 0}`,
          deleted: !!x.deletedAt,
          active: selectedSubject?._id === x._id,
        }))}
        onSelect={onSelect}
      />
      {selectedSubject && (
        <SubjectEditorCard subject={selectedSubject} onSaved={onReload} onClear={() => {}} notify={notify} />
      )}
    </div>
  );
}

function UnitWorkspace({
  selectedSubject,
  units,
  selectedUnit,
  onReload,
  onSelect,
  notify,
}: {
  selectedSubject: Subject | null;
  units: Unit[];
  selectedUnit: Unit | null;
  onReload: () => Promise<void>;
  onSelect: (id: string) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  if (!selectedSubject) return <EmptyWorkspace text="Select a subject first." />;

  return (
    <div className="space-y-5">
      <SectionTitle title={`Units in ${selectedSubject.name}`} subtitle="Add and manage units." />
      <CreateUnitInline
        subjectId={selectedSubject._id}
        notify={notify}
        onCreated={async (created) => {
          await onReload();
          await onSelect(created._id);
        }}
      />
      <EntityListGrid
        items={units.map((x) => ({
          id: x._id,
          title: x.name,
          subtitle: `Order ${x.orderIndex ?? 0}`,
          deleted: !!x.deletedAt,
          active: selectedUnit?._id === x._id,
        }))}
        onSelect={onSelect}
      />
      {selectedUnit && <UnitEditorCard unit={selectedUnit} onSaved={onReload} onClear={() => {}} notify={notify} />}
    </div>
  );
}

function ChapterWorkspace({
  selectedUnit,
  chapters,
  selectedChapter,
  onReload,
  onSelect,
  notify,
}: {
  selectedUnit: Unit | null;
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onReload: () => Promise<void>;
  onSelect: (id: string) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  if (!selectedUnit) return <EmptyWorkspace text="Select a unit first." />;

  return (
    <div className="space-y-5">
      <SectionTitle title={`Chapters in ${selectedUnit.name}`} subtitle="Add and manage chapters." />
      <CreateChapterInline
        unitId={selectedUnit._id}
        notify={notify}
        onCreated={async (created) => {
          await onReload();
          await onSelect(created._id);
        }}
      />
      <EntityListGrid
        items={chapters.map((x) => ({
          id: x._id,
          title: x.name,
          subtitle: `Order ${x.orderIndex ?? 0}`,
          deleted: !!x.deletedAt,
          active: selectedChapter?._id === x._id,
        }))}
        onSelect={onSelect}
      />
      {selectedChapter && (
        <ChapterEditorCard chapter={selectedChapter} onSaved={onReload} onClear={() => {}} notify={notify} />
      )}
    </div>
  );
}

function LessonWorkspace({
  router,
  lessonTab,
  setLessonTab,
  selectedChapter,
  lessons,
  selectedLesson,
  quiz,
  quizLoading,
  quizError,
  notify,
  onReloadLessons,
  onReloadQuiz,
  onSelectLesson,
}: {
  router: ReturnType<typeof useRouter>;
  lessonTab: LessonTab;
  setLessonTab: (tab: LessonTab) => void;
  selectedChapter: Chapter | null;
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  quiz: Quiz | null;
  quizLoading: boolean;
  quizError: string | null;
  notify: (message: string, tone?: ToastTone) => void;
  onReloadLessons: () => Promise<void>;
  onReloadQuiz: () => Promise<void>;
  onSelectLesson: (id: string) => Promise<void>;
}) {
  if (!selectedChapter) return <EmptyWorkspace text="Select a chapter first." />;

  return (
    <div className="space-y-5">
      <SectionTitle title={`Lessons in ${selectedChapter.name}`} subtitle="Manage lesson content, quiz status, and publishing." />

      <CreateLessonInline
        chapterId={selectedChapter._id}
        notify={notify}
        onCreated={async (created) => {
          await onReloadLessons();
          await onSelectLesson(created._id);
          setLessonTab("content");
        }}
      />

      <EntityListGrid
        items={lessons.map((x) => ({
          id: x._id,
          title: x.title,
          subtitle: `Order ${x.orderIndex ?? 0}${x.published ? " • Published" : ""}`,
          deleted: !!x.deletedAt,
          active: selectedLesson?._id === x._id,
        }))}
        onSelect={onSelectLesson}
      />

      {selectedLesson ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["content", "quiz", "publish"] as LessonTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setLessonTab(tab)}
                className={[
                  "rounded-xl border px-4 py-2 text-sm capitalize transition",
                  lessonTab === tab
                    ? "border-white/25 bg-white/10"
                    : "border-white/10 bg-black/25 hover:bg-white/5",
                ].join(" ")}
              >
                {tab === "content" ? "Lesson Content" : tab === "quiz" ? "Quiz Status" : "Publishing"}
              </button>
            ))}
          </div>

          {lessonTab === "content" && (
            <LessonEditorCard
              lesson={selectedLesson}
              onSaved={onReloadLessons}
              onClear={() => {}}
              notify={notify}
            />
          )}

          {lessonTab === "quiz" && (
            <QuizCard
              router={router}
              lesson={selectedLesson}
              quiz={quiz}
              loading={quizLoading}
              error={quizError}
              notify={notify}
              onReload={onReloadQuiz}
            />
          )}

          {lessonTab === "publish" && (
            <LessonPublishCard lesson={selectedLesson} notify={notify} onSaved={onReloadLessons} />
          )}
        </div>
      ) : (
        <EmptyWorkspace text="Select a lesson to edit content, view quiz status, or manage publishing." />
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/50">{subtitle}</div>
    </div>
  );
}

function EmptyWorkspace({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-8 text-sm text-white/45">
      {text}
    </div>
  );
}

function EntityListGrid({
  items,
  onSelect,
}: {
  items: { id: string; title: string; subtitle?: string; deleted?: boolean; active?: boolean }[];
  onSelect: (id: string) => Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/45">
        No items yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={[
            "rounded-xl border p-4 text-left transition",
            item.active ? "border-white/25 bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-medium">{item.title}</div>
              {item.subtitle && <div className="mt-1 text-sm text-white/50">{item.subtitle}</div>}
            </div>
            {item.deleted && <span className="text-[10px] text-red-300">deleted</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

function CreateStandardInline({
  onCreated,
  notify,
}: {
  onCreated: (created: Standard) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
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
      await onCreated(created);
      setCode("");
      setName("");
      notify("Standard created.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not create standard."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InlineCreateCard
      title="Create Standard"
      actions={<Button onClick={save} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Code" value={code} onChange={setCode} placeholder="STD-8" />
        <TextField label="Name" value={name} onChange={setName} placeholder="Class 8" />
      </div>
    </InlineCreateCard>
  );
}

function CreateSubjectInline({
  standardId,
  onCreated,
  notify,
}: {
  standardId: string;
  onCreated: (created: Subject) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.subjects, {
        method: "POST",
        auth: true,
        body: { standardId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      const created = unwrap(res) as Subject;
      await onCreated(created);
      setName("");
      setOrderIndex(0);
      notify("Subject created.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not create subject."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InlineCreateCard
      title="Add Subject"
      actions={<Button onClick={save} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={name} onChange={setName} placeholder="Mathematics" />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </InlineCreateCard>
  );
}

function CreateUnitInline({
  subjectId,
  onCreated,
  notify,
}: {
  subjectId: string;
  onCreated: (created: Unit) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.units, {
        method: "POST",
        auth: true,
        body: { subjectId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      const created = unwrap(res) as Unit;
      await onCreated(created);
      setName("");
      setOrderIndex(0);
      notify("Unit created.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not create unit."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InlineCreateCard
      title="Add Unit"
      actions={<Button onClick={save} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={name} onChange={setName} placeholder="Algebra" />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </InlineCreateCard>
  );
}

function CreateChapterInline({
  unitId,
  onCreated,
  notify,
}: {
  unitId: string;
  onCreated: (created: Chapter) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>(endpoints.admin.chapters, {
        method: "POST",
        auth: true,
        body: { unitId, name: name.trim(), orderIndex: Number(orderIndex) || 0 },
      });
      const created = unwrap(res) as Chapter;
      await onCreated(created);
      setName("");
      setOrderIndex(0);
      notify("Chapter created.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not create chapter."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InlineCreateCard
      title="Add Chapter"
      actions={<Button onClick={save} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={name} onChange={setName} placeholder="Chapter 1" />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </InlineCreateCard>
  );
}

function CreateLessonInline({
  chapterId,
  onCreated,
  notify,
}: {
  chapterId: string;
  onCreated: (created: Lesson) => Promise<void>;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return;
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
      await onCreated(created);
      setTitle("");
      setOrderIndex(0);
      notify("Lesson created.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not create lesson."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InlineCreateCard
      title="Add Lesson"
      actions={<Button onClick={save} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Title" value={title} onChange={setTitle} placeholder="Introduction to Algebra" />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </InlineCreateCard>
  );
}

function InlineCreateCard({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="font-medium">{title}</div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StandardEditorCard({
  standard,
  onSaved,
  onClear,
  notify,
}: {
  standard: Standard;
  onSaved: () => Promise<void>;
  onClear: () => void;
  notify: (message: string, tone?: ToastTone) => void;
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
      notify("Standard saved.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not save standard."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (standard.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreStandard(standard._id), { method: "PATCH", auth: true });
        notify("Standard restored.");
      } else {
        await apiFetch<any>(`${endpoints.admin.standards}/${standard._id}`, { method: "DELETE", auth: true });
        notify("Standard deleted.");
      }
      await onSaved();
      onClear();
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update standard."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Edit Standard"
      deleted={!!standard.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button variant={standard.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {standard.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Code" value={code} onChange={setCode} />
        <TextField label="Name" value={name} onChange={setName} />
      </div>
    </EditorCard>
  );
}

function SubjectEditorCard({
  subject,
  onSaved,
  onClear,
  notify,
}: {
  subject: Subject;
  onSaved: () => Promise<void>;
  onClear: () => void;
  notify: (message: string, tone?: ToastTone) => void;
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
      notify("Subject saved.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not save subject."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (subject.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreSubject(subject._id), { method: "PATCH", auth: true });
        notify("Subject restored.");
      } else {
        await apiFetch<any>(`${endpoints.admin.subjects}/${subject._id}`, { method: "DELETE", auth: true });
        notify("Subject deleted.");
      }
      await onSaved();
      onClear();
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update subject."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Edit Subject"
      deleted={!!subject.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button variant={subject.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {subject.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={name} onChange={setName} />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </EditorCard>
  );
}

function UnitEditorCard({
  unit,
  onSaved,
  onClear,
  notify,
}: {
  unit: Unit;
  onSaved: () => Promise<void>;
  onClear: () => void;
  notify: (message: string, tone?: ToastTone) => void;
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
      notify("Unit saved.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not save unit."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (unit.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreUnit(unit._id), { method: "PATCH", auth: true });
        notify("Unit restored.");
      } else {
        await apiFetch<any>(`${endpoints.admin.units}/${unit._id}`, { method: "DELETE", auth: true });
        notify("Unit deleted.");
      }
      await onSaved();
      onClear();
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update unit."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Edit Unit"
      deleted={!!unit.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button variant={unit.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {unit.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={name} onChange={setName} />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </EditorCard>
  );
}

function ChapterEditorCard({
  chapter,
  onSaved,
  onClear,
  notify,
}: {
  chapter: Chapter;
  onSaved: () => Promise<void>;
  onClear: () => void;
  notify: (message: string, tone?: ToastTone) => void;
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
      notify("Chapter saved.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not save chapter."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (chapter.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreChapter(chapter._id), { method: "PATCH", auth: true });
        notify("Chapter restored.");
      } else {
        await apiFetch<any>(`${endpoints.admin.chapters}/${chapter._id}`, { method: "DELETE", auth: true });
        notify("Chapter deleted.");
      }
      await onSaved();
      onClear();
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update chapter."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Edit Chapter"
      deleted={!!chapter.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button variant={chapter.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {chapter.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={name} onChange={setName} />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
    </EditorCard>
  );
}

function LessonEditorCard({
  lesson,
  onSaved,
  onClear,
  notify,
}: {
  lesson: Lesson;
  onSaved: () => Promise<void>;
  onClear: () => void;
  notify: (message: string, tone?: ToastTone) => void;
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
      notify("Lesson saved.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not save lesson."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrRestore() {
    setSaving(true);
    try {
      if (lesson.deletedAt) {
        await apiFetch<any>(endpoints.admin.restoreLesson(lesson._id), { method: "PATCH", auth: true });
        notify("Lesson restored.");
      } else {
        await apiFetch<any>(`${endpoints.admin.lessons}/${lesson._id}`, { method: "DELETE", auth: true });
        notify("Lesson deleted.");
      }
      await onSaved();
      onClear();
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update lesson."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Edit Lesson Content"
      deleted={!!lesson.deletedAt}
      actions={
        <>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Lesson"}</Button>
          <Button variant={lesson.deletedAt ? "default" : "danger"} onClick={removeOrRestore} disabled={saving}>
            {lesson.deletedAt ? "Restore" : "Delete"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Title" value={title} onChange={setTitle} />
        <NumberField label="Order" value={orderIndex} onChange={setOrderIndex} />
      </div>
      <TextField label="Video URL" value={videoUrl} onChange={setVideoUrl} />
      <Toggle label="Published" value={published} onChange={setPublished} />
      <TextAreaField label="Bullets (one per line)" value={bulletsText} onChange={setBulletsText} rows={5} />
      <TextAreaField label="Tags (one per line)" value={tagsText} onChange={setTagsText} rows={4} />
      <TextAreaField label="Content Text" value={contentText} onChange={setContentText} rows={10} />
    </EditorCard>
  );
}

function LessonPublishCard({
  lesson,
  notify,
  onSaved,
}: {
  lesson: Lesson;
  notify: (message: string, tone?: ToastTone) => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function setPublished(published: boolean) {
    setSaving(true);
    try {
      await apiFetch<any>(`${endpoints.admin.lessons}/${lesson._id}`, {
        method: "PATCH",
        auth: true,
        body: {
          chapterId: lesson.chapterId,
          title: lesson.title,
          orderIndex: lesson.orderIndex ?? 0,
          videoUrl: lesson.videoUrl,
          bullets: lesson.bullets ?? [],
          contentText: lesson.contentText,
          published,
          tags: lesson.tags ?? [],
        },
      });
      await onSaved();
      notify(published ? "Lesson published." : "Lesson unpublished.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update lesson publishing."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorCard
      title="Publishing"
      actions={
        <>
          <Button onClick={() => setPublished(true)} disabled={saving}>
            Publish Lesson
          </Button>
          <Button variant="ghost" onClick={() => setPublished(false)} disabled={saving}>
            Unpublish Lesson
          </Button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Info label="Lesson" value={lesson.title} />
        <Info label="Status" value={lesson.published ? "Published" : "Draft"} />
        <Info label="Order" value={String(lesson.orderIndex ?? 0)} />
      </div>
    </EditorCard>
  );
}

function QuizCard({
  router,
  lesson,
  quiz,
  loading,
  error,
  notify,
  onReload,
}: {
  router: ReturnType<typeof useRouter>;
  lesson: Lesson;
  quiz: Quiz | null;
  loading: boolean;
  error: string | null;
  notify: (message: string, tone?: ToastTone) => void;
  onReload: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function publishExclusive() {
    if (!quiz?._id) {
      notify("Create the quiz from the Quiz Builder first.", "error");
      return;
    }

    setSaving(true);
    try {
      await apiFetch<any>(endpoints.admin.publishQuizExclusive(quiz._id), {
        method: "PATCH",
        auth: true,
      });
      await onReload();
      notify("Quiz published exclusively.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not publish quiz exclusively."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function setPublished(published: boolean) {
    if (!quiz?._id) {
      notify("Create the quiz from the Quiz Builder first.", "error");
      return;
    }

    setSaving(true);
    try {
      await apiFetch<any>(endpoints.admin.setQuizPublished(quiz._id), {
        method: "PATCH",
        auth: true,
        body: { published },
      });
      await onReload();
      notify(published ? "Quiz published." : "Quiz unpublished.");
    } catch (e: any) {
      notify(getErrorMessage(e, "Could not update quiz publish state."), "error");
    } finally {
      setSaving(false);
    }
  }

  const questionCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="font-medium text-base">Quiz Status</div>
            <div className="mt-1 text-sm text-white/50">{lesson.title}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => router.push(`/admin/quizzes?lesson=${lesson._id}`)}
            >
              Open Quiz Builder
            </Button>
            <Button variant="ghost" onClick={onReload} disabled={loading || saving}>
              Reload
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/50">
            Loading quiz...
          </div>
        ) : error && !String(error).toLowerCase().includes("no quiz for lesson") ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            <div className="text-sm font-medium text-red-200">Could not load quiz</div>
            <div className="mt-1 text-sm text-red-200/80">{error}</div>
          </div>
        ) : !quiz ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-5">
            <div className="text-base font-medium">No quiz created yet</div>
            <div className="mt-2 text-sm text-white/50">
              Build questions and create the first quiz for this lesson in Quiz Builder.
            </div>
            <div className="mt-5">
              <Button onClick={() => router.push(`/admin/quizzes?lesson=${lesson._id}`)}>
                Create Quiz
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <QuizInfoCard label="Version" value={`v${quiz.version}`} />
              <QuizInfoCard label="Status" value={quiz.published ? "Published" : "Draft"} />
              <QuizInfoCard label="Difficulty" value={quiz.difficulty ?? "-"} />
              <QuizInfoCard label="Questions" value={String(questionCount)} />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="text-sm font-medium">Actions</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => setPublished(true)} disabled={saving}>
                  Publish
                </Button>
                <Button variant="ghost" onClick={() => setPublished(false)} disabled={saving}>
                  Unpublish
                </Button>
                <Button variant="ghost" onClick={publishExclusive} disabled={saving}>
                  Publish Exclusive
                </Button>
                <Button variant="ghost" onClick={() => router.push(`/admin/quizzes?lesson=${lesson._id}`)}>
                  Edit in Quiz Builder
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-sm font-medium">Create or edit quiz</div>
          <div className="mt-1 text-sm text-white/50">
            Open Quiz Builder to add questions, create the first quiz, or create a new version for this lesson.
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
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
      <div className="space-y-4 p-4">{children}</div>
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

function ToastView({
  toast,
}: {
  toast: { tone: ToastTone; message: string } | null;
}) {
  if (!toast) return null;

  const toneClasses =
    toast.tone === "success"
      ? "border-green-400/20 bg-green-500/10 text-green-200"
      : toast.tone === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : "border-white/15 bg-white/10 text-white";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={`rounded-xl border px-4 py-3 text-sm shadow-xl ${toneClasses}`}>
        {toast.message}
      </div>
    </div>
  );
}