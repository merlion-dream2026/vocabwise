// Resize public/avatars/*.png down to the largest size actually rendered in the
// app (77px, see lib/avatars.ts usages — PinGate is the biggest at width={77}).
// 2x for retina = 160px is a safe ceiling; source files were 256px, wasting
// bandwidth on every dashboard/kids/leaderboard render since <Image unoptimized>
// skips Next.js's own resizing. Re-run this after adding new avatar assets.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const DIR = path.join(process.cwd(), 'public', 'avatars')
const TARGET_SIZE = 160

async function main() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png'))
  let beforeTotal = 0
  let afterTotal = 0

  for (const file of files) {
    const filePath = path.join(DIR, file)
    const before = fs.statSync(filePath).size
    const buf = await sharp(filePath)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
      .png({ quality: 85, compressionLevel: 9, palette: true })
      .toBuffer()
    fs.writeFileSync(filePath, buf)
    const after = buf.length
    beforeTotal += before
    afterTotal += after
    console.log(`${file}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`)
  }

  console.log(`\nTotal: ${(beforeTotal / 1024 / 1024).toFixed(2)}MB → ${(afterTotal / 1024 / 1024).toFixed(2)}MB (-${(100 - afterTotal / beforeTotal * 100).toFixed(0)}%)`)
}

main()
