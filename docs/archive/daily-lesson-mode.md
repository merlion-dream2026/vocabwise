# Archived: Daily "Bài học hôm nay" (guided lesson mode)

Removed 2026-07-14 from `app/dashboard/[childId]/[level]/[topicId]/page.tsx`.
User now lands straight on the free game-picker grid instead of a guided
4-step daily lesson. Kept here in case the guided-lesson flow needs to come
back (e.g. as an opt-in mode, or for younger levels only).

## What it did
- Forced a fixed 4-step sequence (`flashcard → listen → match → spell` for
  Seeker/Starter/Ranger, `flashcard → quiz → gapfill → typing` for
  Explorer/Scholar/Master) with a progress dot bar, locked/active/done step
  states, and a "🎉 Bài học hôm nay xong rồi!" completion panel that linked to
  the next topic.
- Had an escape hatch button ("🎮 Tự do chọn trò chơi") to drop into free-pick
  mode, and a return button ("📅 Quay lại bài học hôm nay") to go back.
- Per-step scores were tracked via `getStepScore()` (`lib/stepScores.ts`) and
  shown next to each step ("✅ 8/10", "🔄 Làm lại").

## To restore

### 1. Re-add the import
```tsx
import { getStepScore } from '@/lib/stepScores'
```

### 2. Re-add the lesson sequence consts (near top of file, after other consts)
```tsx
// Daily lesson sequences: easy → hard, 4 steps each
const LESSON_STARTER  = ['flashcard', 'listen', 'match', 'spell']
const LESSON_EXPLORER = ['flashcard', 'quiz', 'gapfill', 'typing']
```

### 3. Re-add state (inside `TopicPage`, alongside other `useState`)
```tsx
const [lessonMode, setLessonMode] = useState(true)
const [stepScores, setStepScores] = useState<Record<string, { correct: number; total: number } | null>>({})
```

### 4. Re-add the step-score loader effect
```tsx
useEffect(() => {
  const allGameKeys = [...new Set([...LESSON_STARTER, ...LESSON_EXPLORER].filter(g => g !== 'flashcard'))]
  const loaded: Record<string, { correct: number; total: number } | null> = {}
  for (const g of allGameKeys) loaded[g] = getStepScore(childId, topicId, g)
  setStepScores(loaded)
}, [childId, topicId])
```

### 5. Re-add computed values (near `isDone`, `games`, `colors`)
```tsx
const isSimpleLevel = ['seeker', 'starter', 'ranger'].includes(level)
const lessonSteps = isSimpleLevel ? LESSON_STARTER : LESSON_EXPLORER
const allGamesFlat = [...STARTER_GAMES, ...EXPLORER_GAMES]
const lessonCurrentStep = lessonSteps.findIndex(g =>
  g === 'flashcard' ? !mastery.flashcard : !mastery.games.includes(g)
)
const isLessonDone = lessonCurrentStep === -1
```

### 6. Wrap the free-pick grid back in the lesson/free ternary
Replace the current (post-removal) unconditional free-pick grid block with:

```tsx
{/* Lesson mode / Free mode toggle */}
{lessonMode ? (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    {/* Lesson header */}
    <div className={`${colors.header} px-4 py-3`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm">📅 Bài học hôm nay</p>
          <p className="text-white/70 text-xs">~5 phút · 4 bước</p>
        </div>
        <div className="flex items-center gap-1.5">
          {lessonSteps.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${
              i < (isLessonDone ? lessonSteps.length : lessonCurrentStep)
                ? 'w-2 h-2 bg-white'
                : i === lessonCurrentStep
                ? 'w-4 h-2 bg-white'
                : 'w-2 h-2 bg-white/30'
            }`} />
          ))}
        </div>
      </div>
    </div>

    {/* Steps */}
    <div className="divide-y divide-gray-50">
      {lessonSteps.map((gameKey, i) => {
        const gameInfo = allGamesFlat.find(g => g.key === gameKey)!
        const done = isLessonDone || i < lessonCurrentStep
        const active = !isLessonDone && i === lessonCurrentStep
        const locked = !isLessonDone && i > lessonCurrentStep
        return (
          <div key={gameKey} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${active ? 'bg-purple-50' : ''}`}>
            <span className={`text-2xl flex-shrink-0 ${locked ? 'opacity-25' : ''}`}>{gameInfo.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm leading-tight ${locked ? 'text-gray-300' : 'text-gray-800'}`}>
                Bước {i + 1}: {gameInfo.label}
              </p>
            </div>
            {done && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs font-black text-green-600">
                  {gameKey === 'flashcard'
                    ? `${(topic as { words: unknown[] }).words.length}/${(topic as { words: unknown[] }).words.length}`
                    : stepScores[gameKey] ? `${stepScores[gameKey]!.correct}/${stepScores[gameKey]!.total}` : null}
                </span>
                <span className="text-green-500 text-lg">✅</span>
              </div>
            )}
            {active && !stepScores[gameKey] && (
              <button
                onClick={() => router.push(`/dashboard/${childId}/${level}/${topicId}/${gameKey}`)}
                className={`flex-shrink-0 ${colors.header} text-white text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-all`}
              >
                ▶ Bắt đầu
              </button>
            )}
            {active && stepScores[gameKey] && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-black text-orange-500">
                  {stepScores[gameKey]!.correct}/{stepScores[gameKey]!.total}
                </span>
                <button
                  onClick={() => router.push(`/dashboard/${childId}/${level}/${topicId}/${gameKey}`)}
                  className="text-xs font-black bg-orange-100 text-orange-600 px-3 py-2 rounded-full active:scale-95 transition-all"
                >
                  🔄 Làm lại
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>

    {isLessonDone && (
      <div className="px-4 py-5 bg-green-50 border-t border-green-100 space-y-3">
        <div className="text-center">
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-black text-green-700 text-base">Bài học hôm nay xong rồi!</p>
          <p className="text-xs text-gray-400 mt-0.5">Hoàn thành {lessonSteps.length} bước · ~5 phút</p>
        </div>
        {nextTopic ? (
          <button
            onClick={() => router.push(`/dashboard/${childId}/${level}/${nextTopic.id}`)}
            className={`w-full ${colors.header} text-white font-black text-sm py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2`}
          >
            <span>{nextTopic.emoji} {nextTopic.name}</span>
            <span className="opacity-70">→</span>
          </button>
        ) : (
          <p className="text-center text-xs text-green-600 font-bold">🏆 Đã học hết tất cả chủ đề level này!</p>
        )}
      </div>
    )}

    {/* Escape to free mode */}
    <div className="border-t border-gray-100 px-4 py-3 text-center">
      <button onClick={() => setLessonMode(false)} className="text-sm text-gray-400 font-semibold hover:text-gray-600 transition-colors">
        🎮 Tự do chọn trò chơi
      </button>
    </div>
  </div>
) : (
  /* Free pick mode */
  <div className="space-y-3">
    <button
      onClick={() => setLessonMode(true)}
      className={`w-full ${colors.header} text-white font-bold text-sm py-2.5 rounded-2xl opacity-80 hover:opacity-100 transition-all active:scale-95`}
    >
      📅 Quay lại bài học hôm nay
    </button>
    <div className="grid grid-cols-2 gap-3">
      {games.map(game => {
        const gameDone = game.key === 'flashcard' ? mastery.flashcard : mastery.games.includes(game.key)
        const isAI = game.key === 'speak'
        return (
          <button key={game.key}
            onClick={() => router.push(`/dashboard/${childId}/${level}/${topicId}/${game.key}`)}
            className={`relative rounded-2xl px-3 py-3 flex items-center gap-3 shadow-sm active:scale-95 transition-all text-left ${
              isAI
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:brightness-105'
                : 'bg-white hover:shadow-md'
            }`}>
            {gameDone && (
              <span className="absolute top-1.5 right-2 text-sm leading-none">⭐</span>
            )}
            {isAI && !gameDone && (
              <span className="absolute top-1.5 right-2 text-[10px] font-black bg-yellow-300 text-yellow-900 px-1.5 py-0.5 rounded-full leading-none">AI</span>
            )}
            <span className="text-3xl flex-shrink-0">{game.emoji}</span>
            <p className={`font-bold text-sm leading-tight pr-6 ${isAI ? 'text-white' : 'text-gray-800'}`}>{game.label}</p>
          </button>
        )
      })}
    </div>
  </div>
)}
```
