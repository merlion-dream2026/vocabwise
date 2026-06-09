# VocabKids 🌟

App học từ vựng tiếng Anh song ngữ Việt–Anh cho 2 bé — Mia (Lớp 1) và Tim (Lớp 5).

**Live:** https://vocab-kids.vercel.app

---

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (cross-device sync)
- Vercel (hosting)
- Web Speech API (TTS phát âm)

## Chạy local

```bash
npm install
# tạo .env.local với 2 biến (xem .env.local.example)
npm run dev        # http://localhost:3000
```

**.env.local:**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Nội dung

| Level | Bé | Topics | Từ |
|---|---|---|---|
| Starter | Mia (Lớp 1, Pre-A1→A1) | 30 | 350 |
| Explorer | Tim (Lớp 5, A2→B1) | 30 | 350 |

Topics 1–20: 10 từ/topic · Topics 21–30: 15 từ/topic

## Games

| Game | Starter | Explorer |
|---|---|---|
| Flashcard + TTS | ✅ | ✅ |
| Listen & Choose | ✅ | ✅ |
| Quiz | ✅ | ✅ |
| Match pairs | ✅ | ✅ |
| Memory flip | ✅ | ✅ |
| Bubble Pop | ✅ | — |
| Spell It | ✅ | — |
| Gap Fill | — | ✅ |
| Typing Sprint | — | ✅ |
| Speed Round | — | ✅ |

## Tính năng

- **Ôn tập thông minh** — lưu từ sai, đề xuất ôn top 10 từ yếu nhất
- **Streak ngày** — 🔥 duy trì chuỗi ngày học liên tiếp
- **Sibling Battle** — so điểm tuần giữa 2 bé (`/battle`)
- **Progress bar** — theo dõi % từ đã luyện mỗi topic
- **Cross-device sync** — Supabase, tự động merge khi đổi thiết bị

## Cấu trúc

```
app/
├── page.tsx                    # Chọn bé (Mia / Tim)
├── battle/page.tsx             # Sibling Battle
└── [level]/
    ├── page.tsx                # Danh sách topics
    ├── review/page.tsx         # Ôn từ yếu
    └── [topicId]/
        ├── page.tsx            # Chọn game
        └── [gamemode]/page.tsx # Các game
components/                     # Game components
lib/                            # progress, weakWords, streak, battle, cloudSync
data/words.json                 # Toàn bộ từ vựng
```
