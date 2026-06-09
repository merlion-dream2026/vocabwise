export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-4 pt-6 pb-16">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-36 bg-white/30 rounded-full" />
            <div className="h-4 w-24 bg-white/20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-white/20 rounded-2xl" />
            <div className="h-9 w-20 bg-white/20 rounded-2xl" />
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="max-w-xl mx-auto mt-5 flex gap-1">
          {[1,2,3].map(i => <div key={i} className="flex-1 h-9 bg-white/20 rounded-xl" />)}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-xl mx-auto px-4 -mt-4 space-y-4 pb-10">
        <div className="h-28 bg-white/80 rounded-3xl shadow-sm" />
        <div className="h-40 bg-white/80 rounded-3xl shadow-sm" />
        <div className="h-32 bg-white/80 rounded-3xl shadow-sm" />
      </div>
    </div>
  )
}
