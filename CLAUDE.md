# CLAUDE.md — VocabWise

## Project Overview
**VocabWise** — SaaS app học tiếng Anh song ngữ Việt–Anh, rebrand từ VocabKids Pro.
- **URL:** vocabwise.vercel.app
- **Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase · Vercel
- **Auth:** Custom JWT (jose, HS256) + bcrypt · cookie: `vk_session` (httpOnly, secure)
- **Email:** Gmail SMTP via nodemailer

## App Structure (3 sections)
| Section | Badge | Target Learners |
|---|---|---|
| **Luyện phát âm** | Pronunciation | Mọi lứa tuổi |
| **VocabWise Kids** | Kids · Pre-A1 → C1 | Trẻ em |
| **VocabWise** | Academic · A1 → C2 | Teen/Adult |

## Business Model
| Plan | Giá | Tính năng |
|---|---|---|
| Free | 0đ | 7 ngày trial · 1 topic/level · 1 hồ sơ bé |
| Pro 1 tháng | 59.000đ | Toàn bộ nội dung · 10 games · AI phát âm · tối đa 3 bé |
| Pro 3 tháng | 159.000đ | Như trên |
| Pro 6 tháng | 299.000đ | Như trên |

Payment: chuyển khoản thủ công → admin kích hoạt qua Superadmin UI.

## VocabWise Kids — Curriculum
- **6 levels:** Seeker (Pre-A1) · Starter (A1) · Ranger (A2) · Explorer (B1) · Scholar (B2) · Master (C1)
- **30 topics/level = 180 topics**
- **~400 words/level = 2.300+ từ**
- Data: `/data/words.json` — key là level slug, mỗi level có `topics[]`

## VocabWise (Academic) — Curriculum
- **3 books:** Book 1 (A1-A2, 60 topics) · Book 2 (B1-B2, 60 topics) · Book 3 (C1-C2, 30 topics)
- **150 topics tổng, ~2.250 từ**
- Content pipeline: JSON files `/data/vocabwise/bookN/` → `scripts/vw-seed.js` → Supabase
- Exercise system: 5 bài × 5 câu = 25 câu/topic (8 loại bài tập E1–E8)
- DB tables: `vw_books`, `vw_themes`, `vw_topics`, `vw_passages`, `vw_glossary`, `vw_exercises`
- Progress: `vw_user_topic_progress`, `vw_user_word_progress` — dùng `family_id TEXT` (không phải Supabase UUID)

## Key Routes
| Route | Mô tả |
|---|---|
| `/` | Landing page (public) |
| `/login` | Đăng nhập (SĐT + password) |
| `/register` | Đăng ký (SĐT làm username) |
| `/verify-email` | Xác thực OTP 6 số |
| `/kids` | Màn hình chọn bé → VocabWise Kids |
| `/dashboard` | Parent dashboard — hồ sơ bé, FAQ, cài đặt |
| `/vocabwise` | VocabWise (Academic) — chọn book |
| `/vocabwise/[book]` | Topic list theo theme |
| `/vocabwise/[book]/[topic]` | Topic view: passage → glossary → exercises |
| `/superadmin` | Admin console — quản lý families, kích hoạt Pro |

## API Structure
```
/api/auth/login          POST
/api/auth/register       POST
/api/auth/verify-otp     POST
/api/auth/forgot-password POST
/api/auth/reset-password POST
/api/auth/resend-otp     POST
/api/auth/me             GET
/api/auth/logout         POST
/api/children            GET/POST
/api/sync/[childId]      GET/POST — vocab_sync progress (VocabWise Kids)
/api/score-pronunciation POST — AI chấm phát âm (Groq Whisper)
/api/vocabwise/topics    GET — list topics by book
/api/vocabwise/topics/[id] GET — topic detail
/api/vocabwise/progress  GET/POST — VocabWise (Academic) progress
/api/superadmin/families GET/POST/PATCH/DELETE
/api/superadmin/config   GET/PATCH
```

## Database (Supabase)
### Inherited tables
`families`, `children`, `vocab_sync`, `admin_config`

### VocabWise (Academic) tables — prefix vw_
`vw_books`, `vw_themes`, `vw_topics`, `vw_passages`, `vw_glossary`, `vw_exercises`
`vw_user_topic_progress(family_id TEXT, topic_id, ...)`, `vw_user_word_progress(family_id TEXT, topic_id, item_order, ...)`

## Important Conventions
- Username = SĐT (digits only, 9–11 chars), stored lowercase
- Plan values: `'free'`, `'1month'`, `'3months'`, `'6months'`
- Ghost account cleanup: unverified + OTP expired → auto-delete on re-register
- Rate limiting: middleware.ts (in-memory sliding window per IP)
- Superadmin: session `familyId === 'superadmin'` (hardcoded check)
- PWA: `public/manifest.webmanifest` + `public/sw.js` + `app/icon.tsx`
- Prefix `vw_` cho tất cả VocabWise (Academic) tables

## Env Vars (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
GMAIL_USER
GMAIL_APP_PASSWORD
OPENAI_API_KEY
GROQ_API_KEY
NEXT_PUBLIC_APP_URL
```

## Audio Files
`public/audio/stories/[level].[topic-id].mp3` — mini story audio (VocabWise Kids)

## Print Export
`scripts/gen-docx.js` — generates A4 narrow-margin DOCX từ Academic JSON files
- `node scripts/gen-docx.js book1 b1-t01` → single topic
- `node scripts/gen-docx.js book1` → all topics in a book
- `node scripts/gen-docx.js all` → all books
- Output: `vocabwise-<book>-<topicId>.docx` tại project root
- Color themes: emerald (book1) · blue (book2) · purple (book3)
- Exercise types supported: E1 Matching · E3 MCQ · E4 GapFill · E5 TFNG · E6 WordForms · E7 Reordering · E8 ErrorFix
