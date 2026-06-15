import { buildSyncSummary, computeEarnedBadges, getXpLevel } from '@/lib/badges'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.vercel.app'

function avatarImg(emoji: string, name: string, size = 40): string {
  return `<img src="${APP_URL}/avatars/${emoji}.png" width="${size}" height="${size}" alt="${name}" style="border-radius:50%;display:block;">`
}

const LEVEL_TOTAL: Record<string, number> = {
  seeker: 399, starter: 356, ranger: 400, explorer: 368, scholar: 387, master: 303,
}

// ── Monthly recap types & helpers ─────────────────────────────────────────────

export type MonthStats = { words: number; games: number; xp: number; activeDays: number }

export type AllLevelSync = {
  level?: string
  history?: Record<string, { words: number; games: number; xp: number }>
  streak?: { current?: number; best?: number; lastActive?: string }
  mastery?: Record<string, { flashcard: boolean; games: string[] }>
  battle?: { totalAllTime?: number }
  seen?: string[]
  weak_words?: Record<string, unknown>
}

export function calcMonthStats(syncs: AllLevelSync[], yearMonth: string): MonthStats {
  let words = 0, games = 0, xp = 0
  const days = new Set<string>()
  for (const s of syncs) {
    for (const [date, e] of Object.entries(s.history ?? {})) {
      if (!date.startsWith(yearMonth)) continue
      words += e.words ?? 0
      games += e.games ?? 0
      xp    += e.xp    ?? 0
      if ((e.words ?? 0) + (e.games ?? 0) + (e.xp ?? 0) > 0) days.add(date)
    }
  }
  return { words, games, xp, activeDays: days.size }
}

function delta(cur: number, prev: number): string {
  if (prev === 0 && cur === 0) return ''
  const d = cur - prev
  if (d > 0) return `<span style="color:#22c55e;font-size:11px;font-weight:700;">↑ +${d}</span>`
  if (d < 0) return `<span style="color:#f97316;font-size:11px;font-weight:700;">↓ ${d}</span>`
  return `<span style="color:#9ca3af;font-size:11px;font-weight:700;">= ${cur}</span>`
}

function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function buildMonthlyRecapHtml(
  username: string,
  rows: Array<{ child: ChildRow; thisMonth: MonthStats; prevMonth: MonthStats; primarySync: SyncRow }>,
  monthLabel: string,
  prevMonthLabel: string,
  yearMonth: string,
): string {
  const totalDays = daysInMonth(yearMonth)

  const childBlocks = rows.map(({ child, thisMonth, prevMonth, primarySync }) => {
    const summary  = buildSyncSummary(primarySync)
    const xpInfo   = getXpLevel(summary.xp)
    const earned   = computeEarnedBadges(summary)
    const streak   = primarySync?.streak?.current ?? 0
    const topics   = summary.masteredTopics
    const weak     = Object.keys(primarySync?.weak_words ?? {}).length

    function kpi(label: string, icon: string, cur: number, prev: number, suffix = '') {
      return `
        <td style="width:25%;padding:6px 4px;text-align:center;vertical-align:top;">
          <div style="background:#f9fafb;border-radius:12px;padding:10px 4px;">
            <p style="margin:0 0 2px;font-size:18px;">${icon}</p>
            <p style="margin:0;font-size:20px;font-weight:900;color:#1f2937;">${cur}${suffix}</p>
            <p style="margin:2px 0 0;font-size:10px;color:#9ca3af;font-weight:600;">${label}</p>
            <p style="margin:4px 0 0;">${delta(cur, prev)}</p>
          </div>
        </td>`
    }

    const badgeRow = earned.length > 0
      ? `<p style="margin:8px 0 0;font-size:18px;letter-spacing:2px;">${earned.map(b => b.emoji).join(' ')}</p>`
      : ''

    return `
      <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;"><tr>
          <td style="width:48px;vertical-align:middle;">${avatarImg(child.emoji, child.name, 40)}</td>
          <td style="vertical-align:middle;padding-left:10px;">
            <p style="margin:0;font-weight:900;font-size:17px;color:#1f2937;">${child.name}</p>
            <p style="margin:0;font-size:11px;color:#7c3aed;font-weight:700;">${xpInfo.emoji} ${xpInfo.name} · ${summary.xp} XP tổng</p>
          </td>
        </tr></table>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
          <tr>
            ${kpi('Ngày học', '📅', thisMonth.activeDays, prevMonth.activeDays, `/${totalDays}`)}
            ${kpi('Từ mới', '📚', thisMonth.words, prevMonth.words)}
            ${kpi('Game', '🎮', thisMonth.games, prevMonth.games)}
            ${kpi('XP', '⭐', thisMonth.xp, prevMonth.xp)}
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #f3f4f6;padding-top:10px;margin-top:2px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;font-weight:600;">🔥 Streak hiện tại</td>
            <td style="padding:8px 0;font-size:13px;color:#1f2937;font-weight:700;text-align:right;">${streak} ngày</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#6b7280;font-weight:600;">🏆 Topics hoàn thành</td>
            <td style="padding:4px 0;font-size:13px;color:#1f2937;font-weight:700;text-align:right;">${topics} topics</td>
          </tr>
          ${weak > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;font-weight:600;">⚠️ Từ cần ôn</td><td style="padding:4px 0;font-size:13px;color:#f97316;font-weight:700;text-align:right;">${weak} từ</td></tr>` : ''}
        </table>
        ${badgeRow}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed,#ec4899);border-radius:20px;padding:24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:28px;">📅</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;">Tổng kết ${monthLabel}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">VocabWise · Xin chào, <strong>${username}</strong>!</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:11px;">So sánh với ${prevMonthLabel}</p>
    </div>
    ${childBlocks}
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabkids.vn'}/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#ec4899);color:#fff;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;">
        Xem Dashboard →
      </a>
    </div>
    <p style="text-align:center;margin-top:20px;font-size:11px;color:#9ca3af;">VocabWise · Báo cáo tháng dành riêng cho gói 6 tháng.</p>
  </div>
</body>
</html>`
}

export type ChildRow = { id: string; name: string; emoji: string; level: string }
type WeakVal = number | { wrong: number; correctStreak: number; lastWrong: string }
function weakCount(v: WeakVal): number { return typeof v === 'number' ? v : v.wrong }

export type SyncRow = {
  seen?: string[]
  weak_words?: Record<string, WeakVal>
  streak?: { current?: number; best?: number; lastActive?: string }
  battle?: { totalAllTime?: number }
  mastery?: Record<string, { flashcard: boolean; games: string[] }>
} | null

export function buildReportHtml(username: string, rows: { child: ChildRow; sync: SyncRow }[]): string {
  const childBlocks = rows.map(({ child, sync }) => {
    const summary = buildSyncSummary(sync)
    const xpInfo = getXpLevel(summary.xp)
    const earned = computeEarnedBadges(summary)
    const totalWords = LEVEL_TOTAL[child.level] ?? 0
    const seen = summary.seenCount
    const pct = totalWords > 0 ? Math.round((seen / totalWords) * 100) : 0
    const weak = Object.keys(sync?.weak_words ?? {}).length
    const streak = sync?.streak?.current ?? 0
    const lastActive = sync?.streak?.lastActive ?? ''
    const daysSinceActive = lastActive
      ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000)
      : null

    const badgeRow = earned.length > 0
      ? `<p style="font-size:20px;margin:6px 0 0;">${earned.map(b => b.emoji).join(' ')}</p>`
      : ''

    const streakNote = daysSinceActive === null
      ? 'Chưa bắt đầu học'
      : daysSinceActive === 0
        ? `🔥 Đang streak ${streak} ngày — học hôm nay rồi!`
        : daysSinceActive === 1
          ? `⚡ Streak ${streak} ngày — nhớ học hôm nay để giữ streak!`
          : `💤 Chưa học ${daysSinceActive} ngày — streak đang ngủ`

    const weakWords = Object.entries(sync?.weak_words ?? {})
      .sort((a, b) => weakCount(b[1]) - weakCount(a[1])).slice(0, 8)

    const weakWordBlock = weak > 0 ? `
      <div style="margin-top:10px;background:#fff7ed;border-radius:10px;padding:10px 12px;">
        <p style="margin:0 0 6px;font-size:12px;color:#ea580c;font-weight:700;">⚠️ ${weak} từ cần ôn luyện thêm:</p>
        <p style="margin:0;font-size:13px;color:#9a3412;font-weight:600;line-height:1.7;">
          ${weakWords.map(([w, v]) => `${w} <span style="color:#f97316;font-size:11px;">×${weakCount(v)}</span>`).join(' &nbsp;·&nbsp; ')}${weak > 8 ? ` <span style="color:#9ca3af;font-size:11px;">+${weak - 8} từ khác</span>` : ''}
        </p>
      </div>` : ''

    return `
      <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;"><tr>
          <td style="width:48px;vertical-align:middle;">${avatarImg(child.emoji, child.name, 40)}</td>
          <td style="vertical-align:middle;padding-left:10px;">
            <p style="margin:0;font-weight:900;font-size:18px;color:#1f2937;">${child.name}</p>
            <p style="margin:0;font-size:12px;color:#7c3aed;font-weight:700;">${xpInfo.emoji} ${xpInfo.name} · ${summary.xp} XP</p>
          </td>
        </tr></table>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:600;">📚 Từ đã học</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:700;text-align:right;">${seen}/${totalWords} từ (${pct}%)</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:600;">🏆 Topics hoàn thành</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:700;text-align:right;">${summary.masteredTopics} topics</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${weak > 0 ? '#f97316' : '#22c55e'};font-weight:600;">⚠️ Từ cần ôn</td>
            <td style="padding:6px 0;font-size:13px;color:${weak > 0 ? '#f97316' : '#22c55e'};font-weight:700;text-align:right;">${weak > 0 ? `${weak} từ` : 'Không có ✓'}</td>
          </tr>
        </table>
        ${weakWordBlock}
        <p style="margin:10px 0 0;font-size:13px;color:#4b5563;font-weight:600;">${streakNote}</p>
        ${badgeRow}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:20px;padding:24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:28px;">📚</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;">Báo cáo học tập</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">VocabWise · Xin chào, <strong>${username}</strong>!</p>
    </div>
    ${childBlocks}
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabkids.vn'}/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;">
        Vào học ngay →
      </a>
    </div>
    <p style="text-align:center;margin-top:20px;font-size:11px;color:#9ca3af;">VocabWise · Bạn nhận email này vì đã đăng ký tài khoản.</p>
  </div>
</body>
</html>`
}
