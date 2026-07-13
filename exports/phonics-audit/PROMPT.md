Bạn là giáo viên phát âm tiếng Anh (British RP) bản ngữ, chuyên dạy học sinh Việt Nam trình độ Pre-A1 đến người lớn.

File đính kèm (`phonics.md`) chứa 58 bài Phonics, mỗi bài 1 block dạng:

```
---
## LESSON: iː-ɪ | type: pair | iː / ɪ

### KNOWLEDGE

**how_to:**
- iː: ...
- ɪ: ...

**vs_vietnamese:** ...

**spelling:**
- ee | tree, see, feet, green, free

**mistakes:**
- "ship" đọc thành "sheep"...

**mnemonic:** ...

### PRACTICE

**tip:** ...

**practice_words:** tree, fish, see, sit, ...

**practice_sentences:**
1. See the fish. [see, fish]
2. Sit and eat some beans. [sit, eat, beans]
```

3 loại `type`:
- `pair`/`consonant`/`challenge`: có `### KNOWLEDGE` (how_to, vs_vietnamese, spelling, mistakes, mnemonic) + `### PRACTICE` (tip, practice_words, practice_sentences — mỗi câu có `[highlight words]`).
- `rule`: `### KNOWLEDGE` có thêm `why`/`exceptions` thay vì spelling/mistakes/mnemonic; `### PRACTICE` thay bằng `### BUCKETS` (mỗi bucket có `label`, `condition`, `words`).
- `rhythm`: `### PRACTICE` có `sentences` dạng `N. câu [stressed: w1, w2] [vi: nghĩa tiếng Việt]`.

## Nhiệm vụ

Với MỖI bài, kiểm tra:

1. **how_to**: mô tả cách phát âm có chính xác về ngữ âm học không, đủ cụ thể/dễ hình dung cho người Việt không.
2. **vs_vietnamese**: so sánh với tiếng Việt có đúng không, có bỏ sót lỗi điển hình của người Việt học âm này không.
3. **spelling / examples**: từ ví dụ có đúng chứa spelling pattern và IPA nêu không.
4. **mistakes**: có phản ánh đúng lỗi phổ biến THẬT của người Việt không (không phải lỗi ngẫu nhiên, chung chung).
5. **mnemonic**: có dễ nhớ, không gây hiểu sai không.
6. **practice_words**: từ có đúng chứa âm mục tiêu không; nếu `type: pair`, các cặp từ có phải minimal pairs hợp lệ không (chỉ khác đúng 1 âm cần luyện).
7. **practice_sentences / sentences (rhythm) — TRỌNG TÂM**: câu phải **tự nhiên và có nghĩa thực sự**, không chỉ đúng ngữ pháp. Loại lỗi cần tìm: câu bị gượng ép vì cố nhét target word vào ngữ cảnh vô lý. Ví dụ lỗi đã phát hiện trong bộ này:
   - "The list is raw and needs to be cooked a lot." — "list" (danh sách) không thể "raw"/"cooked".
   - "The dog will bark at a cat on the pat." — "pat" không phải danh từ chỉ địa điểm, "on the pat" vô nghĩa.
   Nếu câu nào rơi vào loại lỗi này, viết lại câu tự nhiên hơn nhưng vẫn giữ target word và số âm tiết/độ khó tương đương. `[highlight]`/`[stressed]` phải khớp đúng từ chứa âm mục tiêu thực sự xuất hiện trong câu mới.
8. **buckets** (`type: rule`): từ trong mỗi bucket có thực sự thuộc đúng quy tắc/nhóm âm nêu trong `condition` không.
9. **IPA còn thiếu**: các bài sau chưa có IPA cho `practice_words` (không có dòng `practice_words_ipa` tương ứng, chỉ có từ thường) — hãy bổ sung IPA British RP cho từng từ theo đúng thứ tự trong `practice_words`, viết dạng `word /ipa/` (giống các bài khác đã có IPA):
   - `final-voiced`, `final-fricatives`, `clusters-pbl`, `clusters-trdr`, `final-l`

## Output — CHỈ liệt kê bài CẦN SỬA, giữ nguyên format block

- Giữ nguyên dòng `## LESSON: id | type: ... | title` y hệt bản gốc.
- CHỈ ghi lại `### KNOWLEDGE` / `### PRACTICE` / `### BUCKETS` và bên trong đó CHỈ ghi field bị đổi (không copy lại field không đổi).
- Với `practice_words` khi thêm IPA: viết lại toàn bộ dòng `**practice_words:**` với format `word /ipa/, word /ipa/, ...` cho mọi từ trong bài đó.
- Với `practice_sentences`/`sentences`: nếu sửa 1 câu trong 4 câu, vẫn phải in lại ĐỦ cả danh sách (giữ nguyên câu không đổi, chỉ thay câu bị lỗi) vì đây là 1 field dạng danh sách.
- Nếu KHÔNG bài nào cần sửa, trả lời đúng 1 dòng: `NO FIXES NEEDED`.
- KHÔNG thêm text nào khác ngoài các block trên (không mở đầu, không tổng kết).

Ví dụ output khi chỉ sửa 1 câu trong practice_sentences:

```
---
## LESSON: l-r | type: pair | l / r

### PRACTICE

**practice_sentences:**
1. I will read a book by the lake. [read, lake]
2. The farmer uses a rake on the lawn. [rake]
3. It is right to lead the dog on a long walk. [right, lead, long]
4. She will read the long list and then rest. [read, long, rest]
```

Ví dụ output khi bổ sung IPA còn thiếu:

```
---
## LESSON: final-l | type: pair | ...

### PRACTICE

**practice_words:** feel /fiːl/, ball /bɔːl/, ...
```
