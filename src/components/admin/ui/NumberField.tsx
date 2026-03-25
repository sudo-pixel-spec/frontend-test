"use client";

export default function NumberField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs text-white/70">{label}</div>
      <input
        type="number"
        disabled={disabled}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
      />
    </label>
  );
}