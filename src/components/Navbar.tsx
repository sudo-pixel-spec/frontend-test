"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  { href: "/study", label: "Study", icon: "📚" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, clear } = useAuthStore();
  const [signing, setSigning] = useState(false);

  async function handleSignOut() {
    setSigning(true);
    try {
      await apiFetch(endpoints.auth.logout, { method: "POST" });
    } catch {}
    clear();
    window.location.href = "/auth/login";
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-20 lg:w-64 z-50 flex flex-col py-6 px-3 lg:px-5" 
         style={{ background: "rgba(2,4,9,0.9)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black"
             style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)", boxShadow: "0 0 24px rgba(34,211,238,0.4)" }}>
          G
        </div>
        <span className="hidden lg:block text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Gamifyed
        </span>
      </div>

      {/* Navigation items */}
      <div className="flex-1 flex flex-col gap-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  background: active ? "rgba(34,211,238,0.12)" : "transparent",
                  color: active ? "#22d3ee" : "rgba(255,255,255,0.5)"
                }}
              >
                {active && (
                  <motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                    style={{ background: "linear-gradient(180deg,#22d3ee,#a855f7)" }} />
                )}
                <span className="text-xl leading-none ml-1">{icon}</span>
                <span className="hidden lg:block text-sm font-semibold">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* User info + signout */}
      <div className="mt-auto">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl mb-2"
             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
               style={{ background: "linear-gradient(135deg,#a855f7,#22d3ee)" }}>
            {user?.profile?.fullName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.profile?.fullName ?? "Student"}</p>
            <p className="text-xs text-white/40 truncate">Lv {user?.level ?? 1} • {user?.totalXP ?? 0} XP</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSignOut}
          disabled={signing}
          className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-red-400 transition-colors"
        >
          <span className="text-base">🚪</span>
          <span className="hidden lg:block">{signing ? "Signing out…" : "Sign Out"}</span>
        </motion.button>
      </div>
    </nav>
  );
}
