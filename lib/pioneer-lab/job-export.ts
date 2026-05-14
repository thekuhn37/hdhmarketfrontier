import * as XLSX from 'xlsx'
import type { PioneerJobPost } from '@/lib/supabase/types'

export function generateJobExcel(jobs: PioneerJobPost[]): Buffer {
  const rows = jobs.map((j) => ({
    'Company Name': j.company_name,
    'Company Category': j.company_category,
    'Position Title': j.position_title,
    'Function / Role Type': j.function_type,
    'Job Description': j.job_description ?? '',
    'Expected Salary': j.expected_salary ?? 'Not disclosed',
    'Posted Date': j.posted_date ?? '',
    'Closing Date': j.closing_date ?? '',
    'Location': j.location ?? '',
    'Remote Type': j.remote_type ?? '',
    'Seniority Level': j.seniority_level ?? '',
    'Employment Type': j.employment_type ?? '',
    'Source Platform': j.source_platform ?? '',
    'Source Link': j.source_link ?? '',
    'Required Skills': (j.required_skills ?? []).join(', '),
    'Preferred Skills': (j.preferred_skills ?? []).join(', '),
    'AI Relevance Score': j.ai_relevance_score ?? '',
    'AI Relevance Explanation': j.ai_relevance_explanation ?? '',
    'Status': j.status,
    'Notes': j.notes ?? '',
    'First Discovered': j.first_discovered_at ? j.first_discovered_at.slice(0, 10) : '',
    'Last Checked': j.last_checked_at ? j.last_checked_at.slice(0, 10) : '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  const colWidths = [
    { wch: 25 }, { wch: 22 }, { wch: 35 }, { wch: 22 }, { wch: 60 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 12 },
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 50 }, { wch: 40 },
    { wch: 40 }, { wch: 10 }, { wch: 50 }, { wch: 14 }, { wch: 30 },
    { wch: 14 }, { wch: 14 },
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Job Market Today')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return buf
}
