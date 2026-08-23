import { NextRequest } from 'next/server'
import { jobs } from '../../_store'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const entry = jobs.get(jobId)

  if (!entry) {
    return Response.json({ status: 'not_found' }, { status: 404 })
  }

  const { uniqueId, ...rest } = entry
  return Response.json(rest)
}
