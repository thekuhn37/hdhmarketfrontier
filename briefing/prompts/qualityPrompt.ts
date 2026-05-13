export function buildQualityPrompt(content: string): string {
  const preview = content.slice(0, 8000);

  return `You are a quality control editor for a professional financial publication. Review the following HTML article and return a JSON quality assessment.

Return ONLY valid JSON — no markdown, no explanation.

Check all of the following criteria:
1. Minimum length: article should have more than 800 words of readable text
2. All 10 required sections present: Executive Summary, Global Equity Markets, Futures & Volatility, FX Markets, Commodities, Cryptocurrency, Regional Highlights, Key Market News, Economic Calendar, Closing Perspective
3. Professional institutional tone (Bloomberg-style, analytical, not promotional)
4. No repetitive phrasing or copy-pasted paragraphs
5. No broken HTML structure (unclosed tags, garbled text)
6. Data references appear consistent (no obviously contradictory numbers)

Return this exact JSON structure:
{
  "passed": boolean,
  "issues": ["string describing each issue found, empty array if none"],
  "score": number between 0 and 100
}

Score guidelines:
- 90-100: Publication-ready, all sections present, excellent analysis
- 70-89: Good quality, minor issues
- 50-69: Acceptable but needs improvement
- Below 50: Significant issues, needs rewrite

Article content (first 8000 chars):
${preview}`;
}
