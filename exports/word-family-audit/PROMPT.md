Bạn là chuyên gia từ vựng tiếng Anh, đang AUDIT lại dữ liệu "word family" cho app học từ vựng trẻ em Việt Nam.

File đính kèm chứa danh sách từ mà hệ thống hiện đang coi là **KHÔNG có word family nào khác** (chỉ có chính nó), mỗi dòng 1 từ:
```
word=microscope|pos=n|meaning=kính hiển vi
word=banana|pos=n|meaning=quả chuối
```

Ví dụ lỗi đã phát hiện: "microscope" (n) từng bị đánh dấu "không có family", nhưng thực ra có dạng tính từ rất thông dụng "microscopic" (cực nhỏ, phải soi kính hiển vi) — bị bỏ sót ở bước tạo dữ liệu trước.

## Nhiệm vụ

Với MỖI từ, kiểm tra lại: từ này có THỰC SỰ không có word family nào khác không, hay có dạng liên quan (n/v/adj/adv cùng gốc) **thông dụng, có thật trong từ điển** mà bị bỏ sót?

**QUY TẮC:**
1. Chỉ báo cáo từ nào **CÓ** dạng liên quan thông dụng bị bỏ sót — đa số từ trong danh sách (đồ vật cụ thể, con vật, thức ăn, địa điểm...) thực sự không có family, đừng cố tìm cho bằng được.
2. Dạng bổ sung phải **CÓ THẬT**, thông dụng, cùng gốc nghĩa — không bịa từ, không liệt kê từ ghép không liên quan.
3. Mỗi pos (n/v/adj/adv) chỉ 1 từ.
4. `meaning` = nghĩa tiếng Việt ngắn gọn (tối đa 4-5 từ) cho đúng dạng từ đó.

## Output — CHỈ liệt kê từ CẦN SỬA, bỏ qua từ đúng

Với các từ CÓ family bị bỏ sót, trả về 1 dòng/từ, format **đầy đủ cả family** (bao gồm cả entry gốc của chính từ đó, KHÔNG chỉ phần thêm mới):
```
word=microscope|family=n:microscope:kính hiển vi;adj:microscopic:cực nhỏ, phải soi kính hiển vi
```
- Giữ nguyên cột `word=...` y hệt input để đối chiếu.
- `family` = danh sách đầy đủ các dạng (kể cả dạng gốc), phân cách `;`, mỗi dạng `pos:word:meaning` phân cách `:`.
- **Từ nào đúng là không có family (đa số) thì KHÔNG liệt kê dòng nào cho từ đó cả** — chỉ trả về những dòng cần sửa. Nếu không có từ nào cần sửa trong cả file, trả lời đúng 1 dòng: `NO FIXES NEEDED`.
- KHÔNG dùng markdown heading, không bullet, không đánh số, không giải thích thêm — chỉ các dòng `word=...|family=...` thuần.

Xử lý HẾT toàn bộ các dòng trong file đính kèm.
