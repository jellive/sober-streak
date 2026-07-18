'use client';
import { useState } from 'react';
import { DrinkDay } from '@/lib/types';
import { cellClass } from './MiniHeatmap';

export function monthGrid(month: string): { leadBlanks: number; days: string[] } {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const leadBlanks = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  return { leadBlanks, days };
}

export function MonthHeatmap({ initialMonth, getDay, onPick }: {
  initialMonth: string; getDay: (d: string) => DrinkDay | undefined; onPick: (date: string) => void;
}) {
  const [month, setMonth] = useState(initialMonth);
  const { leadBlanks, days } = monthGrid(month);
  const shift = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={() => shift(-1)} aria-label="이전 달" style={navBtn}>‹</button>
        <strong className="tabnum">{month}</strong>
        <button onClick={() => shift(1)} aria-label="다음 달" style={navBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {Array.from({ length: leadBlanks }).map((_, i) => <span key={`b${i}`} />)}
        {days.map((d) => {
          const cls = cellClass(getDay(d));
          return <button key={d} onClick={() => onPick(d)} aria-label={d} data-cell={cls} style={{
            aspectRatio: '1', borderRadius: 6, border: 'none', position: 'relative', cursor: 'pointer',
            background: cls.startsWith('sober') ? 'linear-gradient(var(--glow),#2f8fa6)' : 'var(--surface)',
            boxShadow: cls === 'drank' ? 'inset 0 0 0 1px rgba(150,190,205,.35)' : 'none',
          }}>
            {cls.includes('na') && <i style={{ position: 'absolute', inset: 0, margin: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--ink-bright)' }} />}
          </button>;
        })}
      </div>
    </div>
  );
}
const navBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--glow)', fontSize: 24, minWidth: 'var(--tap)', minHeight: 'var(--tap)', cursor: 'pointer' };
