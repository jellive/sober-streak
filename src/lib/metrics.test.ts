import { describe, it, expect } from 'vitest';
import { DrinkStore, DrinkDay } from './types';
import { lastDrinkDate, currentStreak, cumulativeSoberDays, peakStreak } from './metrics';

function day(date: string, drank: boolean, nonAlcohol = false): DrinkDay {
  return { date, drank, nonAlcohol };
}
// base = 마지막 음주일. 시드는 base에 drank:true 한 행.
function store(base: string, days: DrinkDay[]): DrinkStore {
  const rec: Record<string, DrinkDay> = {};
  for (const d of days) rec[d.date] = d;
  return { days: rec, meta: { trackingStartDate: base, schemaVersion: 1 } };
}

describe('lastDrinkDate', () => {
  it('가장 최근 drank 날', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-14', true), day('2026-07-16', false)]);
    expect(lastDrinkDate(s, '2026-07-18')).toBe('2026-07-14');
  });
  it('오늘 이후 음주는 무시', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-20', true)]);
    expect(lastDrinkDate(s, '2026-07-18')).toBe('2026-07-10');
  });
  it('음주 기록 전무하면 null', () => {
    const s = store('2026-07-10', [day('2026-07-10', false)]);
    expect(lastDrinkDate(s, '2026-07-18')).toBeNull();
  });
});

describe('currentStreak', () => {
  it('시드 8일 전 → 8일차 (온보딩 직후)', () => {
    const s = store('2026-07-10', [day('2026-07-10', true)]);
    expect(currentStreak(s, '2026-07-18')).toBe(8);
  });
  it('오늘 마시면 0', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-18', true)]);
    expect(currentStreak(s, '2026-07-18')).toBe(0);
  });
  it('미기록 공백은 금주로 간주(안 끊김)', () => {
    // 7-14 마심 후 기록 공백만 있음 → 4일차
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-14', true)]);
    expect(currentStreak(s, '2026-07-18')).toBe(4);
  });
  it('음주 기록 없으면 base부터', () => {
    const s = store('2026-07-16', [day('2026-07-16', false)]);
    expect(currentStreak(s, '2026-07-18')).toBe(2);
  });
});

describe('cumulativeSoberDays', () => {
  it('온보딩 직후 8일차면 누적도 8', () => {
    // base 7-10(마심) ~ 7-18: 9일 - 마심 1 = 8
    const s = store('2026-07-10', [day('2026-07-10', true)]);
    expect(cumulativeSoberDays(s, '2026-07-18')).toBe(8);
  });
  it('중간 음주 2회 차감', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-13', true)]);
    // 9일 - 2 = 7
    expect(cumulativeSoberDays(s, '2026-07-18')).toBe(7);
  });
  it('오늘 이후 음주는 미차감', () => {
    const s = store('2026-07-16', [day('2026-07-16', true), day('2026-07-25', true)]);
    // 7-16~7-18 3일 - 1 = 2
    expect(cumulativeSoberDays(s, '2026-07-18')).toBe(2);
  });
});

describe('peakStreak', () => {
  it('현재 진행 스트릭이 최고면 그 값', () => {
    const s = store('2026-07-10', [day('2026-07-10', true)]);
    expect(peakStreak(s, '2026-07-18')).toBe(8);
  });
  it('과거 더 긴 구간이 최고', () => {
    // 7-01 마심, 7-11 마심(그 사이 10일 간격 → 피크 9), 이후 7일 진행
    const s = store('2026-07-01', [day('2026-07-01', true), day('2026-07-11', true)]);
    expect(peakStreak(s, '2026-07-18')).toBe(9);
  });
  it('base가 음주 아님', () => {
    const s = store('2026-07-16', [day('2026-07-16', false)]);
    expect(peakStreak(s, '2026-07-18')).toBe(2);
  });
});
