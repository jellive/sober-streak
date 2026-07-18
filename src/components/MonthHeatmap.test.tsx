import { describe, it, expect } from 'vitest';
import { monthGrid } from './MonthHeatmap';
describe('monthGrid', () => {
  it('2026-07은 1일이 수요일, 31일까지', () => {
    const g = monthGrid('2026-07');
    expect(g.leadBlanks).toBe(3); // 일=0..수=3
    expect(g.days[0]).toBe('2026-07-01');
    expect(g.days.at(-1)).toBe('2026-07-31');
  });
});
