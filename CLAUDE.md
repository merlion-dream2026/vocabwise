# CLAUDE.md — VocabKids Pro (Commercial)

## Project Overview
**VocabKids Pro** — SaaS app học từ vựng tiếng Anh song ngữ Việt–Anh cho trẻ em.
- **URL:** https://vocab-kids-pro.vercel.app
- **Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase · Vercel
- **Auth:** Custom JWT (jose, HS256) + bcrypt · cookie: `vk_session` (httpOnly, secure)
- **Email:** Gmail SMTP via nodemailer (`vocab.kids.pro@gmail.com`)

## Business Model
| Plan | Giá | Tính năng |
|---|---|---|
| Free | 0đ | 7 ngày trial · 1 topic/level · 1 hồ sơ bé |
| Pro 1 tháng | 59.000đ | Toàn bộ 180 topics · 2.300+ từ · 10 games · AI phát âm · tối đa 3 bé |
| Pro 3 tháng | 159.000đ | Như trên |
| Pro 6 tháng | 299.000đ | Như trên |

Payment: chuyển khoản thủ công → admin kích hoạt qua Superadmin UI.

## Curriculum
- **6 levels:** Seeker (Pre-A1) · Starter (A1) · Ranger (A2) · Explorer (B1) · Scholar (B2) · Master (C1)
- **30 topics/level = 180 topics tổng**
- **~400 words/level = 2.300+ từ tổng**
- Data: `/data/words.json` — key là level slug, mỗi level có `topics[]`

## Key Routes
| Route | Mô tả |
|---|---|
| `/` | Landing page (public) |
| `/login` | Đăng nhập (SĐT + password) |
| `/register` | Đăng ký (SĐT làm username) |
| `/verify-email` | Xác thực OTP 6 số |
| `/kids` | Màn hình chọn bé (protected) |
| `/dashboard` | Parent dashboard — hồ sơ bé, FAQ, cài đặt (protected) |
| `/superadmin` | Admin console — quản lý families, kích hoạt Pro |

## API Structure
```
/api/auth/login          POST — đăng nhập, trả JWT cookie
/api/auth/register       POST — tạo account + gửi OTP email
/api/auth/verify-otp     POST — xác thực OTP → gửi welcome email
/api/auth/forgot-password POST — gửi reset link email
/api/auth/reset-password POST — đặt lại mật khẩu
/api/auth/resend-otp     POST — gửi lại OTP
/api/auth/me             GET  — lấy session hiện tại
/api/auth/logout         POST — xóa cookie
/api/children            GET/POST — CRUD hồ sơ bé
/api/sync/[childId]      GET/POST — đồng bộ vocab progress (Supabase)
/api/score-pronunciation POST — AI chấm phát âm (Groq Whisper)
/api/superadmin/families GET/POST — list/create families
/api/superadmin/families/[id] PATCH/DELETE — update/delete family
/api/superadmin/config   GET/PATCH — global config (max_kids defaults)
```

## Database (Supabase)
### families
`id, username (SĐT), password_hash, email, name, phone, plan, plan_start_date, plan_end_date, free_trial_expires_at, email_verified, otp, otp_expires_at, reset_token, reset_token_expires_at, disabled, max_kids (override), referral_source, created_at`

### children
`id, family_id, name, avatar, color, level, created_at`

### vocab_sync
`id, child_id, level, data (JSONB), reset_at, updated_at`

### admin_config
`key, value` — global defaults: `free_max_kids` (default 1), `pro_max_kids` (default 3)

## Child Profile Limits
- Free: 1 bé (global default từ `admin_config.free_max_kids`)
- Pro: 3 bé (global default từ `admin_config.pro_max_kids`)
- Per-account override: `families.max_kids` (NULL = dùng global default)

## Email Flow
| Trigger | Email | File |
|---|---|---|
| OTP verify thành công (lần đầu) | Welcome + mời upgrade Pro | `verify-otp/route.ts` |
| Admin tạo free account | Welcome + mời upgrade Pro | `superadmin/families/route.ts` |
| Admin set plan → paid | Pro activated + hướng dẫn | `superadmin/families/[id]/route.ts` |
| User forgot password | Reset link (1h) | `forgot-password/route.ts` |
| User resend OTP | OTP mới | `resend-otp/route.ts` |

Templates: `lib/emailTemplates.ts` · Sender: `lib/email.ts`

## Important Conventions
- Username = SĐT (digits only, 9–11 chars), stored lowercase
- Plan values: `'free'`, `'1month'`, `'3months'`, `'6months'`
- Ghost account cleanup: unverified + OTP expired → auto-delete on re-register
- Rate limiting: middleware.ts (in-memory sliding window per IP)
- Superadmin: session `familyId === 'superadmin'` (hardcoded check)
- PWA: `public/manifest.webmanifest` + `public/sw.js` + `app/icon.tsx`

## Env Vars (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
GMAIL_USER=vocab.kids.pro@gmail.com
GMAIL_APP_PASSWORD
OPENAI_API_KEY
GROQ_API_KEY
NEXT_PUBLIC_APP_URL=https://vocab-kids-pro.vercel.app
```

## Audio Files
`public/audio/stories/[level].[topic-id].mp3` — mini story audio
- Seeker: 30/30 ✅ · Starter: 30/30 ✅ · Ranger: 30/30 ✅
- Explorer: 25/30 (thiếu: art-creativity, critical-thinking, genetics-evolution, global-issues, sports-competition)
- Scholar: 0/30 · Master: 0/30
