'use client';
import { useRef, useState } from 'react';
import { DrinkStore } from '@/lib/types';
import { exportJSON, importJSON } from '@/lib/store';

export function ExportImport({ store, replaceStore }: { store: DrinkStore; replaceStore: (s: DrinkStore) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>('');

  const download = () => {
    const blob = new Blob([exportJSON(store)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sober-streak-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      replaceStore(importJSON(store, await file.text()));
      setMsg('가져오기 완료 — 기록을 병합했어.');
    } catch {
      setMsg('가져오기 실패 — 올바른 백업 파일이 아니야.');
    } finally { e.target.value = ''; }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={download} style={row}>백업 내보내기 (JSON)</button>
      <button onClick={() => fileRef.current?.click()} style={row}>백업 가져오기</button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
      {msg && <p role="status" style={{ color: 'var(--muted-2)', fontSize: 13 }}>{msg}</p>}
    </div>
  );
}
const row: React.CSSProperties = { padding: 16, borderRadius: 12, minHeight: 'var(--tap)', textAlign: 'left',
  border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 15 };
