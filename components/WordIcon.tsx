'use client'

import * as Ph from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { getWordIcon } from '@/lib/wordIcon'

type Props = {
  word: string
  emoji: string
  /** Tailwind text-size class for emoji, e.g. "text-8xl" */
  emojiClass?: string
  /** px size for Phosphor icon */
  iconSize?: number
  className?: string
}

/**
 * Renders a Phosphor icon if a mapping exists for the word,
 * otherwise falls back to the emoji character.
 */
export default function WordIcon({ word, emoji, emojiClass = 'text-8xl', iconSize = 100, className = '' }: Props) {
  const iconName = getWordIcon(word)

  if (iconName) {
    const IconComponent = (Ph as Record<string, Icon | unknown>)[iconName] as Icon | undefined
    if (IconComponent) {
      return (
        <IconComponent
          size={iconSize}
          weight="duotone"
          className={className}
        />
      )
    }
  }

  return (
    <span className={`${emojiClass} leading-none select-none ${className}`}>
      {emoji}
    </span>
  )
}
