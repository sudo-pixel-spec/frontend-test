"use client";

export default function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-sm text-white/80">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={[
          "w-12 h-7 rounded-full border transition-all relative",
          value ? "bg-white/20 border-white/30" : "bg-black/40 border-white/10",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 w-5 h-5 rounded-full bg-white/70 transition-all",
            value ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </label>
  );
}