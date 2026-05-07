const CODE_REGEX = /^[A-Z0-9]{6}$/
const QR_URL_PATTERN = /\/send\?code=([A-Z0-9]{6})(?:$|&)/

export function parseQrPayload(raw: string): string | null {
  const match = raw.match(QR_URL_PATTERN)
  if (match) return match[1]

  const upper = raw.trim().toUpperCase()
  if (CODE_REGEX.test(upper)) return upper

  return null
}

export function isValidCode(code: string): boolean {
  return CODE_REGEX.test(code)
}
