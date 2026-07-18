'use client';
import { useDrinkStore } from '@/hooks/useDrinkStore';
import { ExportImport } from '@/components/ExportImport';
import { STORAGE_KEY } from '@/lib/types';

export default function Settings() {
  const { store, replaceStore, ready } = useDrinkStore();
  if (!ready) return null;
  if (!store) return <p style={{ padding: 24, color: 'var(--muted)' }}>먼저 메인에서 시작해줘.</p>;
  const reset = () => {
    if (confirm('모든 기록을 지울까? 되돌릴 수 없어.')) { localStorage.removeItem(STORAGE_KEY); location.href = '/'; }
  };
  return (
    <section style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, margin: 0 }}>설정</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>데이터 백업</span>
        <ExportImport store={store} replaceStore={replaceStore} />
      </div>
      <button onClick={reset} style={{ padding: 16, borderRadius: 12, minHeight: 'var(--tap)', border: '1px solid rgba(180,90,90,.4)', background: 'transparent', color: '#c98a8a', fontSize: 15, textAlign: 'left' }}>
        데이터 초기화
      </button>
    </section>
  );
}
