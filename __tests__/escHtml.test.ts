import { describe, it, expect } from 'vitest'
import { esc } from '@/lib/escHtml'

describe('esc', () => {
  it('escapes angle brackets (XSS payload)', () => {
    expect(esc('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes double quotes', () => {
    expect(esc('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes ampersands', () => {
    expect(esc('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapes ampersand FIRST so existing entities are not double-mangled incorrectly', () => {
    // & is replaced before < so "&<" becomes "&amp;&lt;"
    expect(esc('&<')).toBe('&amp;&lt;')
  })

  it('does NOT escape single quotes (current behavior — safe inside double-quoted HTML attrs)', () => {
    expect(esc("it's")).toBe("it's")
  })

  it('leaves normal text unchanged', () => {
    expect(esc('normal text')).toBe('normal text')
  })

  it('returns empty string for empty input', () => {
    expect(esc('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(esc(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(esc(undefined)).toBe('')
  })

  it('escapes a combined payload', () => {
    expect(esc('<a href="x">Tom & "Jerry"</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &quot;Jerry&quot;&lt;/a&gt;'
    )
  })
})
