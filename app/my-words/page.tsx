'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { speak } from '@/lib/speak'
import type { WordList } from '@/components/WordListPicker'
import UpgradeModal from '@/components/UpgradeModal'
import { getMyWordsLimit } from '@/lib/planUtils'
import { cachedFetch } from '@/lib/cachedFetch'
import VWFlashcard from '@/components/vocabwise/VWFlashcard'
import { GameHeader, cta } from '@/components/ChunkyUI'
import { PRESS } from '@/components/TopicHub'
import Mascot from '@/components/Mascot'

type Session = { plan: string; username: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; bonus_features?: string[] | null }

type SavedWord = {
  id: number
  word: string
  meaning_vi: string
  pos: string
  ipa: string
  example_en: string
  book_id: string
  topic_id: string
  topic_title: string
  source: string
  list_id: number | null
  saved_at: string
}

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  academic: { label: 'Academic', color: 'bg-indigo-100 text-indigo-700' },
  kids:     { label: 'Daily',    color: 'bg-amber-100  text-amber-700'  },
}

const LIST_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

type SortKey = 'recent' | 'alpha' | 'topic'

function sortWords(words: SavedWord[], key: SortKey) {
  return [...words].sort((a, b) => {
    if (key === 'recent') return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    if (key === 'alpha')  return a.word.localeCompare(b.word)
    return a.topic_title.localeCompare(b.topic_title)
  })
}

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
  const [removing, setRemoving]     = useState<Set<number>>(new Set())
  const [showGuide, setShowGuide]   = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0])
  const [creatingList, setCreatingList] = useState(false)
  const [editingList, setEditingList] = useState<WordList | null>(null)
  const [deletingList, setDeletingList] = useState<number | null>(null)
  const [confirmDeleteList, setConfirmDeleteList] = useState<number | null>(null)
  const [showUpgrade, setShowUpgrade]   = useState(false)
  const [view, setView]                 = useState<'list' | 'grid'>('list')
  const [detailId, setDetailId]         = useState<number | null>(null)   // word shown in the bottom sheet
  const [folded, setFolded]             = useState<Record<string, boolean>>({})
  const [studyWords, setStudyWords]     = useState<SavedWord[] | null>(null) // non-null = flashcard session
  const inputRef = useRef<HTMLInputElement>(null)

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
    localStorage.setItem('myWordsFilters', JSON.stringify({ activeList, activeSource, sort, search, view }))
  }, [filtersLoaded, activeList, activeSource, sort, search, view])

  useEffect(() => {
    if (showNewList) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showNewList])

  async function removeWord(w: SavedWord) {
    setRemoving(prev => new Set(prev).add(w.id))
    await fetch('/api/vocabwise/wordlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: w.word, topic_id: w.topic_id }),
    })
    setWords(prev => prev.filter(x => x.id !== w.id))
    setRemoving(prev => { const s = new Set(prev); s.delete(w.id); return s })
  }

  async function createList() {
    if (!newListName.trim() || creatingList) return
    setCreatingList(true)
    const res = await fetch('/api/wordlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName.trim(), color: newListColor }),
    })
    if (res.ok) {
      const { list } = await res.json()
      setLists(prev => [...prev, list])
      setShowNewList(false)
      setNewListName('')
    }
    setCreatingList(false)
  }

  async function deleteList(id: number) {
    setDeletingList(id)
    await fetch('/api/wordlists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLists(prev => prev.filter(l => l.id !== id))
    setWords(prev => prev.map(w => w.list_id === id ? { ...w, list_id: null } : w))
    if (activeList === id) setActiveList('all')
    setDeletingList(null)
  }

  async function assignToList(wordId: number, listId: number | null) {
    await fetch('/api/vocabwise/wordlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wordId, list_id: listId }),
    })
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, list_id: listId } : w))
  }

  async function renameList(id: number, name: string, color: string) {
    await fetch('/api/wordlists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, color }),
    })
    setLists(prev => prev.map(l => l.id === id ? { ...l, name, color } : l))
    setEditingList(null)
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

  function wordLink(w: SavedWord) {
    if (w.source === 'academic') return `/vocabwise/${w.book_id}/${w.topic_id}`
    return null
  }

  function startStudy() {
    const a = [...sorted]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    setStudyWords(a)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {showUpgrade && session && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} username={session.username} />
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-8 pb-3 text-white rounded-b-3xl border-b-[4px] border-black/20">
        <h1 className="text-xl font-bold">⭐ Từ của tôi</h1>
        <p className="text-indigo-200 text-sm mt-0.5">
          {totalAll} từ đã lưu · {totalAcademic} Academic · {totalKids} Daily
        </p>
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

        {/* How-to guide (collapsible) — one rounded card; the body opens inside it */}
        <div className="mx-4 mt-4 overflow-hidden rounded-3xl border-2 border-b-[4px] border-indigo-100 border-b-indigo-200 bg-indigo-50">
          <button
            onClick={() => setShowGuide(v => !v)}
            aria-expanded={showGuide}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-bold text-indigo-700">💡 Cách hoạt động</span>
            <span className={`text-indigo-400 transition-transform text-xs ${showGuide ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showGuide && (
            <div className="space-y-2 px-4 pb-4 text-sm text-indigo-800">
              <p>• Nhấn <strong>⭐</strong> cạnh bất kỳ từ nào trong tab <strong>Từ vựng</strong> (Academic) hoặc màn hình <strong>Flashcard</strong> (Daily) để lưu.</p>
              <p>• Khi lưu, bạn có thể <strong>chọn danh sách</strong> để gắn từ vào — hoặc bỏ qua để vào mục Tất cả.</p>
              <p>• Tạo nhiều <strong>danh sách riêng</strong> cho từng mục tiêu: IELTS Writing, SAT Vocab, Ôn thi tuần này…</p>
              <p>• Chọn một danh sách (hoặc Tất cả) rồi nhấn <strong>Học ngay</strong> để ôn lại dạng flashcard. Chạm vào một từ để xem chi tiết.</p>
            </div>
          )}
        </div>

        {/* Lists section */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh sách của tôi</h2>
            <button
              onClick={() => setShowNewList(v => !v)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
            >
              + Tạo mới
            </button>
          </div>

          {/* Create new list inline */}
          {showNewList && (
            <div className="bg-white rounded-3xl p-4 mb-3 space-y-3 border-2 border-slate-200 border-b-[4px] border-b-slate-300">
              <input
                ref={inputRef}
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createList() }}
                placeholder="Tên danh sách..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                maxLength={40}
              />
              <div className="flex gap-2 flex-wrap">
                {LIST_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewListColor(c)}
                    className={`w-7 h-7 rounded-lg transition-all ${newListColor === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowNewList(false); setNewListName('') }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm">Hủy</button>
                <button onClick={createList} disabled={!newListName.trim() || creatingList}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
                  {creatingList ? '...' : 'Tạo'}
                </button>
              </div>
            </div>
          )}

          {/* List chips */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveList('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                activeList === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              📌 Tất cả ({totalAll})
            </button>
            {lists.map(l => {
              const cnt = words.filter(w => w.list_id === l.id).length
              const isActive = activeList === l.id
              const isConfirming = confirmDeleteList === l.id
              const isEditing = editingList?.id === l.id
              return (
                <div key={l.id} className="relative group">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 bg-white border-2 border-indigo-300 rounded-2xl px-3 py-2 shadow-sm">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: editingList!.color }} />
                      <input
                        autoFocus
                        value={editingList!.name}
                        onChange={e => setEditingList({ ...editingList!, name: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') renameList(editingList!.id, editingList!.name, editingList!.color)
                          if (e.key === 'Escape') setEditingList(null)
                        }}
                        className="text-xs font-bold focus:outline-none w-24"
                        maxLength={40}
                      />
                      <div className="flex gap-1">
                        {LIST_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditingList({ ...editingList!, color: c })}
                            className={`w-3.5 h-3.5 rounded-full transition-all ${editingList!.color === c ? 'ring-1 ring-offset-1 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => renameList(editingList!.id, editingList!.name, editingList!.color)}
                        className="text-[10px] font-bold text-white bg-indigo-500 rounded-full px-2 py-0.5 hover:bg-indigo-600 transition-colors"
                      >✓</button>
                      <button
                        onClick={() => setEditingList(null)}
                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                      >✕</button>
                    </div>
                  ) : isConfirming ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                      <span className="text-sm font-bold text-red-700 whitespace-nowrap">Xóa &quot;{l.name}&quot;?</span>
                      <button
                        onClick={() => setConfirmDeleteList(null)}
                        className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5 hover:bg-gray-100 transition-colors"
                      >Hủy</button>
                      <button
                        onClick={() => { setConfirmDeleteList(null); deleteList(l.id) }}
                        disabled={deletingList === l.id}
                        className="text-[10px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5 hover:bg-red-600 transition-colors disabled:opacity-50"
                      >{deletingList === l.id ? '...' : 'Xóa'}</button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveList(isActive ? 'all' : l.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                          isActive ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                        }`}
                        style={isActive ? { backgroundColor: l.color } : {}}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.name} ({cnt})
                      </button>
                      <button
                        onClick={() => setEditingList(l)}
                        className="absolute -top-1 -left-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold hidden group-hover:flex items-center justify-center transition-all"
                        title="Đổi tên danh sách"
                      >✎</button>
                      <button
                        onClick={() => setConfirmDeleteList(l.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold hidden group-hover:flex items-center justify-center transition-all"
                        title="Xóa danh sách"
                      >✕</button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Study this list */}
        <div className="px-4 mt-4">
          <button type="button" disabled={loading || sorted.length === 0} onClick={startStudy}
            className={cta('indigo', 'flex items-center justify-center gap-2')}>
            🎴 Học ngay {sorted.length > 0 ? `${sorted.length} từ` : ''}{activeList !== 'all' ? ` · ${lists.find(l => l.id === activeList)?.name ?? ''}` : ''}
          </button>
        </div>

        {/* Filters + Search (sticky) */}
        <div className="sticky top-0 z-20 -mx-0 mt-2 space-y-2 bg-gray-50/95 px-4 pb-2 pt-2 backdrop-blur">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm từ..."
            className="w-full rounded-3xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white border-2 border-slate-200 border-b-[4px] border-b-slate-300"
          />
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
            <div className="text-center py-16">
              <Mascot shot={search ? 'pose-magnify' : 'pose-cards'} size={112} className="mb-3 rounded-3xl" />
              <p className="text-gray-500 font-bold">
                {search ? 'Không tìm thấy từ nào' : 'Chưa có từ nào được lưu'}
              </p>
              {!search && (
                <p className="text-gray-400 text-sm mt-1">
                  Nhấn ⭐ cạnh từ trong Academic hoặc Daily để lưu
                </p>
              )}
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
                      {g.words.map(w => {
                        const listInfo = w.list_id ? lists.find(l => l.id === w.list_id) : null
                        return view === 'grid' ? (
                          <div key={w.id} onClick={() => setDetailId(w.id)} role="button" tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') setDetailId(w.id) }}
                            className={`relative flex min-h-[112px] cursor-pointer flex-col rounded-2xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-3 ${PRESS}`}>
                            {listInfo && <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: listInfo.color }} />}
                            <button type="button" onClick={e => { e.stopPropagation(); speak(w.word) }} aria-label={`Nghe phát âm ${w.word}`}
                              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-base active:scale-90">🔊</button>
                            <p className="mt-4 break-words pr-8 text-lg font-bold leading-tight text-slate-800">{w.word}</p>
                            {w.ipa && <p className="text-xs font-semibold text-slate-400">{w.ipa}</p>}
                            <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-blue-700">{w.meaning_vi}</p>
                          </div>
                        ) : (
                          <div key={w.id} onClick={() => setDetailId(w.id)} role="button" tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') setDetailId(w.id) }}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-[3px] border-slate-200 border-b-slate-300 bg-white px-3 py-2.5 ${PRESS}`}>
                            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: listInfo?.color ?? '#e2e8f0' }} />
                            <div className="min-w-0 flex-1">
                              <p className="flex items-baseline gap-2">
                                <span className="truncate text-lg font-bold leading-tight text-slate-800">{w.word}</span>
                                {w.ipa && <span className="flex-shrink-0 text-xs font-semibold text-slate-400">{w.ipa}</span>}
                              </p>
                              <p className="truncate text-sm font-bold text-blue-700">{w.meaning_vi}</p>
                            </div>
                            <button type="button" onClick={e => { e.stopPropagation(); speak(w.word) }} aria-label={`Nghe phát âm ${w.word}`}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg active:scale-90">🔊</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      </div>

      {/* Word detail sheet */}
      {detail && (() => {
        const link = wordLink(detail)
        const src = SOURCE_LABEL[detail.source] ?? SOURCE_LABEL.academic
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => { setDetailId(null) }}>
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-4" onClick={e => e.stopPropagation()}>
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-3xl font-bold leading-tight text-slate-800">{detail.word}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-400">
                    {detail.ipa && <span>{detail.ipa}</span>}
                    {detail.pos && <span className="italic">{detail.pos}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${src.color}`}>{src.label}</span>
                  </p>
                </div>
                <button type="button" onClick={() => speak(detail.word)} aria-label={`Nghe phát âm ${detail.word}`}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl active:scale-90">🔊</button>
              </div>
              <p className="mt-3 text-xl font-bold text-blue-700">{detail.meaning_vi}</p>
              {detail.example_en && <p className="mt-2 text-base italic text-slate-500">&ldquo;{detail.example_en}&rdquo;</p>}
              {detail.topic_title && (link
                ? <Link href={link} className="mt-3 inline-block text-sm font-bold text-indigo-600">📄 {detail.topic_title} →</Link>
                : <p className="mt-3 text-sm font-semibold text-slate-400">📄 {detail.topic_title}</p>)}

              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Danh sách</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => assignToList(detail.id, null)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-bold ${!detail.list_id ? 'border-slate-300 bg-slate-200 text-slate-700' : 'border-slate-200 bg-white text-slate-400'}`}>Không có</button>
                {lists.map(l => (
                  <button key={l.id} type="button" onClick={() => assignToList(detail.id, l.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-bold ${detail.list_id === l.id ? 'border-transparent text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                    style={detail.list_id === l.id ? { backgroundColor: l.color } : {}}>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: l.color }} />{l.name}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setDetailId(null) }} className={cta('slate', 'flex-1')}>Đóng</button>
                <button type="button" disabled={removing.has(detail.id)} onClick={async () => { await removeWord(detail); setDetailId(null) }}
                  className={cta('red', 'flex-1')}>🗑 Xóa từ</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
