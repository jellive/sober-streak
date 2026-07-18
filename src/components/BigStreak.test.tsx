import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BigStreak } from './BigStreak';

describe('BigStreak', () => {
  it('current>0 이면 큰 숫자로 표시', () => {
    render(<BigStreak current={8} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.queryByText('다시 시작 💧')).not.toBeInTheDocument();
  });
  it('current===0(마신 당일)이면 큰 "0" 대신 "다시 시작" 톤 — 0을 강조하지 않는다', () => {
    render(<BigStreak current={0} />);
    expect(screen.getByText('다시 시작 💧')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
