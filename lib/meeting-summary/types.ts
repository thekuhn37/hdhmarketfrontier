export type JobStatus = 'queued' | 'transcribing' | 'summarizing' | 'complete' | 'error'

export interface MeetingSummaryJob {
  id: string
  user_id: string
  filename: string
  file_size_bytes: number | null
  duration_seconds: number | null
  status: JobStatus
  transcript: string | null
  summary: string | null
  minutes: string | null
  language_detected: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}
