"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import {
  clearProfileDraft,
  getProfileDraft,
  setProfileDraft,
} from "@/lib/profileDraft";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import ActionButton from "@/components/onboarding/ActionButton";
import { Globe2, Rocket, Lock } from "lucide-react";

export default function Step3() {
  const router = useRouter();
  const draft = getProfileDraft();

  const detectedTZ =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Kolkata";

  const [timezone] = useState(draft.timezone ?? detectedTZ);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function finish() {
    setErr(null);

    const tz = (timezone ?? "").trim();
    if (tz.length < 3) return setErr("Enter a valid timezone.");

    setLoading(true);
    try {
      setProfileDraft({ timezone: tz });
      const merged = getProfileDraft();

      if (!merged.fullName) throw new Error("Name missing (go back to Step 1)");
      if (!merged.standard)
        throw new Error("Standard missing (go back to Step 2)");

      await apiFetch(endpoints.user.profile, {
        method: "PATCH",
        body: {
          fullName: merged.fullName,
          standard: merged.standard,
          timezone: tz,
          profileComplete: true,
        },
      });

      clearProfileDraft();
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={3}
      total={3}
      title="Set Your Timezone"
      subtitle="This helps schedule streaks and daily quests correctly."
      footer={
        <div className="flex gap-3">
          <ActionButton variant="ghost" onClick={() => router.back()}>
            Back
          </ActionButton>
          <ActionButton loading={loading} onClick={finish}>
            <Rocket size={16} />
            Launch
          </ActionButton>
        </div>
      }
    >
      <label className="block text-sm text-white/70">Timezone</label>

      <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 opacity-80">
        <Globe2 size={16} className="text-white/55" />
        <input
          readOnly
          className="w-full bg-transparent outline-none text-white/70 cursor-default"
          value={timezone}
          placeholder="Asia/Kolkata"
        />
        <Lock size={14} className="text-white/35" />
      </div>

      {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
        Your daily streak resets based on this timezone.
      </div>
    </OnboardingShell>
  );
}