"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileDraft, setProfileDraft } from "@/lib/profileDraft";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import ActionButton from "@/components/onboarding/ActionButton";
import { Sparkles, Lock } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/endpoints";
import { apiFetch } from "@/lib/api";

type Standard = { _id: string; code: string; name: string; };


export default function Step2() {
  const router = useRouter();
  const draft = getProfileDraft();

  const { data: standardsRaw, isLoading: loading } = useQuery({
    queryKey: ["standards"],
    queryFn: () => apiFetch<any>(endpoints.curriculum.standards).then(res => (Array.isArray(res) ? res : []) as Standard[]),
    staleTime: 30 * 60_000
  });

  const standards = standardsRaw ?? [];

  const [selectedCode, setSelectedCode] = useState<string>(() => draft.standard || "");

  const footer = (
    <div className="flex gap-3">
      <ActionButton variant="ghost" onClick={() => router.back()}>
        Back
      </ActionButton>

      <ActionButton
        disabled={!selectedCode || loading}
        onClick={() => {
          setProfileDraft({ standard: selectedCode });
          router.push("/profile/setup/step-3");
        }}
      >
        Next
      </ActionButton>
    </div>
  );
  return (
    <OnboardingShell
      step={2}
      total={3}
      title="Choose Your Sector"
      subtitle="Select your CBSE standard."
      footer={footer}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))
        ) : (
          standards.map((s) => {
            const selected = selectedCode === s.code;

            return (
              <button
                key={s._id}
                onClick={() => setSelectedCode(s.code)}
                className={[
                  "relative rounded-xl border px-4 py-4 text-left transition",
                  selected
                    ? "bg-white/90 text-black border-white/60"
                    : "bg-black/20 border-white/10 text-white hover:bg-white/5",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">{s.name}</div>

                <div className={selected ? "text-xs opacity-80" : "text-xs text-white/60"}>
                  {s.code.includes("8") || s.code.includes("9") ? "Unlocked" : "Standard"}
                </div>

                {selected && (
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/10 px-2 py-1 text-[10px] font-semibold">
                    <Sparkles size={12} />
                    Selected
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 text-xs text-white/55">
        You can change this later in Settings.
      </div>
    </OnboardingShell>
  );
}