# Mascots — Rocky & Bubi

- **Map (code):** `lib/mascots.ts` — shot → `/mascots/{char}/{char}-{shot}.png`, fallback về `pose-idle`.
- **Component:** `components/Mascot.tsx` (`<Mascot>`, `<BadgeArt>`). Không truyền `character` → lấy mascot của bé đang học.
- **Ảnh trong app:** `public/mascots/` = bản derived thu nhỏ (pose/anim 512px, portrait/badge/streak 256px, duo scene 1024px), giữ nền xám, không tách nền. Bản gốc 1254px nằm ngoài repo (thư mục `VocabWise mascots/` của Andie), không bị sửa.
- **Inventory:** `mascot-assets.local.json` — 126 bản ghi catalog + 3 ảnh wave/think tìm thấy local, kèm sha256, kích thước, đường dẫn nguồn (tương đối với thư mục mascot) và `app_url`. QA/user_review gốc giữ nguyên.

## Mỗi bé một mascot (`children.mascot`: `'rocky' | 'bubi' | NULL`)
- `components/MascotContext.tsx` (`ChildMascotProvider` ở root layout) xác định bé theo URL `/dashboard/<id>/…`, hoặc `nav_child_id` cho `/vocabwise`, `/my-words`. Route khác (landing, 404, onboarding) → `DEFAULT_MASCOT` = Rocky.
- `NULL` → lần đầu bé vào route của bé sẽ hiện dialog **"Chọn bạn đồng hành"** (`MascotPickDialog`). "Để sau" ẩn tới khi đóng tab (sessionStorage); trong lúc đó hiện Rocky.
- Bé chọn xong → `MascotIntro`: 3 slide trên `scene-onboarding-1/2/3` (chào + nút nghe lời chào TTS → học qua trò chơi → sưu tầm quà, confetti). Hiện **1 lần cho mỗi bé** (cột `children.mascot_intro_seen_at`), dù bé tự chọn hay phụ huynh chọn; đổi sang mascot khác → reset để bé gặp bạn mới. Profile bé có thẻ "Bạn đồng hành" + nút **Xem lại lời chào** (chưa chọn → **Chọn ngay**).
- Phụ huynh chọn/đổi trong form Thêm/Sửa hồ sơ bé (`MascotOptions`: Để bé chọn / Rocky / Bubi).
- Trong lúc đang tải mascot của bé, `<Mascot>` chỉ hiện ô xám trống, không nháy Rocky → Bubi.

## Ghi chú inventory
- Idle + reference (cả 2 nhân vật): hash lệch catalog, kích thước khớp → coi là bản gốc Andie đã duyệt.
- `bubi-portrait-{explorer,scholar,master}.png` nằm trong thư mục `rocky/` (đã kiểm tra đúng là Bubi).
- Wave/think local dùng tên lỗi chính tả `*-post-*`; trong app đổi về `*-pose-*`.
- **Thiếu:** `bubi-pose-think` → fallback `bubi-pose-idle`.

## Chỗ đang dùng
| Màn hình | Ảnh |
|---|---|
| Daily topic hub (`TopicHub`) | wave (chưa bắt đầu) / idle + blink / cheer (đã chinh phục) |
| Academic topic hub (`AcademicHub`) | idle + blink / cheer |
| Kết quả game (`GameResultScreen`) | cheer ≥90% / idle 60–89% / oops <60% |
| Chọn level Daily | portrait seeker → master |
| Huy hiệu (profile + modal level) | badge-* / streak-* theo `lib/badges.ts` |
| Onboarding | duo-wave → think → cheer |
| 404 / error | lost / oops |
| My Words rỗng / tìm không thấy | cards / magnify |
| Sticker album rỗng | gift |

## Chưa duyệt / chưa làm
- Blink: căn khung tĩnh đã so (chỉ vùng mắt thay đổi), timing 4.5s/~120ms là prototype — **chưa xem playback thật**.
- Talk: không dùng (Rocky talk-open lệch nhẹ viền đầu). Jump: tắt (NEEDS_REVIEW).
- Chưa dùng: pose-offline (banner offline là dải mỏng; trang offline của `sw.js` không có cache ảnh), scene onboarding/share-card/email-header/trophy, face-*.
