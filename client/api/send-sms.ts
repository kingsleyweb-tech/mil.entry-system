import type { IncomingMessage, ServerResponse } from 'http'

type Req = IncomingMessage & { body: Record<string, string> }
type Res = ServerResponse & {
  status: (code: number) => Res
  json: (data: unknown) => void
}

export default async function handler(req: Req, res: Res) {
  console.log('[send-sms] handler called, method:', req.method)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, registrationId } = req.body as { phone: string; registrationId: string }
  console.log('[send-sms] phone:', phone, '| registrationId:', registrationId)

  if (!phone || !registrationId) {
    console.error('[send-sms] Missing phone or registrationId')
    return res.status(400).json({ error: 'Missing phone or registrationId' })
  }

  // Load Vynfy credentials from environment variables
  const apiKey = process.env.VYNFY_API_KEY
  const senderId = process.env.VYNFY_SENDER_ID || 'EXRESOLUTE'
  console.log('[send-sms] apiKey present:', Boolean(apiKey), '| senderId:', senderId)

  if (!apiKey) {
    console.error('[send-sms] VYNFY_API_KEY is not set in environment variables!')
    return res.status(500).json({ error: 'VYNFY_API_KEY not configured on server' })
  }

  // Normalize phone → Ghana format (233XXXXXXXXX)
  let recipient = phone.trim()
  if (recipient.startsWith('0')) {
    recipient = '233' + recipient.substring(1)
  } else if (recipient.startsWith('+')) {
    recipient = recipient.substring(1)
  }
  console.log('[send-sms] normalized recipient:', recipient)

  const message = `EXERCISE RESOLUTE SYNERGY 2026: Your registration was successful. Your Unique ID is ${registrationId}. Present your QR code or ID at the entry point.`

  try {
    console.log('[send-sms] Dispatching POST request to Vynfy...')
    const smsRes = await fetch('https://sms.vynfy.com/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        sender: senderId,
        recipients: [recipient],
        message,
      }),
    })

    const data = await smsRes.json().catch(() => ({}))
    console.log('[send-sms] Vynfy response status:', smsRes.status, '| body:', JSON.stringify(data))

    if (!smsRes.ok) {
      console.error('[send-sms] Vynfy rejected the request:', smsRes.status, data)
      return res.status(smsRes.status).json({ error: 'SMS send failed', details: data })
    }

    console.log('[send-sms] SMS sent successfully to:', recipient)
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    console.error('[send-sms] Fetch error calling Vynfy:', err)
    return res.status(500).json({ error: 'Failed to reach Vynfy API', details: String(err) })
  }
}
