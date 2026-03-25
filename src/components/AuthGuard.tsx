"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, user, hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace("/auth/login");
      return;
    }
    if (accessToken && !user?.onboardingComplete && 
        !window.location.pathname.startsWith("/onboarding")) {
      router.replace("/onboarding");
    }
  }, [hydrated, accessToken, user, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}
