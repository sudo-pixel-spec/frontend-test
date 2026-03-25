"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type Me = {
  _id: string;
  email: string;
  role?: "admin" | "user";
};

function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res) return res.data as T;
  return res as T;
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        // If your backend uses a different "me" endpoint, change it here.
        const res = await apiFetch<any>("/me", { auth: true });
        const me = unwrap<Me>(res);

        if (!mounted) return;

        if (me?.role === "admin") {
          setState("ok");
          return;
        }

        setState("denied");
        router.replace("/");
      } catch (e: any) {
        if (!mounted) return;
        setState("denied");
        router.replace("/auth/login");
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <div className="text-white/70 text-sm">Checking admin access…</div>
      </div>
    );
  }

  if (state === "denied") return null;
  return <>{children}</>;
}