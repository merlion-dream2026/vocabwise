Bạn là chuyên gia từ vựng tiếng Anh, tạo dữ liệu "word family" (họ từ cùng gốc: danh từ/n, động từ/v, tính từ/adj, trạng từ/adv) cho app học từ vựng trẻ em Việt Nam.

File đính kèm chứa danh sách từ, mỗi dòng 1 từ, format:
```
word=airport|pos=n|meaning=sân bay
word=decide|pos=v|meaning=quyết định
```

## Nhiệm vụ

Với MỖI dòng, xác định word family CÓ THẬT trong từ điển tiếng Anh của từ đó — các dạng danh từ/động từ/tính từ/trạng từ liên quan cùng gốc, thông dụng. Luôn bao gồm dạng của chính từ gốc (đúng pos đã cho) trong danh sách.

**QUY TẮC BẮT BUỘC (đã kiểm chứng qua thử nghiệm — model nhỏ hay phạm các lỗi này, cần tránh tuyệt đối):**
1. Chỉ liệt kê dạng từ **CÓ THẬT**, thông dụng. Nếu không chắc chắn, bỏ qua — KHÔNG bịa từ (ví dụ lỗi từng gặp: biến "banana" thành "banal" — hai từ không liên quan).
2. **Danh từ cụ thể** (đồ vật, con vật, thức ăn, địa điểm — vd "airport", "banana", "cat") thường **KHÔNG có word family** — chỉ trả về đúng chính nó (1 phần tử), **KHÔNG bịa động từ/tính từ** cho các từ này (lỗi từng gặp: bịa "airport" thành động từ nghĩa "hoạt động như sân bay" — sai).
3. Mỗi pos (n/v/adj/adv) chỉ 1 từ — chọn dạng phổ biến nhất.
4. KHÔNG liệt kê từ ghép (compound words) không liên quan về nghĩa (vd không liệt kê "catbird", "catnap" cho từ "cat").
5. Nếu từ chỉ có 1-2 dạng liên quan thật sự, chỉ liệt kê từng đó — **đừng cố lấp đầy đủ 4 dạng**.
6. `meaning` = nghĩa tiếng Việt ngắn gọn (tối đa 4-5 từ) cho đúng dạng từ đó (không copy y hệt nghĩa gốc nếu từ loại khác làm nghĩa đổi sắc thái, vd danh từ "decision" = "quyết định", nhưng tính từ "decisive" = "quyết đoán").

## Output — GIỮ NGUYÊN thứ tự và cột `word=` y hệt bản gốc để đối chiếu

Với MỖI dòng input, trả về đúng 1 dòng output, format:
```
word=airport|family=n:airport:sân bay
word=decide|family=v:decide:quyết định;n:decision:quyết định;adj:decisive:quyết đoán;adv:decisively:một cách quyết đoán
```
- `family` = danh sách các dạng, phân cách bằng `;`, mỗi dạng là `pos:word:meaning` (phân cách bằng `:`).
- Giữ nguyên cột `word=...` đầu dòng y hệt input (không sửa chính tả/viết hoa) để công cụ đối chiếu tự động.
- KHÔNG dùng markdown heading (`#`, `##`), không dùng bullet, không đánh số — chỉ các dòng `word=...|family=...` thuần, mỗi dòng 1 từ.
- KHÔNG thêm lời giải thích, mở đầu, hay tổng kết nào khác ngoài các dòng trên.
- Nếu file có nhiều dòng, xử lý HẾT toàn bộ, không bỏ sót dòng nào.

Xử lý tất cả các dòng trong file đính kèm theo quy tắc trên.
