export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 animate-pulse">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-4 py-5">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="h-8 w-8 bg-white/20 rounded-xl" />
          <div className="h-6 w-40 bg-white/30 rounded-full" />
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/80 rounded-3xl shadow-sm h-32" />
        ))}
      </div>
    </div>
  )
}
