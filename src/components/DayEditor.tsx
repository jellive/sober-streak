'use client';
import { DrinkDay } from '@/lib/types';
export function DayEditor({ date, current, setDay, onClose }: {
  date: string; current: DrinkDay | undefined; setDay: (d: DrinkDay) => void; onClose: () => void;
}) {
  const day = current ?? { date, drank: false, nonAlcohol: false };
  const save = (over: Partial<DrinkDay>) => setDay({ ...day, ...over });
  return (
    <div role="dialog" aria-label={`${date} 편집`} style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,16,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: 'var(--bg-0)', borderRadius: '18px 18px 0 0', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <strong className="tabnum">{date}</strong>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => save({ drank: false })} aria-pressed={!day.drank} style={editBtn(!day.drank)}>안 마심</button>
          <button onClick={() => save({ drank: true })} aria-pressed={day.drank} style={editBtn(day.drank)}>마심</button>
        </div>
        <button role="switch" aria-checked={day.nonAlcohol} onClick={() => save({ nonAlcohol: !day.nonAlcohol })} style={editBtn(day.nonAlcohol)}>🍺🚫 논알콜 마심</button>
        <button onClick={onClose} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--glow)', fontSize: 15, minHeight: 'var(--tap)' }}>닫기</button>
      </div>
    </div>
  );
}
function editBtn(active: boolean): React.CSSProperties {
  return { flex: 1, padding: 14, borderRadius: 12, minHeight: 'var(--tap)', fontSize: 15,
    border: '1px solid var(--line)', background: active ? 'var(--glow)' : 'var(--surface)', color: active ? 'var(--on-glow)' : 'var(--ink)' };
}
