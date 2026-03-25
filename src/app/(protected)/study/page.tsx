"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth.store";

type Lesson = { _id: string; title: string; orderIndex: number; published: boolean; videoUrl?: string; bullets?: string[]; };
type Chapter = { _id: string; name: string; orderIndex: number; lessons?: Lesson[]; };
type Subject = { _id: string; name: string; orderIndex: number; };

const LESSON_XP = 100;

function LessonRow({ lesson, subjectName, chapterName }: { lesson: Lesson; subjectName: string; chapterName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
             style={{ background: "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(168,85,247,0.15))", border: "1px solid rgba(168,85,247,0.25)" }}>
          📖
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{lesson.title}</p>
          <p className="text-xs text-white/30 mt-0.5">⚡ {LESSON_XP} XP</p>
        </div>
        <span className="text-white/20 text-lg">›</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            onClick={() => setOpen(false)}>
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              className="glass-card p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-white/30 mb-1">{subjectName} › {chapterName}</p>
              <h3 className="text-xl font-black text-white mb-2">{lesson.title}</h3>
              {lesson.bullets && lesson.bullets.length > 0 && (
                <ul className="text-sm text-white/50 space-y-1 mb-4 list-disc list-inside">
                  {lesson.bullets.slice(0, 4).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
              <div className="flex gap-3 mt-4 mb-6">
                <div><p className="text-lg font-black text-cyan-400">⚡ {LESSON_XP}</p><p className="text-xs text-white/30">XP Reward</p></div>
                {lesson.videoUrl && <div><p className="text-lg font-black text-purple-400">🎥</p><p className="text-xs text-white/30">Video</p></div>}
              </div>
              <a href={`/study/lesson/${lesson._id}`}>
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)", boxShadow: "0 0 24px rgba(34,211,238,0.25)" }}>
                  Start Lesson →
                </motion.button>
              </a>
              <button onClick={() => setOpen(false)} className="w-full mt-3 text-xs text-white/30 hover:text-white/50 transition">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChapterSection({ chapter, subjectName, subjectId }: { chapter: Chapter; subjectName: string; subjectId: string }) {
  const [open, setOpen] = useState(false);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["lessons", chapter._id],
    queryFn: () => apiFetch<any>(`${endpoints.curriculum.lessons}?chapterId=${chapter._id}&limit=100`).then(
      (res: any) => (Array.isArray(res) ? res : res?.data ?? res?.lessons ?? []) as Lesson[]
    ),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const lessonList = lessons ?? chapter.lessons ?? [];

  return (
    <div className="mb-2">
      <motion.button
        whileHover={{ x: 2 }}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left"
        style={{ background: open ? "rgba(34,211,238,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${open ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)"}` }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
             style={{ background: open ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)" }}>
          {open ? "📂" : "📁"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{chapter.name}</p>
        </div>
        <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-white/30 text-lg">›</motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="ml-4 mt-1.5 space-y-1.5 pb-1">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))
              ) : lessonList.length === 0 ? (
                <p className="text-xs text-white/25 px-4 py-3">No lessons published yet.</p>
              ) : (
                lessonList
                  .sort((a: Lesson, b: Lesson) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .map((lesson: Lesson) => (
                    <LessonRow key={lesson._id} lesson={lesson} subjectName={subjectName} chapterName={chapter.name} />
                  ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubjectSection({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState(false);

  const { data: chaptersRaw, isLoading } = useQuery({
    queryKey: ["chapters", subject._id],
    queryFn: () =>
      apiFetch<any>(`${endpoints.curriculum.chapters}?subjectId=${subject._id}&limit=200`).then(
        (res: any) => (Array.isArray(res) ? res : res?.data ?? res?.chapters ?? []) as Chapter[]
      ),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const chapters = (chaptersRaw ?? []).sort((a: Chapter, b: Chapter) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden mb-3"
    >
      <motion.button
        whileHover={{ backgroundColor: "rgba(168,85,247,0.08)" }}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left transition-all"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
             style={{
               background: open ? "linear-gradient(135deg,#a855f7,#22d3ee)" : "rgba(168,85,247,0.15)",
               boxShadow: open ? "0 0 24px rgba(168,85,247,0.4)" : "none"
             }}>
          📚
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white">{subject.name}</p>
          <p className="text-xs text-white/30 mt-0.5">Tap to explore chapters</p>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} className="text-white/30 text-2xl flex-shrink-0">›</motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="pt-3">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-12 rounded-2xl mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))
                ) : chapters.length === 0 ? (
                  <p className="text-sm text-white/30 py-4 text-center">No chapters available yet.</p>
                ) : (
                  chapters.map((ch: Chapter) => (
                    <ChapterSection key={ch._id} chapter={ch} subjectName={subject.name} subjectId={subject._id} />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StudyPage() {
  const { user } = useAuthStore();
  const standard = user?.profile?.standard;

  const subjectsQuery = useQuery({
    queryKey: ["subjects", standard],
    queryFn: () =>
      apiFetch<any>(
        `${endpoints.curriculum.subjects}${standard ? `?standardId=${standard}&` : "?"}limit=100`
      ).then((res: any) => (Array.isArray(res) ? res : res?.data ?? res?.subjects ?? []) as Subject[]),
    staleTime: 10 * 60_000,
    enabled: true,
  });

  const subjects = (subjectsQuery.data ?? []).sort(
    (a: Subject, b: Subject) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  );

  return (
    <div className="max-w-2xl mx-auto animate-fadeUp">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">📚 Study</h1>
        <p className="text-white/40 text-sm mt-1">
          {standard
            ? `Your curriculum · ${standard.replace("CBSE_", "").replace("_", " ")}`
            : "Browse all subjects below"}
        </p>
      </div>

      {subjectsQuery.isLoading ? (
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="glass-card p-5 mb-3 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl" style={{ background: "rgba(168,85,247,0.1)" }} />
              <div>
                <div className="h-4 w-32 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-3 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
            </div>
          </div>
        ))
      ) : subjects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-white/60 font-semibold">No subjects found</p>
          <p className="text-white/30 text-sm mt-1">
            {standard
              ? "No subjects have been published for your class yet."
              : "Complete onboarding to see your curriculum."}
          </p>
        </div>
      ) : (
        subjects.map((sub: Subject) => (
          <SubjectSection key={sub._id} subject={sub} />
        ))
      )}
    </div>
  );
}
