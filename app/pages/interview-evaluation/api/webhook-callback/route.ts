import { NextRequest } from 'next/server'
import { jobs } from '../_store'

function normalizePayload(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return value

    try {
      return normalizePayload(JSON.parse(trimmed))
    } catch {
      return value
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 1) return normalizePayload(value[0])
    return value.map((item) => normalizePayload(item))
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if (typeof obj.text === 'string' && !obj.jobId && !obj.result && !obj.error) {
      const parsedText = normalizePayload(obj.text)
      if (parsedText && typeof parsedText === 'object') {
        return normalizePayload(parsedText)
      }
    }

    const normalized: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(obj)) {
      normalized[key] = normalizePayload(item)
    }
    return normalized
  }

  return value
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const normalized = normalizePayload(data)
  const body = Array.isArray(normalized) ? normalized[0] : normalized

  if (!body || (typeof body !== 'object' && typeof body !== 'string')) {
    return Response.json({ error: 'empty body' }, { status: 400 })
  }

  const parsedBody: Record<string, unknown> = typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)
    : { value: body }

  const { jobId, result, error } = parsedBody
  const finalResult = result ?? body

  const targetId = jobId ? String(jobId) : null

  for (const [jid, entry] of jobs) {
    if (entry.status !== 'pending') continue
    if (targetId && jid !== targetId) continue

    if (error) {
      jobs.set(jid, { status: 'error', error: String(error) })
    } else {
      jobs.set(jid, { status: 'completed', result: finalResult })
    }

    if (targetId) break
  }

  return Response.json({ ok: true })
}
