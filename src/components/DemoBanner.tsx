export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_IS_DEMO !== "true") return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
      <strong>Demo</strong> — anyone can edit; data may be reset periodically.
    </div>
  );
}
