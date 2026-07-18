'use client';
import { useState } from 'react';
import { DrinkDay, DrinkType, DrinkContext } from '@/lib/types';

const TYPES: DrinkType[] = ['맥주', '소주', '사케', '와인', '기타'];
const CONTEXTS: DrinkContext[] = ['회식', '약속', '혼술', '기타'];

export function TodayButtons({ today, current, setDay }: {
  today: string; current: DrinkDay | undefined; setDay: (d: DrinkDay) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const drank = current?.drank ?? false;
  const base = (over: Partial<DrinkDay>): DrinkDay => ({
    date: today, drank: false, nonAlcohol: current?.nonAlcohol ?? false, ...current, ...over,
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center', color: 'var(--muted-2)', fontSize: 15 }}>오늘 마셨어?</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setDay(base({ drank: false, type: undefined, amount: undefined, context: undefined }))}
          aria-pressed={!drank}
          style={{ flex: 1, padding: 16, borderRadius: 14, minHeight: 'var(--tap)', fontWeight: 600, fontSize: 16,
            border: '1px solid rgba(126,220,238,.3)', background: !drank ? 'rgba(120,220,238,.16)' : 'transparent', color: 'var(--ink)' }}>
          안 마심
        </button>
        <button onClick={() => { setDay(base({ drank: true })); setSheet(true); }}
          aria-pressed={drank}
          style={{ flex: 1, padding: 16, borderRadius: 14, minHeight: 'var(--tap)', fontWeight: 600, fontSize: 16,
            border: '1px solid rgba(120,160,180,.4)', background: drank ? 'rgba(120,160,180,.18)' : 'transparent', color: 'var(--muted-2)' }}>
          마심
        </button>
      </div>
      {sheet && drank && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'var(--surface)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>기록 (스킵 가능)</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((t) => (
              <button key={t} onClick={() => setDay(base({ drank: true, type: t }))}
                aria-pressed={current?.type === t}
                style={chip(current?.type === t)}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONTEXTS.map((c) => (
              <button key={c} onClick={() => setDay(base({ drank: true, context: c }))}
                aria-pressed={current?.context === c}
                style={chip(current?.context === c)}>{c}</button>
            ))}
          </div>
          <button onClick={() => setSheet(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--glow)', fontSize: 14, minHeight: 'var(--tap)' }}>완료</button>
        </div>
      )}
    </div>
  );
}
function chip(active: boolean): React.CSSProperties {
  return { padding: '8px 14px', borderRadius: 20, fontSize: 14, minHeight: 'var(--tap)',
    border: '1px solid var(--line)', background: active ? 'var(--glow)' : 'transparent', color: active ? 'var(--on-glow)' : 'var(--ink)' };
}
