'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Section = 'kids' | 'academic' | 'phonics' | null

const STEPS = ['Chào mừng', 'Chọn phần học', 'Bắt đầu thôi!']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [section, setSection] = useState<Section>(null)

  function finish(dest: string) {
    localStorage.setItem('onboarding_done', '1')
    router.push(dest)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 w-full">
        <div
          className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all duration-500 rounded-full"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-6 w-full">
            <div className="text-7xl animate-bounce">🎉</div>
            <div>
              <h1 className="text-3xl font-black text-gray-800 mb-2">Chào mừng đến VocabWise!</h1>
              <p className="text-gray-500 text-base leading-relaxed">
                App học tiếng Anh song ngữ Việt–Anh.<br />
                Hãy để chúng tôi hướng dẫn bạn trong 30 giây.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full text-left space-y-3">
              {[
                { icon: '🔤', title: 'Phonics IPA', desc: 'Luyện phát âm chuẩn IPA quốc tế · mọi lứa tuổi' },
                { icon: '📖', title: 'VocabWise Daily', desc: 'Từ vựng hàng ngày · Pre-A1 → C2 · song ngữ Việt–Anh' },
                { icon: '🎓', title: 'VocabWise Academic', desc: 'Từ vựng học thuật IELTS/SAT · A1 → C2' },
                { icon: '🎤', title: 'Phát âm cùng AI', desc: '🇻🇳🇬🇧 Song ngữ Việt–Anh · AI chấm điểm ngay lập tức' },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="font-black text-gray-800 text-sm">{f.title}</p>
                    <p className="text-gray-400 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              Tiếp theo →
            </button>
          </div>
        )}

        {/* Step 1 — Choose section */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center gap-6 w-full">
            <div className="text-5xl">🤔</div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-1">Bạn muốn học gì trước?</h2>
              <p className="text-gray-400 text-sm">Có thể đổi bất cứ lúc nào</p>
            </div>
            <div className="w-full space-y-3">
              <button
                onClick={() => setSection('kids')}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  section === 'kids'
                    ? 'border-purple-400 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">👶</span>
                  <div>
                    <p className="font-black text-gray-800">Daily</p>
                    <p className="text-gray-400 text-xs mt-0.5">Dành cho trẻ em · Pre-A1 đến C1-C2 · 10 trò chơi/chủ đề</p>
                  </div>
                  {section === 'kids' && <span className="ml-auto text-purple-500 text-xl">✓</span>}
                </div>
              </button>

              <button
                onClick={() => setSection('academic')}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  section === 'academic'
                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📚</span>
                  <div>
                    <p className="font-black text-gray-800">VocabWise Academic</p>
                    <p className="text-gray-400 text-xs mt-0.5">Dành cho teen & người lớn · A1 đến C2 · IELTS/SAT-ready</p>
                  </div>
                  {section === 'academic' && <span className="ml-auto text-indigo-500 text-xl">✓</span>}
                </div>
              </button>

              <button
                onClick={() => setSection('phonics')}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  section === 'phonics'
                    ? 'border-green-400 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🔊</span>
                  <div>
                    <p className="font-black text-gray-800">Luyện phát âm · Phonics IPA</p>
                    <p className="text-gray-400 text-xs mt-0.5">Mọi lứa tuổi · 9 cấp độ · 57 bài · AI chấm phát âm</p>
                  </div>
                  {section === 'phonics' && <span className="ml-auto text-green-500 text-xl">✓</span>}
                </div>
              </button>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep(0)}
                className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-2xl"
              >
                ← Quay lại
              </button>
              <button
                onClick={() => section && setStep(2)}
                disabled={!section}
                className="flex-[2] bg-gradient-to-r from-purple-500 to-indigo-500 disabled:from-gray-300 disabled:to-gray-300 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all"
              >
                Tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Quick tips + go */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center gap-6 w-full">
            <div className="text-6xl">🚀</div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-1">Sẵn sàng rồi!</h2>
              <p className="text-gray-400 text-sm">Một vài mẹo để học hiệu quả</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full text-left space-y-3">
              {(section === 'kids'
                ? [
                    { icon: '📖', tip: 'Bắt đầu với Flashcard để ghi nhớ từ mới' },
                    { icon: '🎮', tip: 'Chơi ít nhất 3 game mỗi chủ đề để nhận 🏆' },
                    { icon: '🔄', tip: 'Ôn lại từ cũ trong Daily Review mỗi ngày' },
                  ]
                : section === 'phonics'
                ? [
                    { icon: '🔊', tip: 'Học từng âm IPA chuẩn quốc tế · 9 cấp độ từ cơ bản đến nâng cao' },
                    { icon: '🎤', tip: 'Luyện nói cùng AI — nhận điểm phát âm ngay lập tức' },
                    { icon: '📈', tip: 'Hoàn thành bài học trước → mở khoá bài tiếp theo' },
                  ]
                : [
                    { icon: '📄', tip: 'Đọc passage → học glossary → làm bài tập' },
                    { icon: '⭐', tip: 'Đạt 80% → topic được đánh dấu "mastered"' },
                    { icon: '🔄', tip: 'Review theo lịch SRS để nhớ lâu hơn' },
                  ]
              ).map(({ icon, tip }) => (
                <div key={tip} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => finish(section === 'academic' ? '/vocabwise' : '/kids')}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                {section === 'academic' ? '📚 Vào VocabWise Academic' : section === 'phonics' ? '🔊 Vào Phonics IPA' : '📖 Vào Daily'}
              </button>
              <button
                onClick={() => finish('/dashboard')}
                className="w-full text-gray-400 text-sm font-bold py-2"
              >
                Xem tất cả tính năng →
              </button>
            </div>
          </div>
        )}

        {/* Step dots */}
        <div className="flex gap-2 mt-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i === step ? 'w-6 h-2 bg-purple-500' : i < step ? 'w-2 h-2 bg-purple-300' : 'w-2 h-2 bg-gray-200'
            }`} />
          ))}
        </div>
      </div>
    </div>
  )
}
