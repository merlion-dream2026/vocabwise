'use client'
import { useState } from 'react'

// "ⓘ Cách học" panel of the Daily topic hub: how a topic works, the games, the trophy rule.
const KID_FAQ = [
  { q: '📖 Học một chủ đề như thế nào?', a: 'Bắt đầu bằng Flashcard để xem và nghe từ mới.\nSau đó chọn các trò chơi để luyện tập.\nQua Vòng 1 và Vòng 2 → nhận 🏆!' },
  { q: '🎮 Có những trò chơi gì?', a: 'Level Seeker / Starter / Ranger (20 trò):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng/Sai · 🖼️ Nối từ với hình\n🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu\n🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n🚀 Phóng tên lửa · 🔨 Đập chuột chũi · 🎣 Câu cá · ✈️ Máy bay qua mây · 🐸 Ếch nhảy lá sen · 🏎️ Đua xe tốc độ · 🚂 Tàu chở chữ · 🗺️ Đào kho báu · 🧺 Hứng táo chữ · 🦘 Hô to để nhảy\n\nLevel Explorer / Scholar / Master (21 trò khác):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng/Sai\n❓ Trắc nghiệm · ✏️ Điền từ · 🔀 Ghép định nghĩa · 🎤 Phát âm cùng AI ✨\n⌨️ Gõ từ nhanh 15s · 🔁 Sắp xếp câu · ⚡ Speed Round · ✍️ Đặt câu cùng AI\n🚀 Phóng tên lửa · 🔨 Đập chuột chũi · 🎣 Câu cá · ✈️ Máy bay qua mây · 🐸 Ếch nhảy lá sen · 🏎️ Đua xe tốc độ · 🚂 Tàu chở chữ · 🗺️ Đào kho báu · 🧺 Hứng táo chữ · 🦘 Hô to để nhảy' },
  { q: '🏆 Tiêu chí hoàn thành bài học', a: 'Cần đủ 3 điều kiện:\n① Xem hết Flashcard tất cả các từ trong chủ đề\n② Vòng 1 · Làm quen: đạt ⭐⭐⭐ (trên 80% câu đúng) ở ít nhất 3 trò chơi của vòng (level Seeker chỉ cần 2)\n③ Vòng 2 · Ôn tập: đạt ⭐⭐⭐ ở ít nhất 3 trò chơi của vòng\n(Các trò ở mục "Thử thách thêm" để chơi cho vui, không bắt buộc.)\n\nSao tính theo lần chơi gần nhất: ≤50% = ⭐ · ≤80% = ⭐⭐ · trên 80% = ⭐⭐⭐.\nChơi lại bao nhiêu lần cũng được để lên sao!' },
  { q: '📚 Mini Story là gì?', a: 'Mỗi chủ đề có 1 câu chuyện ngắn dùng các từ vừa học.\nCuộn xuống → đọc chuyện tiếng Anh + tiếng Việt, nghe audio.\nBấm "Làm bài" → điền từ vào chỗ trống trong chuyện!' },
  { q: '🎤 Game Phát âm cùng AI ✨ dùng như thế nào?', a: 'Bấm nút micro 🎤 → đọc to từ (hoặc câu) trên màn hình.\nApp nhận diện giọng và cho biết đúng hay sai.\nBấm 🔊 để nghe phát âm mẫu · ▶️ để nghe lại giọng mình.\n\n⚠️ Cần cho phép quyền Microphone khi trình duyệt hỏi.' },
]

export default function TopicFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
      {KID_FAQ.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenFaq(o => o === i ? null : i)}
            className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
            <span className="font-bold text-gray-700 text-sm">{item.q}</span>
            <span className={`text-gray-400 text-xs font-black flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {openFaq === i && (
            <div className="px-4 pb-3">
              <div className="bg-purple-50 rounded-xl p-3">
                {item.a.split('\n').map((line, j) => (
                  <p key={j} className={`text-xs text-gray-600 leading-relaxed ${j > 0 ? 'mt-1' : ''}`}>
                    {line || <span className="block h-1" />}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
