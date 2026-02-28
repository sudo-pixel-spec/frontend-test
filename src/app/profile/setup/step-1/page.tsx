"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileDraft, setProfileDraft } from "@/lib/profileDraft";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import ActionButton from "@/components/onboarding/ActionButton";
import { User } from "lucide-react";

export default function Step1() {
  const router = useRouter();
  const draft = getProfileDraft();

  const [fullName, setFullName] = useState(draft.fullName ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function next() {
    setErr(null);
    const v = fullName.trim();
    if (v.length < 2) return setErr("Enter a valid full name.");

    setLoading(true);
    try {
      setProfileDraft({ fullName: v });
      router.push("/profile/setup/step-2");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      total={3}
      title="Identify the Pilot"
      subtitle="Tell us what to call you on your learning journey."
      footer={
        <div className="flex gap-3">
          <ActionButton variant="ghost" onClick={() => router.back()}>
            Back
          </ActionButton>
          <ActionButton loading={loading} onClick={next}>
            Next
          </ActionButton>
        </div>
      }
    >
      <label className="block text-sm text-white/70">Full name</label>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 focus-within:border-orange-400/40 focus-within:ring-2 focus-within:ring-orange-400/10 transition">
        <User size={16} className="text-white/55" />
        <input
          className="w-full bg-transparent outline-none placeholder:text-white/30"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Dylan Fernandes"
          autoComplete="name"
        />
      </div>

      {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
        Your name will appear on streaks, leaderboards, and XP badges.
      </div>
    </OnboardingShell>
  );
}