export default function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="rounded-xl border border-white/10 bg-black/20 px-6 py-4">
        <div className="text-sm opacity-80">Loading…</div>
      </div>
    </div>
  );
}