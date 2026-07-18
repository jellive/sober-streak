'use client';
export function BigStreak({ current }: { current: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 13 }}>현재 스트릭</div>
      <div className="tabnum" style={{ fontWeight: 200, fontSize: 'clamp(96px,34vw,168px)', lineHeight: .85, color: 'var(--ink-bright)', textShadow: '0 0 40px rgba(101,214,232,.5)' }}>
        {current}<span style={{ fontSize: '.28em', fontWeight: 300, color: 'var(--glow)', marginLeft: 6 }}>일</span>
      </div>
      <div style={{ fontSize: 17, color: 'var(--muted-2)', marginTop: 4 }}>무알콜 💧</div>
    </div>
  );
}
