const MS_PER_DAY = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toUTCMidnight(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function todayKST(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTCMidnight(to) - toUTCMidnight(from)) / MS_PER_DAY);
}

export function addDays(date: string, n: number): string {
  return new Date(toUTCMidnight(date) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let cur = from; cur <= to; cur = addDays(cur, 1)) out.push(cur);
  return out;
}
