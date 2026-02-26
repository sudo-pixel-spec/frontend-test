import { create } from "zustand";

export type User = {
  _id: string;
  email: string;
  role: "admin" | "learner";
  name?: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string | null, user?: User | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user = null) => set({ accessToken: token, user }),
  clear: () => set({ accessToken: null, user: null }),
}));