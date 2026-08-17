interface JobEntry {
  status: 'pending' | 'completed' | 'error'
  result?: unknown
  error?: string
  uniqueId?: string
}

export const jobs = new Map<string, JobEntry>()
