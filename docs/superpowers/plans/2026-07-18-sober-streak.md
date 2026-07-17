# Sober Streak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버 없이 폰에서 매일 한 번 탭하는 초경량 음주/금주 트래커 PWA — 현재/최고/누적 스트릭과 히트맵을 localStorage만으로.

**Architecture:** 순수 로직 계층(날짜·지표·스토어, React 무관 → 유닛 100%)과 React UI 계층을 분리한다. 상태는 `useDrinkStore` 훅 하나가 localStorage를 읽어 화면에 공급. 파생 지표(현재/최고/누적)는 저장하지 않고 순수 함수로 계산. 서버·인증·DB 없음.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript 5, Vitest + React Testing Library(유닛), Playwright(E2E), Serwist(PWA), Vercel 배포, pnpm.

## Global Constraints

- **런타임:** 전부 클라이언트. 서버 로직/DB/인증 **없음**. `use client` 컴포넌트 + localStorage.
- **저장 형태:** `DrinkStore = { days: Record<'YYYY-MM-DD', DrinkDay>, meta: Meta }` 하나를 localStorage 키 `sober-streak:v1`에 통째 JSON.
- **날짜 기준:** 전부 `Asia/Seoul`(KST, 고정 +9, DST 없음). 날짜는 `'YYYY-MM-DD'` 문자열.
- **지표 정의 (고정):**
  - `base = meta.trackingStartDate` = 온보딩에서 입력한 **마지막 음주일**(가장 이른 알려진 날짜).
  - `현재 스트릭 = daysBetween(lastDrinkDate ?? base, today)` (음수면 0). `lastDrinkDate` = `days` 중 `drank===true`이고 `date<=today`인 최대 날짜.
  - `누적 금주일 = (daysBetween(base, today) + 1) − (base~today 구간 drank 날 수)`.
  - `최고 기록 = base~today 매일 streak을 이터레이션하며 얻는 최댓값`.
- **테마:** **다크 단일 커밋** (라이트 미제공). 팔레트 그라운드 `#0a1c2a→#071722→#05121b`, 텍스트 `#d7e8f1`, 뮤트 `#5f8ea0`, 시그널 글로우 `#4fd1e0`.
- **톤:** 마신 날 **빨간 경고·실패 문구 금지**. 마심 = 히트맵 "빈 셀"(아웃라인), 논알콜 = 밝은 점. 히어로에 0 강조 X.
- **모션:** `prefers-reduced-motion` 존중.
- **커버리지:** 전체 ≥80%, `src/lib/**`(지표·날짜·스토어) **100%**.
- **커밋 트레일러:** 각 커밋 마지막 줄 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

```
src/
  lib/
    types.ts        # DrinkDay, Meta, DrinkStore, 상수 (순수)
    date.ts         # KST 날짜 헬퍼: todayKST, daysBetween, addDays, eachDay (순수)
    metrics.ts      # currentStreak, peakStreak, cumulativeSoberDays, lastDrinkDate (순수)
    store.ts        # loadStore/saveStore/upsertDay/setMeta/exportJSON/importJSON/mergeStores
  hooks/
    useDrinkStore.ts # localStorage 바인딩 + 뮤테이션 (React)
  app/
    layout.tsx      # 다크 셸 + 폰트 + 하단 탭
    globals.css     # 물(水) 테마 토큰 + 베이스 스타일
    page.tsx        # 메인 화면 (온보딩 게이트 포함)
    calendar/page.tsx
    settings/page.tsx
  components/
    AppShell.tsx    # 하단 탭 네비 + 콘텐츠 영역
    Onboarding.tsx  # 마지막 음주일 시드 + 홈화면 안내
    BigStreak.tsx   # 히어로 숫자 + 무알콜 라벨
    SafetyNet.tsx   # 최고·누적
    TodayButtons.tsx# 안 마심/마심 + 마심 옵션 시트
    NonAlcoholToggle.tsx
    MiniHeatmap.tsx # 최근 14일
    MonthHeatmap.tsx# 월 그리드
    DayEditor.tsx   # 특정 날짜 편집(backfill)
    ExportImport.tsx
tests/            # (vitest는 *.test.ts 병치, e2e는 여기)
e2e/
  sober.spec.ts
```

파일별 단일 책임: `lib/*`는 순수·테스트가능, `hooks/`는 localStorage 바인딩만, `components/*`는 표현. 같이 바뀌는 것끼리 둔다.

---

## Task 1: 스캐폴드 + 툴링

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/lib/smoke.test.ts`

**Interfaces:**
- Produces: 동작하는 `pnpm dev` / `pnpm test` / `pnpm test:e2e` 환경.

- [ ] **Step 1: Next.js 스캐폴드 생성**

```bash
cd ~/jell/sober-streak
pnpm dlx create-next-app@latest . --ts --app --no-tailwind --no-src-dir --eslint --use-pnpm --import-alias "@/*" --yes
# 이미 docs/, .git 존재 → 덮어쓰기 프롬프트 시 유지. 생성 후 src 디렉터리로 재정리:
mkdir -p src && git mv app src/app 2>/dev/null || true
```
Expected: `pnpm dev` 시 localhost:3000 기동.

- [ ] **Step 2: 테스트/PWA 의존성 추가**

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @playwright/test
pnpm add @serwist/next serwist
pnpm exec playwright install chromium
```

- [ ] **Step 3: 설정 파일 작성**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**'],
      thresholds: { 'src/lib/**': { statements: 100, branches: 100, functions: 100, lines: 100 } },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```
(`pnpm add -D @vitejs/plugin-react` 도 추가.)

`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000', ...devices['iPhone 13'] },
  webServer: { command: 'pnpm build && pnpm start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
});
```

`package.json` scripts 병합:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 4: 스모크 테스트 작성**

`src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
describe('toolchain', () => {
  it('runs vitest', () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: 실행 검증**

Run: `pnpm test`
Expected: 1 passed. `pnpm dev` → 200 OK.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + vitest + playwright + serwist"
```

---

## Task 2: 타입 + KST 날짜 헬퍼 (TDD)

**Files:**
- Create: `src/lib/types.ts`, `src/lib/date.ts`, `src/lib/date.test.ts`

**Interfaces:**
- Produces:
  - `DrinkType`, `DrinkContext`, `DrinkDay`, `Meta`, `DrinkStore`, `SCHEMA_VERSION`, `STORAGE_KEY`
  - `todayKST(now?: Date): string`
  - `daysBetween(from: string, to: string): number` — `to − from` 일수
  - `addDays(date: string, n: number): string`
  - `eachDay(from: string, to: string): string[]` — 양끝 포함

- [ ] **Step 1: 타입 작성**

`src/lib/types.ts`:
```ts
export type DrinkType = '맥주' | '소주' | '사케' | '와인' | '기타';
export type DrinkContext = '회식' | '약속' | '혼술' | '기타';

export interface DrinkDay {
  date: string;          // 'YYYY-MM-DD' (KST)
  drank: boolean;
  nonAlcohol: boolean;
  type?: DrinkType;
  amount?: string;
  context?: DrinkContext;
}

export interface Meta {
  trackingStartDate: string; // 'YYYY-MM-DD' — 시드된 마지막 음주일
  schemaVersion: number;
}

export interface DrinkStore {
  days: Record<string, DrinkDay>;
  meta: Meta;
}

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'sober-streak:v1';
```

- [ ] **Step 2: 실패 테스트 작성**

`src/lib/date.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { todayKST, daysBetween, addDays, eachDay } from './date';

describe('todayKST', () => {
  it('KST 자정 직후 새벽 2시는 그날로 친다', () => {
    // 2026-07-18 02:00 KST = 2026-07-17 17:00 UTC
    expect(todayKST(new Date('2026-07-17T17:00:00Z'))).toBe('2026-07-18');
  });
  it('KST 자정 직전 23:59는 아직 그날', () => {
    // 2026-07-18 23:59 KST = 2026-07-18 14:59 UTC
    expect(todayKST(new Date('2026-07-18T14:59:00Z'))).toBe('2026-07-18');
  });
});

describe('daysBetween', () => {
  it('8일 차이', () => { expect(daysBetween('2026-07-10', '2026-07-18')).toBe(8); });
  it('같은 날은 0', () => { expect(daysBetween('2026-07-18', '2026-07-18')).toBe(0); });
  it('음수도 반환', () => { expect(daysBetween('2026-07-18', '2026-07-10')).toBe(-8); });
  it('월 경계', () => { expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1); });
});

describe('addDays', () => {
  it('더하기/월 경계', () => { expect(addDays('2026-07-18', 1)).toBe('2026-07-19'); expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); });
  it('빼기', () => { expect(addDays('2026-07-18', -8)).toBe('2026-07-10'); });
});

describe('eachDay', () => {
  it('양끝 포함', () => { expect(eachDay('2026-07-16', '2026-07-18')).toEqual(['2026-07-16','2026-07-17','2026-07-18']); });
  it('단일 날', () => { expect(eachDay('2026-07-18', '2026-07-18')).toEqual(['2026-07-18']); });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm exec vitest run src/lib/date.test.ts`
Expected: FAIL — `date.ts` 미존재/함수 없음.

- [ ] **Step 4: 구현**

`src/lib/date.ts`:
```ts
const MS_PER_DAY = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toUTCMidnight(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function todayKST(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTCMidnight(to) - toUTCMidnight(from)) / MS_PER_DAY);
}

export function addDays(date: string, n: number): string {
  return new Date(toUTCMidnight(date) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let cur = from; cur <= to; cur = addDays(cur, 1)) out.push(cur);
  return out;
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm exec vitest run src/lib/date.test.ts`
Expected: PASS (전부).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/date.ts src/lib/date.test.ts
git commit -m "feat(lib): KST date helpers + core types"
```

---

## Task 3: 파생 지표 (TDD, 100%) — 앱의 심장

**Files:**
- Create: `src/lib/metrics.ts`, `src/lib/metrics.test.ts`

**Interfaces:**
- Consumes: `DrinkStore` (Task 2), `daysBetween`/`addDays` (Task 2)
- Produces:
  - `lastDrinkDate(store: DrinkStore, today: string): string | null`
  - `currentStreak(store: DrinkStore, today: string): number`
  - `cumulativeSoberDays(store: DrinkStore, today: string): number`
  - `peakStreak(store: DrinkStore, today: string): number`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/metrics.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DrinkStore, DrinkDay } from './types';
import { lastDrinkDate, currentStreak, cumulativeSoberDays, peakStreak } from './metrics';

function day(date: string, drank: boolean, nonAlcohol = false): DrinkDay {
  return { date, drank, nonAlcohol };
}
// base = 마지막 음주일. 시드는 base에 drank:true 한 행.
function store(base: string, days: DrinkDay[]): DrinkStore {
  const rec: Record<string, DrinkDay> = {};
  for (const d of days) rec[d.date] = d;
  return { days: rec, meta: { trackingStartDate: base, schemaVersion: 1 } };
}

describe('lastDrinkDate', () => {
  it('가장 최근 drank 날', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-14', true), day('2026-07-16', false)]);
    expect(lastDrinkDate(s, '2026-07-18')).toBe('2026-07-14');
  });
  it('오늘 이후 음주는 무시', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-20', true)]);
    expect(lastDrinkDate(s, '2026-07-18')).toBe('2026-07-10');
  });
  it('음주 기록 전무하면 null', () => {
    const s = store('2026-07-10', [day('2026-07-10', false)]);
    expect(lastDrinkDate(s, '2026-07-18')).toBeNull();
  });
});

describe('currentStreak', () => {
  it('시드 8일 전 → 8일차 (온보딩 직후)', () => {
    const s = store('2026-07-10', [day('2026-07-10', true)]);
    expect(currentStreak(s, '2026-07-18')).toBe(8);
  });
  it('오늘 마시면 0', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-18', true)]);
    expect(currentStreak(s, '2026-07-18')).toBe(0);
  });
  it('미기록 공백은 금주로 간주(안 끊김)', () => {
    // 7-14 마심 후 기록 공백만 있음 → 4일차
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-14', true)]);
    expect(currentStreak(s, '2026-07-18')).toBe(4);
  });
  it('음주 기록 없으면 base부터', () => {
    const s = store('2026-07-16', [day('2026-07-16', false)]);
    expect(currentStreak(s, '2026-07-18')).toBe(2);
  });
});

describe('cumulativeSoberDays', () => {
  it('온보딩 직후 8일차면 누적도 8', () => {
    // base 7-10(마심) ~ 7-18: 9일 - 마심 1 = 8
    const s = store('2026-07-10', [day('2026-07-10', true)]);
    expect(cumulativeSoberDays(s, '2026-07-18')).toBe(8);
  });
  it('중간 음주 2회 차감', () => {
    const s = store('2026-07-10', [day('2026-07-10', true), day('2026-07-13', true)]);
    // 9일 - 2 = 7
    expect(cumulativeSoberDays(s, '2026-07-18')).toBe(7);
  });
  it('오늘 이후 음주는 미차감', () => {
    const s = store('2026-07-16', [day('2026-07-16', true), day('2026-07-25', true)]);
    // 7-16~7-18 3일 - 1 = 2
    expect(cumulativeSoberDays(s, '2026-07-18')).toBe(2);
  });
});

describe('peakStreak', () => {
  it('현재 진행 스트릭이 최고면 그 값', () => {
    const s = store('2026-07-10', [day('2026-07-10', true)]);
    expect(peakStreak(s, '2026-07-18')).toBe(8);
  });
  it('과거 더 긴 구간이 최고', () => {
    // 7-01 마심, 7-11 마심(그 사이 10일 간격 → 피크 9), 이후 7일 진행
    const s = store('2026-07-01', [day('2026-07-01', true), day('2026-07-11', true)]);
    expect(peakStreak(s, '2026-07-18')).toBe(9);
  });
  it('base가 음주 아님', () => {
    const s = store('2026-07-16', [day('2026-07-16', false)]);
    expect(peakStreak(s, '2026-07-18')).toBe(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/lib/metrics.test.ts`
Expected: FAIL — `metrics.ts` 미존재.

- [ ] **Step 3: 구현**

`src/lib/metrics.ts`:
```ts
import { DrinkStore } from './types';
import { daysBetween, addDays } from './date';

export function lastDrinkDate(store: DrinkStore, today: string): string | null {
  let last: string | null = null;
  for (const d of Object.values(store.days)) {
    if (d.drank && d.date <= today && (last === null || d.date > last)) last = d.date;
  }
  return last;
}

export function currentStreak(store: DrinkStore, today: string): number {
  const base = lastDrinkDate(store, today) ?? store.meta.trackingStartDate;
  return Math.max(0, daysBetween(base, today));
}

export function cumulativeSoberDays(store: DrinkStore, today: string): number {
  const base = store.meta.trackingStartDate;
  const totalInclusive = daysBetween(base, today) + 1;
  let drankCount = 0;
  for (const d of Object.values(store.days)) {
    if (d.drank && d.date >= base && d.date <= today) drankCount += 1;
  }
  return Math.max(0, totalInclusive - drankCount);
}

export function peakStreak(store: DrinkStore, today: string): number {
  const base = store.meta.trackingStartDate;
  if (today < base) return 0;
  let streak = 0;
  let peak = 0;
  for (let cur = base; cur <= today; cur = addDays(cur, 1)) {
    const d = store.days[cur];
    if (cur === base) streak = 0;
    else if (d && d.drank) streak = 0;
    else streak += 1;
    if (streak > peak) peak = streak;
  }
  return peak;
}
```

- [ ] **Step 4: 통과 + 커버리지 100% 확인**

Run: `pnpm exec vitest run src/lib/metrics.test.ts --coverage`
Expected: PASS 전부, `src/lib/metrics.ts` 100%.

- [ ] **Step 5: Commit**

```bash
git add src/lib/metrics.ts src/lib/metrics.test.ts
git commit -m "feat(lib): derived metrics (current/peak/cumulative) with 100% coverage"
```

---

## Task 4: 스토어 — localStorage + export/import 병합 (TDD)

**Files:**
- Create: `src/lib/store.ts`, `src/lib/store.test.ts`

**Interfaces:**
- Consumes: `DrinkStore`, `DrinkDay`, `Meta`, `STORAGE_KEY`, `SCHEMA_VERSION` (Task 2)
- Produces:
  - `emptyStore(base: string): DrinkStore`
  - `loadStore(): DrinkStore | null`
  - `saveStore(store: DrinkStore): void`
  - `upsertDay(store: DrinkStore, day: DrinkDay): DrinkStore` (순수, 새 객체 반환)
  - `exportJSON(store: DrinkStore): string`
  - `mergeStores(a: DrinkStore, b: DrinkStore): DrinkStore` (b가 최신 우선; base는 더 이른 날)
  - `importJSON(current: DrinkStore, json: string): DrinkStore`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/store.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { emptyStore, loadStore, saveStore, upsertDay, exportJSON, importJSON, mergeStores } from './store';
import { STORAGE_KEY } from './types';

beforeEach(() => localStorage.clear());

describe('save/load', () => {
  it('저장한 걸 그대로 읽는다', () => {
    const s = emptyStore('2026-07-10');
    saveStore(s);
    expect(loadStore()).toEqual(s);
  });
  it('없으면 null', () => { expect(loadStore()).toBeNull(); });
  it('깨진 JSON이면 null', () => { localStorage.setItem(STORAGE_KEY, '{oops'); expect(loadStore()).toBeNull(); });
});

describe('upsertDay', () => {
  it('새 날 추가(불변)', () => {
    const s = emptyStore('2026-07-10');
    const s2 = upsertDay(s, { date: '2026-07-18', drank: false, nonAlcohol: true });
    expect(s2.days['2026-07-18'].nonAlcohol).toBe(true);
    expect(s.days['2026-07-18']).toBeUndefined(); // 원본 불변
  });
  it('같은 날 덮어쓰기', () => {
    let s = emptyStore('2026-07-10');
    s = upsertDay(s, { date: '2026-07-18', drank: true, nonAlcohol: false });
    s = upsertDay(s, { date: '2026-07-18', drank: false, nonAlcohol: false });
    expect(s.days['2026-07-18'].drank).toBe(false);
  });
});

describe('export/import 왕복', () => {
  it('무손실 왕복', () => {
    let s = emptyStore('2026-07-10');
    s = upsertDay(s, { date: '2026-07-18', drank: true, nonAlcohol: false, type: '맥주' });
    const json = exportJSON(s);
    expect(importJSON(emptyStore('2026-07-15'), json)).toEqual(s);
  });
  it('깨진 import는 throw', () => {
    expect(() => importJSON(emptyStore('2026-07-10'), 'nope')).toThrow();
  });
});

describe('mergeStores', () => {
  it('더 이른 base 채택', () => {
    const a = emptyStore('2026-07-10'); const b = emptyStore('2026-07-05');
    expect(mergeStores(a, b).meta.trackingStartDate).toBe('2026-07-05');
  });
  it('겹치는 날은 b(import) 우선', () => {
    let a = emptyStore('2026-07-10'); let b = emptyStore('2026-07-10');
    a = upsertDay(a, { date: '2026-07-18', drank: true, nonAlcohol: false });
    b = upsertDay(b, { date: '2026-07-18', drank: false, nonAlcohol: true });
    expect(mergeStores(a, b).days['2026-07-18'].nonAlcohol).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/lib/store.test.ts`
Expected: FAIL — `store.ts` 미존재.

- [ ] **Step 3: 구현**

`src/lib/store.ts`:
```ts
import { DrinkStore, DrinkDay, STORAGE_KEY, SCHEMA_VERSION } from './types';

export function emptyStore(base: string): DrinkStore {
  return { days: {}, meta: { trackingStartDate: base, schemaVersion: SCHEMA_VERSION } };
}

export function loadStore(): DrinkStore | null {
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DrinkStore;
    if (!parsed || typeof parsed !== 'object' || !parsed.meta || !parsed.days) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStore(store: DrinkStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function upsertDay(store: DrinkStore, day: DrinkDay): DrinkStore {
  return { ...store, days: { ...store.days, [day.date]: day } };
}

export function exportJSON(store: DrinkStore): string {
  return JSON.stringify(store, null, 2);
}

export function mergeStores(a: DrinkStore, b: DrinkStore): DrinkStore {
  const base = a.meta.trackingStartDate < b.meta.trackingStartDate
    ? a.meta.trackingStartDate : b.meta.trackingStartDate;
  return {
    days: { ...a.days, ...b.days }, // b 우선
    meta: { trackingStartDate: base, schemaVersion: SCHEMA_VERSION },
  };
}

export function importJSON(current: DrinkStore, json: string): DrinkStore {
  const parsed = JSON.parse(json) as DrinkStore; // 깨지면 throw
  if (!parsed?.meta?.trackingStartDate || !parsed.days) throw new Error('invalid store JSON');
  return mergeStores(current, parsed);
}
```

- [ ] **Step 4: 통과 + 커버리지 확인**

Run: `pnpm exec vitest run src/lib/store.test.ts --coverage`
Expected: PASS, `src/lib/store.ts` 100%.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.ts src/lib/store.test.ts
git commit -m "feat(lib): localStorage store + export/import merge"
```

---

## Task 5: useDrinkStore 훅 (TDD, RTL)

**Files:**
- Create: `src/hooks/useDrinkStore.ts`, `src/hooks/useDrinkStore.test.tsx`

**Interfaces:**
- Consumes: `store.ts` 전체, `todayKST` (Task 2), 지표 (Task 3)
- Produces (hook 반환):
  - `store: DrinkStore | null` (null = 온보딩 필요)
  - `today: string`
  - `metrics: { current: number; peak: number; cumulative: number } | null`
  - `initialize(lastDrinkDate: string): void`
  - `setDay(day: DrinkDay): void`
  - `getDay(date: string): DrinkDay | undefined`
  - `replaceStore(next: DrinkStore): void`

- [ ] **Step 1: 실패 테스트 작성**

`src/hooks/useDrinkStore.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrinkStore } from './useDrinkStore';

beforeEach(() => localStorage.clear());

describe('useDrinkStore', () => {
  it('초기엔 store=null(온보딩 필요)', () => {
    const { result } = renderHook(() => useDrinkStore());
    expect(result.current.store).toBeNull();
    expect(result.current.metrics).toBeNull();
  });

  it('initialize 후 지표 계산 + 영속', () => {
    const { result } = renderHook(() => useDrinkStore());
    act(() => result.current.initialize('2026-07-10'));
    expect(result.current.store?.meta.trackingStartDate).toBe('2026-07-10');
    expect(result.current.metrics?.current).toBeGreaterThanOrEqual(0);
    expect(localStorage.getItem('sober-streak:v1')).toBeTruthy();
  });

  it('setDay 반영', () => {
    const { result } = renderHook(() => useDrinkStore());
    act(() => result.current.initialize('2026-07-10'));
    act(() => result.current.setDay({ date: result.current.today, drank: false, nonAlcohol: true }));
    expect(result.current.getDay(result.current.today)?.nonAlcohol).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/hooks/useDrinkStore.test.tsx`
Expected: FAIL — hook 미존재.

- [ ] **Step 3: 구현**

`src/hooks/useDrinkStore.ts`:
```ts
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DrinkDay, DrinkStore } from '@/lib/types';
import { loadStore, saveStore, upsertDay, emptyStore } from '@/lib/store';
import { todayKST } from '@/lib/date';
import { currentStreak, peakStreak, cumulativeSoberDays } from '@/lib/metrics';

export function useDrinkStore() {
  const [store, setStore] = useState<DrinkStore | null>(null);
  const [today, setToday] = useState(() => todayKST());

  useEffect(() => {
    setStore(loadStore());
    setToday(todayKST());
  }, []);

  const persist = useCallback((next: DrinkStore) => {
    saveStore(next);
    setStore(next);
  }, []);

  const initialize = useCallback((lastDrinkDate: string) => {
    let next = emptyStore(lastDrinkDate);
    next = upsertDay(next, { date: lastDrinkDate, drank: true, nonAlcohol: false });
    persist(next);
  }, [persist]);

  const setDay = useCallback((day: DrinkDay) => {
    setStore((prev) => {
      const base = prev ?? emptyStore(day.date);
      const next = upsertDay(base, day);
      saveStore(next);
      return next;
    });
  }, []);

  const getDay = useCallback((date: string) => store?.days[date], [store]);

  const metrics = useMemo(() => {
    if (!store) return null;
    return {
      current: currentStreak(store, today),
      peak: peakStreak(store, today),
      cumulative: cumulativeSoberDays(store, today),
    };
  }, [store, today]);

  return { store, today, metrics, initialize, setDay, getDay, replaceStore: persist };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm exec vitest run src/hooks/useDrinkStore.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDrinkStore.ts src/hooks/useDrinkStore.test.tsx
git commit -m "feat(hooks): useDrinkStore — localStorage binding + live metrics"
```

---

## Task 6: 앱 셸 + 물(水) 테마 + 하단 탭

**Files:**
- Create: `src/components/AppShell.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: 없음(표현)
- Produces: `AppShell` — 하단 탭(메인/캘린더/설정) + `children` 콘텐츠 슬롯. CSS 토큰 `--bg-*`, `--ink`, `--muted`, `--glow`.

- [ ] **Step 1: 테마 토큰 작성**

`src/app/globals.css` (전체 교체):
```css
:root {
  --bg-0: #0a1c2a; --bg-1: #071722; --bg-2: #05121b;
  --ink: #d7e8f1; --muted: #5f8ea0; --muted-2: #6b98ab;
  --glow: #4fd1e0; --line: rgba(120,180,200,.16);
  --tap: 44px;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  color: var(--ink);
  background: radial-gradient(120% 80% at 50% 22%, rgba(79,209,224,.14), transparent 55%),
              linear-gradient(var(--bg-0), var(--bg-1) 42%, var(--bg-2));
  background-attachment: fixed;
  font-family: 'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.tabnum { font-variant-numeric: tabular-nums; }
:focus-visible { outline: 2px solid var(--glow); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```
(폰트: `pnpm add pretendard` 후 layout에서 import. Latin thin 숫자용은 Task 8에서 확정.)

- [ ] **Step 2: 레이아웃 작성**

`src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = { title: 'Sober Streak', description: '금주 스트릭 트래커' };
export const viewport: Viewport = { themeColor: '#071722', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
```

- [ ] **Step 3: AppShell 작성**

`src/components/AppShell.tsx`:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '메인' },
  { href: '/calendar', label: '캘린더' },
  { href: '/settings', label: '설정' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
      <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0 calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--line)' }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? 'page' : undefined}
            style={{ color: path === t.href ? 'var(--ink)' : 'var(--muted)', textDecoration: 'none', fontWeight: path === t.href ? 700 : 500, fontSize: 14, minWidth: 'var(--tap)', textAlign: 'center' }}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: 검증**

Run: `pnpm dev` → 하단 탭 3개, 물 배경, 탭 이동 동작. (임시 `page.tsx`가 있어야 하므로 Task 8에서 대체 전까지 "Hello".)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/AppShell.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): water(水) dark theme shell + bottom tabs"
```

---

## Task 7: 온보딩 (마지막 음주일 시드 + 홈화면 안내)

**Files:**
- Create: `src/components/Onboarding.tsx`

**Interfaces:**
- Consumes: `useDrinkStore().initialize`, `today` (Task 5)
- Produces: `Onboarding` — `onDone` 없이 훅 `initialize` 직접 호출. 마지막 음주일 `<input type="date" max={today}>` + "오늘 처음이라 오늘 마셨다" 지름길 + 홈화면 안내 문구.

- [ ] **Step 1: 실패 테스트 작성**

`src/components/Onboarding.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding } from './Onboarding';

describe('Onboarding', () => {
  it('날짜 선택 후 시작하면 initialize 호출', () => {
    const initialize = vi.fn();
    render(<Onboarding today="2026-07-18" initialize={initialize} />);
    fireEvent.change(screen.getByLabelText('마지막으로 마신 날'), { target: { value: '2026-07-10' } });
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));
    expect(initialize).toHaveBeenCalledWith('2026-07-10');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run src/components/Onboarding.test.tsx`
Expected: FAIL.

- [ ] **Step 3: 구현**

`src/components/Onboarding.tsx`:
```tsx
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
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm exec vitest run src/components/Onboarding.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Onboarding.tsx src/components/Onboarding.test.tsx
git commit -m "feat(ui): onboarding — seed last-drink date + home-screen hint"
```

---

## Task 8: 메인 화면 (히어로 + 버튼 + 토글 + 미니 히트맵)

**Files:**
- Create: `src/components/BigStreak.tsx`, `src/components/SafetyNet.tsx`, `src/components/TodayButtons.tsx`, `src/components/NonAlcoholToggle.tsx`, `src/components/MiniHeatmap.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useDrinkStore` (Task 5), `Onboarding` (Task 7), `eachDay`/`addDays` (Task 2)
- Produces: 메인 화면 = 온보딩 게이트 → 히어로(현재/무알콜) + 안전망(최고·누적) + 오늘 버튼 + 논알콜 토글 + 최근 14일 히트맵.

- [ ] **Step 1: 히트맵 색 규칙 테스트 작성**

`src/components/MiniHeatmap.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { cellClass } from './MiniHeatmap';

describe('cellClass', () => {
  it('마심=drank(빈 셀), 안마심=sober, 미기록=empty', () => {
    expect(cellClass({ date: 'x', drank: true, nonAlcohol: false })).toBe('drank');
    expect(cellClass({ date: 'x', drank: false, nonAlcohol: false })).toBe('sober');
    expect(cellClass(undefined)).toBe('empty');
  });
  it('논알콜은 점 부여(안마심 유지)', () => {
    expect(cellClass({ date: 'x', drank: false, nonAlcohol: true })).toBe('sober na');
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현**

Run: `pnpm exec vitest run src/components/MiniHeatmap.test.tsx` → FAIL.

`src/components/MiniHeatmap.tsx`:
```tsx
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
          background: cls.startsWith('sober') ? 'linear-gradient(var(--glow),#2f8fa6)' : 'rgba(255,255,255,.05)',
          boxShadow: cls === 'drank' ? 'inset 0 0 0 1px rgba(150,190,205,.35)' : 'none',
        }}>
          {cls.includes('na') && <i style={{ position: 'absolute', inset: 0, margin: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#eafaff' }} />}
        </span>;
      })}
    </div>
  );
}
```
Run again → PASS.

- [ ] **Step 3: BigStreak / SafetyNet 작성**

`src/components/BigStreak.tsx`:
```tsx
'use client';
export function BigStreak({ current }: { current: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 13 }}>현재 스트릭</div>
      <div className="tabnum" style={{ fontWeight: 200, fontSize: 'clamp(96px,34vw,168px)', lineHeight: .85, color: '#eafaff', textShadow: '0 0 40px rgba(101,214,232,.5)' }}>
        {current}<span style={{ fontSize: '.28em', fontWeight: 300, color: 'var(--glow)', marginLeft: 6 }}>일</span>
      </div>
      <div style={{ fontSize: 17, color: 'var(--muted-2)', marginTop: 4 }}>무알콜 💧</div>
    </div>
  );
}
```

`src/components/SafetyNet.tsx`:
```tsx
'use client';
export function SafetyNet({ peak, cumulative }: { peak: number; cumulative: number }) {
  return (
    <div className="tabnum" style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
      최고 {peak}일 · 누적 {cumulative}일
    </div>
  );
}
```

- [ ] **Step 4: TodayButtons / NonAlcoholToggle 작성**

`src/components/TodayButtons.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { DrinkDay, DrinkType, DrinkContext } from '@/lib/types';

const TYPES: DrinkType[] = ['맥주', '소주', '사케', '와인', '기타'];
const CONTEXTS: DrinkContext[] = ['회식', '약속', '혼술', '기타'];

export function TodayButtons({ today, current, setDay }: {
  today: string; current: DrinkDay | undefined; setDay: (d: DrinkDay) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const drank = current?.drank ?? false;
  const base = (over: Partial<DrinkDay>): DrinkDay => ({
    date: today, drank: false, nonAlcohol: current?.nonAlcohol ?? false, ...current, ...over,
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center', color: 'var(--muted-2)', fontSize: 15 }}>오늘 마셨어?</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setDay(base({ drank: false, type: undefined, amount: undefined, context: undefined }))}
          aria-pressed={!drank}
          style={{ flex: 1, padding: 16, borderRadius: 14, minHeight: 'var(--tap)', fontWeight: 600, fontSize: 16,
            border: '1px solid rgba(126,220,238,.3)', background: !drank ? 'rgba(120,220,238,.16)' : 'transparent', color: 'var(--ink)' }}>
          안 마심
        </button>
        <button onClick={() => { setDay(base({ drank: true })); setSheet(true); }}
          aria-pressed={drank}
          style={{ flex: 1, padding: 16, borderRadius: 14, minHeight: 'var(--tap)', fontWeight: 600, fontSize: 16,
            border: '1px solid rgba(120,160,180,.4)', background: drank ? 'rgba(120,160,180,.18)' : 'transparent', color: 'var(--muted-2)' }}>
          마심
        </button>
      </div>
      {sheet && drank && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>기록 (스킵 가능)</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((t) => (
              <button key={t} onClick={() => setDay(base({ drank: true, type: t }))}
                aria-pressed={current?.type === t}
                style={chip(current?.type === t)}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONTEXTS.map((c) => (
              <button key={c} onClick={() => setDay(base({ drank: true, context: c }))}
                aria-pressed={current?.context === c}
                style={chip(current?.context === c)}>{c}</button>
            ))}
          </div>
          <button onClick={() => setSheet(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--glow)', fontSize: 14 }}>완료</button>
        </div>
      )}
    </div>
  );
}
function chip(active: boolean): React.CSSProperties {
  return { padding: '8px 14px', borderRadius: 20, fontSize: 14, minHeight: 'var(--tap)',
    border: '1px solid var(--line)', background: active ? 'var(--glow)' : 'transparent', color: active ? '#06202b' : 'var(--ink)' };
}
```

`src/components/NonAlcoholToggle.tsx`:
```tsx
'use client';
import { DrinkDay } from '@/lib/types';
export function NonAlcoholToggle({ today, current, setDay }: {
  today: string; current: DrinkDay | undefined; setDay: (d: DrinkDay) => void;
}) {
  const on = current?.nonAlcohol ?? false;
  return (
    <button role="switch" aria-checked={on} aria-label="논알콜 마심"
      onClick={() => setDay({ date: today, drank: current?.drank ?? false, nonAlcohol: !on, type: current?.type, amount: current?.amount, context: current?.context })}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, minHeight: 'var(--tap)',
        border: '1px solid rgba(120,180,200,.16)', background: 'rgba(255,255,255,.05)', color: 'var(--ink)', fontSize: 15, width: '100%' }}>
      <span>🍺🚫 논알콜 마심</span>
      <span style={{ width: 40, height: 24, borderRadius: 20, background: on ? 'var(--glow)' : 'rgba(120,180,200,.3)', position: 'relative', transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#06202b', transition: 'left .2s' }} />
      </span>
    </button>
  );
}
```

- [ ] **Step 5: 메인 페이지 조립**

`src/app/page.tsx`:
```tsx
'use client';
import { useDrinkStore } from '@/hooks/useDrinkStore';
import { Onboarding } from '@/components/Onboarding';
import { BigStreak } from '@/components/BigStreak';
import { SafetyNet } from '@/components/SafetyNet';
import { TodayButtons } from '@/components/TodayButtons';
import { NonAlcoholToggle } from '@/components/NonAlcoholToggle';
import { MiniHeatmap } from '@/components/MiniHeatmap';

export default function Home() {
  const { store, today, metrics, initialize, setDay, getDay } = useDrinkStore();
  if (store === null) {
    // 로드 전(null)엔 온보딩. 실제 미초기화와 로딩을 구분하려면 mounted 플래그를 쓰되, MVP는 동일 처리.
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
```
> **주의(온보딩 게이트):** `loadStore()`가 초기 `null`을 반환하는 로딩 프레임과 "미초기화"를 구분하기 위해, Task 5 훅에 `ready` 플래그(첫 `useEffect` 후 `true`)를 더해 `ready && !store`일 때만 온보딩을 보이도록 후속 보강. MVP 1차는 위 단순 처리 허용.

- [ ] **Step 6: 유닛 통과 + 수동 확인**

Run: `pnpm exec vitest run src/components/`
Expected: PASS. `pnpm dev` → 온보딩 → 8일 히어로 → 버튼/토글/히트맵 동작, 마심 눌러도 빨간 경고 없음.

- [ ] **Step 7: Commit**

```bash
git add src/components src/app/page.tsx
git commit -m "feat(ui): main screen — hero streak, safety-net, today buttons, non-alcohol, mini heatmap"
```

---

## Task 9: 캘린더 월 히트맵 + 날짜 편집(backfill)

**Files:**
- Create: `src/components/MonthHeatmap.tsx`, `src/components/DayEditor.tsx`, `src/app/calendar/page.tsx`

**Interfaces:**
- Consumes: `useDrinkStore`, `cellClass` (Task 8), `eachDay`/`addDays` (Task 2)
- Produces: 월 그리드(이전/다음 달 이동) + 날짜 탭 → `DayEditor`(그날 drank/nonAlcohol/type/context 편집·저장).

- [ ] **Step 1: 월 그리드 날짜 계산 테스트**

`src/components/MonthHeatmap.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { monthGrid } from './MonthHeatmap';
describe('monthGrid', () => {
  it('2026-07은 1일이 수요일, 31일까지', () => {
    const g = monthGrid('2026-07');
    expect(g.leadBlanks).toBe(3); // 일=0..수=3
    expect(g.days[0]).toBe('2026-07-01');
    expect(g.days.at(-1)).toBe('2026-07-31');
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현**

`src/components/MonthHeatmap.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { DrinkDay } from '@/lib/types';
import { cellClass } from './MiniHeatmap';

export function monthGrid(month: string): { leadBlanks: number; days: string[] } {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const leadBlanks = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  return { leadBlanks, days };
}

export function MonthHeatmap({ initialMonth, getDay, onPick }: {
  initialMonth: string; getDay: (d: string) => DrinkDay | undefined; onPick: (date: string) => void;
}) {
  const [month, setMonth] = useState(initialMonth);
  const { leadBlanks, days } = monthGrid(month);
  const shift = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={() => shift(-1)} aria-label="이전 달" style={navBtn}>‹</button>
        <strong className="tabnum">{month}</strong>
        <button onClick={() => shift(1)} aria-label="다음 달" style={navBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {Array.from({ length: leadBlanks }).map((_, i) => <span key={`b${i}`} />)}
        {days.map((d) => {
          const cls = cellClass(getDay(d));
          return <button key={d} onClick={() => onPick(d)} aria-label={d} data-cell={cls} style={{
            aspectRatio: '1', borderRadius: 6, border: 'none', position: 'relative', cursor: 'pointer',
            background: cls.startsWith('sober') ? 'linear-gradient(var(--glow),#2f8fa6)' : 'rgba(255,255,255,.05)',
            boxShadow: cls === 'drank' ? 'inset 0 0 0 1px rgba(150,190,205,.35)' : 'none',
          }}>
            {cls.includes('na') && <i style={{ position: 'absolute', inset: 0, margin: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#eafaff' }} />}
          </button>;
        })}
      </div>
    </div>
  );
}
const navBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--glow)', fontSize: 24, minWidth: 'var(--tap)', minHeight: 'var(--tap)', cursor: 'pointer' };
```
Run `pnpm exec vitest run src/components/MonthHeatmap.test.tsx` → PASS.

- [ ] **Step 3: DayEditor 작성**

`src/components/DayEditor.tsx`:
```tsx
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
    border: '1px solid var(--line)', background: active ? 'var(--glow)' : 'rgba(255,255,255,.05)', color: active ? '#06202b' : 'var(--ink)' };
}
```

- [ ] **Step 4: 캘린더 페이지 조립**

`src/app/calendar/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useDrinkStore } from '@/hooks/useDrinkStore';
import { MonthHeatmap } from '@/components/MonthHeatmap';
import { DayEditor } from '@/components/DayEditor';

export default function Calendar() {
  const { store, today, setDay, getDay } = useDrinkStore();
  const [picked, setPicked] = useState<string | null>(null);
  if (!store) return <p style={{ padding: 24, color: 'var(--muted)' }}>먼저 메인에서 시작해줘.</p>;
  return (
    <>
      <MonthHeatmap initialMonth={today.slice(0, 7)} getDay={getDay} onPick={setPicked} />
      {picked && <DayEditor date={picked} current={getDay(picked)} setDay={setDay} onClose={() => setPicked(null)} />}
    </>
  );
}
```

- [ ] **Step 5: 통과 + 수동 확인**

Run: `pnpm exec vitest run src/components/MonthHeatmap.test.tsx`
Expected: PASS. `pnpm dev` → 캘린더 탭 → 달 이동 → 날짜 탭 → 편집 저장 반영.

- [ ] **Step 6: Commit**

```bash
git add src/components/MonthHeatmap.tsx src/components/MonthHeatmap.test.tsx src/components/DayEditor.tsx src/app/calendar/page.tsx
git commit -m "feat(ui): calendar month heatmap + day editor (backfill)"
```

---

## Task 10: 설정 (JSON export/import + 초기화)

**Files:**
- Create: `src/components/ExportImport.tsx`, `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `useDrinkStore` (store, replaceStore), `exportJSON`/`importJSON` (Task 4)
- Produces: 내보내기(파일 다운로드) + 가져오기(파일 선택→병합) + 데이터 초기화.

- [ ] **Step 1: 구현 (ExportImport)**

`src/components/ExportImport.tsx`:
```tsx
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
  border: '1px solid var(--line)', background: 'rgba(255,255,255,.05)', color: 'var(--ink)', fontSize: 15 };
```

- [ ] **Step 2: 설정 페이지 조립**

`src/app/settings/page.tsx`:
```tsx
'use client';
import { useDrinkStore } from '@/hooks/useDrinkStore';
import { ExportImport } from '@/components/ExportImport';
import { STORAGE_KEY } from '@/lib/types';

export default function Settings() {
  const { store, replaceStore } = useDrinkStore();
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
```
> 초기화 버튼만 예외적으로 경고색(붉은기) 허용 — 파괴적 동작 표준. 스트릭/음주 기록 표시엔 절대 사용 금지(Global Constraints 톤).

- [ ] **Step 3: 수동 확인 + Commit**

Run: `pnpm dev` → 설정 → 내보내기 파일 생성, 가져오기 병합, 초기화 동작.
```bash
git add src/components/ExportImport.tsx src/app/settings/page.tsx
git commit -m "feat(ui): settings — JSON export/import + reset"
```

---

## Task 11: PWA (매니페스트 + Serwist SW + 아이콘)

**Files:**
- Create: `src/app/manifest.ts`, `src/app/sw.ts`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: 설치 가능 + 오프라인 셸 캐시.

- [ ] **Step 1: 매니페스트**

`src/app/manifest.ts`:
```ts
import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sober Streak', short_name: 'Sober', start_url: '/', display: 'standalone',
    background_color: '#071722', theme_color: '#071722',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}
```

- [ ] **Step 2: Serwist 서비스워커 + next.config**

`src/app/sw.ts`:
```ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: any };
const serwist = new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting: true, clientsClaim: true, navigationPreload: true, runtimeCaching: defaultCache });
serwist.addEventListeners();
```

`next.config.ts`:
```ts
import withSerwistInit from '@serwist/next';
const withSerwist = withSerwistInit({ swSrc: 'src/app/sw.ts', swDest: 'public/sw.js', disable: process.env.NODE_ENV === 'development' });
export default withSerwist({});
```

- [ ] **Step 3: 아이콘 생성**

물 테마 아이콘(💧, `#071722` 배경) 192/512 PNG를 `public/`에 배치. (디자인 에셋 — 간단 SVG→PNG 또는 임시 단색 물방울.)

- [ ] **Step 4: 빌드 검증 + Commit**

Run: `pnpm build` → SW 생성 확인. `pnpm start` 후 크롬 DevTools → Application → Manifest/Service Worker/Installable.
```bash
git add src/app/manifest.ts src/app/sw.ts next.config.ts public/icon-192.png public/icon-512.png
git commit -m "feat(pwa): installable manifest + serwist offline shell"
```

---

## Task 12: E2E (Playwright)

**Files:**
- Create: `e2e/sober.spec.ts`

**Interfaces:**
- Consumes: 전체 앱(빌드본).

- [ ] **Step 1: E2E 시나리오 작성**

`e2e/sober.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('온보딩 → 스트릭 표시 → 새로고침 생존', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('마지막으로 마신 날').fill('2026-07-10');
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.locator('.tabnum').first()).toContainText('일'); // 히어로 렌더
  await page.reload();
  await expect(page.getByText('현재 스트릭')).toBeVisible(); // 온보딩으로 안 돌아감 = 영속
});

test('마심 눌러도 빨간 경고/실패 문구 없음', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('마지막으로 마신 날').fill('2026-07-10');
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.getByRole('button', { name: '마심' }).click();
  await expect(page.getByText(/실패|경고|망쳤|다 날아|끝장/)).toHaveCount(0);
});

test('백업 내보내기 파일 생성', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('마지막으로 마신 날').fill('2026-07-10');
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.goto('/settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '백업 내보내기 (JSON)' }).click(),
  ]);
  expect(download.suggestedFilename()).toContain('sober-streak');
});
```

- [ ] **Step 2: 실행**

Run: `pnpm test:e2e`
Expected: 3 passed.

- [ ] **Step 3: Commit**

```bash
git add e2e/sober.spec.ts playwright.config.ts
git commit -m "test(e2e): onboarding persistence, no-warning tone, backup export"
```

---

## Task 13: 배포 준비 (Vercel + README)

**Files:**
- Create: `README.md`, `vercel.json`(선택)

- [ ] **Step 1: README + 빌드 최종 점검**

`README.md`에 실행/배포 요약. Run: `pnpm build` 무에러, `pnpm test` 전 통과(커버리지 게이트 포함).

- [ ] **Step 2: Vercel 배포**

```bash
pnpm dlx vercel@latest --prod
```
배포 후 폰 Safari에서 열어 "홈 화면에 추가" → 오프라인 동작 + 스트릭 유지 확인.

- [ ] **Step 3: Commit**

```bash
git add README.md vercel.json
git commit -m "chore: deploy prep — README + vercel"
```

---

## Self-Review

**1. Spec coverage:**
- §1 목적/성공기준 → Task 8(1탭 기록), Task 8 히어로(3숫자), Task 10/11(데이터 안 날아감). ✅
- §2 스코프 in → Task 7~10 전부 커버. out(로그인/서버/알림/목표/뱃지) → 미구현 유지. ✅
- §3 결정 Q1~Q5 + 상실감 → 지표 정의(Task 3), 시드(Task 7), 논알콜 독립(Task 8), localStorage(Task 4/11), 3숫자+무경고(Task 8). ✅
- §4 데이터 모델 → Task 2 types. ✅
- §5 파생 지표 + 엣지 → Task 3 (KST/미기록/시드/오늘음주 전부 테스트). ✅
- §6 durability → Task 7(홈화면 안내) + Task 10(export/import) + Task 11(오프라인). ✅
- §7 화면/톤 → Task 6~10. ✅
- §8/8.1 스택·비주얼 B물 → Task 1(스택), Task 6(테마), Task 8(thin 히어로/글로우). ✅
- §9 테스트 → Task 2~5 유닛 + Task 12 E2E. ✅

**2. Placeholder scan:** 실제 코드/명령/기대결과 명시. 아이콘 에셋(Task 11-3)만 디자인 산출물로 남김 — 코드 아님, 의도적.

**3. Type consistency:** `DrinkStore`/`DrinkDay`/`Meta` 시그니처 Task 2 정의 → 3/4/5/8/9/10에서 동일 사용. `cellClass`(Task 8) → Task 9 재사용. `initialize(lastDrinkDate)`/`setDay(day)`/`replaceStore` 훅 인터페이스 일관. 지표 정의(base=trackingStartDate=마지막 음주일) Global Constraints ↔ Task 3 구현 일치.

**보강 노트:** Task 8 온보딩 게이트의 로딩/미초기화 구분은 Task 5 훅에 `ready` 플래그로 후속 보강(문서화됨). MVP 1차 동작엔 지장 없음.
