import type { CalendarEvent } from '../../types/index.js';
import { withRetry } from '../../utils/retry.js';
import { logger } from '../../utils/logger.js';
import { today } from '../../utils/format.js';

interface FinnhubEvent {
  time?: string;
  event?: string;
  impact?: string;
  country?: string;
}

interface FinnhubResponse {
  economicCalendar?: FinnhubEvent[];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function collectCalendar(): Promise<CalendarEvent[]> {
  logger.info('Collecting economic calendar...');

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    logger.warn('FINNHUB_API_KEY not set — skipping calendar.');
    return [];
  }

  const from = today();
  const to = addDays(from, 7);
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;

  try {
    const data = await withRetry(
      () => fetch(url).then((r) => r.json() as Promise<FinnhubResponse>),
      3,
      1500,
    );

    const events: CalendarEvent[] = (data.economicCalendar ?? []).map((e) => ({
      date: e.time ?? from,
      event: e.event ?? 'Unknown Event',
      importance: e.impact ?? 'low',
      country: e.country,
    }));

    logger.info(`Collected ${events.length} calendar events.`);
    return events;
  } catch (err) {
    logger.warn(`Failed to fetch calendar: ${err}`);
    return [];
  }
}
