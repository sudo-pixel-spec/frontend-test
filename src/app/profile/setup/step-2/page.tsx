"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileDraft, setProfileDraft } from "@/lib/profileDraft";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import ActionButton from "@/components/onboarding/ActionButton";
import { Sparkles } from "lucide-react";

const MAP = {
  "8": "CBSE_STD_8",
  "9": "CBSE_STD_9",
  "10": "CBSE_STD_10",
} as const;

export default function Step2() {
  const router = useRouter();
  const draft = getProfileDraft();

  const [standard, setStandard] = useState<keyof typeof MAP>(() => {
    if (draft.standard === "CBSE_STD_9") return "9";
    if (draft.standard === "CBSE_STD_10") return "10";
    return "8";
  });

  return (
    <OnboardingShell
      step={2}
      total={3}
      title="Choose Your Sector"
      subtitle="Select your CBSE standard. (Std 8 is fully unlocked.)"
      footer={
        <div className="flex gap-3">
          <ActionButton variant="ghost" onClick={() => router.back()}>
            Back
          </ActionButton>
          <ActionButton
            onClick={() => {
              setProfileDraft({ standard: MAP[standard] });
              router.push("/profile/setup/step-3");
            }}
          >
            Next
          </ActionButton>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {(["8", "9", "10"] as const).map((s) => {
          const selected = standard === s;
          const locked = s !== "8";

          return (
            <button
              key={s}
              onClick={() => setStandard(s)}
              className={[
                "relative rounded-xl border px-4 py-4 text-left transition",
                selected
                  ? "bg-white/90 text-black border-white/60"
                  : "bg-black/20 border-white/10 text-white hover:bg-white/5",
              ].join(" ")}
            >
              <div className="text-sm font-semibold">Std {s}</div>
              <div className={selected ? "text-xs opacity-80" : "text-xs text-white/60"}>
                {locked ? "Coming soon" : "Unlocked"}
              </div>

              {selected ? (
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/10 px-2 py-1 text-[10px] font-semibold">
                  <Sparkles size={12} />
                  Selected
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-white/55">
        You can change this later in Settings.
      </div>
    </OnboardingShell>
  );
}