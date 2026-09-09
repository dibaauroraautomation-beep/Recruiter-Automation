import { NextRequest } from 'next/server'
import { jobs } from './_store'

const RESUME_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://hasan123a.app.n8n.cloud/webhook/user-info'
const INTERVIEW_WEBHOOK_URL = process.env.N8N_INTERVIEW_WEBHOOK_URL || 'https://hasan123a.app.n8n.cloud/webhook/interview'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  switch (action) {
    case 'job-status':
      return jobStatus(request)
    case 'interview-status':
      return interviewStatus(request)
    case 'pdf-proxy':
      return pdfProxy(request)
    default:
      return Response.json({ error: 'Unknown action' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  switch (action) {
    case 'submit-resume':
      return submitResume(request)
    case 'start-interview':
      return startInterview(request)
    default:
      return Response.json({ error: 'Unknown action' }, { status: 400 })
  }
}

function jobStatus(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 })
  }
  const job = jobs.get(jobId)
  if (!job) {
    return Response.json({ error: 'Job not found' }, { status: 404 })
  }
  return Response.json(job)
}

function interviewStatus(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 })
  }
  const entry = jobs.get(jobId)
  if (!entry) {
    return Response.json({ status: 'not_found' }, { status: 404 })
  }
  const { uniqueId, ...rest } = entry
  return Response.json(rest)
}

async function submitResume(request: NextRequest) {
  const jobId = crypto.randomUUID()
  const formData = await request.formData()
  const uniqueId = (formData.get('uniqueId') as string | null) ?? ''

  jobs.set(jobId, { status: 'pending', uniqueId })

  forwardToN8n(jobId, formData, RESUME_WEBHOOK_URL, (data: unknown) => {
    const result = Array.isArray(data) ? data[0] : data
    return !!result && (typeof result.ats_score === 'number' || typeof result['ATS Score'] === 'number')
  })

  return Response.json({ jobId })
}

async function startInterview(request: NextRequest) {
  const jobId = crypto.randomUUID()
  const formData = await request.formData()
  const uniqueId = formData.get('uniqueId') as string | null

  if (!uniqueId) {
    return Response.json({ error: 'uniqueId is required' }, { status: 400 })
  }

  jobs.set(jobId, { status: 'pending', uniqueId })

  forwardToN8n(jobId, formData, INTERVIEW_WEBHOOK_URL, (data: unknown) => {
    const result = Array.isArray(data) ? data[0] : data
    return !!result && typeof result === 'object' && Object.keys(result).length > 0
  })

  return Response.json({ jobId })
}

function forwardToN8n(
  jobId: string,
  formData: FormData,
  webhookUrl: string,
  isValidResult: (data: unknown) => boolean,
) {
  formData.append('jobId', jobId)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_200_000)

  fetch(webhookUrl, { method: 'POST', body: formData, signal: controller.signal })
    .then(async (res) => {
      clearTimeout(timeout)
      if (!res.ok) return
      try {
        const data = await res.json()
        if (isValidResult(data)) {
          jobs.set(jobId, { status: 'completed', result: Array.isArray(data) ? data[0] : data })
        }
      } catch { /* not JSON — n8n will callback */ }
    })
    .catch(() => { /* n8n will callback or client will timeout */ })
}

async function pdfProxy(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return new Response('Missing url parameter', { status: 400 })
  }

  const fileId =
    url.match(/[?&]id=([^&]+)/)?.[1] ??
    url.match(/\/d\/([^/]+)/)?.[1]

  const urlsToTry = fileId
    ? [
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/uc?id=${fileId}&confirm=1`,
        `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
      ]
    : [url]

  for (const attemptUrl of urlsToTry) {
    try {
      const res = await fetch(attemptUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') ?? ''
      const blob = await res.blob()

      if (contentType.includes('text/html')) continue

      const headers = new Headers()
      headers.set('Content-Type', 'application/pdf')
      headers.set('Content-Disposition', 'inline')
      headers.set('X-Frame-Options', 'SAMEORIGIN')
      headers.set('Cache-Control', 'public, max-age=3600')

      return new Response(blob, { status: 200, headers })
    } catch {
      continue
    }
  }

  return new Response(
    `<html><body style="display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#6B7280;font-size:14px;margin:0;height:100%">
      <p>PDF preview unavailable</p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } },
  )
}