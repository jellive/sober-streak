import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BigStreak } from './BigStreak';

describe('BigStreak', () => {
  it('current>0 이면 큰 숫자로 표시', () => {
    render(<BigStreak current={8} cumulative={8} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.queryByText('다시 시작 💧')).not.toBeInTheDocument();
  });
  it('current===0(마신 당일)이면 큰 "0" 대신 "다시 시작" 톤 — 0을 강조하지 않는다', () => {
    render(<BigStreak current={0} cumulative={7} />);
    expect(screen.getByText('다시 시작 💧')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
  it('current===0 + 누적>0 이면 누적 금주일로 노력을 크레딧하는 위로 메시지', () => {
    render(<BigStreak current={0} cumulative={24} />);
    expect(screen.getByText(/지금까지 24일 참아냈어/)).toBeInTheDocument();
  });
  it('current===0 + 누적===0(오늘 첫 시작)이면 숫자 없는 기본 격려', () => {
    render(<BigStreak current={0} cumulative={0} />);
    expect(screen.getByText('여기서 새로 쌓아가면 돼')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
