import type { IncomingMessage, ServerResponse } from 'http'

type Req = IncomingMessage & { body: Record<string, string> }
type Res = ServerResponse & {
  status: (code: number) => Res
  json: (data: unknown) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  // Get allowed credentials from environment variables (defaults to requested credentials)
  const allowedUsername = process.env.ADMIN_USERNAME || 'SokoAerial'
  const allowedPassword = process.env.ADMIN_PASSWORD || 'soko123'

  // Verify username (case-insensitive) and password (case-sensitive)
  if (
    username.trim().toLowerCase() === allowedUsername.toLowerCase() &&
    password === allowedPassword
  ) {
    return res.status(200).json({
      success: true,
      token: `soko-auth-${Buffer.from(username).toString('base64')}-${Date.now()}`
    })
  }

  return res.status(401).json({ error: 'Invalid username or password' })
}
