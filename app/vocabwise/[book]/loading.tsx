export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-blue-600 px-4 pt-5 pb-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-white/20 rounded-xl" />
            <div className="h-6 w-48 bg-white/30 rounded-full" />
          </div>
          <div className="h-4 w-32 bg-white/20 rounded-full" />
        </div>
      </div>
      {/* Topic list */}
      <div className="max-w-xl mx-auto px-4 py-5 space-y-3">
        {/* Theme header skeleton */}
        <div className="h-7 w-44 bg-slate-200 rounded-full" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-sm h-16 flex items-center px-4 gap-3">
            <div className="h-10 w-10 bg-slate-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
              <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
            </div>
          </div>
        ))}
        <div className="h-7 w-52 bg-slate-200 rounded-full mt-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-sm h-16" />
        ))}
      </div>
    </div>
  )
}
