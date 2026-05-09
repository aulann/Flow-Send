export function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes).map(b => chars[b % 36]).join("")
}

export function buildQrPayload(code: string): string {
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : "https://flow-send.vercel.app"
  return `${origin}/send?code=${code}`
}

export function isValidSessionCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}
