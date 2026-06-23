'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
import type { WordList } from '@/components/WordListPicker'
import UpgradeModal from '@/components/UpgradeModal'
import { getMyWordsLimit } from '@/lib/planUtils'

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
  const router = useRouter()
  const [session, setSession]       = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [words, setWords]           = useState<SavedWord[]>([])
  const [lists, setLists]           = useState<WordList[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeList, setActiveList] = useState<number | 'all'>('all')
  const [activeSource, setActiveSource] = useState<'all' | 'academic' | 'kids'>('all')
  const [sort, setSort]             = useState<SortKey>('recent')
  const [search, setSearch]         = useState('')
  const [removing, setRemoving]     = useState<Set<number>>(new Set())
  const [showGuide, setShowGuide]   = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0])
  const [creatingList, setCreatingList] = useState(false)
  const [editingList, setEditingList] = useState<WordList | null>(null)
  const [deletingList, setDeletingList] = useState<number | null>(null)
  const [confirmDeleteList, setConfirmDeleteList] = useState<number | null>(null)
  const [assigningWord, setAssigningWord] = useState<number | null>(null)
  const [showUpgrade, setShowUpgrade]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      fetch('/api/vocabwise/wordlist').then(r => r.ok ? r.json() : { saved: [] }),
      fetch('/api/wordlists').then(r => r.ok ? r.json() : { lists: [] }),
    ]).then(([sess, wData, lData]) => {
      setSession(sess)
      setSessionLoaded(true)
      setWords(wData.saved ?? [])
      setLists(lData.lists ?? [])
    }).finally(() => setLoading(false))
  }, [])

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
    setAssigningWord(null)
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-12 pb-5 text-white">
        <h1 className="text-xl font-black">⭐ Từ của tôi</h1>
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
              className="text-xs font-black text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
            >
              Nâng cấp
            </button>
          </div>
        )}

        {/* How-to guide (collapsible) */}
        <div className="mx-4 mt-4">
          <button
            onClick={() => setShowGuide(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-left"
          >
            <span className="text-sm font-black text-indigo-700">💡 Cách hoạt động</span>
            <span className={`text-indigo-400 transition-transform text-xs ${showGuide ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showGuide && (
            <div className="bg-indigo-50 border border-indigo-100 border-t-0 rounded-b-2xl px-4 pb-4 space-y-2 text-sm text-indigo-800">
              <p>• Nhấn <strong>⭐</strong> cạnh bất kỳ từ nào trong tab <strong>Từ vựng</strong> (Academic) hoặc màn hình <strong>Flashcard</strong> (Daily) để lưu.</p>
              <p>• Khi lưu, bạn có thể <strong>chọn danh sách</strong> để gắn từ vào — hoặc bỏ qua để vào mục Tất cả.</p>
              <p>• Tạo nhiều <strong>danh sách riêng</strong> cho từng mục tiêu: IELTS Writing, SAT Vocab, Ôn thi tuần này…</p>
              <p>• Nhấn <strong>Học ngay</strong> trên một danh sách để ôn lại dạng flashcard.</p>
            </div>
          )}
        </div>

        {/* Lists section */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Danh sách của tôi</h2>
            <button
              onClick={() => setShowNewList(v => !v)}
              className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
            >
              + Tạo mới
            </button>
          </div>

          {/* Create new list inline */}
          {showNewList && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
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
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-all">
                  {creatingList ? '...' : 'Tạo'}
                </button>
              </div>
            </div>
          )}

          {/* List chips */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveList('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
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
                        className="text-xs font-black focus:outline-none w-24"
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
                        className="text-[10px] font-black text-white bg-indigo-500 rounded-full px-2 py-0.5 hover:bg-indigo-600 transition-colors"
                      >✓</button>
                      <button
                        onClick={() => setEditingList(null)}
                        className="text-[10px] font-black text-gray-400 hover:text-gray-600 transition-colors"
                      >✕</button>
                    </div>
                  ) : isConfirming ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                      <span className="text-xs font-black text-red-700 whitespace-nowrap">Xóa "{l.name}"?</span>
                      <button
                        onClick={() => setConfirmDeleteList(null)}
                        className="text-[10px] font-black text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5 hover:bg-gray-100 transition-colors"
                      >Hủy</button>
                      <button
                        onClick={() => { setConfirmDeleteList(null); deleteList(l.id) }}
                        disabled={deletingList === l.id}
                        className="text-[10px] font-black text-white bg-red-500 rounded-full px-2 py-0.5 hover:bg-red-600 transition-colors disabled:opacity-50"
                      >{deletingList === l.id ? '...' : 'Xóa'}</button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveList(isActive ? 'all' : l.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                          isActive ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                        }`}
                        style={isActive ? { backgroundColor: l.color } : {}}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.name} ({cnt})
                      </button>
                      <button
                        onClick={() => setEditingList(l)}
                        className="absolute -top-1 -left-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-black hidden group-hover:flex items-center justify-center transition-all"
                        title="Đổi tên danh sách"
                      >✎</button>
                      <button
                        onClick={() => setConfirmDeleteList(l.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black hidden group-hover:flex items-center justify-center transition-all"
                        title="Xóa danh sách"
                      >✕</button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters + Search */}
        <div className="px-4 mt-4 space-y-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm từ..."
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
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
          </div>
        </div>

        {/* Word list */}
        <div className="px-4 mt-4 pb-nav">
          {loading && (
            <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
          )}

          {!loading && sorted.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">{search ? '🔍' : '📭'}</div>
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

          <div className="space-y-2">
            {sorted.map(w => {
              const link = wordLink(w)
              const src  = SOURCE_LABEL[w.source] ?? SOURCE_LABEL.academic
              const listInfo = w.list_id ? lists.find(l => l.id === w.list_id) : null
              return (
                <div key={w.id} className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-black text-gray-800 text-sm">{w.word}</span>
                      {w.ipa && <span className="text-gray-400 text-xs">{w.ipa}</span>}
                      {w.pos && <span className="text-gray-400 text-xs italic">{w.pos}</span>}
                      <button onClick={() => speak(w.word)} aria-label={`Nghe phát âm ${w.word}`} className="text-gray-300 hover:text-blue-500 transition-colors">🔊</button>
                      {/* Source badge */}
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${src.color}`}>{src.label}</span>
                      {/* List badge — click to reassign */}
                      <button
                        onClick={() => setAssigningWord(assigningWord === w.id ? null : w.id)}
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
                          listInfo
                            ? 'text-white hover:opacity-80'
                            : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600'
                        }`}
                        style={listInfo ? { backgroundColor: listInfo.color } : {}}
                        title="Đổi danh sách"
                      >
                        {listInfo ? listInfo.name : '+ list'}
                      </button>
                    </div>
                    {/* Inline list picker */}
                    {assigningWord === w.id && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => assignToList(w.id, null)}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition-colors ${
                            !w.list_id ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                          }`}
                        >Không có</button>
                        {lists.map(l => (
                          <button
                            key={l.id}
                            onClick={() => assignToList(w.id, l.id)}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition-colors ${
                              w.list_id === l.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                            }`}
                            style={w.list_id === l.id ? { backgroundColor: l.color, borderColor: l.color } : {}}
                          >
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ backgroundColor: l.color }} />
                            {l.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-blue-700 font-bold text-xs mt-0.5">{w.meaning_vi}</p>
                    {w.example_en && <p className="text-gray-400 text-xs italic mt-0.5 line-clamp-1">{w.example_en}</p>}
                    {w.topic_title && (
                      link
                        ? <Link href={link} className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors mt-0.5 block">📄 {w.topic_title}</Link>
                        : <p className="text-[10px] text-gray-400 mt-0.5">📄 {w.topic_title}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeWord(w)}
                    disabled={removing.has(w.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40 p-1 -mr-1 mt-0.5"
                    aria-label="Xóa"
                  >✕</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
