Bạn đang **kiểm tra và sửa lỗi** (không phải viết mới) phần giải thích từ vựng tiếng Anh bằng tiếng Việt cho học sinh Việt Nam ôn IELTS, dùng trong app VocabWise Academic.

File đính kèm liệt kê nhiều từ, mỗi từ có format:

```
[[topic_id/word]]
WORD: từ tiếng Anh (từ loại)
MEANING: nghĩa tiếng Việt
EXPLANATION: đoạn giải thích hiện tại đang lưu trong hệ thống
```

Với **MỖI từ**, đọc kỹ trường `EXPLANATION` và kiểm tra 4 lỗi sau:

1. **Chèn tiếng Anh vào câu tiếng Việt.** Bất kỳ từ tiếng Anh nào lẽ ra phải dịch nhưng lại để nguyên trong câu tiếng Việt — kể cả chính từ mục tiêu (`WORD`) nếu nó xuất hiện bên trong một câu tiếng Việt đang mô tả ví dụ/ngữ cảnh. Sai: "giúp cải thiện khả năng cognitive của trẻ em". Đúng: "giúp cải thiện khả năng nhận thức của trẻ em". CHỈ được giữ nguyên từ tiếng Anh khi đứng độc lập lúc định nghĩa (vd: "**Cognitive** là tính từ nghĩa là...").
2. **Dịch sai nghĩa, sai từ loại, hoặc thông tin sai sự thật.** (vd: "potato" ≠ "cà tím"; "hug" ≠ "hôn"; gọi danh từ là tính từ...)
3. **Từ/cụm từ tiếng Việt bị bịa ra, không có nghĩa thật.** (vd: "ốp dịch", "ổn lươn rau" — nghe giống tiếng Việt nhưng vô nghĩa khi tra từ điển)
4. **Câu ví dụ thiếu bản gốc tiếng Anh.** Học sinh cần thấy từ `WORD` được dùng thật trong 1 câu tiếng Anh, kèm bản dịch tiếng Việt — không chỉ có mỗi câu tiếng Việt. Câu ví dụ đúng chuẩn PHẢI có đủ 2 phần theo đúng định dạng:

   ```
   Ví dụ: "<câu tiếng Anh tự nhiên, có dùng từ WORD>" (<câu dịch tiếng Việt tương ứng>)
   ```

   Câu tiếng Anh phải là câu tự nhiên, đúng ngữ pháp, độ khó phù hợp học sinh IELTS (không quá đơn giản kiểu sách giáo khoa lớp 3, không quá học thuật khó hiểu). Câu tiếng Việt phải là bản dịch sát nghĩa của chính câu tiếng Anh đó (không phải một câu ví dụ tiếng Việt độc lập khác).

   Vì đây là lỗi phổ biến nhất (hầu hết `EXPLANATION` hiện tại chỉ có câu ví dụ tiếng Việt), khả năng cao **gần như mọi từ đều cần sửa** ở mục này — điều đó bình thường, không phải bạn tìm lỗi ép.

## Quan trọng — chỉ output những từ CẦN SỬA

- Nếu `EXPLANATION` của 1 từ **không có lỗi nào trong 4 loại trên** (tức đã có sẵn cả câu tiếng Anh + câu dịch tiếng Việt đúng chuẩn, và không code-switch/dịch sai/bịa từ) → **bỏ qua hoàn toàn, không viết gì cho từ đó**. Không cần xác nhận "từ này ổn".
- Nếu `EXPLANATION` **có lỗi** (kể cả chỉ thiếu câu ví dụ tiếng Anh) → viết lại toàn bộ đoạn (sửa hết lỗi, giữ nguyên văn phong, độ dài và các ý còn lại không liên quan đến lỗi; chỉ thay/bổ sung phần ví dụ theo định dạng ở mục 4), trả về đúng format:

```
[[topic_id/word]]
<đoạn giải thích đã sửa, đầy đủ, kết thúc bằng câu ví dụ EN + VN đúng định dạng>
```

- Không markdown heading `#`. Có thể dùng `**in đậm**`/`*in nghiêng*`.
- Duyệt **TẤT CẢ** các từ trong file theo thứ tự. Lần này output có thể GẦN BẰNG hoặc BẰNG số lượng input (vì lỗi #4 áp dụng cho hầu hết mọi từ) — khác với các lần audit trước.

## Bắt buộc: bọc TOÀN BỘ câu trả lời trong 1 code block duy nhất

Đặt toàn bộ output vào bên trong **1 code fence duy nhất** (một cặp ba dấu backtick ở đầu và cuối câu trả lời). Đây là để tôi bấm nút Copy gắn sẵn trên code block thay vì bôi đen tay — bôi đen tay từng làm hỏng dấu tiếng Việt khi dán ra ngoài.

## Khuyến nghị: lưu kết quả ra file thay vì dán vào chat

Nếu Gemini hỗ trợ xuất/lưu câu trả lời ra file (.md), hãy dùng cách đó thay vì copy-paste vào khung chat — tránh bị cắt nội dung do giới hạn ký tự khi dán.
