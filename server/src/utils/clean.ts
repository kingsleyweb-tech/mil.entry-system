export function cleanText(value?: string) {
  return String(value ?? '')
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
}

export function cleanOptional(value?: string) {
  const cleaned = cleanText(value)
  return cleaned || undefined
}
