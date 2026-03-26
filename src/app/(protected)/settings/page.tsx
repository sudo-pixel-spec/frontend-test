"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth.store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const NameSchema = z.object({ fullName: z.string().min(2, "Enter at least 2 characters") });
type NameForm = z.infer<typeof NameSchema>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-4">
      <h2 className="text-sm font-semibold text-white/50 mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div>
        <p className="text-sm font-semibold text-white/80">{label}</p>
        <p className="text-xs text-white/30 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{ background: value ? "#22d3ee" : "rgba(255,255,255,0.12)" }}
      >
        <motion.div animate={{ x: value ? 22 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, clear } = useAuthStore();
  const router = useRouter();
  const [savingName, setSavingName] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<NameForm>({
    resolver: zodResolver(NameSchema),
    defaultValues: { fullName: user?.profile?.fullName ?? "" }
  });

  async function onSaveName(data: NameForm) {
    setSavingName(true);
    try {
      await apiFetch(endpoints.user.profile, {
        method: "PATCH",
        body: JSON.stringify({ fullName: data.fullName, standard: user?.profile?.standard ?? "CBSE_STD_8", timezone: user?.profile?.timezone ?? "Asia/Kolkata" })
      });
      updateUser({ profile: { ...user?.profile, fullName: data.fullName } });
      toast.success("Name updated!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSignOut() {
    try { await apiFetch(endpoints.auth.logout, { method: "POST" }); } catch {}
    clear();
    router.replace("/auth/login");
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeUp">
      <h1 className="text-3xl font-black text-white mb-8">⚙️ Settings</h1>

      <Section title="Account">
        <form onSubmit={handleSubmit(onSaveName)} className="space-y-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Full Name</label>
            <input {...register("fullName")}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              placeholder="Your name" />
            {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Phone</label>
            <input readOnly value={(user as any)?.phone ?? ""}
              className="w-full px-4 py-3 rounded-xl text-sm text-white/40 outline-none cursor-not-allowed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }} />
            <p className="text-xs text-white/25 mt-1">Phone number cannot be changed</p>
          </div>
          <motion.button type="submit" disabled={savingName} whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}>
            {savingName ? "Saving…" : "Save Changes"}
          </motion.button>
        </form>
      </Section>

      <Section title="Preferences">
        <Toggle label="Push Notifications" desc="Get reminders to keep your streak" value={notifications} onChange={setNotifications} />
        <Toggle label="Sound Effects" desc="Play sounds during quizzes" value={sounds} onChange={setSounds} />
      </Section>

      <Section title="Legal">
        <div className="space-y-2">
          {[
            { label: "Terms & Conditions", value: "terms" },
            { label: "Privacy Policy", value: "privacy" },
            { label: "Cookie Policy", value: "cookie" },
          ].map(({ label, value }) => (
            <button key={label} onClick={() => setSelectedPolicy(label)}
              className="w-full flex items-center justify-between py-3 border-b last:border-0 text-sm text-white/60 hover:text-white/90 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {label}
              <span className="text-white/30">→</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Account Actions">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full py-3 rounded-xl text-sm font-bold text-red-400 transition-all"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          🚪 Sign Out
        </motion.button>
      </Section>

      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowSignOutConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <p className="text-4xl mb-4">🚪</p>
              <h3 className="text-lg font-black text-white mb-2">Sign Out?</h3>
              <p className="text-white/40 text-sm mb-6">You'll need to verify your phone again to sign back in.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)" }}>Cancel</button>
                <button onClick={handleSignOut}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedPolicy && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelectedPolicy(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white">{selectedPolicy}</h3>
                <button onClick={() => setSelectedPolicy(null)} className="text-white/40 hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-white/60 space-y-4">
                <p>
                  This is a placeholder text for the <strong>{selectedPolicy}</strong>. 
                  Hmm. Lets add placeholers ig.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <p>
                  1. <strong>First rule</strong>: Always follow the guidelines.<br/>
                  2. <strong>Second rule</strong>: Ensure compliance with all regulations.<br/>
                  3. <strong>Third rule</strong>: Protect user privacy at all times.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.
                  Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => setSelectedPolicy(null)}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}>
                  Close
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
