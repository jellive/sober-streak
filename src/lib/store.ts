import { DrinkStore, DrinkDay, STORAGE_KEY, SCHEMA_VERSION } from './types';

export function emptyStore(base: string): DrinkStore {
  return { days: {}, meta: { trackingStartDate: base, schemaVersion: SCHEMA_VERSION } };
}

export function loadStore(): DrinkStore | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DrinkStore;
    if (!parsed || typeof parsed !== 'object' || !parsed.meta || !parsed.days) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStore(store: DrinkStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function upsertDay(store: DrinkStore, day: DrinkDay): DrinkStore {
  return { ...store, days: { ...store.days, [day.date]: day } };
}

export function exportJSON(store: DrinkStore): string {
  return JSON.stringify(store, null, 2);
}

export function mergeStores(a: DrinkStore, b: DrinkStore): DrinkStore {
  const base = a.meta.trackingStartDate < b.meta.trackingStartDate
    ? a.meta.trackingStartDate : b.meta.trackingStartDate;
  return {
    days: { ...a.days, ...b.days }, // b 우선
    meta: { trackingStartDate: base, schemaVersion: SCHEMA_VERSION },
  };
}

export function importJSON(current: DrinkStore, json: string): DrinkStore {
  const parsed = JSON.parse(json) as DrinkStore; // 깨지면 throw
  if (!parsed?.meta?.trackingStartDate || !parsed.days) throw new Error('invalid store JSON');
  return mergeStores(current, parsed);
}
