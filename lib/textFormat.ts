/**
 * Strip Markdown noise from AI-generated plain-text blurbs (Giải nghĩa, hints…).
 * The models sometimes wrap output in **bold**, ### headings or "1." lists even
 * when asked for plain prose. We want clean running text, not rendered markdown.
 */
export function stripMarkdown(input: string): string {
  if (!input) return ''
  return input
    // headings: "### Khi nào" -> "Khi nào" (line start, or shoved inline after a period)
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\s#{1,6}\s+/g, ' ')
    // bold / italic markers: **x**, __x__, *x*, _x_
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_(?!\s)([^_\n]+?)_(?!_)/g, '$1$2')
    // stray leftover markers
    .replace(/\*\*/g, '')
    // inline code / code fences
    .replace(/`{1,3}/g, '')
    // bullet list markers at line start: "- x" / "* x" -> "x"
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    // collapse 3+ newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
