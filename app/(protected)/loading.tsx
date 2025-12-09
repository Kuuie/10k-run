export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex w-64 flex-col items-center gap-3 rounded-2xl bg-cream/90 p-4 shadow-xl ring-1 ring-olive/10 backdrop-blur">
        <div className="text-xs font-medium text-olive">Loading...</div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-sage-light">
          <div className="absolute inset-0 bg-gradient-to-r from-sage via-sage-dark to-sage animate-pulse" />
        </div>
        <div className="h-9 w-9 rounded-full border-2 border-sage-light border-t-sage animate-spin shadow-sm" />
      </div>
    </div>
  );
}
