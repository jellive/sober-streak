'use client';
import { useState } from 'react';

export function Onboarding({ today, initialize }: { today: string; initialize: (d: string) => void }) {
  const [date, setDate] = useState(today);
  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: 28 }}>
      <div>
        <p style={{ color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 13, margin: 0 }}>Sober Streak</p>
        <h1 style={{ fontSize: 26, margin: '8px 0 0', textWrap: 'balance' }}>마지막으로 마신 날은?</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>그날부터 지금까지가 네 스트릭이 돼. 오늘 마셨으면 오늘로.</p>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--muted-2)' }}>
        마지막으로 마신 날
        <input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)}
          style={{ padding: 14, fontSize: 16, borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(255,255,255,.05)', color: 'var(--ink)' }} />
      </label>
      <button onClick={() => initialize(date)}
        style={{ padding: 16, fontSize: 16, fontWeight: 700, borderRadius: 14, border: 'none', background: 'var(--glow)', color: '#06202b', minHeight: 'var(--tap)' }}>
        시작하기
      </button>
      <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
        💡 공유 버튼 → <b style={{ color: 'var(--ink)' }}>홈 화면에 추가</b>해두면 데이터가 안전하게 유지돼.
      </p>
    </section>
  );
}
