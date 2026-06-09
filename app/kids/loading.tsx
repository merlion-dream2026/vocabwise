export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="h-7 w-36 bg-white/30 rounded-full" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-white/20 rounded-2xl" />
            <div className="h-9 w-16 bg-white/20 rounded-2xl" />
          </div>
        </div>
      </div>
      {/* Child cards skeleton */}
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white/80 rounded-3xl shadow-sm h-28" />
        ))}
        <div className="h-16 bg-white/60 rounded-3xl shadow-sm" />
      </div>
    </div>
  )
}
