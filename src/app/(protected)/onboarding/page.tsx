"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth.store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/endpoints";

type Standard = { _id: string; code: string; name: string; };


function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/40 mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all focus:ring-2 focus:ring-cyan-400/30";
const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

export default function OnboardingPage() {
  const { updateUser } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [age, setAge] = useState("");
  const [standard, setStandard] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { data: standardsRaw, isLoading: loadingStandards } = useQuery({
    queryKey: ["standards"],
    queryFn: () => apiFetch<any>(endpoints.curriculum.standards).then(res => (Array.isArray(res) ? res : res?.data ?? []) as Standard[]),
    staleTime: 30 * 60_000
  });

  const standards = (standardsRaw ?? []);


  function validateStep1() {
    if (fullName.trim().length < 2) { setErrors({ fullName: "Enter at least 2 characters" }); return false; }
    setErrors({}); return true;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    if (school.trim().length < 2) errs.school = "Enter your school name";
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 8 || ageNum > 25) errs.age = "Enter a valid age (8–25)";
    if (!standard) errs.standard = "Please select a standard";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await apiFetch("/me/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName.trim(),
          school: school.trim(),
          age: parseInt(age, 10),
          standard,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Kolkata"
        })
      });
      updateUser({
        profileComplete: true,
        onboardingComplete: true,
        profile: { fullName: fullName.trim(), school: school.trim(), standard }
      });
      setStep(3);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md">

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div animate={{ scaleX: step > s ? 1 : step === s ? 0.5 : 0 }}
                style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)", transformOrigin: "left", height: "100%" }} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}>
              <div className="text-4xl mb-4">👋</div>
              <h1 className="text-2xl font-black text-white mb-1">Welcome to Gamifyed!</h1>
              <p className="text-white/40 text-sm mb-6">Let's set up your profile. Start with your name.</p>
              <div className="space-y-4">
                <Field label="Your full name" error={errors.fullName}>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className={inputCls} style={inputStyle} placeholder="e.g. Arjun Sharma" autoFocus />
                </Field>
                <motion.button onClick={() => validateStep1() && setStep(2)} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}>
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}>
              <div className="text-4xl mb-4">🏫</div>
              <h1 className="text-2xl font-black text-white mb-1">Tell us about you</h1>
              <p className="text-white/40 text-sm mb-6">We'll personalise your learning experience.</p>
              <div className="space-y-4">
                <Field label="School name" error={errors.school}>
                  <input value={school} onChange={e => setSchool(e.target.value)}
                    className={inputCls} style={inputStyle} placeholder="Your school name" />
                </Field>
                <Field label="Your age" error={errors.age}>
                  <input value={age} onChange={e => setAge(e.target.value)} type="number"
                    className={inputCls} style={inputStyle} placeholder="e.g. 14" />
                </Field>
                <Field label="Standard / Class" error={errors.standard}>
                  <div className="relative">
                    <select value={standard} onChange={e => setStandard(e.target.value)}
                      disabled={loadingStandards}
                      className={inputCls} style={inputStyle}>
                      <option value="">{loadingStandards ? "Loading classes..." : "Select your class"}</option>
                      {standards.map((s: Standard) => (
                        <option key={s._id} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                    {loadingStandards && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </Field>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40"
                    style={{ background: "rgba(255,255,255,0.06)" }}>← Back</button>
                  <motion.button onClick={handleSubmit} disabled={loading} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}>
                    {loading ? "Saving…" : "Continue →"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <motion.div className="text-6xl mb-4 inline-block animate-logoFloat">🎉</motion.div>
              <h1 className="text-2xl font-black text-white mb-2">You're all set, {fullName.split(" ")[0]}!</h1>
              <p className="text-white/40 text-sm mb-8">Your learning journey begins now. Earn XP and climb the leaderboard!</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.replace("/dashboard")}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)", boxShadow: "0 0 32px rgba(34,211,238,0.3)" }}>
                Go to Dashboard →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
