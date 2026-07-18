import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrinkStore } from './useDrinkStore';

beforeEach(() => localStorage.clear());

describe('useDrinkStore', () => {
  it('초기엔 store=null(온보딩 필요)', () => {
    const { result } = renderHook(() => useDrinkStore());
    expect(result.current.store).toBeNull();
    expect(result.current.metrics).toBeNull();
  });

  it('initialize 후 지표 계산 + 영속', () => {
    const { result } = renderHook(() => useDrinkStore());
    act(() => result.current.initialize('2026-07-10'));
    expect(result.current.store?.meta.trackingStartDate).toBe('2026-07-10');
    expect(result.current.metrics?.current).toBeGreaterThanOrEqual(0);
    expect(localStorage.getItem('sober-streak:v1')).toBeTruthy();
  });

  it('setDay 반영', () => {
    const { result } = renderHook(() => useDrinkStore());
    act(() => result.current.initialize('2026-07-10'));
    act(() => result.current.setDay({ date: result.current.today, drank: false, nonAlcohol: true }));
    expect(result.current.getDay(result.current.today)?.nonAlcohol).toBe(true);
  });
});
