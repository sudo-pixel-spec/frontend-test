"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminGuard from "./AdminGuard";
import { useAuthStore } from "@/lib/auth.store";

type NavItem = { href: string; label: string };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const nav: NavItem[] = useMemo(
    () => [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/users", label: "User Management" },
      { href: "/admin/events", label: "Challenges & Events" },
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/studio", label: "Curriculum Studio" },
      { href: "/admin/quizzes", label: "Quiz Builder" },
      { href: "/admin/badges", label: "Badges" },
      { href: "/admin/trash", label: "Trash" },
      { href: "/admin/audit", label: "Audit Logs", superOnly: true },
      { href: "/admin/jobs", label: "System Jobs", superOnly: true },
      { href: "/admin/admins", label: "Admin Accounts", superOnly: true },
      { href: "/admin/system/leaderboard", label: "Leaderboard", superOnly: true },
      { href: "/admin/system/api-logs", label: "API Logs", superOnly: true },
    ],
    []
  );

  const filteredNav = useMemo(() => {
    return nav.filter(item => {
      if ((item as any).superOnly && user?.adminType !== "super") return false;
      return true;
    });
  }, [nav, user]);

  const [open, setOpen] = useState(true);

  useEffect(() => {
    // optional: collapse sidebar on small screens
  }, []);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-black text-white">
        <div className="flex">
          <aside className={`border-r border-white/10 ${open ? "w-64" : "w-16"} transition-all`}>
            <div className="p-4 flex items-center justify-between">
              <button
                className="text-sm px-2 py-1 rounded border border-white/15 hover:bg-white/5"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Collapse" : "Expand"}
              </button>
              {open && (
                <button
                  className="text-sm px-2 py-1 rounded border border-white/15 hover:bg-white/5"
                  onClick={() => router.push("/")}
                >
                  Exit
                </button>
              )}
            </div>

            <nav className="px-2 pb-4 space-y-1">
              {filteredNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-white/10 text-white font-medium"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {open ? item.label : item.label.slice(0, 1)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black/60 backdrop-blur">
              <div className="px-6 py-4">
                <div className="text-xs uppercase tracking-widest text-white/60">Admin</div>
                <div className="text-lg font-semibold">
                  {pathname === "/admin"
                    ? "Dashboard"
                    : pathname === "/admin/users"
                    ? "User Management"
                    : pathname === "/admin/events"
                    ? "Challenges & Events"
                    : pathname === "/admin/notifications"
                    ? "Broadcast Notifications"
                    : pathname === "/admin/studio"
                    ? "Studio"
                    : pathname === "/admin/quizzes"
                    ? "Quiz Builder"
                    : pathname === "/admin/trash"
                    ? "Trash"
                    : pathname === "/admin/audit"
                    ? "Audit Log"
                    : pathname === "/admin/jobs"
                    ? "System Jobs"
                    : pathname === "/admin/badges"
                    ? "Badge Management"
                    : pathname === "/admin/admins"
                    ? "Admin Provisioning"
                    : pathname === "/admin/system/leaderboard"
                    ? "Leaderboard Config"
                    : pathname === "/admin/system/api-logs"
                    ? "API Monitoring"
                    : pathname}
                </div>
              </div>
            </header>

            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}