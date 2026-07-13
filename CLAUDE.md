# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기술 스택

- **React 19** + **TypeScript** (strict, `verbatimModuleSyntax` 적용)
- **Vite 8** (`@vitejs/plugin-react`, Oxc 기반)
- **Oxlint** — 린터 (ESLint 대체, Rust 기반으로 빠름)
- 패키지 매니저: npm (`package-lock.json` 존재)

## 주요 명령어

```bash
npm run dev       # 개발 서버 실행 (Vite, HMR)
npm run build     # tsc -b (타입 체크) 후 vite build 로 프로덕션 빌드
npm run preview   # 빌드 결과물 로컬 미리보기
npm run lint      # oxlint 실행
```

### 타입 체크만 단독 실행

`build` 스크립트는 `tsc -b` 후 `vite build`를 실행하므로, 타입 에러만 빠르게 확인하려면:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

### 테스트

현재 테스트 프레임워크가 구성되어 있지 않음 (`package.json`에 test 스크립트 없음). 코드 변경 검증은 다음으로 대체:
1. `npm run lint` — Oxlint 정적 검사
2. `npx tsc --noEmit -p tsconfig.app.json` — 타입 체크
3. `npm run dev`로 브라우저에서 직접 동작 확인

테스트 프레임워크(Vitest 등)를 새로 도입할 경우 이 섹션을 갱신할 것.

## 기획/설계 문서

- `docs/PRD.md` — 팡(PANG) 게임 전체 개요 및 상위 수준 PRD.
- `docs/PLAN.md` — Phase별 목표를 세운 파일.
- `docs/FEATURES/main.md`, `game_rule.md`, `mission1.md` — 메인 화면, 게임 룰, 미션 1 상세 기획.
- `docs/design/phaseN.md` — 각 Phase 구현 설계 문서 (`docs/PLAN.md`의 Phase 번호와 1:1 대응). 새 Phase 설계 시 동일한 이름 규칙(`phase2.md`, `phase3.md`, ...)으로 `docs/design/`에 추가하고, 이 목록은 별도로 갱신할 필요 없음.

코드 작업 전 위 문서들을 먼저 확인하여 기획/설계 의도와 어긋나지 않도록 한다.

## 아키텍처

- 프로젝트 루트에 Vite/TS 설정이 3중 구조로 분리되어 있음: `tsconfig.json`(참조만 지님) → `tsconfig.app.json`(src 앱 코드용, `noEmit`, `jsx: react-jsx`), `tsconfig.node.json`(Vite 설정 파일 등 Node 환경용). 새 tsconfig 옵션 추가 시 어느 파일에 속하는지 구분해야 함.
- 엔트리 포인트: `index.html` → `src/main.tsx` → `src/App.tsx`. 현재 `App.tsx`는 Hello World만 렌더링하는 최소 상태.
- Oxlint 설정(`.oxlintrc.json`)은 `react`, `typescript`, `oxc` 플러그인만 활성화된 기본 상태이며 타입 인지(type-aware) 규칙은 비활성. 필요 시 README에 안내된 대로 `oxlint-tsgolint` 설치 후 `options.typeAware: true`로 확장 가능.
- React Compiler는 빌드/개발 성능 영향으로 인해 의도적으로 비활성화된 상태 (템플릿 기본값).
