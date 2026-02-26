import { apiFetch } from "./api";
import { useAuthStore, User } from "./auth.store";

export async function requestOtp(email: string) {
  return apiFetch<{ ok: true }>(`/auth/request-otp`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, otp: string) {
  const res = await apiFetch<{ accessToken: string; user: User }>(`/auth/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

  useAuthStore.getState().setAuth(res.accessToken, res.user);
  return res;
}

export async function googleSignIn(credential: string) {
  const res = await apiFetch<{ accessToken: string; user: User }>(`/auth/google`, {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

  useAuthStore.getState().setAuth(res.accessToken, res.user);
  return res;
}

export async function logout() {
  await apiFetch(`/auth/logout`, { method: "POST" });
  useAuthStore.getState().clear();
}