import { esc } from './escHtml'

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
  name = esc(name)
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

      ${button('🚀 Khám phá VocabWise', `${BASE_URL}/dashboard`)}

      <!-- Free summary -->
      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin:0 0 24px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px">Tài khoản FREE của bạn</p>
        ${[
          '🔤 Phonics IPA — 1 bài học miễn phí',
          '📖 VocabWise Daily — 1 chủ đề mỗi level (6 chủ đề)',
          '🎓 VocabWise Academic — 1 topic mỗi book (3 topics)',
          '🎤 Phát âm AI — 5 lần/ngày',
          '🇻🇳🇬🇧 Song ngữ Việt–Anh · Flashcard & trò chơi cơ bản',
        ].map(item =>
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
              ['Daily · 6 levels', '6 / 180 chủ đề', '180 chủ đề · 2.300+ từ'],
              ['Academic · 3 books', '3 / 180 topics', '180 topics · IELTS/SAT'],
              ['Phonics IPA', '1 bài', 'Toàn bộ'],
              ['Phát âm AI', '5 lần/ngày', '30–∞ lần/ngày'],
              ['My Words · SRS', '❌', '✅'],
              ['Hồ sơ bé (Daily)', '1 bé', 'Tối đa 3 bé'],
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
  name = esc(name)
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
  name = esc(name)
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
        ${[
          '❌ Daily: chỉ còn 1 chủ đề / level (thay vì 30)',
          '❌ Academic: chỉ còn 1 topic / book (thay vì 60)',
          '❌ Phonics: chỉ 1 bài học',
          '❌ Phát âm AI: chỉ 5 lần/ngày',
        ].map(item =>
          `<p style="color:#7c2d12;font-size:13px;margin:4px 0;font-weight:600">${item}</p>`
        ).join('')}
      </div>

      <!-- Pro benefits -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#15803d;font-weight:900;font-size:13px;margin:0 0 10px">⭐ Nâng cấp Pro — mở khóa toàn bộ:</p>
        ${[
          '✅ Daily: 180 chủ đề · 2.300+ từ · 10 mini-games',
          '✅ Academic: 180 topics theo chuẩn IELTS/SAT',
          '✅ Phonics IPA: toàn bộ bài học phát âm',
          '✅ Phát âm AI: 30–∞ lần/ngày + My Words & SRS',
          '✅ Báo cáo tiến độ hàng tuần qua email',
        ].map(item =>
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
  name = esc(name)
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
  name = esc(name)
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
  parentName = esc(parentName)
  inactiveKids = inactiveKids.map(k => ({ ...k, name: esc(k.name) }))
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
  name = esc(name)
  const steps = [
    {
      emoji: '🔑',
      title: 'Đổi mật khẩu (nếu cần)',
      body: 'Vào <strong>Hồ sơ</strong> → cuộn xuống phần <strong>Bảo mật</strong> → nhập mật khẩu mới.<br>Hoặc dùng link <strong>Quên mật khẩu</strong> ở trang đăng nhập.',
    },
    {
      emoji: '🔤',
      title: 'Luyện Phonics IPA',
      body: 'Vào tab <strong>Phonics</strong> → học phát âm chuẩn IPA quốc tế theo từng âm vị. Mọi lứa tuổi đều dùng được.',
    },
    {
      emoji: '📖',
      title: 'VocabWise Daily — Từ vựng hàng ngày',
      body: `Vào tab <strong>Daily</strong> → chọn bé → chọn chủ đề yêu thích.<br>
        30 chủ đề × 6 levels = 180 chủ đề, 2.300+ từ · Flashcard + 10 mini-games.<br>
        <span style="color:#6b7280;font-size:12px">
          Mầm non / Lớp 1–2 → Seeker (Pre-A1) &nbsp;·&nbsp; Lớp 3–4 → Starter (A1) &nbsp;·&nbsp; Lớp 5–6 → Ranger (A2)<br>
          THCS → Explorer (B1) &nbsp;·&nbsp; THPT → Scholar / Master (B2–C1)
        </span>`,
    },
    {
      emoji: '🎓',
      title: 'VocabWise Academic — Từ vựng học thuật',
      body: 'Vào tab <strong>Academic</strong> → chọn Book (A1–C2) → đọc passage → học glossary → làm 5 bài tập.<br>180 topics theo chuẩn IELTS/SAT. Đạt 80% → topic "mastered".',
    },
    {
      emoji: '🎤',
      title: 'Phát âm cùng AI',
      body: 'Trong các game Daily và bài tập Phonics, nhấn nút mic → đọc to → AI chấm điểm ngay lập tức.',
    },
    {
      emoji: '📊',
      title: 'Theo dõi tiến độ',
      body: 'Vào <strong>Dashboard</strong> → xem XP, streak, badge và tiến độ từng module của gia đình.',
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

      ${button('🚀 Vào VocabWise ngay', `${BASE_URL}/dashboard`)}

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
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;margin-top:8px">
        <p style="color:#1d4ed8;font-size:13px;font-weight:900;margin:0 0 10px">📲 Cách cài app lên màn hình chính:</p>
        <p style="color:#374151;font-size:12px;font-weight:700;margin:0 0 4px">🍎 iPhone / iPad (Safari)</p>
        <p style="color:#4b5563;font-size:12px;margin:0 0 2px">① Bấm nút <strong>Chia sẻ ⬆️</strong> ở thanh dưới Safari</p>
        <p style="color:#4b5563;font-size:12px;margin:0 0 2px">② Chọn <strong>"Thêm vào Màn hình chính"</strong></p>
        <p style="color:#4b5563;font-size:12px;margin:0 0 10px">③ Bấm <strong>Thêm</strong> → mở app từ icon vừa tạo</p>
        <p style="color:#374151;font-size:12px;font-weight:700;margin:0 0 4px">🤖 Android (Chrome)</p>
        <p style="color:#4b5563;font-size:12px;margin:0 0 2px">① Bấm menu <strong>⋮</strong> góc trên phải Chrome</p>
        <p style="color:#4b5563;font-size:12px;margin:0 0 2px">② Chọn <strong>"Thêm vào Màn hình chính"</strong> hoặc <strong>"Cài đặt ứng dụng"</strong></p>
        <p style="color:#4b5563;font-size:12px;margin:0 0 8px">③ Bấm <strong>Thêm</strong> → mở app từ icon vừa tạo</p>
        <p style="color:#60a5fa;font-size:11px;font-weight:600;text-align:center;margin:0">Mở như app thật · tự cập nhật · không cần App Store</p>
      </div>
    </div>

    <div style="padding:16px 28px 28px">
      ${footer()}
    </div>
  </div>
</body>
</html>`
}

// ─── Onboarding Drip ─────────────────────────────────────────────────────────

/** D+1: đăng ký 24h chưa học phiên nào */
export function onboardingD1EmailHtml(name: string): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Bắt đầu chỉ mất 5 phút ⏱')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hôm qua bạn đã tạo tài khoản VocabWise — tuyệt vời! Hành trình thực sự bắt đầu từ phiên học đầu tiên.</p>

      <p style="color:#374151;font-weight:900;font-size:14px;margin:0 0 14px">Chưa biết bắt đầu từ đâu? Thử 1 trong 3 cách này:</p>

      ${[
        { emoji: '🔤', title: 'Phonics IPA', desc: 'Học 1 âm vị hôm nay. Chỉ 5 phút, phù hợp mọi lứa tuổi.' },
        { emoji: '📖', title: 'VocabWise Daily', desc: 'Chọn 1 chủ đề phù hợp lứa tuổi, học qua flashcard và game.' },
        { emoji: '🎓', title: 'VocabWise Academic', desc: 'Đọc passage đầu tiên, học 15 từ theo chuẩn IELTS/SAT.' },
      ].map(m => `
      <div style="display:flex;gap:12px;margin-bottom:14px;padding:12px 14px;background:#faf5ff;border-radius:12px">
        <span style="font-size:24px;flex-shrink:0">${m.emoji}</span>
        <div>
          <p style="color:#7c3aed;font-weight:900;font-size:13px;margin:0 0 2px">${m.title}</p>
          <p style="color:#6b7280;font-size:12px;margin:0;line-height:1.5">${m.desc}</p>
        </div>
      </div>`).join('')}

      <p style="color:#6b7280;font-size:13px;font-style:italic;text-align:center;margin:8px 0 20px">Không cần học nhiều. Chỉ cần bắt đầu.</p>
      ${button('🚀 Vào học ngay', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** D+3: đã học ít nhất 1 phiên, ngày thứ 3 */
export function onboardingD3EmailHtml(
  name: string,
  streak: number,
  words: number,
  topics: number
): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header(`🔥 ${streak} ngày học liên tiếp — bạn đang đi đúng hướng!`)}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px"><strong>${streak} ngày học liên tiếp</strong> — thật ấn tượng!</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px">Trong ${streak} ngày qua bạn đã:</p>
        ${[
          `✅ <strong>${words} từ mới</strong> đã được học`,
          `✅ <strong>${topics} chủ đề / topics</strong> đã hoàn thành`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#166534;font-size:13px;margin:0;line-height:1.6">💡 Nghiên cứu cho thấy: duy trì <strong>5 ngày đầu liên tiếp</strong> → tỉ lệ tiếp tục học sau 1 tháng tăng <strong>3 lần</strong>. Bạn đang rất gần đó.</p>
      </div>

      ${button('🔥 Tiếp tục học hôm nay →', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** D+7: tổng kết tuần đầu */
export function onboardingD7EmailHtml(
  name: string,
  streak: number,
  words: number,
  topics: number,
  hasActivity: boolean
): string {
  name = esc(name)
  const activityBlock = hasActivity
    ? `
      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px">Tuần đầu của bạn:</p>
        ${[
          `📚 <strong>${words} từ</strong> đã học`,
          `🔥 <strong>${streak} ngày</strong> học liên tiếp`,
          `🎯 <strong>${topics} chủ đề / topics</strong> đã hoàn thành`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>`
    : `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#9a3412;font-size:13px;margin:0;line-height:1.6">Chưa bắt đầu vẫn chưa muộn — tuần thứ 2 là cơ hội hoàn hảo để khởi động.</p>
      </div>`

  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('1 tuần với VocabWise — nhìn lại hành trình của bạn 📖')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">7 ngày đã trôi qua kể từ khi bạn gia nhập VocabWise.</p>
      ${activityBlock}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#166534;font-size:13px;margin:0;line-height:1.6">💡 <strong>Mẹo của tuần:</strong> Học đều 10 từ mỗi ngày → sau 1 năm bạn biết thêm 3.650 từ. Không cần học nhiều, chỉ cần học đều.</p>
      </div>
      ${button('📊 Xem tiến độ của bạn →', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

// ─── Trial Conversion ─────────────────────────────────────────────────────────

/** Trial D+4: còn 3 ngày dùng thử */
export function trialD4EmailHtml(name: string): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('⏰ Còn 3 ngày dùng thử — bạn đã thử hết chưa?')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Tài khoản dùng thử của bạn còn <strong>3 ngày</strong>.</p>

      <p style="color:#374151;font-weight:900;font-size:14px;margin:0 0 12px">Bạn đã thử những tính năng Pro này chưa?</p>
      ${[
        { e: '🎤', t: 'Phát âm AI', d: 'Đọc to một từ và nhận điểm phát âm ngay lập tức' },
        { e: '⭐', t: 'My Words', d: 'Lưu từ yếu, ôn lại đúng lúc theo lịch SRS' },
        { e: '🎓', t: 'Academic toàn bộ', d: 'Đọc passage thật, làm 5 dạng bài tập, đạt 80% → mastered' },
      ].map(m => `
      <div style="display:flex;gap:12px;margin-bottom:12px;padding:12px 14px;background:#faf5ff;border-radius:12px">
        <span style="font-size:22px;flex-shrink:0">${m.e}</span>
        <div>
          <p style="color:#7c3aed;font-weight:900;font-size:13px;margin:0 0 2px">${m.t}</p>
          <p style="color:#6b7280;font-size:12px;margin:0">${m.d}</p>
        </div>
      </div>`).join('')}

      <p style="color:#6b7280;font-size:13px;text-align:center;margin:8px 0 0">Sau 7 ngày, bạn vẫn có thể dùng Free — nhưng với 1/30 nội dung.</p>
      ${button('⭐ Nâng cấp Pro →', `${BASE_URL}/dashboard`)}
      ${planCards()}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Trial D+6: còn 1 ngày dùng thử */
export function trialD6EmailHtml(name: string, wordsLearned: number): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Ngày cuối dùng thử 🚨 — đừng để mất đà học')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hôm nay là <strong>ngày cuối cùng</strong> dùng thử.</p>

      ${wordsLearned > 0 ? `
      <div style="background:#faf5ff;border-radius:12px;padding:14px 16px;margin-bottom:16px;text-align:center">
        <p style="color:#7c3aed;font-size:24px;font-weight:900;margin:0">${wordsLearned} từ</p>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0">đã học trong 6 ngày qua — đừng để dừng lại ở đây.</p>
      </div>` : ''}

      <p style="color:#374151;font-weight:900;font-size:13px;margin:0 0 8px">Từ ngày mai nếu không nâng cấp:</p>
      ${['❌ Daily: chỉ còn 6 chủ đề (thay vì 180)', '❌ Academic: chỉ còn 3 topics (thay vì 180)', '❌ Phát âm AI: giới hạn 5 lần/ngày'].map(t =>
        `<p style="color:#7c2d12;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`
      ).join('')}

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px 16px;margin:16px 0">
        <p style="color:#166534;font-size:13px;margin:0">✅ <strong>Tin tốt là:</strong> Chuỗi ngày học liên tiếp (streak) và toàn bộ tiến độ của bạn <strong>không bị xóa</strong> dù bạn chưa nâng cấp ngay.</p>
      </div>

      ${button('⭐ Nâng cấp Pro ngay →', `${BASE_URL}/dashboard`)}
      ${planCards()}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Trial D+7: hết trial, chuyển về Free */
export function trialD7EmailHtml(name: string): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Tài khoản Free từ hôm nay — đây là những gì bạn vẫn có')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">7 ngày dùng thử đã kết thúc. Tài khoản của bạn chuyển về <strong>Free</strong> — và đây là tin tốt: toàn bộ dữ liệu học của bạn <strong>hoàn toàn an toàn</strong>.</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px">Với Free, bạn vẫn có thể:</p>
        ${['✅ Phonics IPA — 1 bài học', '✅ Daily — 6 chủ đề (1 mỗi level)', '✅ Academic — 3 topics (1 mỗi book)', '✅ Phát âm AI — 5 lần/ngày'].map(t =>
          `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`
        ).join('')}
      </div>

      <p style="color:#374151;font-size:14px;margin:0 0 16px;text-align:center">Muốn tiếp tục với toàn bộ nội dung? Nâng cấp bất cứ lúc nào — bé tiếp tục học đúng chỗ đã dừng.</p>
      ${button('Xem gói Pro →', `${BASE_URL}/dashboard`)}
      ${planCards()}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Trial D+8: chưa mua sau 1 ngày hết trial — FAQ objection handling */
export function trialD8EmailHtml(name: string): string {
  name = esc(name)
  const faqs = [
    { q: '"Học online có hiệu quả không?"', a: 'Học qua game và lặp lại có hệ thống (SRS) giúp nhớ từ lâu hơn 40% so với học truyền thống theo nghiên cứu của Cambridge.' },
    { q: '"Nếu bé không thích chủ đề thì sao?"', a: 'Bé có thể đổi chủ đề, đổi level bất cứ lúc nào. Không ràng buộc.' },
    { q: '"Sự khác biệt thật sự giữa Free và Pro là gì?"', a: '30× nhiều nội dung hơn, AI chấm phát âm không giới hạn, My Words + SRS ôn tập, báo cáo tiến độ hàng tuần.' },
    { q: '"Thanh toán thế nào? Có cần thẻ không?"', a: 'Chuyển khoản ngân hàng, gửi bill qua Zalo, admin kích hoạt trong 12 giờ. Không cần thẻ.' },
  ]

  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Còn phân vân? Đây là câu trả lời 🤔')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Chúng tôi hiểu quyết định nâng cấp không phải lúc nào cũng dễ. Đây là những gì phụ huynh thường hỏi:</p>

      ${faqs.map(f => `
      <div style="margin-bottom:16px;padding:14px 16px;border:1px solid #e9d5ff;border-radius:12px">
        <p style="color:#7c3aed;font-weight:900;font-size:13px;margin:0 0 6px">${f.q}</p>
        <p style="color:#374151;font-size:13px;margin:0;line-height:1.6">→ ${f.a}</p>
      </div>`).join('')}

      <p style="color:#6b7280;font-size:13px;text-align:center;margin:8px 0 0">Câu hỏi khác? Nhắn ngay: <strong style="color:#9333ea">Zalo ${BANK.zalo}</strong></p>
      ${button('⭐ Nâng cấp Pro →', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

// ─── Milestone ────────────────────────────────────────────────────────────────

/** Streak 7 ngày */
export function streak7EmailHtml(
  name: string,
  words: number,
  topics: number,
  games: number
): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('🔥 7 ngày liên tiếp — bạn thuộc top 10% người học!')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:22px;font-weight:900;margin:0 0 4px">7 ngày · mỗi ngày · không bỏ buổi nào. 🎉</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px">Đây không phải chuyện nhỏ — chỉ khoảng 10% người dùng đạt chuỗi 7 ngày học liên tiếp (streak).</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px">Tuần qua bạn/bé đã:</p>
        ${[
          `📚 <strong>${words} từ</strong> mới được học`,
          `🎯 <strong>${topics} chủ đề / topics</strong> hoàn thành`,
          `🎮 <strong>${games} lượt game</strong> đã chơi`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#166534;font-size:13px;margin:0;line-height:1.6">💡 Theo nghiên cứu: duy trì học liên tục 7 ngày đầu → tỉ lệ giữ thói quen sau 3 tháng tăng <strong>4×</strong> so với người học không đều.</p>
      </div>

      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);border-radius:12px;padding:12px 20px">
          <p style="color:#fff;font-weight:900;font-size:14px;margin:0">🏆 Huy hiệu "Week Warrior" đã mở khóa trong app!</p>
        </div>
      </div>
      ${button('🔥 Tiếp tục chuỗi ngày học →', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Streak 30 ngày */
export function streak30EmailHtml(
  name: string,
  words: number,
  topics: number,
  activeDays: number
): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('🏆 30 ngày không nghỉ — bạn chính thức là người học kỷ luật nhất!')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:22px;font-weight:900;margin:0 0 4px">30 ngày. Không một ngày nghỉ.</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px">Một tháng học tập đáng nhớ.</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        ${[
          `📚 Tổng từ vựng đã học: <strong>${words} từ</strong>`,
          `🔥 Chuỗi ngày học liên tiếp (streak) hiện tại: <strong>30 ngày</strong>`,
          `🎯 Chủ đề đã hoàn thành: <strong>${topics}</strong>`,
          `📅 Tổng số ngày học: <strong>${activeDays} ngày</strong>`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#166534;font-size:13px;margin:0;line-height:1.6">Ở tốc độ này, sau 6 tháng bé sẽ biết thêm <strong>${words * 6} từ</strong> — đủ để đọc hiểu phần lớn văn bản tiếng Anh thường ngày và bắt đầu tự đọc sách.</p>
      </div>

      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px;padding:12px 20px">
          <p style="color:#fff;font-weight:900;font-size:14px;margin:0">🏆 Huy hiệu "Month Master" đã mở khóa trong app!</p>
        </div>
      </div>
      ${button('📊 Xem hành trình của bạn →', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Academic: hoàn thành topic đầu tiên */
export function topicMasteredEmailHtml(
  name: string,
  topicTitle: string,
  correctAnswers: number,
  totalAnswers: number,
  pct: number,
  nextTopicTitle?: string
): string {
  name = esc(name)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('✅ Topic MASTERED — bạn đang học đúng cách!')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Topic <strong>"${topicTitle}"</strong> vừa được đánh dấu ✅ <strong style="color:#16a34a">MASTERED</strong>!</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        ${[
          '📄 Bài đọc passage',
          '📝 Glossary đầy đủ',
          `🎯 <strong>${correctAnswers}/${totalAnswers} câu</strong> đúng (<strong>${pct}%</strong>)`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>

      ${nextTopicTitle ? `
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <p style="color:#7c3aed;font-weight:900;font-size:13px;margin:0 0 4px">📖 Topic tiếp theo được gợi ý:</p>
        <p style="color:#374151;font-size:13px;margin:0;font-weight:700">"${nextTopicTitle}"</p>
      </div>` : ''}

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:20px">
        <p style="color:#9a3412;font-size:12px;margin:0;line-height:1.5">💡 <strong>Mẹo SRS:</strong> Ôn lại topic này sau <strong>7 ngày</strong> — đây là khoảng thời gian tối ưu để chuyển từ bộ nhớ ngắn hạn sang dài hạn.</p>
      </div>
      ${button('📚 Tiếp tục topic tiếp theo →', `${BASE_URL}/vocabwise`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Daily: hoàn thành toàn bộ 30 topic của 1 level */
export function levelUpEmailHtml(
  parentName: string,
  childName: string,
  completedLevel: string,
  nextLevel: string,
  nextLevelDesc: string,
  words: number,
  games: number,
  bestStreak: number,
  excellentTopics: number
): string {
  parentName = esc(parentName)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header(`🎓 Bé ${childName} vừa lên level — chúc mừng!`)}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${parentName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Bé <strong>${childName}</strong> vừa hoàn thành toàn bộ 30 chủ đề của level <strong>${completedLevel}</strong>! 🎉</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 10px">Thành tích của bé:</p>
        ${[
          `📚 <strong>${words} từ vựng</strong> đã học`,
          `🎮 <strong>${games} lượt game</strong> đã chinh phục`,
          `🔥 Chuỗi ngày học liên tiếp (streak) cao nhất đạt được: <strong>${bestStreak} ngày</strong>`,
          `⭐ <strong>${excellentTopics} chủ đề</strong> hoàn thành xuất sắc (≥80%)`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>

      <div style="background:linear-gradient(135deg,#faf5ff,#fdf2f8);border:2px solid #e9d5ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#7c3aed;font-weight:900;font-size:14px;margin:0 0 4px">Level tiếp theo: ${nextLevel}</p>
        <p style="color:#6b7280;font-size:13px;margin:0">${nextLevelDesc}</p>
      </div>

      ${button(`🚀 Bắt đầu ${nextLevel} →`, `${BASE_URL}/kids`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

// ─── Re-engagement ────────────────────────────────────────────────────────────

/** Inactive 3 ngày */
export function inactive3dEmailHtml(
  parentName: string,
  childName: string,
  streakDays: number
): string {
  parentName = esc(parentName)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header(`Bé ${childName} đang đợi bạn 🐣`)}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${parentName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Đã <strong>3 ngày</strong> kể từ lần cuối bé <strong>${childName}</strong> học.</p>

      ${streakDays > 0 ? `
      <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#9a3412;font-weight:900;font-size:14px;margin:0">⚠️ Chuỗi <strong>${streakDays} ngày học liên tiếp</strong> (streak) của bé sắp bị gián đoạn!</p>
      </div>` : ''}

      <p style="color:#374151;font-size:14px;text-align:center;margin:0 0 20px">Chỉ cần <strong>5 phút hôm nay</strong> để giữ thói quen học.</p>
      ${button('📚 Vào học ngay →', `${BASE_URL}/kids`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Inactive 7 ngày */
export function inactive7dEmailHtml(
  parentName: string,
  childName: string,
  streakDays: number,
  srsWords: number
): string {
  parentName = esc(parentName)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Chuỗi ngày học liên tiếp (streak) của bé đã bị gián đoạn — nhưng không sao cả 💪')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${parentName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Chuỗi <strong>${streakDays} ngày học liên tiếp</strong> (streak) của bé <strong>${childName}</strong> đã bị gián đoạn.</p>

      ${srsWords > 0 ? `
      <div style="background:#faf5ff;border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <p style="color:#7c3aed;font-size:13px;margin:0;font-weight:600">📚 Bé <strong>${childName}</strong> có <strong>${srsWords} từ</strong> cần ôn lại theo lịch SRS — đang đợi bé.</p>
      </div>` : ''}

      <p style="color:#374151;font-size:14px;text-align:center;margin:0 0 20px">Chuỗi ngày học mới, bắt đầu từ hôm nay?</p>
      ${button('🔄 Quay lại học →', `${BASE_URL}/kids`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Inactive 14 ngày — chỉ Pro users */
export function inactive14dEmailHtml(parentName: string, planEndDate: string): string {
  parentName = esc(parentName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Chúng tôi nhớ bạn 🙏 — mọi thứ có ổn không?')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${parentName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Đã <strong>2 tuần</strong> kể từ lần cuối bạn ghé VocabWise. Tài khoản Pro của bạn vẫn đang chạy — hạn đến <strong>${planEndDate}</strong>.</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 8px">Chúng tôi không muốn chỉ gửi email nhắc học. Chúng tôi muốn hỏi thật sự: <strong>Có vấn đề gì không?</strong></p>
        <p style="color:#374151;font-size:13px;margin:0;line-height:1.6">Nếu app khó dùng, bé không hứng thú, hay đơn giản là quá bận — hãy nhắn cho chúng tôi qua <strong style="color:#9333ea">Zalo ${BANK.zalo}</strong>. Chúng tôi sẽ hỗ trợ.</p>
      </div>

      <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 20px">Nếu chỉ là bận: không sao cả. Dữ liệu của bé vẫn nguyên vẹn, bắt đầu lại bất cứ lúc nào.</p>
      ${button('↩️ Quay lại học →', `${BASE_URL}/dashboard`)}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Win-back 30 ngày */
export function winback30dEmailHtml(name: string, childName?: string): string {
  name = esc(name)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('VocabWise có gì mới — bạn có muốn xem không? 👀')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Một tháng rồi — chúng tôi hy vọng bạn và ${childName ? `bé <strong>${childName}</strong>` : 'gia đình'} vẫn ổn.</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 4px">Dữ liệu học${childName ? ` của bé ${childName}` : ''} vẫn được lưu đầy đủ</p>
        <p style="color:#374151;font-size:13px;margin:0">Bắt đầu lại từ đúng chỗ đã dừng — không mất gì.</p>
      </div>

      ${button('↩️ Quay lại VocabWise →', `${BASE_URL}/dashboard`)}
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0">Câu hỏi gì? Zalo: <strong style="color:#9333ea">${BANK.zalo}</strong></p>
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

// ─── Pro Lifecycle ─────────────────────────────────────────────────────────────

/** Pro Expiry -14 ngày: nhắc gia hạn sớm */
export function proExpiry14dEmailHtml(
  name: string,
  planLabel: string,
  endDate: string,
  childName: string,
  words: number,
  streak: number,
  topics: number
): string {
  name = esc(name)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('⏰ Pro của bạn còn 2 tuần — gia hạn sớm để không bị gián đoạn')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Tài khoản <strong>Pro ${planLabel}</strong> của bạn sẽ hết hạn vào <strong>${endDate}</strong> — còn 14 ngày.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="color:#15803d;font-weight:900;font-size:13px;margin:0 0 8px">Gia hạn sớm giúp bạn:</p>
        ${[
          'Chuỗi ngày học liên tiếp (streak) của bé không bị gián đoạn dù chỉ 1 ngày',
          'Nội dung học liên tục, không bị "tụt về Free"',
          'Không cần nhớ deadline vào phút chót',
        ].map(t => `<p style="color:#166534;font-size:13px;margin:4px 0;font-weight:600">✅ ${t}</p>`).join('')}
      </div>

      <div style="background:#f8f4ff;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#6b21a8;font-weight:900;font-size:13px;margin:0 0 8px">Kỳ này bé <strong>${childName}</strong> đã học được:</p>
        ${[
          `📚 ${words} từ vựng`,
          `🔥 Chuỗi ngày học liên tiếp (streak) ${streak} ngày`,
          `🎯 ${topics} chủ đề hoàn thành`,
        ].map(t => `<p style="color:#374151;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`).join('')}
      </div>

      ${button('🔄 Gia hạn ngay →', `${BASE_URL}/dashboard`)}
      ${planCards()}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Pro Expiry D+1: hết hạn hôm qua */
export function proExpiryD1EmailHtml(
  name: string,
  planLabel: string,
  childName: string
): string {
  name = esc(name)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Tài khoản Pro vừa hết hạn — gia hạn trong 7 ngày để giữ toàn bộ')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Tài khoản <strong>Pro ${planLabel}</strong> của bạn đã hết hạn hôm qua.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <p style="color:#166534;font-size:13px;font-weight:700;margin:0">✅ Toàn bộ tiến độ, chuỗi ngày học (streak) và huy hiệu của bé <strong>${childName}</strong> không bị xóa. Dữ liệu được giữ nguyên.</p>
      </div>

      <p style="color:#374151;font-weight:900;font-size:13px;margin:0 0 8px">Hiện tại tài khoản đang ở chế độ Free:</p>
      ${['❌ Daily: chỉ 6 chủ đề', '❌ Academic: chỉ 3 topics', '❌ Phát âm AI: 5 lần/ngày'].map(t =>
        `<p style="color:#7c2d12;font-size:13px;margin:4px 0;font-weight:600">${t}</p>`
      ).join('')}

      <p style="color:#6b7280;font-size:13px;text-align:center;margin:16px 0">Gia hạn bất cứ lúc nào — bé tiếp tục học đúng từ chỗ đã dừng.</p>
      ${button('🔄 Gia hạn ngay →', `${BASE_URL}/dashboard`)}
      ${planCards()}
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}

/** Pro Expiry D+7: final nudge */
export function proExpiryD7EmailHtml(name: string, childName?: string): string {
  name = esc(name)
  childName = esc(childName)
  return `
<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    ${header('Nhắc lần cuối — bé vẫn ở đây khi bạn sẵn sàng 🐣')}
    <div style="padding:28px 28px 8px">
      <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Đây là lần cuối chúng tôi nhắc về gia hạn — chúng tôi hiểu bạn bận và tôn trọng quyết định của bạn.</p>

      <div style="background:#f8f4ff;border-radius:12px;padding:14px 16px;margin-bottom:20px">
        <p style="color:#374151;font-size:13px;margin:0;line-height:1.6">Tài khoản và toàn bộ dữ liệu của ${childName ? `bé <strong>${childName}</strong>` : 'gia đình'} vẫn ở đây. Khi nào bạn sẵn sàng, gia hạn bất cứ lúc nào là bé tiếp tục ngay.</p>
      </div>

      ${button('🔄 Gia hạn Pro →', `${BASE_URL}/dashboard`)}
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0">Câu hỏi hoặc cần hỗ trợ? Nhắn Zalo: <strong style="color:#9333ea">${BANK.zalo}</strong></p>
    </div>
    <div style="padding:0 28px 28px">${footer()}</div>
  </div>
</body></html>`
}
