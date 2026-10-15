'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import { useBuddy, BuddyImg } from '@/components/games/Buddy'
import {
  buildJumpQuestions, jumpScorePct, speechMatches, JUMP_TRIES, type ArcadeWord,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import WordIcon from '@/components/WordIcon'
import { ArcadeStage, StageHud, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Meadow, Obstacle, FinishFlag, GROUND_Y } from '@/components/games/JumpScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'unsupported' | 'run' | 'ask' | 'listen' | 'check' | 'jump' | 'win' | 'done'

// The browser's speech recognition (Chrome / Edge / Safari; not Firefox). Not in TS's DOM lib.
type Recognition = {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type RecognitionCtor = new () => Recognition
const getRecognition = (): RecognitionCtor | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const RUN_MS = 1300
const JUMP_MS = 1100
const LISTEN_MAX_MS = 6000
const AI_RECORD_MS = 3000 // one word — the AI fallback records this long (tap 🎤 again to stop sooner)
const MIC_DENIED = 'Bé cần cho phép dùng micro: vào cài đặt trang web của trình duyệt → Micro → Cho phép, rồi bấm 🎤 lại.'
const SILENT = 'Chưa nghe thấy gì. Bấm 🎤 rồi nói to, rõ hơn nhé!'
// No speech recognition in the browser (Firefox…): record and let Whisper judge via the same API as
// 🎤 Phát âm cùng AI — each try counts against the child's daily AI Speak quota.
const canRecord = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

export default function JumpGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const buddy = useBuddy()

  const [words, setWords] = useState<ArcadeWord[]>(() => buildJumpQuestions(topic.words))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [tries, setTries] = useState(0)
  const [results, setResults] = useState<number[]>([]) // tries used per word, 0 = not solved
  const [heard, setHeard] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [solved, setSolved] = useState<boolean | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<Recognition | null>(null)
  const aiRecRef = useRef<MediaRecorder | null>(null)
  const [aiMode, setAiMode] = useState(false)
  const [quotaOut, setQuotaOut] = useState(false)
  const recorded = useRef(false)
  const alive = useRef(true)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const total = words.length
  const word = words[index]
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => {
    alive.current = true // (re)mount — dev StrictMode runs the cleanup once in between
    const pending = timers.current
    return () => {
      alive.current = false
      pending.forEach(clearTimeout)
      recRef.current?.abort()
      if (aiRecRef.current?.state === 'recording') aiRecRef.current.stop()
    }
  }, [])

  useEffect(() => {
    const measure = () => { const r = stageRef.current?.getBoundingClientRect(); if (r) setSize({ w: r.width, h: r.height }) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const { w, h } = size
  const tall = h > w
  const groundY = tall ? GROUND_Y.tall : h <= 500 ? GROUND_Y.short : GROUND_Y.wide
  const vmin = Math.min(w, h) / 100
  const obsW = Math.max(96, Math.min(200, 26 * vmin))

  const solvedCount = results.filter((n) => n > 0).length
  const scorePct = jumpScorePct(results, total)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, Math.round(solvedCount * 1.5)) // 🟡 like Phát âm — 1.5x XP
    recordGameResult(level, topic.id, 'jump', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const say = (text: string) => speakWord(text, { rate: 0.8 })

  function runTo(i: number) {
    setIndex(i)
    setTries(0)
    setHeard(null)
    setNote(null)
    setSolved(null)
    setPhase('run')
    later(() => setPhase('ask'), RUN_MS)
  }

  function start() {
    playSfx('ready')
    if (getRecognition()) setAiMode(false)
    else if (canRecord()) setAiMode(true)
    else { setPhase('unsupported'); return }
    enterFullscreen()
    runTo(0)
  }

  function listen() {
    if (aiMode) { void recordForAi(); return }
    const Rec = getRecognition()
    if (!Rec || phase !== 'ask') return
    buzz()
    window.speechSynthesis?.cancel()
    const rec = new Rec()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 5
    rec.continuous = false
    let got: string[] = []
    let error = ''
    let judged = false
    const end = () => {
      if (judged) return
      judged = true
      recRef.current = null
      if (alive.current) judge(got, error)
    }
    rec.onresult = (e) => { got = Array.from(e.results[0] ?? []).map((a) => a.transcript) }
    rec.onerror = (e) => { error = e.error }
    rec.onend = end
    recRef.current = rec
    setNote(null)
    setHeard(null)
    setPhase('listen')
    try { rec.start() } catch { setPhase('ask'); setNote('Micro đang bận, bấm 🎤 lần nữa nhé.'); return }
    later(() => recRef.current === rec && rec.stop(), LISTEN_MAX_MS)
    // Some browsers never fire onend after stop(): judge what we have rather than hang on "listening".
    later(() => { if (!judged) { rec.abort(); end() } }, LISTEN_MAX_MS + 1500)
  }

  function judge(alternatives: string[], error: string) {
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      setPhase('ask'); setNote(MIC_DENIED); return
    }
    if (error === 'network') { setPhase('ask'); setNote('Nhận giọng cần có mạng. Kiểm tra kết nối rồi thử lại nhé.'); return }
    if (!alternatives.some((a) => a.trim())) {
      // Nothing heard — not the kid's fault, doesn't use a try.
      setPhase('ask'); setNote(SILENT); return
    }
    verdict(alternatives[0], speechMatches(alternatives, word.word))
  }

  async function recordForAi() {
    if (phase !== 'ask') return
    buzz()
    window.speechSynthesis?.cancel()
    setNote(null)
    setHeard(null)
    setPhase('listen')
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { setPhase('ask'); setNote(MIC_DENIED); return }
    const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'
    const mr = new MediaRecorder(stream, { mimeType: mime })
    const chunks: Blob[] = []
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      aiRecRef.current = null
      if (!alive.current) return
      setPhase('check')
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      const fd = new FormData()
      fd.append('audio', new File([new Blob(chunks, { type: mime })], `rec.${ext}`, { type: mime }))
      fd.append('target', word.word)
      fd.append('word', word.word)
      fd.append('level', level)
      try {
        const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
        if (!alive.current) return
        if (res.status === 429) { setQuotaOut(true); setPhase('unsupported'); return }
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json() as { transcript?: string; correct?: boolean; unclear?: boolean }
        const heardText = String(data.transcript ?? '').trim()
        if (data.unclear || !heardText) { setPhase('ask'); setNote(SILENT); return }
        verdict(heardText, !!data.correct)
      } catch { if (alive.current) { setPhase('ask'); setNote('Lỗi kết nối, bấm 🎤 thử lại nhé.') } }
    }
    aiRecRef.current = mr
    mr.start()
    later(() => { if (mr.state === 'recording') mr.stop() }, AI_RECORD_MS)
  }

  // One try heard: right → jump; wrong → use up a try (the 3rd miss ends the word).
  function verdict(heardText: string, ok: boolean) {
    setHeard(heardText)
    const used = tries + 1
    if (ok) {
      finish(used)
      return
    }
    playWrongSound()
    setTries(used)
    if (used >= JUMP_TRIES) finish(0)
    else { setPhase('ask'); setNote(`Chưa đúng rồi, thử lại nhé! (còn ${JUMP_TRIES - used} lượt)`) }
  }

  // used = tries the word took (1–3), 0 = not solved (out of tries or skipped). the buddy jumps either
  // way so the run keeps going; a miss hears the word first.
  function finish(used: number) {
    setResults((r) => [...r, used])
    recordAnswer(level, topic.id, word, used === 1)
    setSolved(used > 0)
    if (used > 0) {
      playCorrectSound()
      setNote(null)
    } else {
      setNote(`Từ đúng là “${word.word}”. Lần sau nhé!`)
      say(word.word)
    }
    later(() => { setPhase('jump'); playSfx('boing') }, used > 0 ? 500 : 1800)
    later(() => {
      if (index + 1 < total) runTo(index + 1)
      else { setPhase('win'); playSfx('trophy'); setShowConfetti(true) }
    }, (used > 0 ? 500 : 1800) + JUMP_MS)
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    recRef.current?.abort()
    recorded.current = false
    setWords(buildJumpQuestions(topic.words))
    setResults([])
    setShowConfetti(false)
    setIndex(0)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  const onCourse = ['run', 'ask', 'listen', 'check', 'jump'].includes(phase)
  const wrongWords = words.filter((_, i) => results[i] !== undefined && results[i] !== 1).map((x) => x.word)
  const rockyShot = phase === 'jump' || phase === 'win' ? 'pose-jump' : phase === 'listen' ? 'pose-speak' : 'pose-cheer'
  const rockyH = Math.max(80, Math.min(170, 22 * vmin))
  const obsAnim = phase === 'run' ? `jsObsIn ${RUN_MS}ms cubic-bezier(.2,.7,.4,1) both` : phase === 'jump' ? `jsObsOut ${JUMP_MS}ms linear both` : undefined

  return (
    <ArcadeStage>
      <style>{`
        @keyframes jsObsIn { from { left: 110% } to { left: 56% } }
        @keyframes jsObsOut { from { left: 56% } to { left: -30% } }
        @keyframes jsRun { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-6%) rotate(3deg) } }
        @keyframes jsJump { 0% { transform: translateY(0) } 45% { transform: translateY(-120%) } 100% { transform: translateY(0) } }
        @keyframes jsPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.6) } 50% { box-shadow: 0 0 0 4vmin rgba(239,68,68,0) } }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div ref={stageRef} className="absolute inset-0">
        <Meadow groundY={groundY} running={phase === 'run' || phase === 'jump'} />

        <StageHud tone="wood" onExit={exit} cards={[{ label: 'Vượt', value: `${solvedCount}/${total}` }]} />

        {/* The child's buddy */}
        {(onCourse || phase === 'win') && w > 0 && (
          <div className="absolute z-[5] -translate-x-1/2" style={{ left: '20%', top: h * groundY - rockyH, height: rockyH,
            animation: phase === 'jump' ? `jsJump ${JUMP_MS}ms ease-in-out` : phase === 'run' ? 'jsRun .35s ease-in-out infinite' : undefined }}>
            <BuddyImg shot={rockyShot} className="h-full w-auto" />
          </div>
        )}

        {/* The obstacle with its sign */}
        {onCourse && word && w > 0 && (
          <div key={index} className="absolute -translate-x-1/2" style={{ left: '56%', top: h * groundY - obsW * 0.6 + 2, width: obsW, height: obsW * 0.6, animation: obsAnim }}>
            <Obstacle index={index} sign={phase === 'jump' ? undefined : (
              <div className="flex w-max max-w-[44vw] flex-col items-center rounded-xl border-[4px] border-[#78350F] bg-[#FEF3C7] px-3 py-1 shadow-lg portrait:max-w-[60vw]">
                <WordIcon word={word.word} emoji={word.emoji} emojiClass="text-[clamp(30px,8vmin,70px)] leading-none" iconSize={64} />
                <span className="line-clamp-2 text-center text-[clamp(15px,3.6vmin,34px)] font-black leading-tight text-[#451A03]">{word.meaning}</span>
              </div>
            )} />
          </div>
        )}

        {phase === 'win' && w > 0 && (
          <div className="absolute" style={{ left: '30%', top: h * groundY - 26 * vmin, height: 26 * vmin, width: 13 * vmin }}><FinishFlag /></div>
        )}

        {/* Mic panel on the ground */}
        {(phase === 'ask' || phase === 'listen' || phase === 'check' || (phase === 'jump' && solved !== null)) && word && (
          <div className="absolute inset-x-0 bottom-[3%] z-10 flex flex-col items-center gap-[1.5vmin] px-4" style={{ top: h * groundY + 3 * vmin }}>
            <p className="min-h-[1.4em] rounded-full bg-black/35 px-3 py-0.5 text-center text-[clamp(13px,2.9vmin,26px)] font-bold text-white">
              {phase === 'listen' ? 'Đang nghe… nói từ tiếng Anh nhé!'
                : solved === true ? `Giỏi quá! ✨ ${word.word}`
                : phase === 'check' ? 'Đang chấm… 🤖'
                : note ?? `Bấm 🎤 rồi nói từ tiếng Anh để ${buddy.name} nhảy qua!`}
            </p>
            <div className="flex items-center gap-[3vmin]">
              <button type="button" onClick={() => { buzz(); say(word.word) }} disabled={phase !== 'ask'}
                className="rounded-full border-b-4 border-sky-700 bg-sky-100 px-3 py-2 text-[clamp(13px,2.8vmin,24px)] font-black text-sky-900 shadow active:translate-y-0.5 disabled:opacity-50">🔊 Nghe mẫu</button>
              <button type="button" disabled={!(phase === 'ask' || (aiMode && phase === 'listen'))}
                onClick={() => { if (aiMode && phase === 'listen') { if (aiRecRef.current?.state === 'recording') aiRecRef.current.stop() } else listen() }}
                aria-label={aiMode && phase === 'listen' ? 'Nói xong' : 'Bấm để nói'}
                className={`flex h-[clamp(72px,17vmin,130px)] w-[clamp(72px,17vmin,130px)] items-center justify-center rounded-full border-b-[6px] text-[clamp(34px,8vmin,64px)] shadow-xl active:translate-y-1 ${
                  phase === 'listen' ? 'border-red-800 bg-red-500' : 'border-amber-700 bg-amber-300'} disabled:opacity-90`}
                style={phase === 'listen' ? { animation: 'jsPulse 1.2s ease-out infinite' } : undefined}>🎤</button>
              <button type="button" onClick={() => { buzz(); if (phase === 'ask') finish(0) }} disabled={phase !== 'ask'}
                className="rounded-full border-b-4 border-slate-500 bg-slate-100 px-3 py-2 text-[clamp(13px,2.8vmin,24px)] font-black text-slate-700 shadow active:translate-y-0.5 disabled:opacity-50">Bỏ qua ⏭</button>
            </div>
            <p className="text-[clamp(12px,2.6vmin,22px)] font-bold text-amber-100">
              {heard && solved !== true ? <>Máy nghe được: “{heard}” · </> : null}
              Lượt thử: {'●'.repeat(Math.min(tries, JUMP_TRIES))}{'○'.repeat(Math.max(0, JUMP_TRIES - tries))}
            </p>
            {aiMode && <p className="text-[clamp(11px,2.3vmin,20px)] font-semibold text-amber-100/80">🤖 AI nghe giúp · tính vào lượt Phát âm AI hôm nay</p>}
          </div>
        )}

        {phase === 'win' && (
          <div className="absolute inset-x-0 top-[16%] z-10 flex flex-col items-center gap-3 px-4 text-center portrait:top-[20%]">
            <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-white drop-shadow-[0_3px_0_#3F6212]">🏁 Về đích rồi!</p>
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="wood">
          <BuddyImg shot="pose-jump" className="mx-auto h-24 w-auto [@media(max-height:500px)]:hidden" />
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">🦘 Hô To Để Nhảy</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            {buddy.name} gặp chướng ngại vật! Xem hình và nghĩa, bấm 🎤 rồi nói to từ tiếng Anh để {buddy.name} nhảy qua. Mỗi từ được thử {JUMP_TRIES} lần.
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-amber-300 bg-amber-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {total} chướng ngại · cần micro 🎤
          </p>
          <StageButton tone="gold" onClick={start}>▶ Chạy thôi</StageButton>
        </StageModal>
      )}

      {phase === 'unsupported' && (
        <StageModal tone="wood">
          {quotaOut ? <>
            <h2 className="text-2xl font-black sm:text-3xl">Hết lượt chấm AI hôm nay 😴</h2>
            <p className="mt-2 text-base font-semibold">
              Trình duyệt này cần AI để nghe bé nói, và hôm nay đã dùng hết lượt Phát âm AI. Mở app bằng Chrome, Edge hoặc Safari để chơi miễn phí, hoặc quay lại vào ngày mai nhé!
            </p>
          </> : <>
            <h2 className="text-2xl font-black sm:text-3xl">Trình duyệt chưa hỗ trợ nhận giọng 😢</h2>
            <p className="mt-2 text-base font-semibold">
              Hãy mở app bằng Chrome, Edge hoặc Safari (iPhone/iPad) để chơi game này. Trong lúc đó bé có thể luyện nói ở trò “🎤 Phát âm cùng AI”.
            </p>
          </>}
          <StageButton tone="gold" onClick={exit}>← Chọn trò khác</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="wood">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={Math.round(solvedCount * 1.5)} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={`Nói đúng ${solvedCount}/${total} từ`}
              extra={<>Đúng ngay lần đầu: {results.filter((n) => n === 1).length} từ<br />Nói đúng ngay từ lần đầu để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
