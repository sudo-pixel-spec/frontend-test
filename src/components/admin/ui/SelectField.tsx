"use client";

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs text-white/70">{label}</div>
      <select
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}