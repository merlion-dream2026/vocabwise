'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { initPhonicsSync, isPairSeen, isLessonMastered, getPairGames } from '@/lib/phonicsSync'
import phonicsLevels from '@/data/phonicsLevels.json'

type ArticleSection = { heading: string; body: string }
const LEVEL_ARTICLES: Record<string, { intro: string; sections: ArticleSection[] }> = {
  'vowels-short': {
    intro: 'Tiếng Anh có 7 nguyên âm ngắn (short vowels) không xuất hiện trong tiếng Việt. Khác với tiếng Việt, nguyên âm ngắn tiếng Anh không mang thanh điệu — chỉ cần phát âm đúng hình miệng và độ dài ngắn.',
    sections: [
      { heading: '🇻🇳 Tại sao khó với người Việt?', body: 'Tiếng Việt có 6 thanh điệu nhưng ít nguyên âm thuần. Người Việt hay thay /æ/ bằng /a/ (cat → "cat" nghe như "cát"), hay nhầm /ɪ/ với /iː/ (sit → "seat"), hoặc /ʊ/ với /uː/ (put → "pool").' },
      { heading: '📌 7 nguyên âm ngắn cần nhớ', body: '/ɪ/ — sit, kit, fish\n/e/ — bed, pen, ten\n/æ/ — cat, man, bad\n/ɒ/ — hot, dog, shop\n/ʌ/ — cup, bus, sun\n/ʊ/ — put, book, cook\n/ə/ — about, sofa (âm schwa — âm yếu nhất)' },
      { heading: '💡 Mẹo luyện tập', body: 'Nghe mỗi cặp tương phản nhiều lần trước khi tập đọc. Chú ý hình miệng: /æ/ mở rộng hàm, /ɪ/ môi hơi kéo ngang, /ʊ/ môi tròn.' },
    ],
  },
  diphthongs: {
    intro: 'Nguyên âm đôi (diphthong) là âm bắt đầu ở một nguyên âm rồi trượt sang nguyên âm khác trong cùng một âm tiết. Đây là điểm rất khác biệt so với tiếng Việt và là nguyên nhân khiến phát âm tiếng Anh nghe "ngọt" hơn.',
    sections: [
      { heading: '🎯 Nguyên âm đôi là gì?', body: 'Khi phát âm /eɪ/ trong "day", miệng bắt đầu ở /e/ rồi trượt lên /ɪ/. Khi phát âm /aʊ/ trong "now", miệng bắt đầu rộng ở /a/ rồi khép tròn về /ʊ/. Đây không phải 2 âm riêng biệt — là một âm duy nhất có sự trượt.' },
      { heading: '📌 5 nguyên âm đôi chính', body: '/eɪ/ — day, make, rain\n/aɪ/ — my, night, time\n/əʊ/ — go, home, know\n/aʊ/ — now, out, town\n/ɔɪ/ — boy, coin, noise' },
      { heading: '🇻🇳 Lỗi phổ biến', body: 'Người Việt hay phát âm nguyên âm đôi thành âm đơn — ví dụ: /eɪ/ → /e/ (day phát âm như "đê"), /əʊ/ → /o/ (go phát âm như "gô"). Nhớ để miệng "trượt" — không dừng lại ở âm đầu.' },
    ],
  },
  consonants: {
    intro: 'Tiếng Anh có 8 cặp phụ âm đối xứng: một âm vô thanh (không rung dây thanh) và một âm hữu thanh (rung dây thanh). Hiểu cặp đôi này giúp bạn phân biệt được hàng trăm từ trông giống nhau.',
    sections: [
      { heading: '🔊 Vô thanh vs Hữu thanh', body: 'Đặt tay lên cổ họng khi phát âm. Nếu cảm thấy rung → hữu thanh (voiced). Không rung → vô thanh (voiceless).\n\nVô thanh: /p/ /t/ /k/ /f/ /s/ /ʃ/ /tʃ/ /θ/\nHữu thanh: /b/ /d/ /g/ /v/ /z/ /ʒ/ /dʒ/ /ð/' },
      { heading: '📌 Các cặp quan trọng nhất', body: '/p/-/b/: park/bark, cup/cub\n/t/-/d/: ten/den, bet/bed\n/k/-/g/: coat/goat, back/bag\n/f/-/v/: fan/van, leaf/leave\n/s/-/z/: sip/zip, ice/eyes\n/θ/-/ð/: thin/then, bath/bathe' },
      { heading: '🇻🇳 Khó nhất với người Việt', body: '/θ/ và /ð/ (th): không có trong tiếng Việt. Lưỡi chạm nhẹ mép răng trên, thổi hơi qua khe.\n/v/: nhiều người Việt phát âm thành /b/ hoặc /f/.\n/z/: cần rung dây thanh, không phải /s/.' },
    ],
  },
  'consonants-other': {
    intro: 'Ngoài các cặp phụ âm đối xứng, tiếng Anh có nhiều phụ âm đặc biệt: mũi, bán nguyên âm, âm cuối câm và cụm phụ âm. Nhóm này quyết định độ "bản ngữ" trong phát âm.',
    sections: [
      { heading: '👃 Phụ âm mũi (Nasals)', body: '/m/ — man, some, time\n/n/ — now, nine, sun\n/ŋ/ — sing, ring, long\n\nLưu ý: /ŋ/ cuối "sing" không có âm /g/ theo sau. Người Việt hay thêm /g/ → singing nghe như "sing-ging".' },
      { heading: '🌊 Bán nguyên âm (Approximants)', body: '/w/ — wet, away, queen\n/j/ — yes, year, you\n/l/ — late, feel, milk\n/r/ — red, arrive, error\n\nĐặc biệt: /r/ tiếng Anh không rung lưỡi như tiếng Việt — lưỡi co vào giữa không chạm vòm.' },
      { heading: '🔇 Âm cuối (Final Stops)', body: 'Trong tiếng Anh thông thường, /p/ /t/ /k/ cuối từ thường không bật hơi (unreleased). Người học hay thêm nguyên âm vào sau — "cat" thành "cat-uh". Tập dừng miệng tại âm cuối mà không thở thêm.' },
      { heading: '🔗 Cụm phụ âm (Clusters)', body: 'Tiếng Anh cho phép nhiều phụ âm liền nhau: str-, spl-, -nds, -lts. Người Việt hay chèn nguyên âm vào giữa: "street" → "s(ơ)treet". Tập nói liền mạch không ngắt giữa cụm.' },
    ],
  },
  'viet-challenges': {
    intro: 'Ba nhóm âm sau đây là những lỗi phát âm phổ biến nhất của người Việt học tiếng Anh. Nhận ra và sửa đúng những âm này sẽ cải thiện độ rõ ràng trong giao tiếp rất nhiều.',
    sections: [
      { heading: '🔄 /l/ vs /r/', body: 'Tiếng Việt có /l/ nhưng không có /r/ kiểu Anh (retroflex). Trong tiếng Anh, /r/ được tạo bằng cách co lưỡi vào giữa — không rung, không chạm vòm. Ví dụ: light vs right, lace vs race.' },
      { heading: '🔇 Âm cuối bị nuốt', body: 'Tiếng Việt ít kết thúc bằng phụ âm. Người Việt hay nuốt âm cuối: "book" → "boo", "bad" → "ba", "test" → "tes". Luyện tập bằng cách nói chậm, chú ý khép miệng/răng đúng ở âm cuối.' },
      { heading: '🔗 Cụm phụ âm đầu/cuối', body: 'Tiếng Việt không có cụm phụ âm. "Street" thường bị phát âm là "s(ơ)trít", "help" thành "heo". Tập nói liền mạch: str-eet, h-elp không thêm nguyên âm.' },
    ],
  },
  rules: {
    intro: 'Phát âm tiếng Anh có các quy tắc có thể học được — không chỉ là thuộc lòng từng từ. Nắm vững quy tắc đuôi -s/-ed, linking sound và weak forms sẽ giúp bạn nghe và nói tự nhiên hơn nhiều.',
    sections: [
      { heading: '📏 Đuôi -s (Plural & 3rd person)', body: '/s/ sau âm vô thanh: books /bʊks/, cats /kæts/, maps /mæps/\n/z/ sau âm hữu thanh: dogs /dɒgz/, cars /kɑːrz/, bags /bægz/\n/ɪz/ sau âm sibilant: buses /ˈbʌsɪz/, dishes /ˈdɪʃɪz/, churches /ˈtʃɜːtʃɪz/' },
      { heading: '📏 Đuôi -ed (Past tense)', body: '/t/ sau âm vô thanh: walked /wɔːkt/, jumped /dʒʌmpt/\n/d/ sau âm hữu thanh: loved /lʌvd/, called /kɔːld/\n/ɪd/ sau /t/ /d/: wanted /ˈwɒntɪd/, needed /ˈniːdɪd/' },
      { heading: '🔗 Linking Sound (Nối âm)', body: 'Trong hội thoại tự nhiên, các từ nối liền nhau:\n• Phụ âm + nguyên âm: "pick it up" → "pi-ki-tup"\n• Nguyên âm + nguyên âm: thêm /j/ hoặc /w/ nối: "go out" → "go-wout"\n• Âm cuối biến mất: "next door" → "nex door"' },
      { heading: '💬 Weak Forms (Dạng yếu)', body: 'Trong câu nói nhanh, từ chức năng (a, an, the, to, of, can, was...) bị phát âm yếu:\n• "the" → /ðə/ (không phải /ðiː/ trừ trước nguyên âm)\n• "a" → /ə/\n• "can" → /kən/\n• "to" → /tə/\n\nĐây là lý do người Anh bản ngữ nghe khó!' },
    ],
  },
  intonation: {
    intro: 'Ngữ điệu (intonation) là sự lên xuống của giọng trong câu — khác với thanh điệu trong tiếng Việt (áp dụng cho từng âm tiết). Ngữ điệu tiếng Anh thể hiện ý nghĩa, thái độ và cảm xúc của cả câu.',
    sections: [
      { heading: '↗️ Lên giọng (Rising)', body: 'Dùng khi hỏi Yes/No: "Are you ready?" ↗\nCho thấy chưa nói xong, muốn tiếp tục: "I went to the store ↗, and then I saw him."\nThể hiện sự ngạc nhiên, ngờ vực: "You did WHAT?" ↗' },
      { heading: '↘️ Xuống giọng (Falling)', body: 'Câu khẳng định: "I live in Hanoi." ↘\nCâu hỏi Wh-: "Where are you from?" ↘\nKết thúc câu, yêu cầu rõ ràng: "Please sit down." ↘' },
      { heading: '🎯 IELTS Speaking — Nhịp câu', body: 'Trong IELTS Speaking, giám khảo chú ý đến:\n• Nhịp điệu (rhythm): âm tiết nhấn và không nhấn xen kẽ đều đặn\n• Nhấn từ (word stress): nhấn đúng âm tiết trong từ\n• Chunking: chia câu thành nhóm ý, nghỉ ngắn giữa các nhóm\n• Linking: nối âm tự nhiên giữa các từ' },
      { heading: '💡 Mẹo luyện ngữ điệu', body: 'Bắt chước (shadowing): Nghe podcast/phim Anh bản ngữ và đọc theo ngay, bắt chước cả nhịp và lên xuống giọng.\nÊm tai hơn "đúng": Ngữ điệu tự nhiên đôi khi quan trọng hơn phát âm từng âm chính xác.' },
    ],
  },
}

function LevelArticle({ levelId, gradient, text, bg, border }: { levelId: string; gradient: string; text: string; bg: string; border: string }) {
  const [open, setOpen] = useState(false)
  const article = LEVEL_ARTICLES[levelId]
  if (!article) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className={`font-black text-sm ${text}`}>Kiến thức cần biết trước khi luyện</span>
        </div>
        <span className={`text-gray-400 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <div className={`px-4 py-3 ${bg}`}>
            <p className="text-sm text-gray-700 leading-relaxed">{article.intro}</p>
          </div>
          {article.sections.map((s, i) => (
            <div key={i} className={`px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} border-t border-gray-100`}>
              <p className={`text-xs font-black ${text} mb-1.5`}>{s.heading}</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type Level  = typeof phonicsLevels.levels[number]
type Lesson = Level['lessons'][number]

function lessonMastered(lesson: Lesson, mastery: Record<string, { flashcard: boolean; games: string[] }>): boolean {
  const m = mastery[lesson.id]
  if (!m?.flashcard) return false
  return lesson.masteryGames.every(g => m.games.includes(g))
}

export default function LevelPage() {
  const router = useRouter()
  const params = useParams<{ childId: string; levelId: string }>()
  const childId = params.childId
  const levelId = decodeURIComponent(params.levelId)
  const [mastery, setMastery] = useState<Record<string, { flashcard: boolean; games: string[] }>>({})
  const [loading, setLoading] = useState(true)

  const level = phonicsLevels.levels.find(l => l.id === levelId) as Level | undefined
  const backUrl = `/dashboard/${childId}/phonics`

  useEffect(() => {
    if (!level) { router.push(backUrl); return }
    fetch(`/api/sync/${childId}?level=phonics`)
      .then(r => r.json()).catch(() => null)
      .then(data => {
        initPhonicsSync(childId, data)
        setMastery(data?.mastery ?? {})
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, levelId])

  if (!level || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">{level?.emoji ?? '🔤'}</div>
    </div>
  )

  const masteredCount = level.lessons.filter(l => lessonMastered(l, mastery)).length
  const seenCount     = level.lessons.filter(l => (mastery[l.id]?.flashcard)).length
  const pct = level.lessons.length > 0 ? Math.round((masteredCount / level.lessons.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className={`bg-gradient-to-br ${level.gradient} px-4 pt-12 pb-6 text-white`}>
        <button onClick={() => router.back()} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">
          ← Phonics
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{level.emoji}</span>
          <div>
            <h1 className="text-2xl font-black leading-tight">{level.titleVi}</h1>
            <p className="text-white/70 text-sm font-semibold">{level.subtitle}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${level.bar} rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(pct, seenCount > 0 ? 3 : 0)}%` }} />
        </div>
        <p className="text-white/70 text-xs font-semibold mt-1.5">
          {seenCount === 0 ? 'Chưa bắt đầu' : `${seenCount}/${level.lessons.length} đã học · 🏆 ${masteredCount}/${level.lessons.length} thành thạo`}
        </p>
      </div>

      {/* Lesson list */}
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
        <LevelArticle
          levelId={levelId}
          gradient={level.gradient}
          text={level.text}
          bg={level.bg}
          border={level.border}
        />
        {level.lessons.map((lesson, idx) => {
          const seen     = mastery[lesson.id]?.flashcard ?? false
          const games    = mastery[lesson.id]?.games ?? []
          const mastered = lessonMastered(lesson, mastery)
          const gamesPlayed = games.length

          return (
            <button key={lesson.id}
              onClick={() => router.push(`/dashboard/${childId}/phonics/${levelId}/${lesson.id}`)}
              className={`w-full text-left rounded-2xl p-4 shadow-sm border-2 border-gray-100 bg-white active:scale-95 transition-transform`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${level.gradient}`}>
                  {mastered ? '🏆' : lesson.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-black ${level.text} text-base`}>{lesson.title}</span>
                    <span className="text-xs text-gray-400 font-semibold">{lesson.subtitle}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {!seen && <span className="text-xs text-gray-400 font-semibold">Chưa học</span>}
                    {seen && !mastered && gamesPlayed === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">📖 Đã học</span>
                    )}
                    {seen && !mastered && gamesPlayed > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        {gamesPlayed}/{lesson.masteryGames.length} 🎮
                      </span>
                    )}
                    {mastered && <span className="text-xs bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full">🏆 Thành thạo</span>}
                  </div>
                </div>
                <span className={`${level.text} font-black text-lg flex-shrink-0`}>→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
