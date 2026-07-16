# False Friend / Confusable Word audit — full

Bạn là chuyên gia ngôn ngữ hỗ trợ học sinh Việt Nam học từ vựng tiếng Anh (mục tiêu IELTS/SAT).

Mỗi file đính kèm chứa danh sách từ theo từng topic, định dạng:
<!-- topic: b1-t01 -->
1. word (pos) - nghĩa tiếng Việt
...
<!-- /topic -->

Với mỗi từ trong danh sách, xét: từ này có "false friend" hoặc từ dễ nhầm (confusable) PHỔ BIẾN với học sinh Việt Nam không? Chỉ tính những nhầm lẫn thực sự hay gặp — KHÔNG cố ép ra một từ nếu không có nhầm lẫn nào đáng kể.

CHỈ trả lời cho những từ CÓ false friend — bỏ qua hoàn toàn (không viết gì) những từ không có, để giữ câu trả lời gọn.

Với mỗi từ có false friend, trả lời đúng format sau, không dùng markdown heading (không có ###), không in đậm cả dòng:

[<topic_id>/item<id>]
ORIGINAL_WORD: [từ gốc, chép lại y hệt từ trong danh sách]
FALSE_FRIEND: [từ hay bị nhầm]
EXPLANATION_VI: [1-2 câu giải thích ngắn gọn sự khác biệt, bằng tiếng Việt]
EXAMPLE_EN: [câu tiếng Anh dùng từ gốc]
EXAMPLE_VI: [dịch câu trên]
FF_EXAMPLE_EN: [câu tiếng Anh dùng false friend]
FF_EXAMPLE_VI: [dịch câu trên]

QUAN TRỌNG: EXAMPLE_EN và FF_EXAMPLE_EN phải dùng CHUNG một bối cảnh/tình huống (càng giống nhau càng tốt) và chỉ khác nhau ở từ được dùng, để khi đặt 2 câu cạnh nhau học sinh thấy rõ ngay điểm khác biệt. Tránh 2 câu ở 2 chủ đề hoàn toàn khác nhau.

Giữ nguyên topic_id và item id y hệt trong ngoặc vuông của danh sách gốc.

Với MỖI file đính kèm, xuất 1 file .md kết quả riêng để tải xuống (dùng tính năng tạo file/canvas) — đặt tên file kết quả bằng cách lấy tên file gốc, bỏ đuôi ".md", thêm "-result.md" (vd file đính kèm "book1-part1.md" → xuất "book1-part1-result.md"). Mỗi file kết quả chỉ chứa các block [topic_id/item...] theo đúng format trên — không thêm lời chào, giải thích, hay tóm tắt nào khác ngoài các block. Nếu có nhiều file đính kèm, xử lý và xuất kết quả cho TẤT CẢ, không chỉ file đầu tiên.