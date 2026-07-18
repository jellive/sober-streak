'use client';
import { useDrinkStore } from '@/hooks/useDrinkStore';
import { Onboarding } from '@/components/Onboarding';
import { BigStreak } from '@/components/BigStreak';
import { SafetyNet } from '@/components/SafetyNet';
import { TodayButtons } from '@/components/TodayButtons';
import { NonAlcoholToggle } from '@/components/NonAlcoholToggle';
import { MiniHeatmap } from '@/components/MiniHeatmap';

export default function Home() {
  const { store, today, metrics, initialize, setDay, getDay, ready } = useDrinkStore();
  if (!ready) return null;
  if (store === null) {
    return <Onboarding today={today} initialize={initialize} />;
  }
  const current = getDay(today);
  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 22 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <BigStreak current={metrics!.current} />
        <SafetyNet peak={metrics!.peak} cumulative={metrics!.cumulative} />
      </div>
      <TodayButtons today={today} current={current} setDay={setDay} />
      <NonAlcoholToggle today={today} current={current} setDay={setDay} />
      <MiniHeatmap today={today} getDay={getDay} />
    </section>
  );
}
