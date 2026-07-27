# CLAUDE.md — sober-streak (금주 스트릭)

초경량 음주/금주 트래커 **PWA**. 서버·계정·DB 없이 브라우저 `localStorage` 하나로
현재 스트릭 / 최고 스트릭 / 누적 금주일을 추적한다.

패키지 매니저는 **pnpm** (`pnpm-lock.yaml`). 스택: Next.js App Router + Serwist(서비스워커) + TypeScript.

## 명령

```bash
pnpm dev          # next dev — ⚠️ 서비스워커 비활성(아래 참조)
pnpm build        # tsc -p tsconfig.worker.json --noEmit && next build
pnpm start        # next start — PWA 검증은 여기서
pnpm lint
pnpm test         # vitest run --coverage
pnpm test:watch
pnpm test:e2e     # playwright (e2e/sober.spec.ts)
```

## ⚠️ PWA 는 dev 에서 검증되지 않는다

`next.config.ts:11` — `disable: process.env.NODE_ENV === "development"`.
즉 **`pnpm dev` 에서는 서비스워커가 아예 붙지 않는다.** 오프라인 동작·설치·SW 업데이트·캐시 전략은
`pnpm build && pnpm start` 로만 확인할 수 있다. dev 에서 "오프라인 잘 되네"는 증거가 아니다.

- SW 소스 `src/app/sw.ts` → 산출물 `public/sw.js` (`next.config.ts:9-10`)
- **빌드 1단계가 SW 타입체크**(`tsc -p tsconfig.worker.json --noEmit`)다. SW 타입 에러면 `next build` 까지 못 간다.
  (2026-07-27 실측: 통과.) SW 코드를 고쳤으면 이 단계를 먼저 돌려 빠르게 잡는다.
- **Serwist 는 버전 간 API 가 바뀐다.** SW/캐시 코드나 플랜 스니펫을 기억으로 쓰지 말고 설치된 버전 기준으로
  `ctx7` 로 확인할 것 — 과거 이 프로젝트 계열에서 stale Serwist API 로 재작업이 발생했다.

## 구조

```
src/app/        page.tsx · layout.tsx · manifest.ts · sw.ts · globals.css
                calendar/ · settings/
src/components/ src/hooks/ src/lib/
e2e/            sober.spec.ts (playwright)
docs/           superpowers/  ← 커밋이 인용하는 `spec §n` 문서 위치는 여기서 확인
```

## 제품 규칙 — 톤 (코드 리뷰에서 지킬 것)

**무경고 톤.** "마셨음"을 눌러도 **빨간 경고·실패 문구·질책이 뜨지 않는다.** 판단하지 않고 기록만 한다.
이건 취향이 아니라 이 앱의 정체성이고, 커밋 이력에도 계속 등장한다:

```
fix(hero): de-emphasize 0 on drink-day, use '다시 시작' tone (spec §7/§8.1)
feat(hero): 마신 날 '다시 시작' 화면에 누적 금주일 위로 메시지
```

UI·문구를 바꿀 때 경고색·부정 표현·스트릭 0 강조를 도입하지 말 것. 마신 날 화면은 **위로·재시작** 프레임을 쓴다.

## 데이터

`localStorage` 단일 소스. 서버로 아무것도 보내지 않는다 — 원격 저장·계정·분석 전송을 추가하지 말 것.
백업은 설정 화면의 JSON 내보내기/가져오기.

## 커밋

`type(scope): 설명` (영문·한국어 혼용). 예: `fix(hero): …`, `chore(polish): …`
