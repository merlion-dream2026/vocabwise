import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const book    = searchParams.get('book')
  const topicId = searchParams.get('topicId')

  if (!book || !topicId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Sanitise inputs to prevent path traversal
  if (!/^book[123]$/.test(book) || !/^b[123]-t\d{2,3}(-\w+)?$/.test(topicId)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const dir   = path.join(process.cwd(), 'data', 'vocabwise', book)
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : []
  const file  = files.find(f => f.startsWith(topicId.replace(/-final$/, '').replace(/-\w+$/, '')) && f.endsWith('.json'))
    ?? files.find(f => f.includes(topicId.split('-').slice(0, 2).join('-')) && f.endsWith('.json'))

  if (!file) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
  }

  try {
    const raw  = fs.readFileSync(path.join(dir, file), 'utf8')
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }
}
