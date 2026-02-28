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
  },
} as const;