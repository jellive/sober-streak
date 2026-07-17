import { describe, it, expect } from 'vitest';
import { todayKST, daysBetween, addDays, eachDay } from './date';
import { SCHEMA_VERSION, STORAGE_KEY } from './types';

describe('todayKST', () => {
  it('KST 자정 직후 새벽 2시는 그날로 친다', () => {
    // 2026-07-18 02:00 KST = 2026-07-17 17:00 UTC
    expect(todayKST(new Date('2026-07-17T17:00:00Z'))).toBe('2026-07-18');
  });
  it('KST 자정 직전 23:59는 아직 그날', () => {
    // 2026-07-18 23:59 KST = 2026-07-18 14:59 UTC
    expect(todayKST(new Date('2026-07-18T14:59:00Z'))).toBe('2026-07-18');
  });
});

describe('daysBetween', () => {
  it('8일 차이', () => { expect(daysBetween('2026-07-10', '2026-07-18')).toBe(8); });
  it('같은 날은 0', () => { expect(daysBetween('2026-07-18', '2026-07-18')).toBe(0); });
  it('음수도 반환', () => { expect(daysBetween('2026-07-18', '2026-07-10')).toBe(-8); });
  it('월 경계', () => { expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1); });
});

describe('addDays', () => {
  it('더하기/월 경계', () => { expect(addDays('2026-07-18', 1)).toBe('2026-07-19'); expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); });
  it('빼기', () => { expect(addDays('2026-07-18', -8)).toBe('2026-07-10'); });
});

describe('eachDay', () => {
  it('양끝 포함', () => { expect(eachDay('2026-07-16', '2026-07-18')).toEqual(['2026-07-16','2026-07-17','2026-07-18']); });
  it('단일 날', () => { expect(eachDay('2026-07-18', '2026-07-18')).toEqual(['2026-07-18']); });
});

describe('constants', () => {
  it('SCHEMA_VERSION and STORAGE_KEY defined', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(STORAGE_KEY).toBe('sober-streak:v1');
  });
});
