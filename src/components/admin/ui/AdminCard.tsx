import React from "react";

export default function AdminCard({
  title,
  children,
  right,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-white/10 bg-white/[0.03] ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-semibold">{title}</h2>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}