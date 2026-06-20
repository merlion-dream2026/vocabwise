const BASE_URL = 'https://vocabwise.id.vn'

function avatarImg(id: string, name: string, size = 40): string {
  return `<img src="${BASE_URL}/avatars/${id}.png" width="${size}" height="${size}" alt="${name}" style="border-radius:50%;display:block;">`
}

const BANK = {
  bank: 'Timo Bank',
  account: '0977347707',
  name: 'NGUYEN TUNG ANH',
  zalo: '0977 347 707',
}

function header(title: string) {
  return `
    <div style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:28px 24px;text-align:center;border-radius:16px 16px 0 0">
      <p style="font-size:36px;margin:0 0 8px">📚</p>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.5px">VocabWise</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:6px 0 0;font-weight:600">${title}</p>
    </div>`
}

function button(text: string, href: string) {
  return `
    <div style="text-align:center;margin:20px 0">
      <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;font-weight:900;font-size:15px;padding:14px 32px;border-radius:999px;text-decoration:none">${text}</a>
    </div>`
}

function planCards() {
  const plans = [
    { label: '1 tháng', price: '59.000đ', note: null, popular: false },
    { label: '3 tháng', price: '159.000đ', note: 'Tiết kiệm 10%', popular: true },
    { label: '6 tháng', price: '299.000đ', note: 'Tiết kiệm 16%', popular: false },
  ]
  return `
    <p style="color:#374151;font-weight:900;font-size:13px;margin:0 0 12px;text-align:center">Chọn gói phù hợp:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;margin-bottom:8px">
      <tr>
        ${plans.map(p => `
          <td width="33%" style="border:2px solid ${p.popular ? '#9333ea' : '#e9d5ff'};border-radius:12px;padding:12px 8px;text-align:center;background:${p.popular ? '#faf5ff' : '#fff'};vertical-align:top;box-shadow:${p.popular ? '0 2px 12px rgba(147,51,234,0.15)' : 'none'}">
            ${p.popular
              ? '<p style="color:#fff;background:#f97316;font-size:9px;font-weight:900;margin:0 0 6px;text-transform:uppercase;border-radius:20px;padding:2px 6px;display:inline-block">⭐ PHỔ BIẾN</p>'
              : '<p style="margin:0 0 18px"> </p>'}
            <p style="color:#374151;font-weight:900;font-size:13px;margin:0 0 4px">${p.label}</p>
            <p style="color:#9333ea;font-weight:900;font-size:16px;margin:0 0 4px">${p.price}</p>
            ${p.note ? `<p style="color:#16a34a;font-size:11px;font-weight:700;margin:0">${p.note}</p>` : '<p style="margin:0;font-size:11px"> </p>'}
          </td>`).join('')}
      </tr>
    </table>`
}

function footer() {
  return `
    <div style="border-top:1px solid #f0e6ff;margin-top:28px;padding-top:16px;text-align:center">
      <p style="color:#aaa;font-size:12px;margin:0">Câu hỏi? Zalo/SMS: <strong style="color:#9333ea">${BANK.zalo}</strong></p>
      <p style="color:#ccc;font-size:11px;margin:8px 0 0">© 2026 VocabWise · Từ vựng tiếng Anh — vui học mỗi ngày</p>
    </div>`
}

export function welcomeEmailHtml(name: string, tempPassword?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Từ vựng tiếng Anh — vui học mỗi ngày')}

    <div style="padding:28px 28px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Tài khoản của bạn đã được tạo thành công! 🎉<br>Bạn đang có <strong style="color:#9333ea">7 ngày dùng thử miễn phí</strong> — không cần cài app, dùng được ngay trên mọi thiết bị.</p>

      ${tempPassword ? `
      <!-- Thông tin đăng nhập -->
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#15803d;font-weight:900;font-size:13px;margin:0 0 10px">🔑 Thông tin đăng nhập của bạn</p>
        <p style="color:#374151;font-size:13px;margin:4px 0"><strong>Tên đăng nhập:</strong> <span style="font-family:monospace;background:#e0f2fe;padding:2px 6px;border-radius:4px">${name}</span></p>
        <p style="color:#374151;font-size:13px;margin:4px 0"><strong>Mật khẩu:</strong> <span style="font-family:monospace;background:#fef9c3;padding:2px 6px;border-radius:4px;font-size:15px;letter-spacing:1px">${tempPassword}</span></p>
        <p style="color:#6b7280;font-size:12px;margin:8px 0 0">⚠️ Vào <strong>Cài đặt → Bảo mật</strong> để đổi mật khẩu sau khi đăng nhập lần đầu.</p>
      </div>` : ''}

      ${button('🚀 Vào học ngay', `${BASE_URL}/kids`)}

      <!-- Free summary -->
      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin:0 0 24px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px">Tài khoản FREE của bạn</p>
        ${['✅ 1 chủ đề mỗi level (6 chủ đề)', '✅ Flashcard song ngữ Việt–Anh', '✅ Trò chơi từ vựng cơ bản', '✅ 1 hồ sơ bé'].map(item =>
          `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${item}</p>`
        ).join('')}
      </div>

      <!-- Upgrade section -->
      <div style="border:2px solid #e9d5ff;border-radius:12px;overflow:hidden;margin-bottom:20px">
        <div style="background:#faf5ff;padding:14px 20px;border-bottom:1px solid #e9d5ff">
          <p style="color:#7c3aed;font-weight:900;font-size:14px;margin:0">⭐ Nâng cấp Pro — mở khóa toàn bộ</p>
        </div>
        <div style="padding:16px 20px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
            <tr style="background:#f3e8ff">
              <td style="padding:8px 10px;font-weight:700;color:#374151;border-radius:6px 0 0 0"> </td>
              <td style="padding:8px 10px;font-weight:900;color:#6b7280;text-align:center">FREE</td>
              <td style="padding:8px 10px;font-weight:900;color:#9333ea;text-align:center">PRO ⭐</td>
            </tr>
            ${[
              ['Chủ đề', '6 / 180', '180 chủ đề'],
              ['Từ vựng', '~120 từ', '2.300+ từ'],
              ['Trò chơi', 'Cơ bản', '10 games'],
              ['Phát âm AI', '❌', '✅ AI chấm điểm'],
              ['Hồ sơ bé', '1 bé', 'Tối đa 3 bé'],
            ].map(([label, free, pro], i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#faf5ff'}">
              <td style="padding:7px 10px;font-weight:700;color:#374151">${label}</td>
              <td style="padding:7px 10px;color:#9ca3af;text-align:center">${free}</td>
              <td style="padding:7px 10px;color:#7c3aed;font-weight:700;text-align:center">${pro}</td>
            </tr>`).join('')}
          </table>
        </div>
      </div>

      ${planCards()}

      <!-- Payment info -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:8px;font-size:13px">
        <p style="color:#374151;font-weight:900;margin:0 0 10px">Cách nâng cấp:</p>
        ${[
          'Chuyển khoản với nội dung: <strong style="color:#9333ea">VocabWise [gói] [SĐT]</strong>',
          `Ngân hàng: <strong>${BANK.bank}</strong> · TK: <strong>${BANK.account}</strong> · Tên: <strong>${BANK.name}</strong>`,
          `Gửi ảnh bill qua Zalo <strong style="color:#9333ea">${BANK.zalo}</strong>`,
          'Admin kích hoạt ngay, <strong>chậm nhất 12h</strong>',
        ].map((step, i) => `
        <div style="display:flex;gap:10px;margin-bottom:8px">
          <span style="background:#ede9fe;color:#7c3aed;font-weight:900;font-size:11px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
          <p style="color:#4b5563;margin:0;line-height:1.5">${step}</p>
        </div>`).join('')}
      </div>
    </div>

    <div style="padding:0 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

export function renewalReminderEmailHtml(name: string, daysLeft: number, planLabel: string): string {
  const urgency = daysLeft <= 1 ? '#dc2626' : '#f59e0b'
  const urgencyText = daysLeft <= 1 ? '🚨 Hết hạn ngay hôm nay!' : `⏰ Còn ${daysLeft} ngày là hết hạn!`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Nhắc gia hạn tài khoản Pro')}

    <div style="padding:28px 28px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Tài khoản <strong style="color:#9333ea">Pro ${planLabel}</strong> của bạn sắp hết hạn.</p>

      <!-- Urgency banner -->
      <div style="background:${urgency};border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
        <p style="color:#fff;font-weight:900;font-size:16px;margin:0">${urgencyText}</p>
        <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:8px 0 0">Gia hạn ngay để bé không bị gián đoạn việc học!</p>
      </div>

      <!-- Reminder info -->
      <div style="background:#faf5ff;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px">💾 Dữ liệu của bé an toàn</p>
        <p style="color:#374151;font-size:13px;margin:0;line-height:1.6">Toàn bộ tiến độ, streak và huy hiệu của bé <strong>không bị xóa</strong> sau khi hết hạn. Gia hạn bất cứ lúc nào để bé tiếp tục học từ chỗ đã dừng.</p>
      </div>

      ${button('🔄 Gia hạn ngay', `${BASE_URL}/dashboard`)}

      <!-- Plans -->
      <p style="color:#374151;font-weight:900;font-size:13px;margin:20px 0 10px">Chọn gói gia hạn:</p>
      ${planCards()}

      <!-- Payment info -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:13px">
        <p style="color:#374151;font-weight:900;margin:0 0 10px">Cách gia hạn:</p>
        ${[
          'Chuyển khoản với nội dung: <strong style="color:#9333ea">VocabWise [gói] [SĐT]</strong>',
          `Ngân hàng: <strong>${BANK.bank}</strong> · TK: <strong>${BANK.account}</strong> · Tên: <strong>${BANK.name}</strong>`,
          `Gửi ảnh bill qua Zalo <strong style="color:#9333ea">${BANK.zalo}</strong>`,
          'Admin kích hoạt ngay, <strong>chậm nhất 12h</strong>',
        ].map((step, i) => `
        <div style="display:flex;gap:10px;margin-bottom:8px">
          <span style="background:#ede9fe;color:#7c3aed;font-weight:900;font-size:11px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
          <p style="color:#4b5563;margin:0;line-height:1.5">${step}</p>
        </div>`).join('')}
      </div>
    </div>

    <div style="padding:0 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

export function trialExpiryReminderEmailHtml(name: string, daysLeft: number): string {
  const urgency = daysLeft <= 1 ? '#f97316' : '#3b82f6'
  const urgencyText = daysLeft <= 1
    ? '⏰ Hôm nay là ngày cuối dùng thử miễn phí!'
    : `⏰ Còn ${daysLeft} ngày dùng thử miễn phí!`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Dùng thử sắp kết thúc — Nâng cấp Pro!')}

    <div style="padding:28px 28px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Thời gian dùng thử miễn phí của bạn sắp kết thúc.</p>

      <!-- Urgency banner -->
      <div style="background:${urgency};border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
        <p style="color:#fff;font-weight:900;font-size:16px;margin:0">${urgencyText}</p>
        <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:8px 0 0">Nâng cấp Pro để bé tiếp tục học không gián đoạn!</p>
      </div>

      <!-- What they lose -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#9a3412;font-weight:900;font-size:13px;margin:0 0 10px">Sau khi hết dùng thử, tài khoản Free bị giới hạn:</p>
        ${['❌ Chỉ còn 1 chủ đề / level (thay vì 30)', '❌ Không thể mở thêm chủ đề mới', '❌ Chỉ 1 hồ sơ bé'].map(item =>
          `<p style="color:#7c2d12;font-size:13px;margin:4px 0;font-weight:600">${item}</p>`
        ).join('')}
      </div>

      <!-- Pro benefits -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#15803d;font-weight:900;font-size:13px;margin:0 0 10px">⭐ Nâng cấp Pro — mở khóa toàn bộ:</p>
        ${['✅ 180 chủ đề × 2.300+ từ vựng', '✅ 10 trò chơi + AI chấm phát âm', '✅ Tối đa 3 hồ sơ bé', '✅ Báo cáo tiến độ hàng tuần qua email'].map(item =>
          `<p style="color:#166534;font-size:13px;margin:4px 0;font-weight:600">${item}</p>`
        ).join('')}
      </div>

      ${button('⭐ Nâng cấp Pro ngay', `${BASE_URL}/dashboard`)}

      <!-- Plans -->
      <p style="color:#374151;font-weight:900;font-size:13px;margin:20px 0 10px">Chọn gói phù hợp:</p>
      ${planCards()}

      <!-- Payment info -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:13px">
        <p style="color:#374151;font-weight:900;margin:0 0 10px">Cách nâng cấp:</p>
        ${[
          'Chuyển khoản với nội dung: <strong style="color:#9333ea">VocabWise [gói] [SĐT]</strong>',
          `Ngân hàng: <strong>${BANK.bank}</strong> · TK: <strong>${BANK.account}</strong> · Tên: <strong>${BANK.name}</strong>`,
          `Gửi ảnh bill qua Zalo <strong style="color:#9333ea">${BANK.zalo}</strong>`,
          'Admin kích hoạt ngay, <strong>chậm nhất 12h</strong>',
        ].map((step, i) => `
        <div style="display:flex;gap:10px;margin-bottom:8px">
          <span style="background:#ede9fe;color:#7c3aed;font-weight:900;font-size:11px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
          <p style="color:#4b5563;margin:0;line-height:1.5">${step}</p>
        </div>`).join('')}
      </div>
    </div>

    <div style="padding:0 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

/** Gửi khi referrer nhận +X ngày Pro vì người được mời đã học (signup reward released) */
export function referralSignupRewardEmailHtml(name: string, days: number, bonusExpiryDate: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Phần thưởng giới thiệu đã đến! 🎁')}

    <div style="padding:28px 28px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        Người bạn giới thiệu đã <strong style="color:#9333ea">bắt đầu học từ vựng</strong>.<br>
        Phần thưởng của bạn đã được kích hoạt! 🎉
      </p>

      <!-- Reward box -->
      <div style="background:linear-gradient(135deg,#faf5ff,#fdf2f8);border:2px solid #e9d5ff;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="font-size:40px;margin:0 0 8px">🎁</p>
        <p style="color:#7c3aed;font-weight:900;font-size:22px;margin:0 0 4px">+${days} ngày Pro</p>
        <p style="color:#9ca3af;font-size:13px;margin:0">Hiệu lực đến: <strong style="color:#374151">${bonusExpiryDate}</strong></p>
      </div>

      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.7;text-align:center">
        Tiếp tục mời bạn bè để tích lũy thêm ngày Pro miễn phí.<br>
        Mỗi người mua Pro → bạn nhận thêm <strong style="color:#9333ea">+14 ngày</strong>!
      </p>

      ${button('🔗 Chia sẻ link giới thiệu', `${BASE_URL}/dashboard`)}
    </div>

    <div style="padding:0 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

/** Gửi khi referrer nhận +X ngày Pro vì người được mời vừa mua Pro (paid reward) */
export function referralPaidRewardEmailHtml(name: string, days: number, bonusExpiryDate: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Bạn của bạn vừa mua Pro! 🏆')}

    <div style="padding:28px 28px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        Người bạn giới thiệu vừa <strong style="color:#9333ea">nâng cấp lên Pro</strong>.<br>
        Bạn nhận thêm phần thưởng bonus! 🎉
      </p>

      <!-- Reward box -->
      <div style="background:linear-gradient(135deg,#fefce8,#fdf4ff);border:2px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="font-size:40px;margin:0 0 8px">🏆</p>
        <p style="color:#7c3aed;font-weight:900;font-size:22px;margin:0 0 4px">+${days} ngày Pro</p>
        <p style="color:#9ca3af;font-size:13px;margin:0">Cộng vào tài khoản · Hiệu lực đến: <strong style="color:#374151">${bonusExpiryDate}</strong></p>
      </div>

      <p style="color:#374151;font-size:14px;margin:0 0 20px;line-height:1.7;text-align:center">
        Mời thêm bạn bè để tích lũy ngày Pro không giới hạn.<br>
        Đăng ký → <strong style="color:#9333ea">+7 ngày</strong> · Mua Pro → <strong style="color:#9333ea">+14 ngày</strong>
      </p>

      ${button('🔗 Mời thêm bạn bè', `${BASE_URL}/dashboard`)}
    </div>

    <div style="padding:0 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

export function inactiveChildEmailHtml(
  parentName: string,
  inactiveKids: { name: string; emoji: string; daysInactive: number }[]
): string {
  const kidBlocks = inactiveKids.map(kid => `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;margin-bottom:10px;">
      <tr>
        <td width="54" style="padding:14px 0 14px 16px;vertical-align:middle;">${avatarImg(kid.emoji, kid.name, 40)}</td>
        <td style="padding:14px 16px 14px 10px;vertical-align:middle;">
          <p style="margin:0;font-weight:900;font-size:16px;color:#92400e">${kid.name}</p>
          <p style="margin:3px 0 0;font-size:13px;color:#b45309;font-weight:600">😴 Chưa học ${kid.daysInactive} ngày rồi${kid.daysInactive >= 7 ? ' — streak đã mất!' : ''}</p>
        </td>
      </tr>
    </table>`).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Nhắc bé học từ vựng hôm nay 📚')}

    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${parentName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        Bé đang nghỉ học từ vựng một thời gian. Chỉ cần <strong>5–10 phút mỗi ngày</strong> là đủ để duy trì thói quen!
      </p>

      ${kidBlocks}

      ${button('📚 Mở VocabWise ngay', `${BASE_URL}/kids`)}

      <!-- Tips -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-top:8px">
        <p style="color:#15803d;font-weight:900;font-size:13px;margin:0 0 10px">💡 Tips giúp bé học đều hơn:</p>
        ${[
          '⏰ Đặt giờ học cố định mỗi ngày (ví dụ: sau bữa tối)',
          '👨‍👩‍👧 Ngồi cùng bé và chơi thử 1 game — tạo thói quen ban đầu',
          '🏆 Dùng tính năng Sibling Battle để các bé thi đua nhau',
          '🎁 Treo phần thưởng nhỏ khi bé duy trì streak 7 ngày',
        ].map(tip => `<p style="color:#166534;font-size:13px;margin:5px 0;font-weight:600">${tip}</p>`).join('')}
      </div>
    </div>

    <div style="padding:16px 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

export function proActivatedEmailHtml(name: string, planLabel: string, planEndDate: string, tempPassword?: string): string {
  const steps = [
    {
      emoji: '🔑',
      title: 'Đổi mật khẩu (nếu cần)',
      body: 'Vào <strong>Phụ huynh</strong> → cuộn xuống phần <strong>Bảo mật</strong> → nhập mật khẩu mới.<br>Hoặc dùng link <strong>Quên mật khẩu</strong> ở trang đăng nhập.',
    },
    {
      emoji: '👶',
      title: 'Thêm hồ sơ bé (tối đa 3 bé)',
      body: `Vào <strong>Phụ huynh</strong> → <strong>Thêm bé</strong> → điền tên, chọn level phù hợp:<br>
        <span style="color:#6b7280;font-size:12px">
          Mầm non / Lớp 1–2 → Seeker (Pre-A1) &nbsp;·&nbsp;
          Lớp 3–4 → Starter (A1) &nbsp;·&nbsp;
          Lớp 5–6 → Ranger (A2)<br>
          THCS → Explorer (B1) &nbsp;·&nbsp;
          THPT → Scholar / Master (B2–C1)
        </span>`,
    },
    {
      emoji: '📚',
      title: 'Chọn chủ đề học',
      body: '30 chủ đề × 6 levels = 180 chủ đề, 2.300+ từ. Bắt đầu từ chủ đề bé yêu thích nhất!',
    },
    {
      emoji: '🎮',
      title: 'Học qua Flashcard + 10 Games',
      body: 'Mỗi chủ đề có flashcard + trò chơi: ghép hình, điền từ, tìm cặp, tốc độ...',
    },
    {
      emoji: '🎤',
      title: 'Luyện phát âm với AI',
      body: 'Bé đọc to từ → AI chấm điểm ngay. Chạm vào nút mic trong game phát âm.',
    },
    {
      emoji: '📊',
      title: 'Theo dõi tiến độ',
      body: 'Vào <strong>Phụ huynh</strong> → xem XP, streak, badge và các chủ đề đã hoàn thành của mỗi bé.',
    },
  ]

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Tài khoản Pro đã được kích hoạt! ⭐')}

    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Tài khoản <strong style="color:#9333ea">Pro ${planLabel}</strong> của bạn đã được kích hoạt thành công! 🎉</p>

      ${tempPassword ? `
      <!-- Thông tin đăng nhập -->
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#15803d;font-weight:900;font-size:13px;margin:0 0 10px">🔑 Thông tin đăng nhập của bạn</p>
        <p style="color:#374151;font-size:13px;margin:4px 0"><strong>Tên đăng nhập:</strong> <span style="font-family:monospace;background:#e0f2fe;padding:2px 6px;border-radius:4px">${name}</span></p>
        <p style="color:#374151;font-size:13px;margin:4px 0"><strong>Mật khẩu:</strong> <span style="font-family:monospace;background:#fef9c3;padding:2px 6px;border-radius:4px;font-size:15px;letter-spacing:1px">${tempPassword}</span></p>
        <p style="color:#6b7280;font-size:12px;margin:8px 0 0">⚠️ Vào <strong>Cài đặt → Bảo mật</strong> để đổi mật khẩu sau khi đăng nhập lần đầu.</p>
      </div>` : ''}

      <!-- Plan info box -->
      <div style="background:linear-gradient(135deg,#faf5ff,#fdf2f8);border:2px solid #e9d5ff;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <span style="font-size:36px;display:block;margin-bottom:10px">⭐</span>
        <p style="color:#7c3aed;font-weight:900;font-size:16px;margin:0 0 6px">Pro ${planLabel}</p>
        <p style="color:#9ca3af;font-size:13px;margin:0">Hạn sử dụng: <strong style="color:#374151">${planEndDate}</strong></p>
      </div>

      ${button('🚀 Vào VocabWise ngay', `${BASE_URL}/kids`)}

      <!-- Steps -->
      <p style="color:#374151;font-weight:900;font-size:14px;margin:24px 0 16px">Hướng dẫn nhanh — bắt đầu trong 2 phút:</p>

      ${steps.map((step, i) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
        <tr>
          <td width="36" valign="top" style="padding-right:14px">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,#9333ea,#ec4899);border-radius:50%;text-align:center;line-height:32px">
              <span style="color:#fff;font-weight:900;font-size:14px;line-height:32px">${i + 1}</span>
            </div>
          </td>
          <td valign="top">
            <p style="color:#374151;font-weight:900;font-size:14px;margin:2px 0 5px">${step.emoji} ${step.title}</p>
            <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.65">${step.body}</p>
          </td>
        </tr>
      </table>`).join('')}

      <!-- PWA tip -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-top:8px">
        <p style="color:#15803d;font-size:13px;font-weight:700;margin:0">💡 Mẹo: Cài lên màn hình chính để dùng như app thật!</p>
        <p style="color:#4b5563;font-size:12px;margin:6px 0 0;line-height:1.5">Safari/Chrome → "Thêm vào màn hình chính" → mở không cần browser, tự động cập nhật.</p>
      </div>
    </div>

    <div style="padding:16px 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}
