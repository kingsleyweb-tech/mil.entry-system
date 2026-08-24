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

  // Load configuration (supports both Vynfy and new SMS env variables)
  const apiKey = process.env.SMS_API_KEY || process.env.VYNFY_API_KEY
  const senderId = process.env.SMS_SENDER_ID || process.env.VYNFY_SENDER_ID || 'EXRESOLUTE'
  console.log('[send-sms] apiKey present:', Boolean(apiKey), '| senderId:', senderId)

  if (!apiKey) {
    console.error('[send-sms] SMS API Key is not set in environment variables!')
    return res.status(500).json({ error: 'SMS API Key not configured on server' })
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
    // ── Build SMS gateway URL ───────────────────────────────────────────────
    // Endpoint and params match http://sms.gonlinesites.com/app/sms/api format
    const gatewayUrl = `https://sms.gonlinesites.com/app/sms/api?action=send-sms&api_key=${encodeURIComponent(apiKey)}&to=${recipient}&from=${encodeURIComponent(senderId)}&sms=${encodeURIComponent(message)}`

    console.log('[send-sms] Dispatching GET request to SMS gateway...')
    const smsRes = await fetch(gatewayUrl, {
      method: 'GET',
    })

    const textResponse = await smsRes.text()
    console.log('[send-sms] SMS gateway status:', smsRes.status, '| response:', textResponse)

    if (!smsRes.ok) {
      console.error('[send-sms] SMS gateway rejected request:', smsRes.status, textResponse)
      return res.status(smsRes.status).json({ error: 'SMS send failed', details: textResponse })
    }

    console.log('[send-sms] SMS sent successfully to:', recipient)
    return res.status(200).json({ ok: true, details: textResponse })
  } catch (err) {
    console.error('[send-sms] Fetch error calling SMS gateway:', err)
    return res.status(500).json({ error: 'Failed to reach SMS gateway', details: String(err) })
  }
}
