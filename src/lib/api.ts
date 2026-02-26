import { useAuthStore } from "./auth.store";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

type FetchOptions = RequestInit & { retryOn401?: boolean };

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { accessToken, setAuth, clear } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && options.retryOn401 !== false) {
    const refreshed = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (refreshed.ok) {
      const data = (await refreshed.json()) as { accessToken: string };
      setAuth(data.accessToken);
      return apiFetch<T>(path, { ...options, retryOn401: false });
    }

    clear();
  }

  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (json && (json.message || json.error || json?.data?.message)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}