'use client';
import { DrinkDay } from '@/lib/types';
export function NonAlcoholToggle({ today, current, setDay }: {
  today: string; current: DrinkDay | undefined; setDay: (d: DrinkDay) => void;
}) {
  const on = current?.nonAlcohol ?? false;
  return (
    <button role="switch" aria-checked={on} aria-label="논알콜 마심"
      onClick={() => setDay({ date: today, drank: current?.drank ?? false, nonAlcohol: !on, type: current?.type, amount: current?.amount, context: current?.context })}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, minHeight: 'var(--tap)',
        border: '1px solid rgba(120,180,200,.16)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 15, width: '100%' }}>
      <span>🍺🚫 논알콜 마심</span>
      <span style={{ width: 40, height: 24, borderRadius: 20, background: on ? 'var(--glow)' : 'rgba(120,180,200,.3)', position: 'relative', transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: 'var(--on-glow)', transition: 'left .2s' }} />
      </span>
    </button>
  );
}
