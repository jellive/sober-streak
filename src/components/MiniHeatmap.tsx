'use client';
import { DrinkDay } from '@/lib/types';
import { addDays } from '@/lib/date';

export function cellClass(day: DrinkDay | undefined): string {
  if (!day) return 'empty';
  if (day.drank) return 'drank';
  return day.nonAlcohol ? 'sober na' : 'sober';
}

export function MiniHeatmap({ today, getDay }: { today: string; getDay: (d: string) => DrinkDay | undefined }) {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(addDays(today, -i));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }} aria-label="최근 14일 기록">
      {days.map((d) => {
        const cls = cellClass(getDay(d));
        return <span key={d} data-cell={cls} title={d} style={{
          aspectRatio: '1', borderRadius: 6, position: 'relative',
          background: cls.startsWith('sober') ? 'linear-gradient(var(--glow),#2f8fa6)' : 'var(--surface)',
          boxShadow: cls === 'drank' ? 'inset 0 0 0 1px rgba(150,190,205,.35)' : 'none',
        }}>
          {cls.includes('na') && <i style={{ position: 'absolute', inset: 0, margin: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--ink-bright)' }} />}
        </span>;
      })}
    </div>
  );
}
