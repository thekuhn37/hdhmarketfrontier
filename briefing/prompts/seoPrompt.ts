export function buildSeoPrompt(title: string, summary: string, date: string): string {
  return `You are an SEO specialist for a professional financial intelligence website.

Given the following article information, return a JSON object with SEO metadata. Return ONLY valid JSON — no markdown, no explanation.

Article title: ${title}
Article summary: ${summary}
Date: ${date}

Return this exact JSON structure:
{
  "seoTitle": "string (max 60 characters, compelling, includes key market theme)",
  "seoDescription": "string (max 160 characters, summarizes the briefing value for search users)",
  "slug": "string (URL-safe, lowercase, hyphens only, include date e.g. global-markets-may-13-2026)",
  "tags": ["string", "string", "string", "string", "string"]
}

Tags should be relevant financial terms like market indices, asset classes, or macro themes covered in the article.`;
}
