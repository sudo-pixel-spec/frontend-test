"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import { normalizeArray } from "@/components/admin/lib/normalize";
import { useAuthStore } from "@/lib/auth.store";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

type Standard = { _id: string; code: string; name: string; deletedAt?: string | null };
type Subject  = { _id: string; standardId: string; name: string; deletedAt?: string | null };
type Unit     = { _id: string; subjectId: string; name: string; deletedAt?: string | null };
type Chapter  = { _id: string; unitId: string; name: string; deletedAt?: string | null };
type Lesson   = { _id: string; chapterId: string; title: string; published?: boolean; deletedAt?: string | null };
type Quiz     = { _id: string; lessonId: string; version: number; published?: boolean; deletedAt?: string | null; questions?: any[] };

type Metrics = {
  widgets: {
    totalUsers: number;
    activeUsersToday: number;
    activeUsersWeek: number;
    newRegistrationsMonth: number;
    lessonsCompleted: number;
    quizzesTaken: number;
    system?: {
      status: string;
      uptime: number;
      memory: { rss: number; heapUsed: number; heapTotal: number };
      jobs: { running: number; failed: number; queued: number };
    };
  };
  charts: {
    userGrowth: { date: string; count: number }[];
    dailyActiveUsers: { date: string; count: number }[];
  };
};

function getErrorMessage(e: any, fallback: string) {
  return e?.message || e?.response?.data?.message || fallback;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const isRegular = user?.adminType === "regular";
  const isSuper   = user?.adminType === "super";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [standards, setStandards] = useState<Standard[]>([]);
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [units,     setUnits]     = useState<Unit[]>([]);
  const [chapters,  setChapters]  = useState<Chapter[]>([]);
  const [lessons,   setLessons]   = useState<Lesson[]>([]);
  const [quizzes,   setQuizzes]   = useState<Quiz[]>([]);
  const [jobsEnabled, setJobsEnabled] = useState<boolean | null>(null);
  const [metrics,   setMetrics]   = useState<Metrics | null>(null);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [standardsRes, subjectsRes, unitsRes, chaptersRes, lessonsRes, jobsRes, metricsRes] =
        await Promise.all([
          apiFetch<any>(`${endpoints.admin.standards}?includeDeleted=true&limit=5000`, { auth: true }),
          apiFetch<any>(`${endpoints.admin.subjects}?includeDeleted=true&limit=5000`, { auth: true }),
          apiFetch<any>(`${endpoints.admin.units}?includeDeleted=true&limit=5000`, { auth: true }),
          apiFetch<any>(`${endpoints.admin.chapters}?includeDeleted=true&limit=5000`, { auth: true }),
          apiFetch<any>(`${endpoints.admin.lessons}?includeDeleted=true&limit=5000`, { auth: true }),
          apiFetch<any>(endpoints.admin.jobsStatus, { auth: true }).catch(() => null),
          apiFetch<any>(endpoints.admin.metrics, { auth: true }).catch(() => null),
        ]);

      setStandards(normalizeArray<Standard>(standardsRes));
      setSubjects(normalizeArray<Subject>(subjectsRes));
      setUnits(normalizeArray<Unit>(unitsRes));
      setChapters(normalizeArray<Chapter>(chaptersRes));
      setLessons(normalizeArray<Lesson>(lessonsRes));

      const jobsPayload = jobsRes;
      setJobsEnabled(typeof jobsPayload?.enabled === "boolean" ? jobsPayload.enabled : null);

      const metricsPayload = metricsRes;
      if (metricsPayload?.widgets) setMetrics(metricsPayload);

      const lessonList = normalizeArray<Lesson>(lessonsRes);
      const quizFetches = await Promise.all(
        lessonList.map(async (lesson) => {
          try {
            const res = await apiFetch<any>(
              `${endpoints.admin.latestQuizForLesson}?lessonId=${encodeURIComponent(lesson._id)}`,
              { auth: true }
            );
            return res as Quiz;
          } catch { return null; }
        })
      );
      setQuizzes(quizFetches.filter(Boolean) as Quiz[]);
    } catch (e: any) {
      setErr(getErrorMessage(e, "Could not load dashboard data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll().catch(() => {}); }, []);

  const stats = useMemo(() => {
    const activeStandards = standards.filter((x) => !x.deletedAt);
    const activeSubjects  = subjects.filter((x) => !x.deletedAt);
    const activeUnits     = units.filter((x) => !x.deletedAt);
    const activeChapters  = chapters.filter((x) => !x.deletedAt);
    const activeLessons   = lessons.filter((x) => !x.deletedAt);
    const activeQuizzes   = quizzes.filter((x) => !x.deletedAt);
    const publishedLessons = activeLessons.filter((x) => !!x.published);
    const publishedQuizzes = activeQuizzes.filter((x) => !!x.published);
    const lessonsWithoutQuiz = activeLessons.filter(
      (lesson) => !activeQuizzes.some((quiz) => quiz.lessonId === lesson._id)
    );
    const publishedLessonsWithoutQuiz = publishedLessons.filter(
      (lesson) => !activeQuizzes.some((quiz) => quiz.lessonId === lesson._id)
    );
    const totalQuestionCount = activeQuizzes.reduce(
      (sum, quiz) => sum + (Array.isArray(quiz.questions) ? quiz.questions.length : 0), 0
    );
    return {
      activeStandards: activeStandards.length, activeSubjects: activeSubjects.length,
      activeUnits: activeUnits.length, activeChapters: activeChapters.length,
      activeLessons: activeLessons.length, activeQuizzes: activeQuizzes.length,
      publishedLessons: publishedLessons.length, publishedQuizzes: publishedQuizzes.length,
      lessonsWithoutQuiz: lessonsWithoutQuiz.length,
      publishedLessonsWithoutQuiz: publishedLessonsWithoutQuiz.length,
      totalQuestionCount,
    };
  }, [standards, subjects, units, chapters, lessons, quizzes]);

  const recentLessons = useMemo(() =>
    [...lessons].filter((x) => !x.deletedAt)
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      .slice(0, 6),
    [lessons]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-2xl font-semibold">Admin Dashboard</div>
          <div className="mt-1 text-sm text-white/55">
            Overview of curriculum, users, quiz coverage, and platform health.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => loadAll()} disabled={loading}>Refresh</Button>
          <Link href="/admin/studio"><Button>Open Studio</Button></Link>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</div>
      )}

      {isSuper && (
        <div className="rounded-xl border p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-purple-500/30">
          <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
            <span>👑</span> Super Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-purple-300/80">
            You have full and complete access to all data, curriculum, and settings across the entire platform.
          </p>
        </div>
      )}
      {isRegular && (
        <div className="rounded-xl border p-4 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-teal-500/30">
          <h2 className="text-lg font-bold text-teal-200 flex items-center gap-2">
            <span>🛡️</span> Regular Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-teal-300/80">
            Your access is scoped to your allocated standards — data below reflects only your assigned grades.
          </p>
        </div>
      )}

      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricWidget label="Total Users" value={metrics.widgets.totalUsers} icon="👥" color="blue" loading={loading} />
          <MetricWidget label="Active Today" value={metrics.widgets.activeUsersToday} icon="⚡" color="yellow" loading={loading} />
          <MetricWidget label="Active This Week" value={metrics.widgets.activeUsersWeek} icon="📅" color="teal" loading={loading} />
          <MetricWidget label="New (30d)" value={metrics.widgets.newRegistrationsMonth} icon="🆕" color="purple" loading={loading} />
          <MetricWidget label="Quizzes Taken" value={metrics.widgets.quizzesTaken} icon="📝" color="orange" loading={loading} />
          <MetricWidget label="Completed" value={metrics.widgets.lessonsCompleted} icon="✅" color="green" loading={loading} />
        </div>
      )}

      {isSuper && metrics?.widgets.system && (
        <AdminCard title="Global Platform Health">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/5 p-4 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Server Status</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="text-lg font-medium text-emerald-400">Online</div>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Queue Stats</div>
              <div className="text-lg font-medium">
                {metrics.widgets.system.jobs.running} Active / {metrics.widgets.system.jobs.failed} Failed
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Uptime</div>
              <div className="text-lg font-medium">{Math.floor(metrics.widgets.system.uptime / 3600)}h {Math.floor((metrics.widgets.system.uptime % 3600) / 60)}m</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Memory Usage</div>
              <div className="text-lg font-medium">{Math.round(metrics.widgets.system.memory.heapUsed / 1024 / 1024)} MB</div>
            </div>
          </div>
        </AdminCard>
      )}

      {metrics && (
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminCard title="User Growth (Last 30 Days)">
            <MiniChart data={metrics.charts.userGrowth} color="#818cf8" />
          </AdminCard>
          <AdminCard title="Daily Active Users (Last 7 Days)">
            <MiniChart data={metrics.charts.dailyActiveUsers} color="#34d399" />
          </AdminCard>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Standards"        value={stats.activeStandards}  loading={loading} />
        <StatCard label="Subjects"         value={stats.activeSubjects}   loading={loading} />
        <StatCard label="Units"            value={stats.activeUnits}      loading={loading} />
        <StatCard label="Chapters"         value={stats.activeChapters}   loading={loading} />
        <StatCard label="Lessons"          value={stats.activeLessons}    loading={loading} />
        <StatCard label="Quizzes"          value={stats.activeQuizzes}    loading={loading} />
        <StatCard label="Published Lessons" value={stats.publishedLessons} loading={loading} />
        <StatCard label="Published Quizzes" value={stats.publishedQuizzes} loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard title="Quick Actions">
          <div className="grid gap-3 md:grid-cols-2">
            <QuickLink href="/admin/studio"    title="Curriculum Studio"    desc="Create and manage standards, subjects, units, chapters, and lessons." />
            <QuickLink href="/admin/quizzes"   title="Quiz Builder"         desc="Build lesson quizzes, create new versions, and publish." />
            <QuickLink href="/admin/users"     title="User Management"      desc="View, edit, ban, and manage all learner accounts." />
            <QuickLink href="/admin/jobs"      title="Jobs"                 desc="Check scheduler health and background processing status." />
          </div>
        </AdminCard>
        <AdminCard title="System Snapshot">
          <div className="space-y-3">
            <MiniRow label="Jobs" value={jobsEnabled === null ? "Unknown" : jobsEnabled ? "Enabled" : "Disabled"} />
            <MiniRow label="Lessons without quiz" value={loading ? "..." : String(stats.lessonsWithoutQuiz)} />
            <MiniRow label="Published without quiz" value={loading ? "..." : String(stats.publishedLessonsWithoutQuiz)} />
            <MiniRow label="Total quiz questions" value={loading ? "..." : String(stats.totalQuestionCount)} />
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard title="Curriculum Health">
          <div className="space-y-4">
            <HealthBar label="Lesson quiz coverage" value={stats.activeLessons - stats.lessonsWithoutQuiz} total={stats.activeLessons} loading={loading} />
            <HealthBar label="Published lesson quiz coverage" value={stats.publishedLessons - stats.publishedLessonsWithoutQuiz} total={stats.publishedLessons} loading={loading} />
            <HealthBar label="Quiz publish coverage" value={stats.publishedQuizzes} total={stats.activeQuizzes} loading={loading} />
          </div>
        </AdminCard>
        <AdminCard title="Recent Lessons">
          {loading ? (
            <div className="text-sm text-white/55">Loading lessons...</div>
          ) : recentLessons.length === 0 ? (
            <div className="text-sm text-white/55">No lessons available yet.</div>
          ) : (
            <div className="space-y-3">
              {recentLessons.map((lesson) => (
                <div key={lesson._id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{lesson.title}</div>
                    <div className="mt-1 text-xs text-white/45">{lesson.published ? "Published" : "Draft"}</div>
                  </div>
                  <Link href={`/admin/quizzes?lesson=${lesson._id}`}>
                    <Button variant="ghost">Quiz</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-300",   ring: "border-blue-500/20" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-300", ring: "border-yellow-500/20" },
  teal:   { bg: "bg-teal-500/10",   text: "text-teal-300",   ring: "border-teal-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-300", ring: "border-purple-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-300", ring: "border-orange-500/20" },
  green:  { bg: "bg-green-500/10",  text: "text-green-300",  ring: "border-green-500/20" },
};

function MetricWidget({ label, value, icon, color, loading }: { label: string; value: number; icon: string; color: string; loading: boolean }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className={`rounded-2xl border ${c.ring} ${c.bg} p-5`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/45">
        <span>{icon}</span> {label}
      </div>
      <div className={`mt-3 text-3xl font-bold ${c.text}`}>{loading ? "..." : value.toLocaleString()}</div>
    </div>
  );
}

function MiniChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  if (!data || data.length === 0) {
    return <div className="flex h-32 items-center justify-center text-sm text-white/40">No data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          itemStyle={{ color }}
        />
        <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#grad-${color.replace("#", "")})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{loading ? "..." : value}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl border border-white/10 bg-black/25 p-4 transition hover:bg-white/5">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm text-white/50">{desc}</div>
    </Link>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function HealthBar({ label, value, total, loading }: { label: string; value: number; total: number; loading: boolean }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm text-white/70">{label}</div>
        <div className="text-sm font-medium">{loading ? "..." : `${value}/${total} (${pct}%)`}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/70 transition-all" style={{ width: `${loading ? 0 : pct}%` }} />
      </div>
    </div>
  );
}