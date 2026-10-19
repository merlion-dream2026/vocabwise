# So sánh chi phí AI: Groq miễn phí vs Groq Developer vs OpenAI trả phí

*Cập nhật: 19/10/2026 · Áp dụng cho vocab-wise và axanh-global-english · Cập nhật lại khi đổi giá / đổi quy mô.*

## TL;DR
- Quy mô hiện tại (vocab-wise 10 gia đình / 14 HS): đổi sang trả phí chỉ tốn **~$1–4/tháng**. Vấn đề của Groq free là **rate limit**, không phải tiền.
- Groq free `gpt-oss-120b`: **8K token/phút, 200K token/ngày** → vocab-wise hết quota ngày ở ~35 HS học cùng ngày (fallback Cerebras); AXANH chỉ chấm được ~1 bài/phút.
- **Đề xuất bước 1:** nâng Groq lên **Developer** (pay-as-you-go, 250K TPM), đặt spend limit — không sửa code.
- Bước 2 (tùy chọn): chỉ các endpoint chấm điểm quan trọng → OpenAI `gpt-5-mini`; còn lại giữ Groq.

## 1. Bảng giá (USD / 1M token) — tra 19/10/2026

| Provider / model | Input | Output | Speech-to-text | Ghi chú |
|---|---|---|---|---|
| Groq free `gpt-oss-120b` (đang dùng) | 0 | 0 | 0 | 8K TPM, 200K TPD |
| Groq Developer `gpt-oss-120b` | 0.15 | 0.60 | Whisper turbo $0.04/giờ (min 10s/request) | 250K TPM, 1K RPM; batch/cached −50% |
| OpenAI `gpt-5-nano` | 0.05 | 0.40 | — | rẻ nhất, tiếng Việt/chấm bài yếu hơn |
| OpenAI `gpt-4o-mini` | 0.15 | 0.60 | — | tiếng Việt ổn |
| OpenAI `gpt-4.1-mini` | 0.40 | 1.60 | — | |
| OpenAI `gpt-5-mini` | 0.25 | 2.00 | — | chấm bài tốt nhất nhóm này |
| OpenAI (khác, tham khảo) | `gpt-5.4-nano` 0.20/1.25 · `gpt-5.4-mini` 0.75/4.50 · `gpt-6-luna` 0.10/0.50 | | | |
| OpenAI speech | — | — | `gpt-4o-mini-transcribe` $0.003/phút · `whisper-1` / `gpt-4o-transcribe` $0.006/phút | |

Giá OpenAI: trang chính thức. Giá Groq: trang tổng hợp (trang Groq không truy cập trực tiếp được) → **xác minh lại trên console Groq trước khi nâng gói**.

## 2. vocab-wise

**Giả định / HS / ngày học** (ước tính từ prompt + max_tokens trong code, chưa có log thật — usage chỉ nằm trong Upstash Redis 25h):

| Chức năng | Lần/ngày | Token in / out |
|---|---|---|
| Giải nghĩa (cache DB, mỗi từ gọi 1 lần) | ~2 | 250 / 450 |
| Hint | 3 | 200 / 200 |
| Grammar-note, sentence-check, writing-check | 1 mỗi loại | 200–500 / 300–500 |
| IELTS Speaking evaluate | 0.2 | 3.000 / 1.500 |
| Ghi âm phát âm (Speak, Jump) | ~15 | ~5 giây/lần |

→ ~2,6K in + 3,2K out + ~1,2 phút audio / ngày; 20 ngày học / tháng.

**Chi phí / tháng (USD):**

| Phương án | 1 HS | 14 HS (hiện tại) | 100 | 500 | 1.000 |
|---|---|---|---|---|---|
| Groq Developer | 0.08 | 1.1 | 8 | 40 | 80 |
| OpenAI `gpt-5-nano` + mini-transcribe | 0.10 | 1.4 | 10 | 50 | 100 |
| OpenAI `gpt-4o-mini` + mini-transcribe | 0.12 | 1.7 | 12 | 60 | 120 |
| OpenAI `gpt-4.1-mini` + mini-transcribe | 0.20 | 2.8 | 20 | 100 | 200 |
| OpenAI `gpt-5-mini` + whisper-1 | 0.29 | 4 | 29 | 145 | 290 |

- Audio chiếm ~60% chi phí trên OpenAI; Groq rẻ hơn 2–5 lần ở phần này.
- 1.000 HS với `gpt-4o-mini` ≈ 3,1 triệu đ/tháng (tỷ giá giả định ~26.000đ/USD) ≈ 3.200đ/HS/tháng.

## 3. AXANH

Giả định: 50 NV × 2 lần chấm/ngày × 20 ngày = 2.000 lần chấm/tháng, ~5K token/lần + ~1.000 phút audio phần Nói.

| Phương án | Chi phí / tháng |
|---|---|
| Groq Developer | ~$3,5 |
| OpenAI `gpt-4o-mini` + mini-transcribe | ~$6 |
| OpenAI `gpt-5-mini` + mini-transcribe | ~$11 |

Nút thắt là 8K TPM (≈1 bài/phút toàn công ty); Groq Developer 250K TPM ≈ ~50 bài/phút.

## 4. Lưu ý kỹ thuật khi chuyển
- vocab-wise: provider nằm ở `lib/aiChat.ts` (groq / cerebras). Thêm OpenAI ≈ 20 dòng (API tương thích OpenAI).
- AXANH: AI soạn nội dung đã có switch `CONTENT_AI_PROVIDER=openai` (`lib/contentAI.ts`); phần chấm bài vẫn gọi Groq riêng.
- `gpt-5-mini` / `nano` là reasoning model: **không nhận `temperature`**, dùng `max_completion_tokens` thay `max_tokens`, reasoning tokens tính như output → chi phí thực tế có thể ×1,5 so với bảng.
- `gpt-oss` (Groq) cũng là reasoning model: phải để `max_tokens` đủ lớn + `reasoning_effort: 'low'`, nếu không câu trả lời bị cắt (lỗi "Giải nghĩa" cụt, sửa 18/10/2026).

## 5. Chưa kiểm chứng / việc có thể làm tiếp
- Nhận xét chất lượng tiếng Việt / chấm bài giữa các model là đánh giá định tính, chưa benchmark. Có thể chạy 10 bài viết thật qua 3 model để so (< $0.10).
- Lượng dùng là giả định — nếu cần số thật, log usage theo endpoint (Redis hiện chỉ giữ 25h).

## Nguồn
- [OpenAI API Pricing (chính thức)](https://developers.openai.com/api/docs/pricing)
- [Groq Pricing Oct 2026 – morphllm](https://www.morphllm.com/groq-pricing)
- [Groq pricing 2026 – eesel](https://eesel.ai/blog/groq-pricing)
- [CostBench – Groq](https://costbench.com/software/llm-api-providers/groq/)
