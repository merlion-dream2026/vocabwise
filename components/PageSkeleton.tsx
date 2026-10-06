// Loading placeholder in the "chunky 3D" style (rounded header with a dark bottom edge, thick-bottomed
// cards) so the first frame already matches the loaded screens instead of flashing the old flat look.
export default function PageSkeleton({
  header = 'bg-violet-500', bg = 'from-violet-50 to-purple-50', cards = [128, 176, 112],
}: { header?: string; bg?: string; cards?: number[] }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${bg} animate-pulse`} aria-hidden>
      <div className={`${header} rounded-b-3xl border-b-[4px] border-black/20`}>
        <div className="max-w-xl mx-auto flex items-center gap-3 px-4 py-4">
          <div className="h-9 w-9 flex-shrink-0 rounded-full border-b-[3px] border-black/20 bg-white/25" />
          <div className="h-11 w-11 flex-shrink-0 -rotate-6 rounded-2xl bg-white/80" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 rounded-full bg-white/40" />
            <div className="h-3 w-24 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
      <div className="max-w-xl mx-auto space-y-3 px-4 py-5">
        {cards.map((h, i) => (
          <div key={i} className="rounded-3xl border-2 border-b-[4px] border-slate-200 bg-white" style={{ height: h }} />
        ))}
      </div>
    </div>
  )
}
