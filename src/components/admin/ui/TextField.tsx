"use client";

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs text-white/70">{label}</div>
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
      />
    </label>
  );
}