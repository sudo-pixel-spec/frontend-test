"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import TextAreaField from "../ui/TextAreaField";
import NumberField from "../ui/NumberField";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import { normalizeArray, unwrap } from "@/components/admin/lib/normalize";

type Standard = {
  _id: string;
  code: string;
  name: string;
};

type Subject = {
  _id: string;
  standardId: string;
  name: string;
  orderIndex?: number;
};

type Unit = {
  _id: string;
  subjectId: string;
  name: string;
  orderIndex?: number;
};

type Chapter = {
  _id: string;
  unitId: string;
  name: string;
  orderIndex?: number;
};

type Lesson = {
  _id: string;
  chapterId: string;
  title: string;
  orderIndex?: number;
  published?: boolean;
};

type QuizQuestion = {
  qid: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

type Quiz = {
  _id: string;
  lessonId: string;
  version: number;
  source?: "seed" | "ai";
  difficulty?: "easy" | "medium" | "hard";
  published?: boolean;
  deletedAt?: string | null;
  questions?: QuizQuestion[];
};

function getErrorMessage(e: any, fallback: string) {
  return e?.message || e?.response?.data?.message || fallback;
}

function makeQid() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-white/20 disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}

export default function QuizzesPage() {
  const searchParams = useSearchParams();
  const presetLessonId = searchParams.get("lesson") ?? "";

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

  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [answerIndex, setAnswerIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [draftQuestions, setDraftQuestions] = useState<QuizQuestion[]>([]);

  const selectedStandard = standards.find((x) => x._id === selectedStandardId) ?? null;
  const selectedSubject = subjects.find((x) => x._id === selectedSubjectId) ?? null;
  const selectedUnit = units.find((x) => x._id === selectedUnitId) ?? null;
  const selectedChapter = chapters.find((x) => x._id === selectedChapterId) ?? null;
  const selectedLesson = lessons.find((x) => x._id === selectedLessonId) ?? null;

  function flashOk(message: string) {
    setOk(message);
    setErr(null);
  }

  function flashErr(message: string) {
    setErr(message);
    setOk(null);
  }

  function clearMessages() {
    setErr(null);
    setOk(null);
  }

  function resetQuestionForm() {
    setPrompt("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setAnswerIndex(0);
    setExplanation("");
  }

  const currentOptions = useMemo(
    () => [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
    [optionA, optionB, optionC, optionD]
  );

  const canAddQuestion =
    prompt.trim().length > 0 &&
    currentOptions.every((x) => x.length > 0) &&
    answerIndex >= 0 &&
    answerIndex <= 3;

  const canCreateQuiz = selectedLessonId.length > 0 && draftQuestions.length > 0 && !loading;

  const standardOptions = useMemo(
    () =>
      standards.map((s) => ({
        value: s._id,
        label: `${s.code} — ${s.name}`,
      })),
    [standards]
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map((s) => ({
        value: s._id,
        label: s.name,
      })),
    [subjects]
  );

  const unitOptions = useMemo(
    () =>
      units.map((u) => ({
        value: u._id,
        label: u.name,
      })),
    [units]
  );

  const chapterOptions = useMemo(
    () =>
      chapters.map((c) => ({
        value: c._id,
        label: c.name,
      })),
    [chapters]
  );

  const lessonOptions = useMemo(
    () =>
      lessons.map((l) => ({
        value: l._id,
        label: l.title,
      })),
    [lessons]
  );

  async function loadStandards() {
    const res = await apiFetch<any>(`${endpoints.admin.standards}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const items = normalizeArray<Standard>(res).sort((a, b) =>
      `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`)
    );
    setStandards(items);
  }

  async function loadSubjects(standardId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.subjects}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const items = normalizeArray<Subject>(res)
      .filter((x) => x.standardId === standardId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setSubjects(items);
  }

  async function loadUnits(subjectId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.units}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const items = normalizeArray<Unit>(res)
      .filter((x) => x.subjectId === subjectId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setUnits(items);
  }

  async function loadChapters(unitId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.chapters}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const items = normalizeArray<Chapter>(res)
      .filter((x) => x.unitId === unitId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setChapters(items);
  }

  async function loadLessons(chapterId: string) {
    const res = await apiFetch<any>(`${endpoints.admin.lessons}?includeDeleted=true&limit=5000`, {
      auth: true,
    });
    const items = normalizeArray<Lesson>(res)
      .filter((x) => x.chapterId === chapterId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    setLessons(items);
  }

  async function loadLatestQuizForLesson(lessonId: string, keepMessages = false) {
    if (!lessonId) return;

    setLoading(true);
    if (!keepMessages) clearMessages();

    try {
      const res = await apiFetch<any>(
        `${endpoints.admin.latestQuizForLesson}?lessonId=${encodeURIComponent(lessonId)}`,
        { auth: true }
      );
      const data = unwrap<Quiz>(res);
      setQuiz(data ?? null);
      if (!keepMessages) flashOk("Latest quiz loaded.");
    } catch (e: any) {
      const msg = getErrorMessage(e, "Could not load latest quiz.");
      setQuiz(null);

      if (String(msg).toLowerCase().includes("no quiz for lesson")) {
        if (!keepMessages) flashErr("No quiz exists yet for this lesson. Add questions below and create one.");
      } else {
        flashErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      setBootLoading(true);
      try {
        await loadStandards();
      } catch (e: any) {
        flashErr(getErrorMessage(e, "Could not load standards."));
      } finally {
        setBootLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!presetLessonId || !lessons.length) return;
    const found = lessons.find((l) => l._id === presetLessonId);
    if (found && selectedLessonId !== presetLessonId) {
      setSelectedLessonId(presetLessonId);
      loadLatestQuizForLesson(presetLessonId, true).catch(() => {});
    }
  }, [presetLessonId, lessons, selectedLessonId]);

  async function hydratePathFromLessonId(lessonId: string) {
    try {
      const lessonsRes = await apiFetch<any>(`${endpoints.admin.lessons}?includeDeleted=true&limit=5000`, {
        auth: true,
      });
      const allLessons = normalizeArray<Lesson>(lessonsRes);
      const lesson = allLessons.find((x) => x._id === lessonId);
      if (!lesson) return;

      const chaptersRes = await apiFetch<any>(`${endpoints.admin.chapters}?includeDeleted=true&limit=5000`, {
        auth: true,
      });
      const allChapters = normalizeArray<Chapter>(chaptersRes);
      const chapter = allChapters.find((x) => x._id === lesson.chapterId);
      if (!chapter) return;

      const unitsRes = await apiFetch<any>(`${endpoints.admin.units}?includeDeleted=true&limit=5000`, {
        auth: true,
      });
      const allUnits = normalizeArray<Unit>(unitsRes);
      const unit = allUnits.find((x) => x._id === chapter.unitId);
      if (!unit) return;

      const subjectsRes = await apiFetch<any>(`${endpoints.admin.subjects}?includeDeleted=true&limit=5000`, {
        auth: true,
      });
      const allSubjects = normalizeArray<Subject>(subjectsRes);
      const subject = allSubjects.find((x) => x._id === unit.subjectId);
      if (!subject) return;

      const standardsRes = await apiFetch<any>(`${endpoints.admin.standards}?includeDeleted=true&limit=5000`, {
        auth: true,
      });
      const allStandards = normalizeArray<Standard>(standardsRes);
      const standard = allStandards.find((x) => x._id === subject.standardId);
      if (!standard) return;

      setStandards(allStandards.sort((a, b) => `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`)));
      setSelectedStandardId(standard._id);

      const filteredSubjects = allSubjects
        .filter((x) => x.standardId === standard._id)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setSubjects(filteredSubjects);
      setSelectedSubjectId(subject._id);

      const filteredUnits = allUnits
        .filter((x) => x.subjectId === subject._id)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setUnits(filteredUnits);
      setSelectedUnitId(unit._id);

      const filteredChapters = allChapters
        .filter((x) => x.unitId === unit._id)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setChapters(filteredChapters);
      setSelectedChapterId(chapter._id);

      const filteredLessons = allLessons
        .filter((x) => x.chapterId === chapter._id)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setLessons(filteredLessons);
      setSelectedLessonId(lesson._id);

      await loadLatestQuizForLesson(lesson._id, true);
      flashOk("Lesson preselected from Studio.");
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not preselect lesson from Studio."));
    }
  }

  useEffect(() => {
    if (!presetLessonId) return;
    hydratePathFromLessonId(presetLessonId).catch(() => {});
  }, [presetLessonId]);

  async function onSelectStandard(id: string) {
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
    clearMessages();

    if (!id) return;

    try {
      await loadSubjects(id);
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not load subjects."));
    }
  }

  async function onSelectSubject(id: string) {
    setSelectedSubjectId(id);
    setSelectedUnitId("");
    setSelectedChapterId("");
    setSelectedLessonId("");
    setUnits([]);
    setChapters([]);
    setLessons([]);
    setQuiz(null);
    clearMessages();

    if (!id) return;

    try {
      await loadUnits(id);
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not load units."));
    }
  }

  async function onSelectUnit(id: string) {
    setSelectedUnitId(id);
    setSelectedChapterId("");
    setSelectedLessonId("");
    setChapters([]);
    setLessons([]);
    setQuiz(null);
    clearMessages();

    if (!id) return;

    try {
      await loadChapters(id);
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not load chapters."));
    }
  }

  async function onSelectChapter(id: string) {
    setSelectedChapterId(id);
    setSelectedLessonId("");
    setLessons([]);
    setQuiz(null);
    clearMessages();

    if (!id) return;

    try {
      await loadLessons(id);
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not load lessons."));
    }
  }

  async function onSelectLesson(id: string) {
    setSelectedLessonId(id);
    setQuiz(null);
    clearMessages();

    if (!id) return;

    await loadLatestQuizForLesson(id);
  }

  function addDraftQuestion() {
    const p = prompt.trim();
    const opts = currentOptions;

    if (!selectedLessonId) {
      flashErr("Select a lesson first.");
      return;
    }

    if (!p) {
      flashErr("Enter the question text.");
      return;
    }

    if (opts.some((x) => !x)) {
      flashErr("Please fill all 4 options.");
      return;
    }

    if (answerIndex < 0 || answerIndex > 3) {
      flashErr("Correct answer index must be between 0 and 3.");
      return;
    }

    if (!opts[answerIndex]) {
      flashErr("Correct answer points to an empty option.");
      return;
    }

    const q: QuizQuestion = {
      qid: makeQid(),
      prompt: p,
      options: opts,
      answerIndex,
      explanation: explanation.trim() || undefined,
    };

    setDraftQuestions((prev) => [...prev, q]);
    resetQuestionForm();
    flashOk("Question added to draft.");
  }

  function removeDraftQuestion(qid: string) {
    setDraftQuestions((prev) => prev.filter((q) => q.qid !== qid));
    flashOk("Draft question removed.");
  }

  function clearDraft() {
    setDraftQuestions([]);
    flashOk("Draft cleared.");
  }

  async function createQuizVersion(mode: "create" | "new-version") {
    if (!selectedLessonId) {
      flashErr("Select a lesson first.");
      return;
    }

    if (draftQuestions.length < 1) {
      flashErr("Add at least 1 question before creating a quiz.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const payload = {
        lessonId: selectedLessonId,
        difficulty,
        questions: draftQuestions,
      };

      await apiFetch<any>(endpoints.admin.createQuizVersion, {
        method: "POST",
        auth: true,
        body: payload,
      });

      setDraftQuestions([]);
      resetQuestionForm();
      await loadLatestQuizForLesson(selectedLessonId, true);
      flashOk(mode === "create" ? "Quiz created successfully." : "New quiz version created.");
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not create quiz."));
    } finally {
      setLoading(false);
    }
  }

  async function setPublished(published: boolean) {
    if (!quiz?._id) {
      flashErr("Load a quiz first.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await apiFetch<any>(endpoints.admin.setQuizPublished(quiz._id), {
        method: "PATCH",
        auth: true,
        body: { published },
      });

      await loadLatestQuizForLesson(selectedLessonId, true);
      flashOk(published ? "Quiz published." : "Quiz unpublished.");
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not update publish state."));
    } finally {
      setLoading(false);
    }
  }

  async function publishExclusive() {
    if (!quiz?._id) {
      flashErr("Load a quiz first.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await apiFetch<any>(endpoints.admin.publishQuizExclusive(quiz._id), {
        method: "PATCH",
        auth: true,
      });

      await loadLatestQuizForLesson(selectedLessonId, true);
      flashOk("Quiz published exclusively.");
    } catch (e: any) {
      flashErr(getErrorMessage(e, "Could not publish quiz exclusively."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard title="Pick Lesson">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="Standard"
            value={selectedStandardId}
            onChange={onSelectStandard}
            options={standardOptions}
            placeholder={bootLoading ? "Loading standards..." : "Select standard"}
            disabled={bootLoading}
          />

          <SelectField
            label="Subject"
            value={selectedSubjectId}
            onChange={onSelectSubject}
            options={subjectOptions}
            placeholder="Select subject"
            disabled={!selectedStandardId}
          />

          <SelectField
            label="Unit"
            value={selectedUnitId}
            onChange={onSelectUnit}
            options={unitOptions}
            placeholder="Select unit"
            disabled={!selectedSubjectId}
          />

          <SelectField
            label="Chapter"
            value={selectedChapterId}
            onChange={onSelectChapter}
            options={chapterOptions}
            placeholder="Select chapter"
            disabled={!selectedUnitId}
          />

          <SelectField
            label="Lesson"
            value={selectedLessonId}
            onChange={onSelectLesson}
            options={lessonOptions}
            placeholder="Select lesson"
            disabled={!selectedChapterId}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <InfoCard label="Standard" value={selectedStandard ? `${selectedStandard.code} — ${selectedStandard.name}` : "-"} />
          <InfoCard label="Subject" value={selectedSubject?.name ?? "-"} />
          <InfoCard label="Unit" value={selectedUnit?.name ?? "-"} />
          <InfoCard label="Chapter" value={selectedChapter?.name ?? "-"} />
          <InfoCard label="Lesson" value={selectedLesson?.title ?? "-"} />
        </div>

        {presetLessonId && (
          <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
            This lesson was opened from Studio.
          </div>
        )}

        {ok && (
          <div className="mt-4 rounded-xl border border-green-400/20 bg-green-500/10 px-3 py-2 text-sm text-green-200">
            {ok}
          </div>
        )}

        {err && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Build Question">
        <div className="mb-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-sm font-medium">How this works</div>
          <div className="mt-2 text-sm text-white/55">
            Select the lesson from the curriculum path, build at least one question, add it to the draft, then create the quiz.
          </div>
        </div>

        <div className="grid gap-4">
          <TextAreaField
            label="Question"
            value={prompt}
            onChange={setPrompt}
            rows={4}
            placeholder="Enter the question text..."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Option A" value={optionA} onChange={setOptionA} placeholder="Option 1" />
            <TextField label="Option B" value={optionB} onChange={setOptionB} placeholder="Option 2" />
            <TextField label="Option C" value={optionC} onChange={setOptionC} placeholder="Option 3" />
            <TextField label="Option D" value={optionD} onChange={setOptionD} placeholder="Option 4" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <NumberField
              label="Correct Option Index (0-3)"
              value={answerIndex}
              onChange={setAnswerIndex}
            />
            <div>
              <label className="mb-2 block text-sm text-white/70">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-white/20"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
          </div>

          <TextAreaField
            label="Explanation (optional)"
            value={explanation}
            onChange={setExplanation}
            rows={3}
            placeholder="Why is this the correct answer?"
          />

          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-sm font-medium">Answer preview</div>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              {currentOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border px-3 py-2 ${
                    answerIndex === idx
                      ? "border-green-400/30 bg-green-500/10 text-green-200"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <span className="mr-2 font-medium">{idx}.</span>
                  {opt || <span className="text-white/35">Empty option</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={addDraftQuestion} disabled={!canAddQuestion || !selectedLessonId}>
              Add Question
            </Button>
            <Button variant="ghost" onClick={resetQuestionForm}>
              Clear Form
            </Button>
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title={`Draft Questions (${draftQuestions.length})`}
        right={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => createQuizVersion("create")} disabled={!canCreateQuiz}>
              Create Quiz
            </Button>
            <Button variant="ghost" onClick={() => createQuizVersion("new-version")} disabled={!canCreateQuiz}>
              Create New Version
            </Button>
            <Button variant="ghost" onClick={clearDraft} disabled={loading || draftQuestions.length < 1}>
              Clear Draft
            </Button>
          </div>
        }
      >
        {draftQuestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/55">
            Add at least one question to the draft, then create the quiz.
          </div>
        ) : (
          <div className="space-y-3">
            {draftQuestions.map((q, idx) => (
              <div key={q.qid} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Question {idx + 1}</div>
                    <div className="mt-2 text-sm text-white/85">{q.prompt}</div>

                    <div className="mt-3 grid gap-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            i === q.answerIndex
                              ? "border-green-400/30 bg-green-500/10 text-green-200"
                              : "border-white/10 bg-black/20 text-white/65"
                          }`}
                        >
                          <span className="mr-2 font-medium">{i}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="mt-3 text-sm text-white/50">
                        Explanation: {q.explanation}
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" onClick={() => removeDraftQuestion(q.qid)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Latest Quiz">
        {!quiz ? (
          <div className="text-sm text-white/55">No quiz loaded.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <InfoCard label="Version" value={`v${quiz.version}`} />
              <InfoCard label="Status" value={quiz.published ? "Published" : "Draft"} />
              <InfoCard label="Source" value={quiz.source ?? "-"} />
              <InfoCard label="Difficulty" value={quiz.difficulty ?? "-"} />
              <InfoCard
                label="Questions"
                value={String(Array.isArray(quiz.questions) ? quiz.questions.length : 0)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setPublished(true)} disabled={loading}>
                Publish
              </Button>
              <Button variant="ghost" onClick={() => setPublished(false)} disabled={loading}>
                Unpublish
              </Button>
              <Button variant="ghost" onClick={publishExclusive} disabled={loading}>
                Publish Exclusive
              </Button>
            </div>

            {Array.isArray(quiz.questions) && quiz.questions.length > 0 && (
              <div className="space-y-3">
                {quiz.questions.map((q, idx) => (
                  <div key={q.qid || idx} className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm font-medium">Question {idx + 1}</div>
                    <div className="mt-2 text-sm text-white/85">{q.prompt}</div>

                    <div className="mt-3 grid gap-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            i === q.answerIndex
                              ? "border-green-400/30 bg-green-500/10 text-green-200"
                              : "border-white/10 bg-black/20 text-white/65"
                          }`}
                        >
                          <span className="mr-2 font-medium">{i}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="mt-3 text-sm text-white/50">
                        Explanation: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AdminCard>
    </div>
  );
}