export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function formatReadingTime(minutes: number, locale = 'en'): string {
  if (locale === 'ko') return `${minutes}분 읽기`
  if (locale === 'zh') return `${minutes}分钟阅读`
  return `${minutes} min read`
}
