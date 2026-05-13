import type { QualityCheckResult } from '../../types/index.js';
import { chatComplete } from '../../lib/openaiClient.js';
import { buildQualityPrompt } from '../../prompts/qualityPrompt.js';
import { logger } from '../../utils/logger.js';

const REQUIRED_SECTIONS = [
  'Executive Summary',
  'Global Equity Markets',
  'Futures',
  'FX Markets',
  'Commodities',
  'Cryptocurrency',
  'Regional Highlights',
  'Key Market News',
  'Economic Calendar',
  'Closing Perspective',
];

function heuristicCheck(content: string): QualityCheckResult {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').filter(Boolean).length;
  const issues: string[] = [];

  if (wordCount < 500) issues.push(`Word count too low: ${wordCount} words`);

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      issues.push(`Missing section: ${section}`);
    }
  }

  const score = Math.max(0, 100 - issues.length * 15);
  return { passed: issues.length === 0, issues, score };
}

export async function qualityCheck(content: string, title: string): Promise<QualityCheckResult> {
  logger.info(`Running quality check for: ${title}`);

  try {
    const prompt = buildQualityPrompt(content);
    const raw = await chatComplete(
      [{ role: 'user', content: prompt }],
      'gpt-4o-mini',
      500,
    );

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as QualityCheckResult;

    const result: QualityCheckResult = {
      passed: parsed.passed ?? false,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      score: typeof parsed.score === 'number' ? parsed.score : 0,
    };

    logger.info(`Quality check score: ${result.score}, passed: ${result.passed}`);
    return result;
  } catch (err) {
    logger.warn(`GPT quality check failed, using heuristics: ${err}`);
    return heuristicCheck(content);
  }
}
