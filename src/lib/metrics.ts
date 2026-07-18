import { DrinkStore } from './types';
import { daysBetween, addDays } from './date';

export function lastDrinkDate(store: DrinkStore, today: string): string | null {
  let last: string | null = null;
  for (const d of Object.values(store.days)) {
    if (d.drank && d.date <= today && (last === null || d.date > last)) last = d.date;
  }
  return last;
}

export function currentStreak(store: DrinkStore, today: string): number {
  const base = lastDrinkDate(store, today) ?? store.meta.trackingStartDate;
  return Math.max(0, daysBetween(base, today));
}

export function cumulativeSoberDays(store: DrinkStore, today: string): number {
  const base = store.meta.trackingStartDate;
  const totalInclusive = daysBetween(base, today) + 1;
  let drankCount = 0;
  for (const d of Object.values(store.days)) {
    if (d.drank && d.date >= base && d.date <= today) drankCount += 1;
  }
  return Math.max(0, totalInclusive - drankCount);
}

export function peakStreak(store: DrinkStore, today: string): number {
  const base = store.meta.trackingStartDate;
  let streak = 0;
  let peak = 0;
  for (let cur = base; cur <= today; cur = addDays(cur, 1)) {
    const d = store.days[cur];
    if (cur === base) streak = 0;
    else if (d && d.drank) streak = 0;
    else streak += 1;
    if (streak > peak) peak = streak;
  }
  return peak;
}
