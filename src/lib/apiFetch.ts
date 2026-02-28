import { useAuthStore } from "./auth.store";
import { endpoints } from "./endpoints";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

type FetchOptions = RequestInit & {
  retryOn401?: boolean;
  auth?: boolean;
};

type OkShape<T = any> = { ok: true; data: T };

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { accessToken, setAuth, clear } = useAuthStore.getState();

  const authEnabled = options.auth !== false;
  const retryOn401 = options.retryOn401 !== false;

  const headers = new Headers(options.headers || {});

  let body: any = options.body;
  const isPlainObject =
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  if (isPlainObject) {
    body = JSON.stringify(body);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  } else if (typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authEnabled && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  if (res.status === 401 && retryOn401 && authEnabled) {
    const refreshed = await fetch(`${BASE}${endpoints.auth.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (refreshed.ok) {
      const refreshPayload = await readJson<any>(refreshed);
      const newToken = refreshPayload?.data?.accessToken;

      if (typeof newToken === "string" && newToken.length > 10) {
        setAuth(newToken);
        return apiFetch<T>(path, { ...options, retryOn401: false, auth: authEnabled });
      }
    }

    clear();
  }

  const payload = await readJson<any>(res);

  if (!res.ok) {
    const rawMsg =
      payload?.message ||
      payload?.error ||
      payload?.data?.message ||
      payload?.data?.error ||
      `Request failed (${res.status})`;
    throw new Error(typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg));
  }

  if (payload && payload.ok === true && "data" in payload) {
    return (payload as OkShape<T>).data;
  }

  return payload as T;
}

async function readJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}