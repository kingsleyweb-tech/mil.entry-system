import type { Personnel, PersonnelForm, PersonnelStatus, Stats, VerifyResponse } from '../types/personnel'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

type ApiError = Error & { status?: number }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message ?? 'Request failed') as ApiError
    error.status = response.status
    throw error
  }
  return payload
}

export function registerPersonnel(data: PersonnelForm) {
  return request<{ personnel: Personnel }>('/personnel/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getPersonnel(registrationId: string) {
  return request<{ personnel: Personnel }>(`/personnel/${encodeURIComponent(registrationId)}`)
}

export function verifyRegistration(registrationId: string) {
  return request<VerifyResponse>('/personnel/verify', {
    method: 'POST',
    body: JSON.stringify({ registrationId }),
  })
}

export function checkInPersonnel(registrationId: string) {
  return request<{ message: string; personnel: Personnel }>(
    `/personnel/${encodeURIComponent(registrationId)}/check-in`,
    { method: 'POST' },
  )
}

export function listPersonnel(search: string, status: PersonnelStatus | 'ALL') {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status !== 'ALL') params.set('status', status)
  return request<{ personnel: Personnel[] }>(`/personnel?${params.toString()}`)
}

export function getStats() {
  return request<{ stats: Stats }>('/personnel/stats')
}

export function seedDemoData() {
  return request<{ message: string; created: number }>('/personnel/seed-demo', {
    method: 'POST',
  })
}
