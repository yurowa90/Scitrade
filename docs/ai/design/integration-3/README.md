# 3차 통합 측정 (세션 B, 2026-10-10)

허브의 통합 측정 요청(DECISIONS D15)에 따른 측정이다. 개발 브랜치 `5d59ff3`에서 했다. 글꼴 내장(D16)과 3차 화면 작업(TASK-0024·0025·0026·0055) 뒤의 상태를 평택판 배포 전에 한 번 잰다.

## 방법

- 빌드는 두 가지다.
  - `5d59ff3`을 `git archive`로 저장소 밖에 풀어 만든 빌드. 빌드 표시는 `dev`다.
  - 같은 커밋의 git 작업 트리 빌드. 빌드 표시는 `5d59ff3`이고 배포본과 같다.
- 측정: 시나리오 14개 × `tools/browser/profiles.json` 7개 프로필. `campaign-end`만 정한 3개 프로필이다(93회 실행).
  - 명령: `node tools/browser/measure.mjs --dist <빌드> --scenario <시나리오> --offline-fonts`.
  - Chromium 141.0.7390.37, 실제 배율.
- 비교 기준: TASK-0024 검수 때 잰 이 작업 빌드(`619c920` 내용, 빌드 표시 `dev`)의 같은 시나리오 값.
- 원자료: `raw/<시나리오>.json`. 해시 표시 빌드의 `smoke`는 `raw/smoke-hash.json`이다.

## 결과

- 14개 시나리오 모두 종료 코드 0(모든 기대 통과). 해시 표시 빌드의 `smoke`도 통과했다.
- 기준(TASK-0024 측정) 대비 값 차이:
  - 측정값 412개가 모두 같다(차이 0).
  - 쪽 오류 0, 글꼴 판정 실패 0(모두 빌드 안 글꼴 `fonts.local`, 외부 요청 0), 화면 크기 판정 실패 0.
- 머리 줄(`smoke` `bar_bottom_day1`, 해시 표시 빌드):
  - 값: 149.8 · 165.8 · 166.3 · 166.3 · 166.3 · 149.8 · 166.3 px(l1366 · cb1366t · ipadAirL · ipadminiL · ipadmini6L · l1920 · t1000).
  - 1024×768·1000×700에서 한 줄을 유지하고, `dev` 빌드와 같다.
- 크기 한도(`node tools/check_bundle_size.mjs dist`, `dev` 빌드): 첫 화면 JS·CSS 403,907 B·gzip 118,549 B로 통과(한도 600,000 B·140,000 B).

## 범위 밖

- 키보드·읽던 자리·UX-23 측정기(저장소 밖)는 이번에 다시 돌리지 않았다.
  - TASK-0024 병합(`74e53ac`) 뒤 `src/ui`·`tools/browser`·`index.html`·`public`에 바뀐 곳이 없다. 바뀐 빌드 파일은 `vite.config.ts`(TASK-0055, 캐릭터 자료 칸 줄이기)뿐이다.
  - 시나리오 값 412개가 같은 것으로 화면 배치가 같음을 확인했다.
- `SCENARIO_M2_OPERATIONS`는 화면 목록에 없어 재지 않았다.
