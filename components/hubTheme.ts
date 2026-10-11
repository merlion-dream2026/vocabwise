// Per-level (Daily) / per-book (Academic) colours for the topic hubs. The level hue paints the
// structure — card borders, round pills, word chips, the trail, the next-step button and the row it
// points at. Status stays fixed on every level: emerald ✓ = done. Full class strings so Tailwind
// keeps them (this file sits under components/, which Tailwind scans; lib/ is not scanned).
export type HubTheme = {
  card: string       // border of every hub card
  tint: string       // round-1 card / icon tile background
  soft: string       // highlighted "next" row, chip, round-2 pill background
  title: string      // headline text
  accent: string     // counts, dashed "+N" chip text
  dashed: string     // dashed borders (+N từ, Thử thách thêm)
  trail: string      // finished part of the journey line
  primary: string    // next-step button + current journey stop (bg + bottom edge)
  ring: string       // glow around the current journey stop
  pill: string       // round-1 pill
  pillSoft: string   // round-2 pill
}

export const DAILY_HUB_THEMES: Record<string, HubTheme> = {
  seeker: {
    card: 'border-violet-200 border-b-violet-300', tint: 'bg-violet-50', soft: 'bg-violet-100', title: 'text-violet-800',
    accent: 'text-violet-700', dashed: 'border-violet-300', trail: 'border-violet-300', primary: 'border-violet-800 bg-violet-600',
    ring: 'ring-violet-100', pill: 'border-violet-800 bg-violet-600 text-white', pillSoft: 'border-violet-300 bg-violet-100 text-violet-800',
  },
  starter: {
    card: 'border-pink-200 border-b-pink-300', tint: 'bg-pink-50', soft: 'bg-pink-100', title: 'text-pink-800',
    accent: 'text-pink-700', dashed: 'border-pink-300', trail: 'border-pink-300', primary: 'border-pink-800 bg-pink-600',
    ring: 'ring-pink-100', pill: 'border-pink-800 bg-pink-600 text-white', pillSoft: 'border-pink-300 bg-pink-100 text-pink-800',
  },
  ranger: {
    card: 'border-emerald-200 border-b-emerald-300', tint: 'bg-emerald-50', soft: 'bg-emerald-100', title: 'text-emerald-800',
    accent: 'text-emerald-700', dashed: 'border-emerald-300', trail: 'border-emerald-300', primary: 'border-emerald-800 bg-emerald-600',
    ring: 'ring-emerald-100', pill: 'border-emerald-800 bg-emerald-600 text-white', pillSoft: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  },
  explorer: {
    card: 'border-blue-200 border-b-blue-300', tint: 'bg-blue-50', soft: 'bg-blue-100', title: 'text-blue-800',
    accent: 'text-blue-700', dashed: 'border-blue-300', trail: 'border-blue-300', primary: 'border-blue-800 bg-blue-600',
    ring: 'ring-blue-100', pill: 'border-blue-800 bg-blue-600 text-white', pillSoft: 'border-blue-300 bg-blue-100 text-blue-800',
  },
  scholar: {
    card: 'border-indigo-200 border-b-indigo-300', tint: 'bg-indigo-50', soft: 'bg-indigo-100', title: 'text-indigo-800',
    accent: 'text-indigo-700', dashed: 'border-indigo-300', trail: 'border-indigo-300', primary: 'border-indigo-800 bg-indigo-600',
    ring: 'ring-indigo-100', pill: 'border-indigo-800 bg-indigo-600 text-white', pillSoft: 'border-indigo-300 bg-indigo-100 text-indigo-800',
  },
  master: {
    card: 'border-gray-200 border-b-gray-300', tint: 'bg-gray-50', soft: 'bg-gray-100', title: 'text-gray-800',
    accent: 'text-gray-700', dashed: 'border-gray-300', trail: 'border-gray-300', primary: 'border-gray-900 bg-gray-700',
    ring: 'ring-gray-200', pill: 'border-gray-900 bg-gray-700 text-white', pillSoft: 'border-gray-300 bg-gray-100 text-gray-800',
  },
}

export const ACADEMIC_HUB_THEMES: Record<string, HubTheme> = {
  book1: {
    card: 'border-emerald-200 border-b-emerald-300', tint: 'bg-emerald-50', soft: 'bg-emerald-100', title: 'text-emerald-800',
    accent: 'text-emerald-700', dashed: 'border-emerald-300', trail: 'border-emerald-300', primary: 'border-emerald-800 bg-emerald-600',
    ring: 'ring-emerald-100', pill: 'border-emerald-800 bg-emerald-600 text-white', pillSoft: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  },
  book2: DAILY_HUB_THEMES.explorer,
  book3: DAILY_HUB_THEMES.seeker,
}

// Academic page chrome per book: header gradient, page background, active-tab colour.
export const ACADEMIC_CHROME: Record<string, { header: string; page: string; tab: string }> = {
  book1: { header: 'from-emerald-500 to-green-600', page: 'from-emerald-50 to-green-50', tab: 'text-emerald-600 border-emerald-600' },
  book2: { header: 'from-blue-500 to-cyan-600', page: 'from-blue-50 to-cyan-50', tab: 'text-blue-600 border-blue-600' },
  book3: { header: 'from-violet-600 to-blue-600', page: 'from-violet-50 to-indigo-50', tab: 'text-violet-600 border-violet-600' },
}

export const hubTheme = (themes: Record<string, HubTheme>, key: string, fallback: string): HubTheme => themes[key] ?? themes[fallback]
