# Sober Streak (금주 스트릭)

초경량 음주/금주 트래커 PWA. 서버도, 계정도, DB도 없이 브라우저 `localStorage` 하나로
현재 스트릭·최고 기록·누적 금주일을 추적한다.

## 뭘 하는 앱인가

- **오늘 마셨어? / 안 마셨어** 한 탭으로 기록 (논알콜 여부는 별도 토글로 독립 기록)
- 메인 화면에 세 가지 숫자만: **현재 스트릭 / 최고 스트릭 / 누적 금주일**
- 최근 기록을 보여주는 미니 히트맵 + 월 단위 캘린더(날짜별 편집)
- 설정에서 JSON 백업 내보내기/가져오기, 초기화
- 설치형 PWA (오프라인 동작, 홈 화면 아이콘)
- **무경고 톤**: "마셨음"을 눌러도 빨간 경고나 실패 문구가 뜨지 않는다. 판단하지 않고 그냥 기록만 한다.

### 지표 정의

- **현재 스트릭** = 마지막 음주일(없으면 추적 시작일) 기준 오늘까지 경과일
- **최고 스트릭** = 추적 시작일부터 오늘까지 중 가장 길었던 무음주 연속일
- **누적 금주일** = 추적 시작일부터 오늘까지의 총 일수 - 마신 날 수

## 스코프 밖 (의도적으로 없음)

로그인/계정, 서버·DB, 푸시 알림, 목표 설정, 뱃지/게이미피케이션, 통계 대시보드. 전부 나중 얘기 — MVP는 스트릭 추적 + 데이터 보존 두 가지에만 집중한다.

## 스택

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Serwist](https://serwist.pages.dev) — PWA 매니페스트 + 서비스 워커 (오프라인 캐싱)
- [Vitest](https://vitest.dev) — 유닛 테스트 + 커버리지
- [Playwright](https://playwright.dev) — E2E 테스트
- 배포: [Vercel](https://vercel.com)

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## 테스트

```bash
pnpm test         # 유닛 테스트 (vitest run --coverage)
pnpm test:watch   # watch 모드
pnpm test:e2e     # E2E (playwright — 내부적으로 build+start 후 실행)
```

`src/lib/**` (지표 계산, 날짜 유틸, 스토어 직렬화)는 **100% 커버리지**가 CI 게이트로
강제된다 (`vitest.config.ts`의 `coverage.thresholds`).

## 빌드

```bash
pnpm build         # tsc(서비스워커 타입체크) + next build, public/sw.js 생성
pnpm start         # 프로덕션 서버 로컬 실행
```

## 설계 메모

- **localStorage-only** — 서버/DB/인증 없음. 모든 상태는 `sober-streak:v1` 키 하나의
  JSON blob(`DrinkStore` — `days` + `meta`)으로 브라우저에만 저장된다.
- **데이터 보존 전략** (서버가 없으니 브라우저 저장소가 지워지면 곧 데이터 유실):
  1. 온보딩에서 "공유 버튼 → 홈 화면에 추가"를 안내한다 — iOS Safari에서 홈 화면에
     추가된 PWA는 ITP(Intelligent Tracking Prevention)의 7일 자동 삭제 정책에서
     면제된다.
  2. 설정 화면에서 JSON 내보내기/가져오기로 수동 백업이 가능하다.
- **단일 다크 테마** — "물(水)" 컨셉 하나만. 라이트 테마나 테마 전환 없음.
- **무경고 톤** — "마셨음"을 기록해도 경고색·실패 문구·네이티브 `confirm()` 다이얼로그가
  뜨지 않는다. 판단 없이 기록만 하는 게 설계 의도.

## 배포 (Vercel)

정적/클라이언트 전용 Next.js 앱이라 **환경변수도, DB 연결도 필요 없다**. Vercel이
`next build`를 자동으로 인식하므로 별도 설정 없이 바로 배포된다.

**Vercel CLI로:**

```bash
pnpm dlx vercel@latest --prod
```

**또는 GitHub import로:**

1. [vercel.com/new](https://vercel.com/new)에서 이 리포를 import
2. Framework Preset은 Next.js로 자동 감지됨 — 별도 빌드 설정 불필요
3. Deploy

배포 후 확인할 것: 아이폰 Safari로 열어 **공유 → 홈 화면에 추가** → 오프라인 상태에서
앱이 열리는지, 스트릭이 유지되는지.

## 프로젝트 구조

```
src/
  app/            # 라우트: /(메인), /calendar, /settings, manifest, sw.ts
  components/     # BigStreak, MiniHeatmap, MonthHeatmap, Onboarding, ExportImport 등
  hooks/          # useDrinkStore — localStorage 훅
  lib/            # date, metrics, store, types — 100% 커버리지 대상
e2e/              # Playwright 시나리오
```
