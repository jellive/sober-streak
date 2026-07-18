import { describe, it, expect, beforeEach } from 'vitest';
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
});

describe('mergeStores', () => {
  it('더 이른 base 채택', () => {
    const a = emptyStore('2026-07-10'); const b = emptyStore('2026-07-05');
    expect(mergeStores(a, b).meta.trackingStartDate).toBe('2026-07-05');
  });
  it('겹치는 날은 b(import) 우선', () => {
    let a = emptyStore('2026-07-10'); let b = emptyStore('2026-07-10');
    a = upsertDay(a, { date: '2026-07-18', drank: true, nonAlcohol: false });
    b = upsertDay(b, { date: '2026-07-18', drank: false, nonAlcohol: true });
    expect(mergeStores(a, b).days['2026-07-18'].nonAlcohol).toBe(true);
  });
});
