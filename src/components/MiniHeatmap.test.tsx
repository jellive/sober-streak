import { describe, it, expect } from 'vitest';
import { cellClass } from './MiniHeatmap';

describe('cellClass', () => {
  it('마심=drank(빈 셀), 안마심=sober, 미기록=empty', () => {
    expect(cellClass({ date: 'x', drank: true, nonAlcohol: false })).toBe('drank');
    expect(cellClass({ date: 'x', drank: false, nonAlcohol: false })).toBe('sober');
    expect(cellClass(undefined)).toBe('empty');
  });
  it('논알콜은 점 부여(안마심 유지)', () => {
    expect(cellClass({ date: 'x', drank: false, nonAlcohol: true })).toBe('sober na');
  });
});
