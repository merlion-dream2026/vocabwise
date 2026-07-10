# CLAUDE.md — VocabWise

## Project
- **URL:** vocabwise.id.vn (vocabwise.vercel.app → 307 redirect)
- **Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase · Vercel
- **Auth:** Custom JWT (jose, HS256) + bcrypt · cookie `vk_session` (httpOnly, secure)
- **Email:** Gmail SMTP via nodemailer

## App Sections
| Section | Display Name | Badge | Users |
|---|---|---|---|
| Luyện phát âm | Phonics | Pronunciation | Mọi lứa tuổi |
| VocabWise Kids | **Daily** | Kids · Pre-A1→C1 | Trẻ em |
| VocabWise | Academic | Academic · A1→C2 | Teen/Adult |

⚠️ "VocabWise Kids" = tên code/route (`/kids`). Display name trên app = **"Daily"**. Internal vars dùng `kids_full`. Không nhầm khi viết UI text.

## Business Model
| Plan | Giá | Bé | Gating đặc biệt |
|---|---|---|---|
| Free | 0đ | 1 | 7 ngày trial |
| Pro 1 tháng | 59.000đ | 2 | AI Speak 30/ngày · email thủ công |
| Pro 3 tháng | 159.000đ | 3 | AI Speak ∞ · Word Stress · email auto tuần |
| Pro 6 tháng | 299.000đ | 3 | + Monthly recap · Gift Pro 14 ngày |

Payment: chuyển khoản thủ công → admin kích hoạt qua Superadmin UI.

## Feature Gating — nguồn duy nhất: `lib/planUtils.ts`

| Tính năng | Free | Pro 1T | Pro 3T | Pro 6T |
|---|---|---|---|---|
| Kids topics | 1/level | ✅ Full | ✅ Full | ✅ Full |
| Academic topics | 1/book | ✅ Full | ✅ Full | ✅ Full |
| Phonics IPA | 1 bài (vowels-short idx 0) | ✅ Full | ✅ Full | ✅ Full |
| Word Stress | ❌ | ❌ | ✅ | ✅ |
| My Words | 20 từ | ✅ | ✅ | ✅ |
| SRS ôn từ yếu | 20 từ | ✅ | ✅ | ✅ |
| Offline download | 0 | 20 topic | ∞ | ∞ |
| AI Speak | 5/ngày | 30/ngày | ∞ | ∞ |
| Push notification | ❌ | ✅ | ✅ | ✅ |
| Email report | ❌ | Thủ công | Auto tuần | Auto tuần |
| Monthly recap | ❌ | ❌ | ❌ | ✅ |
| Gift Pro 14 ngày | ❌ | ❌ | ❌ | ✅ |

Gate helpers (`lib/planUtils.ts`): `getPlanTier()`, `getEffectivePlan()`, `canAccessPhonicsLesson()`, `canAccessWordStress()`, `getMyWordsLimit()`, `getSRSLimit()`, `getOfflineDownloadLimit()`, `getAISpeakLimit()`. ⚠️ `canAccessMyWords()`/`canAccessSRS()` luôn `true` — limit thật nằm ở `getMyWordsLimit()`/`getSRSLimit()`, tên hàm dễ gây hiểu lầm.

⚠️ **Không phải mọi route đều gate qua `planUtils.ts`:** `report/settings` và `cron/monthly-recap` hiện so trực tiếp `plan==='6months'` thay vì gọi `getEffectivePlan()` → family có Pro qua bonus/referral bị bỏ sót Monthly Recap (bug đang mở, xem memory `project_security_critical_2026_07`).

Gating phụ thuộc DB — fetch `/api/auth/me` với `cache: 'no-store'` để áp dụng ngay khi superadmin đổi plan.

## Data Sources
- **Daily (Kids) — nguồn duy nhất:** `/data/words/{level}.json` (6 file, seeker→master · 30 topics/level · 400 từ/level). Runtime KHÔNG đọc `/data/words.json` gốc (1.4MB, chỉ dùng bởi script content-generation).
  - ⚠️ **Luôn sửa ở `/data/words/{level}.json` rồi chạy `node scripts/split-words-per-topic.js`** — KHÔNG sửa trực tiếp `/data/words/{level}/{topicId}.json` (180 file). Các file này là bản tách tự động phục vụ `/api/words/[level]/[topicId]` (topic/game page tải nhanh); sửa trực tiếp sẽ lệch với file gốc (trang danh sách level, revision, review, srs vẫn đọc file gốc) và bị ghi đè mất khi script chạy lại lần sau.
- **Academic:** `/data/vocabwise/book{1,2,3}/b{N}-t{NN}.json` → seeded qua `scripts/vw-seed.js` → Supabase · Exercise system: 5 bài chính × 5 câu (E1,E3–E8 tuỳ book) + 1 bài bonus 10 câu (xoay vòng ECategorize/EOddOneOut/ESDSameDiff/ESynSub) = **35 câu/topic**. `answer_key` chỉ cover 5 bài chính.
- **Word Plans (nguồn duy nhất):** `/data/word-plans/*.csv` — **luôn đọc CSV trước khi tạo/sửa JSON content**, không tự đặt titles hay vocab. Format: `book, theme_no, theme_title, topic_no, topic_id, topic_title, w1…w15` (Book 3: `w1…w10, c1…c5`)
- **Phonics:** `/data/phonicsKnowledge.json` + `/data/phonicsLevels.json` — 9 levels · 58 lessons
- ⚠️ **Audio coverage còn thiếu nhiều:** Academic 1/180 topic (0,6%); Story audio Daily thiếu hoàn toàn Scholar+Master (0/30 mỗi level); Daily/Kids không có IPA transcript (0/2.400 từ, chỉ dựa browser TTS)

## Key Routes
| Route | Mô tả |
|---|---|
| `/` | Landing page (public) |
| `/login` · `/register` · `/verify-email` | Auth flow (SĐT + OTP 6 số) |
| `/kids` | Màn hình chọn bé → Daily |
| `/dashboard` | Parent dashboard — hồ sơ bé, FAQ, cài đặt |
| `/vocabwise` · `/vocabwise/[book]` · `/vocabwise/[book]/[topic]` | Academic flow |
| `/superadmin` | Admin console — quản lý families, kích hoạt Pro |

## API
```
/api/auth/{login,register,verify-otp,forgot-password,reset-password,resend-otp,me,logout}
/api/children                GET/POST
/api/sync/[childId]          GET/POST  — Kids progress (vocab_sync)
/api/score-pronunciation     POST      — AI chấm phát âm (Groq Whisper)
/api/vocabwise/topics        GET       — list topics by book
/api/vocabwise/topics/[id]   GET       — topic detail
/api/vocabwise/progress      GET/POST  — Academic progress
/api/superadmin/families     GET/POST/PATCH/DELETE
/api/superadmin/config       GET/PATCH
```

## Database (Supabase)
**Inherited:** `families`, `children`, `vocab_sync`, `admin_config`

**Academic (prefix `vw_`):** `vw_books`, `vw_themes`, `vw_topics`, `vw_passages`, `vw_glossary`, `vw_exercises`

**Progress:** `vw_user_topic_progress`, `vw_user_word_progress` — ⚠️ dùng `family_id TEXT`, không phải Supabase UUID

## Conventions
- Username = SĐT (digits only, 9–11 chars), stored lowercase
- Plan values: `'free'` · `'1month'` · `'3months'` · `'6months'`
- Ghost account: unverified + OTP expired → auto-delete on re-register
- Superadmin: session `familyId === 'superadmin'` (hardcoded check) — đây là flow family login (`vk_session`), **tách biệt** khỏi cổng `/superadmin` (`vk_admin_session`, `/api/superadmin/login`)
- 🔴 **`/api/superadmin/login` không verify TOTP dù UI báo "2FA đang bật"** — chỉ cần đúng password bảng `super_admin`. Lỗ hổng Critical đang mở, xem memory `project_security_critical_2026_07`. Cần fix trước khi mở rộng user.
- PWA: `public/manifest.webmanifest` + `public/sw.js` + `app/icon.tsx`
- Prefix `vw_` cho tất cả Academic DB tables

## Env Vars
```
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY  SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET  GMAIL_USER  GMAIL_APP_PASSWORD
OPENAI_API_KEY  GROQ_API_KEY  NEXT_PUBLIC_APP_URL
```

## Scripts & Assets
- **Audio:** `public/audio/stories/[level].[topic-id].mp3` — Kids mini story
- **Print:** `node scripts/gen-docx.js [book1|book2|book3|all] [topic-id]` → DOCX · colors: emerald/blue/purple

---
*Cập nhật: 09/07/2026 — sau audit toàn diện (bảo mật/tính năng/nội dung/kiến trúc). Chi tiết đầy đủ trong memory `project_security_critical_2026_07`.*
