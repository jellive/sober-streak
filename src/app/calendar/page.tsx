'use client';
import { useState } from 'react';
import { useDrinkStore } from '@/hooks/useDrinkStore';
import { MonthHeatmap } from '@/components/MonthHeatmap';
import { DayEditor } from '@/components/DayEditor';

export default function Calendar() {
  const { store, ready, today, setDay, getDay } = useDrinkStore();
  const [picked, setPicked] = useState<string | null>(null);
  if (!ready) return null;
  if (!store) return <p style={{ padding: 24, color: 'var(--muted)' }}>먼저 메인에서 시작해줘.</p>;
  return (
    <>
      <MonthHeatmap initialMonth={today.slice(0, 7)} getDay={getDay} onPick={setPicked} />
      {picked && <DayEditor date={picked} current={getDay(picked)} setDay={setDay} onClose={() => setPicked(null)} />}
    </>
  );
}
