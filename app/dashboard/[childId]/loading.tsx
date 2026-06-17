export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-4 pt-5 pb-12">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-2xl" />
            <div className="space-y-1.5">
              <div className="h-5 w-28 bg-white/30 rounded-full" />
              <div className="h-3 w-20 bg-white/20 rounded-full" />
            </div>
          </div>
          <div className="h-8 w-20 bg-white/20 rounded-2xl" />
        </div>
        {/* XP bar skeleton */}
        <div className="max-w-xl mx-auto mt-4">
          <div className="h-2.5 w-full bg-white/20 rounded-full" />
        </div>
      </div>
      {/* Content cards */}
      <div className="max-w-xl mx-auto px-4 -mt-6 space-y-4 pb-10">
        <div className="bg-white/80 rounded-3xl shadow-sm h-36" />
        <div className="bg-white/80 rounded-3xl shadow-sm h-48" />
        <div className="bg-white/80 rounded-3xl shadow-sm h-28" />
      </div>
    </div>
  )
}
