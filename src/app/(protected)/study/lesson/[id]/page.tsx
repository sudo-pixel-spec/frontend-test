"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import confetti from "canvas-confetti";

type Question = {
  qid: string;
  prompt: string;
  options: string[];
};

type Quiz = {
  _id: string;
  lessonId: string;
  questions: Question[];
};

type Lesson = {
  _id: string;
  title: string;
  videoUrl?: string;
  bullets?: string[];
  contentText?: string;
};

export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 1. Fetch Lesson Data
  const lessonQuery = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => apiFetch<Lesson>(endpoints.curriculum.lessonById(id as string)),
  });

  // 2. Fetch Quiz Data
  const quizQuery = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => apiFetch<Quiz>(endpoints.curriculum.quizForLesson(id as string)),
  });

  // 3. Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (data: any) => apiFetch<any>(endpoints.attempt.submit, {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: (res) => {
      setResult(res.data);
      setIsSubmitted(true);
      if (res.data.score === quizQuery.data?.questions.length) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22d3ee", "#a855f7", "#ffffff"]
        });
      }
    }
  });

  const lesson = lessonQuery.data;
  const quiz = quizQuery.data;

  const handleSubmit = () => {
    if (!quiz) return;
    const items = Object.entries(selectedAnswers).map(([qid, index]) => ({
      qid,
      selectedIndex: index
    }));

    submitMutation.mutate({
      lessonId: id,
      answers: items,
      timeSpentSec: 60, // Dummy time for now
      idempotencyKey: `lesson-${id}-${Date.now()}`
    });
  };

  const isComplete = useMemo(() => {
     return quiz?.questions.every(q => selectedAnswers[q.qid] !== undefined);
  }, [quiz, selectedAnswers]);

  if (lessonQuery.isLoading || quizQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <p className="text-white/40">Loading your lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center">
        <p className="text-white/60">Lesson not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-cyan-400 font-bold">← Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button onClick={() => router.back()} className="text-white/30 hover:text-white mb-4 transition text-sm flex items-center gap-2">
           <span>‹</span> Back to Study
        </button>
        <h1 className="text-4xl font-black text-white">{lesson.title}</h1>
      </motion.div>

      {/* Video Section */}
      {lesson.videoUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="aspect-video rounded-3xl overflow-hidden mb-8 glass-card border-none bg-black/40">
           <iframe 
             src={lesson.videoUrl.replace("watch?v=", "embed/")} 
             className="w-full h-full" 
             allowFullScreen
           />
        </motion.div>
      )}

      {/* Content Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-8 mb-12">
        <h2 className="text-xl font-bold mb-4 text-white/90">Summary</h2>
        {lesson.bullets && lesson.bullets.length > 0 ? (
          <ul className="space-y-4">
            {lesson.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-4 text-white/60 leading-relaxed">
                <span className="text-cyan-400 font-bold">0{i+1}.</span>
                {bullet}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/60 italic">No summary available for this lesson.</p>
        )}
      </motion.div>

      {/* Quiz Section */}
      <div className="space-y-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-2xl font-black text-white px-4">Take the Quiz</h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {!quiz ? (
          <div className="text-center p-12 glass-card">
            <p className="text-white/30">No quiz available for this lesson yet.</p>
          </div>
        ) : isSubmitted ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-12 text-center">
             <div className="w-24 h-24 rounded-full bg-cyan-400/20 flex items-center justify-center text-5xl mx-auto mb-6">
                🎉
             </div>
             <h2 className="text-3xl font-black text-white mb-2">Lesson Complete!</h2>
             <p className="text-white/50 mb-8">Great job on finishing the lesson and the quiz.</p>
             
             <div className="flex justify-center gap-8 mb-10">
                <div>
                   <p className="text-3xl font-black text-cyan-400">+{result?.xpAwarded || 0}</p>
                   <p className="text-xs text-white/30 uppercase tracking-widest font-bold">XP Earned</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                   <p className="text-3xl font-black text-purple-400">{result?.score}/{result?.total}</p>
                   <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Score</p>
                </div>
             </div>

             <button 
               onClick={() => router.push("/study")}
               className="px-8 py-4 rounded-2xl bg-white text-black font-black hover:scale-105 transition active:scale-95"
             >
               Continue Learning
             </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {quiz.questions.map((q, qIndex) => (
              <motion.div 
                key={q.qid}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-8"
              >
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Question {qIndex + 1}</p>
                <h3 className="text-xl font-bold text-white mb-6">{q.prompt}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[q.qid] === oIndex;
                    return (
                      <button
                        key={oIndex}
                        onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.qid]: oIndex }))}
                        className={`p-4 rounded-2xl text-left transition-all border-2 ${
                          isSelected 
                          ? "bg-cyan-400/10 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? "bg-cyan-400 text-black" : "bg-white/10 text-white/40"}`}>
                              {String.fromCharCode(65 + oIndex)}
                           </div>
                           {option}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}

            <div className="flex justify-center pt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!isComplete || submitMutation.isPending}
                onClick={handleSubmit}
                className={`px-12 py-5 rounded-2xl font-black text-lg shadow-xl transition-all ${
                  isComplete 
                  ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white" 
                  : "bg-white/10 text-white/20 cursor-not-allowed"
                }`}
              >
                {submitMutation.isPending ? "Submitting..." : "Complete Lesson"}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
