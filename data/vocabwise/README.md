# VocabWise Academic — Content Data

## Folder structure
```
data/vocabwise/
  book1/    ← b1-t01.json ... b1-t60.json  (A1-A2, Combo A, 60 topics)
  book2/    ← b2-t01.json ... b2-t60.json  (B1-B2, Combo B, 60 topics)
  book3/    ← b3-t01.json ... b3-t30.json  (C1-C2, Combo C, 30 topics)
```

## Seed a topic
```bash
# Đặt env vars trước (từ .env.local)
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...

# Single topic
node scripts/vw-seed.js --book 1 --file data/vocabwise/book1/b1-t01.json

# Batch (toàn bộ book)
node scripts/vw-seed.js --book 1 --dir data/vocabwise/book1/
```

## JSON format
Xem CLAUDE.md → section "VocabWise (Academic) — Curriculum" hoặc file context gốc.
