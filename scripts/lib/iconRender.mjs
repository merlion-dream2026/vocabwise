// Chuẩn hoá một ảnh GPT thành icon vuông `size` px (PNG buffer): bỏ nền mờ, cắt sát, lề 1/16.
// Dùng chung cho import-icons.mjs (256 + 512) và build-icon-zoom.mjs.
import sharp from 'sharp'

export async function renderIcon(src, size, alphaFloor = 40) {
  // GPT hay để lại lớp nền mờ (chỉ lộ trên nền tối): alpha dưới ngưỡng thành trong suốt hẳn.
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (alphaFloor) for (let i = 3; i < data.length; i += 4) if (data[i] < alphaFloor) data[i] = 0
  const trimmed = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().trim({ threshold: 8 }).toBuffer()
  // GPT vẽ sát mép (tới 97% khung) nên cắt nền thừa rồi đặt lại lề đều (256px → lề 16px).
  const pad = size / 16
  return sharp(trimmed)
    .resize(size - 2 * pad, size - 2 * pad, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer()
}
