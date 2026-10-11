# Onboarding voice script — Rocky 🐘 + Bubi 🐬

Lời thoại narrate màn hình onboarding (`app/onboarding/page.tsx`) + hộp chọn mascot (`components/MascotPicker.tsx`).
Thu âm thủ công trên web ElevenLabs (bản free), lưu file đúng tên vào `public/audio/mascots/`.

**Quy ước tên file:** `{nhân vật}-{chỗ}-{vi|en}.mp3`. Tổng **28 file**.

## Giọng + cài đặt

| | Rocky 🐘 (voi xanh) | Bubi 🐬 (cá heo xanh) |
|---|---|---|
| Tính cách | Hiền, ấm, đáng tin, "anh bạn to xác" | Lanh lợi, vui, nhiều năng lượng |
| Giọng EN (premade) | **Will** (ưu tiên) · dự phòng **Charlie** / **Liam** | **Jessica** (ưu tiên) · dự phòng **Lily** / **Laura** |
| Giọng VI | Voice Library → lọc *Language: Vietnamese* → chọn giọng trẻ, trầm ấm | Voice Library → lọc *Vietnamese* → chọn giọng trẻ, cao, tươi |
| Model | **Eleven v3** (biểu cảm, có tiếng Việt) · nếu đọc lỗi → **Flash v2.5** | như Rocky |
| Stability (v3) | *Natural* | *Creative* (vui hơn) — nếu đọc sai chữ thì lùi về *Natural* |
| Tốc độ | hơi chậm (0.9–0.95) | bình thường (1.0) |

> Giọng premade đọc tiếng Việt sẽ có accent nước ngoài. Muốn đồng bộ thương hiệu thì dùng cùng giọng cho cả 2 bản; muốn tự nhiên thì bản VI dùng giọng Việt bản ngữ.
> Eleven v3 hiểu audio tag trong ngoặc vuông — ví dụ `[excited]`, `[giggles]`, `[warmly]` — đặt đầu câu, không bị đọc ra. Đã gợi ý tag ở cột "Gợi ý"; bỏ đi nếu dùng Flash v2.5.

## Bước 0 — Chào mừng (ảnh Rocky + Bubi vẫy tay, 2 nhân vật nói lần lượt)

| # | File | Nhân vật | 🇻🇳 Tiếng Việt | 🇬🇧 English | Gợi ý |
|---|---|---|---|---|---|
| 1 | `rocky-hello-{vi,en}` | Rocky | Xin chào! Mình là Rocky, chú voi xanh nè! | Hi there! I'm Rocky, the little blue elephant! | `[warmly]` |
| 2 | `bubi-hello-{vi,en}` | Bubi | Còn mình là Bubi, cá heo xanh đây! Chào mừng bạn đến với VocabWise! | And I'm Bubi, the blue dolphin! Welcome to VocabWise! | `[excited]` |
| 3 | `rocky-features-{vi,en}` | Rocky | Ở đây bạn được luyện phát âm IPA, học từ vựng mỗi ngày, học từ vựng IELTS và SAT, và còn luyện nói cùng AI nữa đó! | Here you can practice IPA sounds, learn new words every day, build IELTS and SAT vocabulary, and even practice speaking with AI! | — |
| 4 | `bubi-next-{vi,en}` | Bubi | Chỉ mất ba mươi giây thôi. Bấm Tiếp theo nha! | It only takes thirty seconds. Tap Next to start! | `[cheerfully]` |

## Bước 1 — Chọn phần học (mascot của bé; mỗi nhân vật thu 1 bản)

| # | File | 🇻🇳 Tiếng Việt | 🇬🇧 English |
|---|---|---|---|
| 5 | `rocky-choose-{vi,en}` · `bubi-choose-{vi,en}` | Bạn muốn học gì trước nào? Chọn một phần nhé, đổi lúc nào cũng được! | What would you like to learn first? Pick one. You can change it anytime! |

## Bước 2 — Sẵn sàng + mẹo (theo phần đã chọn; mỗi nhân vật thu cả 3)

| # | File | Phần | 🇻🇳 Tiếng Việt | 🇬🇧 English |
|---|---|---|---|---|
| 6 | `{rocky,bubi}-ready-daily-{vi,en}` | Daily | Sẵn sàng rồi! Bắt đầu với Flashcard, chơi ít nhất ba trò mỗi chủ đề để nhận cúp, và nhớ ôn từ cũ mỗi ngày nhé! | You're all set! Start with Flashcards, play at least three games per topic to win a trophy, and review your old words every day! |
| 7 | `{rocky,bubi}-ready-academic-{vi,en}` | Academic | Sẵn sàng rồi! Đọc bài, học từ mới, rồi làm bài tập. Đạt tám mươi phần trăm là chủ đề được đánh dấu thành thạo đó! | You're all set! Read the passage, learn the key words, then do the exercises. Score eighty percent to master the topic! |
| 8 | `{rocky,bubi}-ready-phonics-{vi,en}` | Phonics | Sẵn sàng rồi! Học từng âm IPA, luyện nói với AI để được chấm điểm ngay, xong bài này là mở khóa bài tiếp theo! | You're all set! Learn each IPA sound, practice speaking with AI for instant scores, and finish a lesson to unlock the next one! |

Gợi ý tag bước 2: Rocky `[proudly]`, Bubi `[excited]`.

## Hộp "Chọn bạn đồng hành" (phát khi bé bấm vào thẻ nhân vật)

| # | File | Nhân vật | 🇻🇳 Tiếng Việt | 🇬🇧 English |
|---|---|---|---|---|
| 9 | `rocky-pick-{vi,en}` | Rocky | Chọn mình đi! Rocky sẽ học cùng bạn mỗi ngày! | Pick me! I'm Rocky, and I'll learn with you every day! |
| 10 | `bubi-pick-{vi,en}` | Bubi | Chọn mình nha! Có Bubi, học vui hơn nhiều đó! | Pick me! I'm Bubi, and I'll make learning super fun! |

## Checklist file (28)

- [ ] Bước 0: `rocky-hello` · `bubi-hello` · `rocky-features` · `bubi-next` × vi/en = 8
- [ ] Bước 1: `rocky-choose` · `bubi-choose` × vi/en = 4
- [ ] Bước 2: `{rocky,bubi}-ready-{daily,academic,phonics}` × vi/en = 12
- [ ] Picker: `rocky-pick` · `bubi-pick` × vi/en = 4

**Mẹo thu:** số viết bằng chữ (ba mươi, tám mươi) để AI không đọc sai · tải về MP3 · mỗi câu thử 2–3 lần, chọn bản hay nhất.
