'use client';
export function SafetyNet({ peak, cumulative }: { peak: number; cumulative: number }) {
  return (
    <div className="tabnum" style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
      최고 {peak}일 · 누적 {cumulative}일
    </div>
  );
}
