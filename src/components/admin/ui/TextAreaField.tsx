"use client";

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs text-white/70">{label}</div>
      <textarea
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
      />
    </label>
  );
}