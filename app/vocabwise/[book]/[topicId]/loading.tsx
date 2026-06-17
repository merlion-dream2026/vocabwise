export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-violet-600 px-4 pt-5 pb-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-white/20 rounded-xl" />
            <div className="h-5 w-40 bg-white/30 rounded-full" />
          </div>
          <div className="h-7 w-64 bg-white/25 rounded-full" />
        </div>
      </div>
      {/* Tab bar */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        <div className="flex gap-2 mb-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-10 bg-white/80 rounded-2xl shadow-sm" />
          ))}
        </div>
        {/* Passage skeleton */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3 mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-slate-100 rounded-full" style={{ width: i === 4 ? '60%' : '100%' }} />
          ))}
        </div>
        {/* Glossary rows */}
        <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-1/3 bg-slate-100 rounded-full" />
                <div className="h-3 w-2/3 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
