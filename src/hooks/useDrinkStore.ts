'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DrinkDay, DrinkStore } from '@/lib/types';
import { loadStore, saveStore, upsertDay, emptyStore } from '@/lib/store';
import { todayKST } from '@/lib/date';
import { currentStreak, peakStreak, cumulativeSoberDays } from '@/lib/metrics';

export function useDrinkStore() {
  const [store, setStore] = useState<DrinkStore | null>(null);
  const [today, setToday] = useState(() => todayKST());

  useEffect(() => {
    setStore(loadStore());
    setToday(todayKST());
  }, []);

  const persist = useCallback((next: DrinkStore) => {
    saveStore(next);
    setStore(next);
  }, []);

  const initialize = useCallback((lastDrinkDate: string) => {
    let next = emptyStore(lastDrinkDate);
    next = upsertDay(next, { date: lastDrinkDate, drank: true, nonAlcohol: false });
    persist(next);
  }, [persist]);

  const setDay = useCallback((day: DrinkDay) => {
    setStore((prev) => {
      const base = prev ?? emptyStore(day.date);
      const next = upsertDay(base, day);
      saveStore(next);
      return next;
    });
  }, []);

  const getDay = useCallback((date: string) => store?.days[date], [store]);

  const metrics = useMemo(() => {
    if (!store) return null;
    return {
      current: currentStreak(store, today),
      peak: peakStreak(store, today),
      cumulative: cumulativeSoberDays(store, today),
    };
  }, [store, today]);

  return { store, today, metrics, initialize, setDay, getDay, replaceStore: persist };
}
