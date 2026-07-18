'use client';
export function BigStreak({ current, cumulative }: { current: number; cumulative: number }) {
  if (current === 0) {
    // 마신 당일(또는 오늘을 마지막 음주일로 시작) — 0을 강조하지 않고 '다시 시작' 톤 (spec §7/§8.1 무경고).
    // 누적 금주일로 노력을 크레딧해 상실감을 완화한다 (v2, 크로스모델 리뷰 제안).
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 13 }}>오늘부터</div>
        <div style={{ fontWeight: 300, fontSize: 'clamp(40px,13vw,72px)', lineHeight: 1, color: 'var(--ink-bright)', textShadow: '0 0 30px rgba(101,214,232,.35)', marginTop: 6 }}>
          다시 시작 💧
        </div>
        <div style={{ fontSize: 15, color: 'var(--muted-2)', marginTop: 10 }}>
          {cumulative > 0 ? `지금까지 ${cumulative}일 참아냈어 · 가볍게 다시` : '여기서 새로 쌓아가면 돼'}
        </div>
      </div>
    );
  }
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
