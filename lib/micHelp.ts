// Mic permission helpers shared by every recording screen: ask for the mic up front (inside a tap, so
// the browser really shows its prompt) and tell the parent where to switch it back on for the device
// they're holding.

export type MicDevice = 'ios' | 'android' | 'desktop'

export function micDevice(): MicDevice {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac — tell them apart by touch support.
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  return /Android/.test(ua) ? 'android' : 'desktop'
}

const HELP: Record<MicDevice, string> = {
  ios: 'Micro đang bị chặn. Trên Safari: bấm "aA" ở thanh địa chỉ → Cài đặt trang web → Micro → Cho phép (hoặc vào Cài đặt iPhone → Safari → Micro → Hỏi), rồi tải lại trang.',
  android: 'Micro đang bị chặn. Bấm biểu tượng 🔒 cạnh địa chỉ web → Quyền → Micro → Cho phép, rồi tải lại trang.',
  desktop: 'Micro đang bị chặn. Bấm biểu tượng 🔒 cạnh địa chỉ web → Micro → Cho phép, rồi tải lại trang.',
}
export const micDeniedHelp = (device: MicDevice = micDevice()) => HELP[device]

export type MicError = 'denied' | 'unavailable'
export const micErrorOf = (e: unknown): MicError => {
  const name = (e as { name?: string } | null)?.name
  return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable'
}

/** Opens and immediately releases the mic, so the permission prompt appears now (call from a tap). */
export async function requestMic(): Promise<MicError | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return 'unavailable'
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true })
    s.getTracks().forEach((t) => t.stop())
    return null
  } catch (e) { return micErrorOf(e) }
}
