export default function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-1.5">
      {([1, 2, 3] as const).map(step => (
        <span
          key={step}
          className={`h-1.5 rounded-full transition-all ${
            step === current ? 'w-6 bg-indigo-600' : 'w-1.5 bg-indigo-200'
          }`}
        />
      ))}
    </div>
  )
}
