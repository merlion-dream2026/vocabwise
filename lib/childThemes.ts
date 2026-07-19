export type ChildThemeId = 'pink' | 'blue' | 'green' | 'orange'

export const CHILD_THEMES: { id: ChildThemeId; emoji: string; label: string }[] = [
  { id: 'pink',   emoji: '🩷', label: 'Bé gái'   },
  { id: 'blue',   emoji: '💙', label: 'Bé trai'  },
  { id: 'green',  emoji: '💚', label: 'Xanh Lá'  },
  { id: 'orange', emoji: '🧡', label: 'Cam'      },
]

export const DEFAULT_CHILD_THEME: ChildThemeId = 'pink'
