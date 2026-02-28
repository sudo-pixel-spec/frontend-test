export type ProfileDraft = {
  fullName?: string;
  standard?: "CBSE_STD_8" | "CBSE_STD_9" | "CBSE_STD_10";
  timezone?: string;
};

const KEY = "profileDraft";

export function getProfileDraft(): ProfileDraft {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function setProfileDraft(patch: ProfileDraft) {
  if (typeof window === "undefined") return;
  const current = getProfileDraft();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearProfileDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}