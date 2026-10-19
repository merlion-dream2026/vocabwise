'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { WordList } from '@/components/WordListPicker'
import UpgradeModal from '@/components/UpgradeModal'
import { getMyWordsLimit } from '@/lib/planUtils'
import { cachedFetch } from '@/lib/cachedFetch'
import VWFlashcard from '@/components/vocabwise/VWFlashcard'
import { GameHeader, cta } from '@/components/ChunkyUI'
import BottomSheet from '@/components/BottomSheet'
import Mascot from '@/components/Mascot'
import type { SavedWord } from './_components/types'
import WordItem from './_components/WordItem'
import WordDetailSheet from './_components/WordDetailSheet'
import ListManagerSheet from './_components/ListManagerSheet'

type Session = { plan: string; username: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; bonus_features?: string[] | null }
type SortKey = 'recent' | 'alpha' | 'topic'
type Toast = { msg: string; undo?: () => void }

const GUIDE_SEEN_KEY = 'myWordsGuideSeen'
const UNDO_MS = 5000

function sortWords(words: SavedWord[], key: SortKey) {
  return [...words].sort((a, b) => {
    if (key === 'recent') return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    if (key === 'alpha')  return a.word.localeCompare(b.word)
    return a.topic_title.localeCompare(b.topic_title)
  })
}

const send = (url: string, method: string, body: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true })
    .then(r => r.ok).catch(() => false)
const deleteSaved = (w: SavedWord) => send('/api/vocabwise/wordlist', 'DELETE', { word: w.word, topic_id: w.topic_id })

export default function MyWordsPage() {
  const [session, setSession]       = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [words, setWords]           = useState<SavedWord[]>([])
  const [lists, setLists]           = useState<WordList[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeList, setActiveList] = useState<number | 'all'>('all')
  const [activeSource, setActiveSource] = useState<'all' | 'academic' | 'kids'>('all')
  const [sort, setSort]             = useState<SortKey>('recent')
  const [search, setSearch]         = useState('')
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [showUpgrade, setShowUpgrade]   = useState(false)
  const [view, setView]                 = useState<'list' | 'grid'>('list')
  const [detailId, setDetailId]         = useState<number | null>(null)   // word shown in the bottom sheet
  const [folded, setFolded]             = useState<Record<string, boolean>>({})
  const [studyWords, setStudyWords]     = useState<SavedWord[] | null>(null) // non-null = flashcard session
  const [sheet, setSheet]               = useState<'guide' | 'lists' | null>(null)
  const [toast, setToast]               = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // "Bỏ lưu" is deferred UNDO_MS so "Hoàn tác" can cancel it — the DELETE never has to be reversed.
  const pendingRemovals = useRef(new Map<number, { word: SavedWord; timer: ReturnType<typeof setTimeout> }>())

  useEffect(() => {
    Promise.all([
      cachedFetch('/api/auth/me').then(r => r.ok ? r.json() : null) as Promise<Session | null>,
      fetch('/api/vocabwise/wordlist').then(r => r.ok ? r.json() : { saved: [] }),
      fetch('/api/wordlists').then(r => r.ok ? r.json() : { lists: [] }),
    ]).then(([sess, wData, lData]) => {
      setSession(sess)
      setSessionLoaded(true)
      setWords(wData.saved ?? [])
      setLists(lData.lists ?? [])
    }).finally(() => setLoading(false))

    // Leaving the page inside the undo window still commits the removal (keepalive fetch).
    const pending = pendingRemovals.current
    return () => { pending.forEach(({ word, timer }) => { clearTimeout(timer); deleteSaved(word) }) }
  }, [])

  // Restore filters/search/sort from the last visit — otherwise switching to another
  // tab and back always reset this screen to its defaults.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('myWordsFilters')
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.activeList !== undefined) setActiveList(saved.activeList)
        if (saved.activeSource) setActiveSource(saved.activeSource)
        if (saved.sort) setSort(saved.sort)
        if (saved.search) setSearch(saved.search)
        if (saved.view === 'grid' || saved.view === 'list') setView(saved.view)
      }
      // The how-to opens by itself once; after that it lives behind the header's ? button.
      if (!localStorage.getItem(GUIDE_SEEN_KEY)) { setSheet('guide'); localStorage.setItem(GUIDE_SEEN_KEY, '1') }
    } catch { /* ignore */ }
    setFiltersLoaded(true)
  }, [])

  // A restored `activeList` may point at a list deleted from another device/session —
  // fall back to "Tất cả" rather than silently filtering everything out with no chip
  // showing as active.
  useEffect(() => {
    if (!filtersLoaded || loading) return
    if (activeList !== 'all' && !lists.some(l => l.id === activeList)) setActiveList('all')
  }, [filtersLoaded, loading, lists, activeList])

  useEffect(() => {
    if (!filtersLoaded) return
    try { localStorage.setItem('myWordsFilters', JSON.stringify({ activeList, activeSource, sort, search, view })) } catch { /* ignore */ }
  }, [filtersLoaded, activeList, activeSource, sort, search, view])

  function showToast(t: Toast) {
    clearTimeout(toastTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), UNDO_MS)
  }
  const failed = () => showToast({ msg: '⚠️ Không lưu được — kiểm tra mạng rồi thử lại.' })

  function removeWord(w: SavedWord) {
    setDetailId(null)
    setWords(prev => prev.filter(x => x.id !== w.id))
    const timer = setTimeout(async () => {
      pendingRemovals.current.delete(w.id)
      if (!(await deleteSaved(w))) { setWords(prev => [...prev, w]); failed() }
    }, UNDO_MS)
    pendingRemovals.current.set(w.id, { word: w, timer })
    showToast({
      msg: `Đã bỏ lưu “${w.word}”`,
      undo: () => {
        if (!pendingRemovals.current.has(w.id)) return // already committed
        clearTimeout(timer); pendingRemovals.current.delete(w.id)
        setWords(prev => [...prev, w]); setToast(null)
      },
    })
  }

  async function createList(name: string, color: string) {
    const res = await fetch('/api/wordlists', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }),
    }).catch(() => null)
    if (!res?.ok) { failed(); return false }
    const { list } = await res.json()
    setLists(prev => [...prev, list])
    return true
  }

  async function renameList(id: number, name: string, color: string) {
    if (!(await send('/api/wordlists', 'PATCH', { id, name, color }))) { failed(); return false }
    setLists(prev => prev.map(l => l.id === id ? { ...l, name, color } : l))
    return true
  }

  async function deleteList(id: number) {
    if (!(await send('/api/wordlists', 'DELETE', { id }))) { failed(); return false }
    setLists(prev => prev.filter(l => l.id !== id))
    setWords(prev => prev.map(w => w.list_id === id ? { ...w, list_id: null } : w))
    if (activeList === id) setActiveList('all')
    return true
  }

  async function assignToList(wordId: number, listId: number | null) {
    const before = words.find(w => w.id === wordId)?.list_id ?? null
    if (before === listId) return
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, list_id: listId } : w))
    if (!(await send('/api/vocabwise/wordlist', 'PATCH', { id: wordId, list_id: listId }))) {
      setWords(prev => prev.map(w => w.id === wordId ? { ...w, list_id: before } : w))
      failed()
    }
  }

  // Filter
  let filtered = words
  if (activeList !== 'all') filtered = filtered.filter(w => w.list_id === activeList)
  if (activeSource !== 'all') filtered = filtered.filter(w => w.source === activeSource)
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(w =>
      w.word.toLowerCase().includes(q) ||
      w.meaning_vi.toLowerCase().includes(q) ||
      w.topic_title?.toLowerCase().includes(q)
    )
  }
  const sorted = sortWords(filtered, sort)

  const totalAll      = words.length
  const totalAcademic = words.filter(w => w.source === 'academic').length
  const totalKids     = words.filter(w => w.source === 'kids').length
  const counts: Record<number, number> = {}
  for (const w of words) if (w.list_id) counts[w.list_id] = (counts[w.list_id] ?? 0) + 1
  const listColor = new Map(lists.map(l => [l.id, l.color]))

  function startStudy() {
    const a = [...sorted]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    setStudyWords(a)
  }

  function clearFilters() {
    setSearch(''); setActiveList('all'); setActiveSource('all')
  }

  // "Tất cả" is shown grouped by list (each group can be folded); picking a list shows just that list.
  const groups: { key: string; name: string; color: string | null; words: SavedWord[] }[] = activeList === 'all'
    ? [
        ...lists.map(l => ({ key: String(l.id), name: l.name, color: l.color, words: sorted.filter(w => w.list_id === l.id) })),
        { key: 'none', name: 'Chưa phân loại', color: null, words: sorted.filter(w => !w.list_id || !lists.some(l => l.id === w.list_id)) },
      ].filter(g => g.words.length > 0)
    : [{ key: 'one', name: '', color: null, words: sorted }]
  const detail = detailId !== null ? words.find(w => w.id === detailId) ?? null : null

  if (studyWords) return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <GameHeader colorCls="bg-gradient-to-r from-indigo-600 to-purple-600" title="🎴 Học ngay"
        subtitle={activeList === 'all' ? 'Tất cả từ đã lưu' : lists.find(l => l.id === activeList)?.name}
        onBack={() => setStudyWords(null)} />
      <div className="mx-auto max-w-lg px-4 py-5">
        <VWFlashcard
          glossary={studyWords.map(w => ({ id: w.id, word: w.word, ipa: w.ipa, pos: w.pos, meaning_vi: w.meaning_vi, example_en: w.example_en ?? '', example_vi: '' }))}
          onExit={() => setStudyWords(null)}
        />
      </div>
    </div>
  )

  if (!sessionLoaded) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">⭐</div>
    </div>
  )

  const wordsLimit = session ? getMyWordsLimit(session) : null
  const chip = (active: boolean) =>
    `flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-all ${active ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`

  return (
    <div className="min-h-screen bg-gray-50">
      {showUpgrade && session && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} username={session.username} />
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-8 pb-3 text-white rounded-b-3xl border-b-[4px] border-black/20">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">⭐ Từ của tôi</h1>
          <p className="text-indigo-200 text-sm mt-0.5">
            {totalAll} từ đã lưu · {totalAcademic} Academic · {totalKids} Daily
          </p>
        </div>
        <button type="button" onClick={() => setSheet('guide')} aria-label="Cách hoạt động"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold active:scale-90">?</button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Free limit banner */}
        {wordsLimit !== null && (
          <div className={`mx-4 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 ${totalAll >= wordsLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-xs font-bold ${totalAll >= wordsLimit ? 'text-red-700' : 'text-amber-700'}`}>
              {totalAll >= wordsLimit
                ? `⚠️ Đã đạt giới hạn ${wordsLimit} từ (Free). Nâng cấp để lưu không giới hạn.`
                : `⭐ Gói Free: ${totalAll}/${wordsLimit} từ đã lưu`}
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-xs font-bold text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
            >
              Nâng cấp
            </button>
          </div>
        )}

        {!loading && totalAll === 0 ? (
          <div className="px-4 py-12 text-center">
            <Mascot shot="pose-cards" size={192} className="mi-pop mb-3 rounded-3xl shadow-md ring-4 ring-white" />
            <p className="font-bold text-gray-600">Chưa có từ nào được lưu</p>
            <p className="mt-1 text-sm text-gray-400">Nhấn ⭐ cạnh từ trong Academic hoặc Daily để lưu vào đây.</p>
            <Link href="/vocabwise" className={cta('indigo', 'mx-auto mt-5 inline-flex !w-auto px-6')}>🎓 Học từ mới ›</Link>
          </div>
        ) : (
          <>
            {/* Study this list */}
            <div className="px-4 mt-4">
              <button type="button" disabled={loading || sorted.length === 0} onClick={startStudy}
                className={cta('indigo', 'flex items-center justify-center gap-2')}>
                🎴 Học ngay {sorted.length > 0 ? `${sorted.length} từ` : ''}{activeList !== 'all' ? ` · ${lists.find(l => l.id === activeList)?.name ?? ''}` : ''}
              </button>
            </div>

            {/* Filters + Search (sticky) */}
            <div className="sticky top-0 z-20 mt-2 space-y-2 bg-gray-50/95 px-4 pb-2 pt-2 backdrop-blur">
              <div className="relative">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Tìm từ, nghĩa, chủ đề..."
                  aria-label="Tìm từ"
                  className="w-full rounded-3xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white border-2 border-slate-200 border-b-[4px] border-b-slate-300"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm"
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-[60%] items-center justify-center text-gray-400">✕</button>
                )}
              </div>
              {/* List chips — one horizontally scrolling row; edit/delete live in "⋯ Quản lý" */}
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                <button type="button" onClick={() => setActiveList('all')}
                  className={`${chip(activeList === 'all')} ${activeList === 'all' ? 'bg-indigo-600' : ''}`}>
                  📌 Tất cả · {totalAll}
                </button>
                {lists.map(l => {
                  const isActive = activeList === l.id
                  return (
                    <button key={l.id} type="button" onClick={() => setActiveList(isActive ? 'all' : l.id)}
                      className={chip(isActive)} style={isActive ? { backgroundColor: l.color } : {}}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isActive ? '#fff' : l.color }} />
                      <span className="max-w-[9rem] truncate">{l.name}</span> · {counts[l.id] ?? 0}
                    </button>
                  )
                })}
                <button type="button" onClick={() => setSheet('lists')}
                  className="flex-shrink-0 rounded-full border border-dashed border-indigo-300 bg-white px-3.5 py-2 text-sm font-bold text-indigo-600">
                  {lists.length ? '⋯ Quản lý' : '+ Tạo danh sách'}
                </button>
              </div>
              <div className="flex gap-2">
                {/* Source filter */}
                {(['all', 'academic', 'kids'] as const).map(s => (
                  <button key={s}
                    onClick={() => setActiveSource(s)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      activeSource === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
                    }`}>
                    {s === 'all' ? 'Tất cả' : s === 'academic' ? 'Academic' : 'Daily'}
                  </button>
                ))}
                <div className="flex-1" />
                {/* Sort */}
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  aria-label="Sắp xếp"
                  className="text-xs font-bold border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none"
                >
                  <option value="recent">Mới nhất</option>
                  <option value="alpha">A–Z</option>
                  <option value="topic">Chủ đề</option>
                </select>
                {/* View toggle */}
                <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white">
                  {([['list', '☰', 'Danh sách'], ['grid', '▦', 'Lưới 2 cột']] as const).map(([v, icon, label]) => (
                    <button key={v} type="button" onClick={() => setView(v)} aria-label={label} aria-pressed={view === v}
                      className={`px-3 py-1 text-sm font-bold ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Word list */}
            <div className="px-4 mt-4 pb-nav">
              {loading && (
                <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
              )}

              {!loading && sorted.length === 0 && (
                <div className="text-center py-12">
                  <Mascot shot="pose-magnify" size={160} className="mi-pop mb-3 rounded-3xl shadow-md ring-4 ring-white" />
                  <p className="text-gray-500 font-bold">Không tìm thấy từ nào</p>
                  <button type="button" onClick={clearFilters} className="mt-2 text-sm font-bold text-indigo-600">Xóa bộ lọc</button>
                </div>
              )}

              <div className="space-y-4">
                {groups.map(g => {
                  const isFolded = !!folded[g.key]
                  return (
                    <section key={g.key}>
                      {g.key !== 'one' && (
                        <button type="button" aria-expanded={!isFolded} onClick={() => setFolded(f => ({ ...f, [g.key]: !f[g.key] }))}
                          className="mb-2 flex w-full items-center justify-between text-left">
                          <span className="flex items-center gap-2 text-sm font-bold text-gray-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color ?? '#cbd5e1' }} />
                            {g.name} <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{g.words.length}</span>
                          </span>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 transition-transform ${isFolded ? '' : 'rotate-180'}`}>▾</span>
                        </button>
                      )}
                      {!isFolded && (
                        <div className={view === 'grid' ? 'grid grid-cols-2 gap-2.5' : 'space-y-2'}>
                          {g.words.map(w => (
                            <WordItem key={w.id} word={w} view={view} onOpen={() => setDetailId(w.id)}
                              color={w.list_id ? listColor.get(w.list_id) ?? null : null} />
                          ))}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {detail && (
        <WordDetailSheet word={detail} lists={lists} onAssign={id => assignToList(detail.id, id)}
          onRemove={() => removeWord(detail)} onManageLists={() => { setDetailId(null); setSheet('lists') }} onClose={() => setDetailId(null)} />
      )}
      {sheet === 'lists' && (
        <ListManagerSheet lists={lists} counts={counts} onCreate={createList} onUpdate={renameList} onDelete={deleteList} onClose={() => setSheet(null)} />
      )}
      {sheet === 'guide' && (
        <BottomSheet title="💡 Cách hoạt động" onClose={() => setSheet(null)}>
          <div className="space-y-2.5 px-5 pb-3 text-sm text-slate-700">
            <p>⭐ Nhấn <strong>⭐</strong> cạnh bất kỳ từ nào trong tab <strong>Từ vựng</strong> (Academic) hoặc màn hình <strong>Flashcard</strong> (Daily) để lưu.</p>
            <p>📁 Tạo nhiều <strong>danh sách riêng</strong> cho từng mục tiêu: IELTS Writing, SAT Vocab, Ôn thi tuần này… (nút <strong>⋯ Quản lý</strong>).</p>
            <p>👆 Chạm vào một từ để xem chi tiết, chuyển danh sách hoặc bỏ lưu.</p>
            <p>🎴 Chọn một danh sách (hoặc Tất cả) rồi nhấn <strong>Học ngay</strong> để ôn lại dạng flashcard.</p>
          </div>
        </BottomSheet>
      )}

      {toast && (
        <div role="status" style={{ bottom: 'var(--bottom-nav-h)' }}
          className="fixed inset-x-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
          <span className="flex-1">{toast.msg}</span>
          {toast.undo && <button type="button" onClick={toast.undo} className="font-bold text-amber-300">Hoàn tác</button>}
        </div>
      )}
    </div>
  )
}
