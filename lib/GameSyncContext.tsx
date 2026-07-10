'use client'

// React Context wrapper for game/lesson sync state.
// Call initGameSync() before each game/review, flush() at completion.

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { saveOfflineProgress } from './offlineStorage'

export type WeakEntry = { wrong: number; correctStreak: number; lastWrong: string }
export type HistoryEntry = { words: number; games: number; xp: number; topicIds?: string[] }
export type SrsEntry = { interval: number; due: string; ef: number }

export type SyncData = {
  seen?: string[]
  weak_words?: Record<string, WeakEntry | number>
  streak?: { current?: number; best?: number; lastActive?: string }
  battle?: { totalAllTime?: number }
  mastery?: Record<string, { flashcard: boolean; games: string[] }>
  history?: Record<string, HistoryEntry>
  srs?: Record<string, SrsEntry>
} | null

type GameSyncApi = {
  initGameSync: (childId: string, level: string, data: SyncData, topicId?: string, topicName?: string) => void
  markSeen: (level: string, topicId: string, word: string) => void
  recordAnswer: (level: string, topicId: string, w: { word: string }, isCorrect: boolean) => boolean
  recordReviewAnswer: (word: string, isCorrect: boolean) => boolean
  getWeakWords: () => Record<string, WeakEntry>
  recordSrsAnswer: (word: string, isCorrect: boolean) => void
  getSrsDueCount: () => number
  recordActivity: (level: string) => void
  addScore: (level: string, points: number) => void
  recordFlashcardDone: (level: string, topicId: string) => void
  recordPerfectGame: (level: string, topicId: string, gameKey: string) => void
  flush: () => Promise<void>
}

function todayKey() { return new Date().toISOString().split('T')[0] }

/**
 * Pure SM-2-style SRS step, extracted so it can be unit-tested directly instead
 * of via a hand-copied reimplementation. `today` is only used as the seed for a
 * brand-new entry's `due` — the interval math below always computes the real due
 * date from `new Date()`.
 */
export function applySrsAnswer(entry: SrsEntry | undefined, isCorrect: boolean, today: string): SrsEntry {
  const e = entry ?? { interval: 1, due: today, ef: 2.5 }
  if (isCorrect) {
    const newInterval = Math.min(Math.round(e.interval * e.ef), 60)
    const newEf = parseFloat(Math.max(1.3, e.ef + 0.1).toFixed(2))
    const due = new Date()
    due.setDate(due.getDate() + newInterval)
    return { interval: newInterval, due: due.toISOString().split('T')[0], ef: newEf }
  }
  const due = new Date()
  due.setDate(due.getDate() + 1)
  return { interval: 1, due: due.toISOString().split('T')[0], ef: parseFloat(Math.max(1.3, e.ef - 0.2).toFixed(2)) }
}

function createGameSyncApi(): GameSyncApi {
  let _childId = ''
  let _level = ''
  let _topicId = ''
  let _topicName = ''
  let _seen: string[] = []
  let _weakWords: Record<string, WeakEntry> = {}
  let _streak = { current: 0, best: 0, lastActive: '' }
  let _battle = { totalAllTime: 0 }
  let _mastery: Record<string, { flashcard: boolean; games: string[] }> = {}
  let _history: Record<string, HistoryEntry> = {}
  let _srs: Record<string, SrsEntry> = {}
  // Tracks whether flush() has been called for the current session.
  // Prevents autoFlushPrevious from sending a duplicate POST after a normal game completion.
  let _flushed = false

  function bumpHistory(field: 'words' | 'games' | 'xp', amount = 1) {
    const today = todayKey()
    const prev = _history[today] ?? { words: 0, games: 0, xp: 0 }
    _history = { ..._history, [today]: { ...prev, [field]: prev[field] + amount } }
  }

  function bumpTopic(topicId: string) {
    const today = todayKey()
    const prev = _history[today] ?? { words: 0, games: 0, xp: 0 }
    const ids = prev.topicIds ?? []
    if (!ids.includes(topicId)) {
      _history = { ..._history, [today]: { ...prev, topicIds: [...ids, topicId] } }
    }
  }

  // If the previous session was abandoned (no flush), send its data before overwriting state.
  function autoFlushPrevious(nextChildId: string) {
    if (!_childId || _childId === nextChildId || _flushed) return
    const childId = _childId
    const payload = { level: _level, seen: _seen, weak_words: _weakWords, streak: _streak, battle: _battle, mastery: _mastery, history: _history, srs: _srs }
    if (typeof navigator !== 'undefined' && !navigator.onLine && _topicId) {
      saveOfflineProgress(childId, _level, _topicId, { topicName: _topicName, ...payload })
      return
    }
    fetch(`/api/sync/${childId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }

  function initGameSync(childId: string, level: string, data: SyncData, topicId = '', topicName = '') {
    autoFlushPrevious(childId)
    _flushed = false
    _childId = childId
    _level = level
    _topicId = topicId
    _topicName = topicName
    _seen = data?.seen ?? []
    // migrate old number format → WeakEntry
    const rawWeak = (data?.weak_words ?? {}) as Record<string, WeakEntry | number>
    _weakWords = Object.fromEntries(
      Object.entries(rawWeak).map(([k, v]) => [
        k,
        typeof v === 'number' ? { wrong: v, correctStreak: 0, lastWrong: '' } : v,
      ])
    )
    _streak = {
      current: data?.streak?.current ?? 0,
      best: data?.streak?.best ?? 0,
      lastActive: data?.streak?.lastActive ?? '',
    }
    _battle = { totalAllTime: data?.battle?.totalAllTime ?? 0 }
    _mastery = data?.mastery ?? {}
    _history = data?.history ?? {}
    _srs = data?.srs ?? {}
  }

  function markSeen(_level: string, _topicId: string, word: string) {
    if (!_seen.includes(word)) {
      _seen = [..._seen, word]
      bumpHistory('words')
      // Auto-schedule in SRS for first-time seen words
      if (!_srs[word]) {
        const today = new Date().toISOString().split('T')[0]
        _srs = { ..._srs, [word]: { interval: 1, due: today, ef: 2.5 } }
      }
    }
  }

  function recordAnswer(
    _level: string, _topicId: string,
    w: { word: string }, isCorrect: boolean
  ): boolean {
    const today = new Date().toISOString().split('T')[0]
    const entry = _weakWords[w.word]
    if (isCorrect) {
      if (entry) {
        const newStreak = entry.correctStreak + 1
        if (newStreak >= 3) {
          const next = { ..._weakWords }
          delete next[w.word]
          _weakWords = next
          return true // mastered — removed from weak list
        }
        _weakWords = { ..._weakWords, [w.word]: { ...entry, correctStreak: newStreak } }
      }
    } else {
      _weakWords = {
        ..._weakWords,
        [w.word]: { wrong: (entry?.wrong ?? 0) + 1, correctStreak: 0, lastWrong: today },
      }
    }
    return false
  }

  // For review session — same logic, by word key
  function recordReviewAnswer(word: string, isCorrect: boolean): boolean {
    return recordAnswer('', '', { word }, isCorrect)
  }

  function getWeakWords(): Record<string, WeakEntry> {
    return { ..._weakWords }
  }

  function recordSrsAnswer(word: string, isCorrect: boolean) {
    const today = new Date().toISOString().split('T')[0]
    _srs = { ..._srs, [word]: applySrsAnswer(_srs[word], isCorrect, today) }
  }

  function getSrsDueCount(): number {
    const today = new Date().toISOString().split('T')[0]
    return Object.values(_srs).filter(e => e.due <= today).length
  }

  function recordActivity(_level: string) {
    const today = new Date().toISOString().split('T')[0]
    if (_streak.lastActive === today) return
    const yest = new Date()
    yest.setDate(yest.getDate() - 1)
    const yesterdayStr = yest.toISOString().split('T')[0]
    const newCurrent = _streak.lastActive === yesterdayStr ? _streak.current + 1 : 1
    _streak = { current: newCurrent, best: Math.max(_streak.best, newCurrent), lastActive: today }
  }

  function addScore(_level: string, points: number) {
    if (points > 0) {
      _battle = { totalAllTime: _battle.totalAllTime + points }
      bumpHistory('xp', points)
    }
  }

  function recordFlashcardDone(_level: string, topicId: string) {
    const entry = _mastery[topicId] ?? { flashcard: false, games: [] }
    if (!entry.flashcard) {
      _mastery = { ..._mastery, [topicId]: { ...entry, flashcard: true } }
      bumpHistory('games')
    }
    bumpTopic(topicId)
  }

  function recordPerfectGame(_level: string, topicId: string, gameKey: string) {
    const entry = _mastery[topicId] ?? { flashcard: false, games: [] }
    if (!entry.games.includes(gameKey)) {
      _mastery = { ..._mastery, [topicId]: { ...entry, games: [...entry.games, gameKey] } }
      bumpHistory('games')
    }
    bumpTopic(topicId)
  }

  async function flush() {
    if (!_childId || !_level) return
    _flushed = true

    const payload = { level: _level, seen: _seen, weak_words: _weakWords, streak: _streak, battle: _battle, mastery: _mastery, history: _history, srs: _srs }

    // Offline: queue progress in localStorage for deferred sync
    if (typeof navigator !== 'undefined' && !navigator.onLine && _topicId) {
      saveOfflineProgress(_childId, _level, _topicId, { topicName: _topicName, ...payload })
      return
    }

    await fetch(`/api/sync/${_childId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }

  return {
    initGameSync, markSeen, recordAnswer, recordReviewAnswer, getWeakWords,
    recordSrsAnswer, getSrsDueCount, recordActivity, addScore,
    recordFlashcardDone, recordPerfectGame, flush,
  }
}

const GameSyncContext = createContext<GameSyncApi | null>(null)

export function GameSyncProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<GameSyncApi | null>(null)
  if (!apiRef.current) apiRef.current = createGameSyncApi()
  return <GameSyncContext.Provider value={apiRef.current}>{children}</GameSyncContext.Provider>
}

export function useGameSync(): GameSyncApi {
  const ctx = useContext(GameSyncContext)
  if (!ctx) throw new Error('useGameSync must be used within GameSyncProvider')
  return ctx
}
