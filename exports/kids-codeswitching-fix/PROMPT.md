Bạn đang **kiểm tra và sửa lỗi** (không phải viết mới) phần giải thích từ vựng tiếng Anh bằng tiếng Việt cho học sinh nhỏ tuổi Việt Nam, dùng trong app VocabWise Daily (Kids).

File đính kèm liệt kê nhiều từ, mỗi từ có format:

```
[[word]]
WORD: từ tiếng Anh (từ loại)
MEANING: nghĩa tiếng Việt
EXPLANATION: đoạn giải thích hiện tại đang lưu trong hệ thống
```

## Lỗi cần tìm — CHỈ 1 loại duy nhất

**Từ/cụm tiếng Anh bị chèn thẳng vào câu ví dụ tiếng Việt mà không dịch.** Ví dụ lỗi thật đã gặp:

- `"I love bạn"` (Tôi yêu bạn) — sai vì trộn "I love" với "bạn" trong 1 câu
- `"...và em cảm thấy rất happy."` — từ mục tiêu để nguyên tiếng Anh cuối câu Việt
- `"Brother, không quên mang sách về nhà nhé!"` — từ mục tiêu chèn thẳng đầu câu Việt
- `"Hoa cam mùa đông có màu orange rực rỡ."` — "orange" không dịch

## Cách sửa — CHỈ sửa câu ví dụ, KHÔNG viết lại phần định nghĩa

**Tuyệt đối không** diễn giải lại, rút gọn, hay đổi văn phong của phần định nghĩa/giải thích phía trước — giữ nguyên y hệt. **Chỉ thay câu ví dụ bị lỗi** bằng 1 câu theo đúng format:

```
"<câu tiếng Anh tự nhiên, đơn giản, có dùng từ WORD>" (<bản dịch tiếng Việt đúng nghĩa>)
```

Ví dụ sửa đúng: `"I love bạn"` → `"I love you" (Tôi yêu bạn)`; `"...và em cảm thấy rất happy."` → `"...và em cảm thấy rất happy. Ví dụ: "I am happy today" (Hôm nay em rất vui)"` (giữ câu gốc, chỉ bổ sung ví dụ đúng chuẩn ngay sau).

Nếu đoạn văn có nhiều câu ví dụ, chỉ sửa (những) câu bị lỗi, các câu ví dụ tiếng Việt sạch khác giữ nguyên.

## Chỉ output những từ CẦN SỬA

- Nếu `EXPLANATION` của 1 từ **không có lỗi trộn tiếng Anh/Việt nào** trong câu ví dụ → **bỏ qua hoàn toàn, không viết gì cho từ đó**.
- Nếu **có lỗi** → trả về **toàn văn `EXPLANATION` đã sửa** (chỉ câu ví dụ thay đổi, mọi câu khác giữ y nguyên), đúng format:

```
[[word]]
<toàn bộ đoạn giải thích, chỉ câu ví dụ được sửa>
```

- Không markdown heading `#`. Có thể dùng `**in đậm**`/`*in nghiêng*`.
- Duyệt **TẤT CẢ** các từ trong file theo thứ tự — dự kiến chỉ khoảng 15-25% số từ cần sửa, phần lớn nên bị bỏ qua.

## Bắt buộc: bọc TOÀN BỘ câu trả lời trong 1 code block duy nhất

Đặt toàn bộ output vào bên trong **1 code fence duy nhất**. Nếu Gemini hỗ trợ lưu ra file (.md), ưu tiên lưu file thay vì dán vào chat để tránh bị cắt nội dung do giới hạn ký tự.
