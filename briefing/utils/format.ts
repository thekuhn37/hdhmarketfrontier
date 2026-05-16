export function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function formatPrice(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

// When the pipeline runs at 02:00 UTC Saturday (= Friday 10 PM New York),
// the market reference date is still Friday — shift back one day.
function marketRefDate(): Date {
  const now = new Date();
  if (now.getUTCDay() === 6) {
    const fri = new Date(now);
    fri.setUTCDate(now.getUTCDate() - 1);
    return fri;
  }
  return now;
}

export function today(): string {
  return marketRefDate().toISOString().slice(0, 10);
}

export function todayLong(): string {
  return marketRefDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function weekOf(): string {
  const ref = marketRefDate();
  const day = ref.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() + diff);
  return monday.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
