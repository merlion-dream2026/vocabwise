export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center animate-pulse">
      <div className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-sm mx-4 space-y-4">
        <div className="h-8 w-40 bg-gray-100 rounded-full mx-auto" />
        <div className="h-12 bg-gray-100 rounded-2xl" />
        <div className="h-12 bg-gray-100 rounded-2xl" />
        <div className="h-12 bg-purple-100 rounded-2xl" />
      </div>
    </div>
  )
}
