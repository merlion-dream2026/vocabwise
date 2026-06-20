# VocabWise — Feature Testing Checklist

> Dùng sau mỗi lần thêm tính năng mới hoặc trước khi push lên Vercel.

---

## 1. Automated (chạy trước mỗi push)

```bash
npm test          # 20 unit tests (planUtils, SRS, rateLimit)
npx tsc --noEmit  # TypeScript zero-error check
```

Nếu một trong hai fail → **không push**.

---

## 2. Auth & Security

| Test | Cách test | Pass khi |
|---|---|---|
| Đăng ký → OTP → Onboarding | Register SĐT mới → verify OTP → redirect `/onboarding` | Wizard hiện đúng 3 bước |
| Onboarding redirect | Chọn Kids → `/kids`, chọn Academic → `/vocabwise` | Đúng destination |
| Đăng nhập đúng | Login SĐT + pass đúng | Vào `/kids` hoặc `/vocabwise` |
| Account lockout | Nhập sai password 5 lần | Thấy "Tài khoản bị khóa X phút" (HTTP 423) |
| Lockout tự reset | Đợi 15 phút hoặc dùng tài khoản khác | Đăng nhập được bình thường |
| Rate limiting | Gọi API nhanh >10 lần/giây | HTTP 429 |
| Expired plan → lock | Tạo free account, hết trial | Không thể xem Academic content |
| Superadmin login | Vào `/superadmin` | Dùng cookie riêng, không ảnh hưởng user session |

---

## 3. VocabWise Kids

| Test | Cách test | Pass khi |
|---|---|---|
| Chọn bé → vào level | Dashboard → chọn bé → chọn level | Hiện topic list |
| Flashcard game | Chơi Flashcard bất kỳ topic | Lật card được, đánh dấu đúng/sai |
| SpeedRound game ⚡ | Explorer+ → chọn Speed Round | Game load, đếm giờ, tính điểm |
| Progress sync | Hoàn thành topic | Badge cập nhật trên level screen |
| Daily Review | Vào Daily Review | Hiện từ theo SRS schedule |

---

## 4. VocabWise Academic

| Test | Cách test | Pass khi |
|---|---|---|
| Book list | Vào `/vocabwise` | 3 books hiện đúng |
| Topic view | Click topic bất kỳ | Passage → Glossary → Exercises load |
| EWordClass tab | Glossary tab → "🏷️ Từ loại" | Word class practice hiện (nếu ≥4 words có POS) |
| Exercise flow | Làm E1→E8 | Submit được, score hiện |
| Progress badge | Hoàn thành topic 80%+ | Badge "mastered" xuất hiện trên book page |
| Book 3 collocations | Mở topic Book 3 | Glossary section "Collocations & Phrases" hiện riêng |
| SRS banner | Có topic due | Banner "Ôn lại hôm nay: X chủ đề" hiện trên book page |
| Placement quiz | `/vocabwise/placement` | Quiz chạy, redirect đúng book |

---

## 5. Pronunciation

| Test | Cách test | Pass khi |
|---|---|---|
| Record & score | Bấm mic, đọc từ | Score phần trăm trả về trong vài giây |
| TTS playback | Bấm nút nghe | Phát âm đúng, không rè |

---

## 6. Plan & Payment

| Test | Cách test | Pass khi |
|---|---|---|
| Free trial countdown | Free account còn trial | Dashboard hiện ngày hết hạn |
| Upgrade banner | Free account hết trial | Banner hiện, link đến payment info |
| Superadmin activate Pro | Vào `/superadmin` → activate 1 tháng cho user | User truy cập được Academic content ngay |
| Bonus days stack | Superadmin thêm bonus lần 2 | Ngày cộng thêm từ ngày hiện tại của bonus |

---

## 7. Regression Checks (sau mỗi thay đổi lớn)

| Area | Kiểm tra |
|---|---|
| Auth flow | Register → OTP → Onboarding → Login → Logout |
| Kids routing | `/kids` → chọn bé → level → topic → game |
| Academic routing | `/vocabwise` → book → topic → exercises |
| API routes | `/api/auth/me`, `/api/vocabwise/topics`, `/api/vocabwise/progress` |
| Superadmin | Login, list families, change plan, logout |
| PWA | App installable, SW caches đúng |

---

## 8. Pre-deploy Checklist

- [ ] `npm test` → all pass
- [ ] `npx tsc --noEmit` → zero errors
- [ ] Test auth flow trên localhost
- [ ] Check Vercel preview URL sau deploy
- [ ] Kiểm tra `/superadmin` trên production
- [ ] Monitor Vercel logs 5 phút sau deploy

---

*Cập nhật: 2026-06-19 — sau full security audit + overnight implementation*
