Bạn đang viết lại phần giải thích từ vựng tiếng Anh (bằng tiếng Việt) cho học sinh Việt Nam ôn IELTS, dùng trong app VocabWise Academic.

File đính kèm liệt kê nhiều từ, mỗi từ có format:

```
[[topic_id/word]]
WORD: từ tiếng Anh (từ loại)
MEANING: nghĩa tiếng Việt
EXAMPLE: câu ví dụ tiếng Anh gốc
```

Với **MỖI từ**, viết 1 đoạn giải thích tiếng Việt (3-4 câu ngắn) gồm: ngữ cảnh thường dùng của từ, phân biệt với từ đồng nghĩa nếu có, và 1 câu ví dụ MỚI dễ nhớ (không lặp lại câu EXAMPLE gốc).

## Quy tắc bắt buộc — vi phạm bất kỳ điều nào dưới đây đều là lỗi nghiêm trọng

1. **Toàn bộ nội dung phải viết hoàn toàn bằng tiếng Việt.** Không được để bất kỳ từ tiếng Anh nào lẫn vào câu tiếng Việt — kể cả chính từ đang giải thích. Sai: "giúp cải thiện khả năng cognitive của trẻ em". Đúng: "giúp cải thiện khả năng nhận thức của trẻ em". Chỉ được giữ nguyên từ tiếng Anh khi: (a) đứng độc lập lúc định nghĩa, ví dụ "**Cognitive** là tính từ nghĩa là...", hoặc (b) nằm trong 1 câu ví dụ TOÀN TIẾNG ANH đặt trong ngoặc kép riêng.
2. **Dịch đúng nghĩa, đúng từ loại.** Không dịch sai (vd: "potato" ≠ "cà tím"; "hug" ≠ "hôn"; "floor" ≠ "bàn"), không gọi sai từ loại (vd: không gọi danh từ là tính từ).
3. **Không bịa từ tiếng Việt.** Mọi từ/cụm từ tiếng Việt dùng phải là tiếng Việt thật, tra được trong từ điển — không viết ra thứ nghe giống tiếng Việt nhưng vô nghĩa (vd: "ốp dịch", "ổn lươn rau" là những lỗi thật đã gặp, không được lặp lại kiểu này).
4. **Không markdown heading `#`.** Có thể dùng `**in đậm**` hoặc `*in nghiêng*` nếu muốn, nhưng không dùng `#`, `##`, `###`.

## Format output — làm đúng để dễ ghép ngược lại vào hệ thống

Với mỗi từ, trả về đúng format sau (giữ nguyên `[[topic_id/word]]` y hệt input):

```
[[topic_id/word]]
<đoạn giải thích 3-4 câu>
```

Xử lý **TẤT CẢ** các từ trong file, theo đúng thứ tự xuất hiện. Không bỏ sót từ nào, không thêm lời dẫn/tổng kết ngoài các block `[[...]]`.

## Bắt buộc: bọc TOÀN BỘ câu trả lời trong 1 code block duy nhất

Đặt toàn bộ output (tất cả các block `[[...]]` của mọi từ) vào **bên trong 1 code fence duy nhất** (một cặp ba dấu backtick ở đầu và cuối câu trả lời, không chia nhỏ), dạng:

<code-fence-start>
[[topic_id/word]]
đoạn giải thích...

[[topic_id/word]]
đoạn giải thích...

...(tiếp tục cho hết tất cả các từ)...
<code-fence-end>

Đây không phải để trang trí — mục đích là để tôi bấm nút **Copy** gắn sẵn trên code block (thay vì bôi đen tay), vì bôi đen tay từng làm hỏng dấu tiếng Việt khi dán ra ngoài. Nếu Gemini không đặt toàn bộ output trong đúng 1 code block, tôi sẽ không copy được sạch.
