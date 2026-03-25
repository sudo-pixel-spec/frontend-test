export const endpoints = {
  auth: {
    requestOtp: "/auth/request-otp",
    verifyOtp: "/auth/verify-otp",
    google: "/auth/google",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },

  user: {
    me: "/me",
    profile: "/me/profile",
    onboarding: "/me/onboarding",
  },

  analytics: {
    overview: "/analytics",
  },

  dashboard: {
    home: "/dashboard/home",
  },

  curriculum: {
    standards: "/curriculum/standards",
    subjects: "/curriculum/subjects",
    units: "/units",
    chapters: "/chapters",
    lessons: "/lessons",
  },

  attempt: {
    start: "/attempts/start",
    submit: "/attempts/submit",
    history: "/attempts/history",
  },

  leaderboard: {
    root: "/leaderboard",
    weekly: "/leaderboard/weekly",
    monthly: "/leaderboard/monthly",
  },

  chat: {
    root: "/chat",
  },

  admin: {
    standards: "/admin/standards",
    subjects: "/admin/subjects",
    units: "/admin/units",
    chapters: "/admin/chapters",
    lessons: "/admin/lessons",

    latestQuizForLesson: "/admin/quizzes/latest",
    latestQuizForLessonUrl: (lessonId: string) => `/admin/quizzes/latest?lessonId=${lessonId}`,
    createQuizVersion: "/admin/quizzes/version",
    createQuizVersionUrl: (lessonId: string) => `/admin/quizzes/version?lessonId=${lessonId}`,

    setQuizPublished: (quizId: string) =>
      `/admin/quizzes/${quizId}/published`,

    publishQuizExclusive: (quizId: string) =>
      `/admin/quizzes/${quizId}/publish`,

    restoreStandard: (id: string) =>
      `/admin/standards/${id}/restore`,

    restoreSubject: (id: string) =>
      `/admin/subjects/${id}/restore`,

    restoreUnit: (id: string) =>
      `/admin/units/${id}/restore`,

    restoreChapter: (id: string) =>
      `/admin/chapters/${id}/restore`,

    restoreLesson: (id: string) =>
      `/admin/lessons/${id}/restore`,

    restoreQuiz: (id: string) =>
      `/admin/quizzes/${id}/restore`,

    jobsStatus: "/admin/jobs/status",
    audit: "/admin/audit",

    // Dashboard metrics
    metrics: "/admin/metrics",

    // User management
    users: "/admin/users",
    userById: (id: string) => `/admin/users/${id}`,
    userProfile: (id: string) => `/admin/users/${id}/profile`,
    userBadges: (id: string) => `/admin/users/${id}/badges`,
    userXP: (id: string) => `/admin/users/${id}/xp`,
    userResetProgress: (id: string) => `/admin/users/${id}/reset-progress`,

    // Admin management
    admins: "/admin/admins",

    // System & Leaderboard
    system: {
      leaderboard: "/admin/system/leaderboard",
      resetLeaderboard: "/admin/system/leaderboard/reset",
      apiLogs: "/admin/system/api-logs",
    },

    // Jobs
    jobs: {
      list: "/admin/jobs",
      retry: (id: string) => `/admin/jobs/${id}/retry`,
      delete: (id: string) => `/admin/jobs/${id}`,
    },

    // Events
    events: "/admin/events",
    eventById: (id: string) => `/admin/events/${id}`,

    // Notifications
    notifications: "/admin/notifications",
 
    // Badges
    badges: "/admin/badges",
    badgeById: (id: string) => `/admin/badges/${id}`,
  },
} as const;