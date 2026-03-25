"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserProfile = {
  fullName?: string;
  avatarUrl?: string;
  standard?: string;
  timezone?: string;
  school?: string;
  age?: number;
};

export type UserWallet = {
  coins?: number;
  diamonds?: number;
};

export type User = {
  id: string;
  phone?: string;
  email?: string;
  role: "admin" | "learner";
  adminType?: "super" | "regular";
  allocatedStandards?: string[];
  profileComplete?: boolean;
  onboardingComplete?: boolean;
  profile?: UserProfile;
  totalXP?: number;
  level?: number;
  streakCount?: number;
  completedLessons?: number;
  wallet?: UserWallet;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string | null, user?: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  clear: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,

      setAuth: (token, user = null) =>
        set({
          accessToken: token,
          user,
        }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      clear: () =>
        set({
          accessToken: null,
          user: null,
        }),

      setHydrated: (value) =>
        set({
          hydrated: value,
        }),
    }),
    {
      name: "auth-store",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);