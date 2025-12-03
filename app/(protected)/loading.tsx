export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex w-64 flex-col items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-xl ring-1 ring-white/60 backdrop-blur dark:bg-slate-900/60 dark:ring-white/10">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-200">Loading...</div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-500 animate-pulse" />
        </div>
        <div className="h-9 w-9 rounded-full border-2 border-white/40 border-t-indigo-500 animate-spin shadow-sm" />
      </div>
    </div>
  );
}
