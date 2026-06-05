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
  minutes?: string | null
  title?: string | null
  short_summary?: string | null
  audio_storage_path?: string | null
  audio_deleted?: boolean
  language_detected: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}
