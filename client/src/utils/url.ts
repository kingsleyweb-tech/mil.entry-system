export function getBaseUrl(): string {
  const origin = window.location.origin
  const hostname = window.location.hostname

  // Detect if current hostname is a local loopback or local network IP
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')

  if (!isLocal) {
    return origin
  }

  // Fallback to the local IP from .env for local phone QR code testing
  return import.meta.env.VITE_APP_BASE_URL || origin
}
