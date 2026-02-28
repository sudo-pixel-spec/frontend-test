"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/auth.store";

type UserShape = {
  id: string;
  email: string;
  role: "learner" | "admin";
  profileComplete: boolean;
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const clear = useAuthStore((s) => s.clear);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meAny = await apiFetch<any>(endpoints.user.me);

        const user: UserShape = (meAny?.user ?? meAny) as UserShape;

        if (!user?.id) throw new Error("Invalid /me response shape");

        if (user.role === "admin") {
          if (!cancelled) setReady(true);
          return;
        }

        if (!user.profileComplete && !pathname.startsWith("/profile/setup")) {
          router.replace("/profile/setup/step-1");
          return;
        }

        if (!cancelled) setReady(true);
      } catch (e) {
        clear();
        router.replace("/auth/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname, clear]);

  if (!ready) return <FullPageLoader />;
  return <>{children}</>;
}