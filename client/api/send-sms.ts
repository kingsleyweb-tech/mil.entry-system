import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, registrationId } = req.body as { phone: string; registrationId: string }

  if (!phone || !registrationId) {
    return res.status(400).json({ error: 'Missing phone or registrationId' })
  }

  const apiKey = process.env.VYNFY_API_KEY
  const senderId = process.env.VYNFY_SENDER_ID || 'EXRESOLUTE'

  if (!apiKey) {
    console.warn('VYNFY_API_KEY not set – SMS skipped')
    return res.status(200).json({ ok: true, skipped: true })
  }

  // Normalize phone → Ghana format (233XXXXXXXXX)
  let recipient = phone.trim()
  if (recipient.startsWith('0')) {
    recipient = '233' + recipient.substring(1)
  } else if (recipient.startsWith('+')) {
    recipient = recipient.substring(1)
  }

  const message = `EXERCISE RESOLUTE SYNERGY 2026: Your registration was successful. Your Unique ID is ${registrationId}. Present your QR code or ID at the entry point.`

  // ── Try Vynfy SMS API ─────────────────────────────────────────────────────
  const smsRes = await fetch('https://api.vynfy.com/v1/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: senderId,
      recipient,
      message,
    }),
  })

  const data = await smsRes.json().catch(() => ({}))

  if (!smsRes.ok) {
    console.error('Vynfy SMS error:', data)
    return res.status(smsRes.status).json({ error: 'SMS send failed', details: data })
  }

  return res.status(200).json({ ok: true, data })
}
