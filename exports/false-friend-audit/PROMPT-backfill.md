# False Friend / Confusable Word audit — backfill examples

Bạn là chuyên gia ngôn ngữ hỗ trợ học sinh Việt Nam học từ vựng tiếng Anh (mục tiêu IELTS/SAT).

Mỗi file đính kèm chứa danh sách từ theo từng topic, định dạng:
<!-- topic: b1-t01 -->
4. word (pos) — giải thích false friend đã có sẵn (EXPLANATION)
...
<!-- /topic -->

Các từ này ĐÃ được xác định là có false friend/confusable, kèm giải thích (EXPLANATION) viết sẵn — giải thích này đáng tin cậy, KHÔNG cần đánh giá lại nội dung này.

Nhiệm vụ: (1) đọc EXPLANATION, xác định xem đó có phải 1 CẶP 2 TỪ TIẾNG ANH KHÁC NHAU hay không (vd "dinner" vs "diner"), hay chỉ là 1 từ duy nhất có nhiều nghĩa/cách đọc khác nhau (heteronym, vd "live" /lɪv/ vs /laɪv/ — cùng 1 từ, không phải 2 từ). (2) Viết 2 câu ví dụ.

Trả lời đúng format sau, không dùng markdown heading (không có ###), không in đậm cả dòng:

[<topic_id>/item<id>]
ORIGINAL_WORD: [từ gốc, chép lại y hệt từ trong danh sách]
FALSE_FRIEND: [nếu EXPLANATION nói về 2 từ khác nhau, ghi từ tiếng Anh còn lại ở đây (vd "diner"). NẾU chỉ là 1 từ nhiều nghĩa (heteronym) — không có từ thứ 2 — để TRỐNG dòng này (không ghi gì sau dấu :)]
EXAMPLE_EN: [câu tiếng Anh dùng từ gốc]
EXAMPLE_VI: [dịch câu trên]
FF_EXAMPLE_EN: [câu tiếng Anh minh hoạ nghĩa/cách dùng thứ 2 — dùng false friend nếu có, hoặc dùng lại từ gốc với nghĩa khác nếu là heteronym]
FF_EXAMPLE_VI: [dịch câu trên]

QUAN TRỌNG: 2 câu ví dụ phải dùng CHUNG một bối cảnh/tình huống (càng giống nhau càng tốt) và chỉ khác nhau ở từ được dùng, để khi đặt cạnh nhau học sinh thấy rõ ngay điểm khác biệt.

Trả lời cho TẤT CẢ các dòng trong file (không có dòng nào bị bỏ qua, vì false friend đã được xác nhận từ trước).

Với MỖI file đính kèm, xuất 1 file .md kết quả riêng để tải xuống (dùng tính năng tạo file/canvas) — đặt tên file kết quả bằng cách lấy tên file gốc, bỏ đuôi ".md", thêm "-result.md" (vd file đính kèm "book1-backfill.md" → xuất "book1-backfill-result.md"). Mỗi file kết quả chỉ chứa các block [topic_id/item...] theo đúng format trên — không thêm lời chào, giải thích, hay tóm tắt nào khác ngoài các block. Nếu có nhiều file đính kèm, xử lý và xuất kết quả cho TẤT CẢ, không chỉ file đầu tiên.