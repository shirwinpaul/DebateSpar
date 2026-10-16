export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" aria-hidden />
      <span className="ml-3 text-muted">{label}</span>
    </div>
  );
}
