import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding } from './Onboarding';

describe('Onboarding', () => {
  it('날짜 선택 후 시작하면 initialize 호출', () => {
    const initialize = vi.fn();
    render(<Onboarding today="2026-07-18" initialize={initialize} />);
    fireEvent.change(screen.getByLabelText('마지막으로 마신 날'), { target: { value: '2026-07-10' } });
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));
    expect(initialize).toHaveBeenCalledWith('2026-07-10');
  });
});
