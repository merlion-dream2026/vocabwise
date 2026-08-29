# Task: audit code-switching trong ví dụ, output dạng DIFF (không viết lại cả đoạn)

Bạn đang audit phần giải thích từ vựng tiếng Anh (VocabWise Academic — học sinh Việt Nam ôn IELTS).
Các file chunk trong `exports/codeswitching-fix/` liệt kê nhiều từ, mỗi từ format:

```
[[topic_id/word]]
WORD: từ tiếng Anh (từ loại)
MEANING: nghĩa tiếng Việt
EXPLANATION: đoạn giải thích hiện tại đang lưu trong hệ thống
```

## Lỗi cần tìm — CHỈ 1 loại

**Từ/cụm tiếng Anh bị chèn thẳng vào câu ví dụ tiếng Việt mà không dịch.** Ví dụ lỗi thật:
- `"...giúp cải thiện khả năng cognitive của trẻ em."` (từ mục tiêu chèn giữa câu Việt)
- `"...và điều đó khiến anh ấy cảm thấy rất anxious."` (từ mục tiêu chèn cuối câu Việt)
- `"Compliance là điều bắt buộc..."` (từ mục tiêu chèn đầu câu Việt)

Đọc **toàn bộ EXPLANATION** để hiểu đúng ngữ cảnh trước khi kết luận (không đọc qua loa — nhiều từ có ví dụ lồng trong đoạn mô tả ngữ cảnh, không phải lúc nào cũng có nhãn "Ví dụ:" rõ ràng).

## Output — CHỈ phần bị lỗi, dạng DIFF (không viết lại cả đoạn)

Với mỗi từ **có lỗi**, xác định đúng câu/cụm bị lỗi trong ví dụ, output:

```
[[topic_id/word]]
OLD: "<copy CHÍNH XÁC nguyên văn câu/cụm bị lỗi từ EXPLANATION gốc — không đổi 1 ký tự, kể cả dấu ngoặc kép gốc>"
NEW: "<câu tiếng Anh tự nhiên, độ khó phù hợp IELTS, có dùng từ WORD>" (<bản dịch tiếng Việt tương ứng>)
```

**Cực kỳ quan trọng về OLD:** phải là bản copy **y hệt từng ký tự** đoạn văn bản gốc (kể cả dấu câu, khoảng trắng) — vì hệ thống sẽ dùng `OLD` để tìm-và-thay bằng phép so khớp chuỗi chính xác (không phải AI đọc hiểu). Nếu `OLD` sai dù chỉ 1 ký tự, phép thay thế sẽ thất bại. Chọn đoạn `OLD` đủ ngắn để chỉ bao trùm phần bị lỗi (không cần copy cả câu nếu chỉ 1 cụm bị lỗi), nhưng đủ dài để duy nhất trong đoạn văn (không trùng với đoạn khác).

**Không** viết lại các câu khác, không đổi văn phong, không thêm phần nào ngoài `OLD`/`NEW`. Không cần thêm câu tiếng Anh cho những ví dụ vốn đã sạch tiếng Việt (không có lỗi trộn ngôn ngữ) — chỉ sửa đúng chỗ bị lỗi.

- Nếu từ **không có lỗi** → bỏ qua hoàn toàn, không viết gì.
- 1 từ có thể có nhiều chỗ lỗi → xuất nhiều block `OLD`/`NEW` liên tiếp dưới cùng `[[topic_id/word]]`, mỗi cặp cách nhau 1 dòng trống:

```
[[topic_id/word]]
OLD: "..."
NEW: "..."

OLD: "..."
NEW: "..."
```

## Việc cần làm

1. Đọc các file chunk được giao (đường dẫn cụ thể sẽ nêu trong task riêng)
2. Duyệt từng từ, áp dụng quy tắc trên
3. Ghi toàn bộ kết quả (chỉ các từ có lỗi) vào 1 file output duy nhất (đường dẫn sẽ nêu trong task riêng), dùng tool Write
4. Không cần validate/import vào DB — chỉ ghi file, việc import sẽ làm ở bước sau
