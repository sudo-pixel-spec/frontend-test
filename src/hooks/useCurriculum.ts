"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";

export type Subject = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  totalLessons: number;
  completedLessons: number;
  xpValue: number;
  color?: string;
};

export type LessonNodeData = {
  id: string;
  title: string;
  status: "locked" | "available" | "completed";
  xp: number;
};

export function useCurriculum() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSubjects() {
    try {
      setLoading(true);
      const res = await apiFetch<Subject[]>(endpoints.curriculum.subjects);
      setSubjects(res || []);
    } catch (err: any) {
      setError(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }

  async function getLessonsForSubject(subjectId: string) {
    try {
      const res = await apiFetch<LessonNodeData[]>(`${endpoints.curriculum.lessons}?subjectId=${subjectId}`);
      return res;
    } catch (err) {
      console.error("Failed to fetch lessons", err);
      return [];
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  return { subjects, loading, error, reload: loadSubjects, getLessonsForSubject };
}
