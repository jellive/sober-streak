import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emptyStore, loadStore, saveStore, upsertDay, exportJSON, importJSON, mergeStores } from './store';
import { STORAGE_KEY } from './types';

beforeEach(() => localStorage.clear());

describe('save/load', () => {
  it('저장한 걸 그대로 읽는다', () => {
    const s = emptyStore('2026-07-10');
    saveStore(s);
    expect(loadStore()).toEqual(s);
  });
  it('없으면 null', () => { expect(loadStore()).toBeNull(); });
  it('깨진 JSON이면 null', () => { localStorage.setItem(STORAGE_KEY, '{oops'); expect(loadStore()).toBeNull(); });
  it('유효 JSON이지만 형태가 틀리면 null', () => {
    localStorage.setItem(STORAGE_KEY, 'null');
    expect(loadStore()).toBeNull();                                    // !parsed
    localStorage.setItem(STORAGE_KEY, '123');
    expect(loadStore()).toBeNull();                                    // typeof !== 'object'
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ days: {} }));   // meta 없음
    expect(loadStore()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta: { trackingStartDate: '2026-07-10', schemaVersion: 1 } })); // days 없음
    expect(loadStore()).toBeNull();
  });
  it('localStorage가 없으면(SSR 등) null 반환 — never throws', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadStore()).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe('upsertDay', () => {
  it('새 날 추가(불변)', () => {
    const s = emptyStore('2026-07-10');
    const s2 = upsertDay(s, { date: '2026-07-18', drank: false, nonAlcohol: true });
    expect(s2.days['2026-07-18'].nonAlcohol).toBe(true);
    expect(s.days['2026-07-18']).toBeUndefined(); // 원본 불변
  });
  it('같은 날 덮어쓰기', () => {
    let s = emptyStore('2026-07-10');
    s = upsertDay(s, { date: '2026-07-18', drank: true, nonAlcohol: false });
    s = upsertDay(s, { date: '2026-07-18', drank: false, nonAlcohol: false });
    expect(s.days['2026-07-18'].drank).toBe(false);
  });
});

describe('export/import 왕복', () => {
  it('무손실 왕복', () => {
    let s = emptyStore('2026-07-10');
    s = upsertDay(s, { date: '2026-07-18', drank: true, nonAlcohol: false, type: '맥주' });
    const json = exportJSON(s);
    expect(importJSON(emptyStore('2026-07-15'), json)).toEqual(s);
  });
  it('깨진 import는 throw', () => {
    expect(() => importJSON(emptyStore('2026-07-10'), 'nope')).toThrow();
  });
  it('parsed 자체가 null이면(JSON "null") throw', () => {
    expect(() => importJSON(emptyStore('2026-07-10'), 'null')).toThrow();
  });
  it('유효 JSON이지만 스키마 검증 실패하면 throw', () => {
    expect(() => importJSON(emptyStore('2026-07-10'), JSON.stringify({ days: {} }))).toThrow();
    expect(() => importJSON(emptyStore('2026-07-10'), JSON.stringify({ meta: {} }))).toThrow();
  });
});

describe('mergeStores', () => {
  it('더 이른 base 채택', () => {
    const a = emptyStore('2026-07-10'); const b = emptyStore('2026-07-05');
    expect(mergeStores(a, b).meta.trackingStartDate).toBe('2026-07-05');
    const c = emptyStore('2026-07-05'); const d = emptyStore('2026-07-10');
    expect(mergeStores(c, d).meta.trackingStartDate).toBe('2026-07-05');
  });
  it('겹치는 날은 b(import) 우선', () => {
    let a = emptyStore('2026-07-10'); let b = emptyStore('2026-07-10');
    a = upsertDay(a, { date: '2026-07-18', drank: true, nonAlcohol: false });
    b = upsertDay(b, { date: '2026-07-18', drank: false, nonAlcohol: true });
    expect(mergeStores(a, b).days['2026-07-18'].nonAlcohol).toBe(true);
  });
});
