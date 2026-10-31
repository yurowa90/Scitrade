# TASK-0077-R1 화면 몫 초과 뒤 이어 하기(첫 화면 청크 구조)

- **지위: 승인(허브, 2026-10-31, H41).** 근거: 2차 결과(`codex/TASK-0077` c0fb6fb, 화면 몫 +2,546 B)와 세션 A 진단(아래 0절).
- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- BASE: 2차 초안 스냅숏(이 지시서를 담은 커밋의 부모). 예산 BASE는 TASK-0076 뒤 HEAD(첫 화면 132,034 B)다.
- **`TASK-0077-path11-screens.md`(개정 1 + 허브 개정 2·3)를 그대로 이어 한다.** 아래만 바뀐다. 관문(화면 몫 ≤ 300 B)은 옮기지 않는다.
- 결과는 `docs/ai/tasks/results/TASK-0077.md` 맨 위에 ‘R1’ 절로 적고, 앞 실행 기록은 그대로 둔다.

## 0. 진단(세션 A, c0fb6fb 사본 실측)

- 원인은 `src/ui/path11-screens.ts:11`의 `import { initialUiState, liveRegionText, type UiCommand } from './session'` 한 줄이다.
  - 이 줄을 타입 import로만 바꾸면 첫 화면에 올라오던 `operations` 공유 청크(12,866 B)가 사라진다(132,463 B).
  - 다른 값 import 여덟 줄은 하나씩 빼도 공유 청크가 그대로였다.
- 해결안 실측
  - (가) 타입 전용 + `liveRegionText`를 인자로 받기: 132,461 B
  - (다′) 새 작은 모듈로 옮기기: 132,462 B
  - (나) 빌드 그룹으로 고정: 135,150 B(더 나쁨)
- CSS +151 B는 경로 11 규칙을 지연 CSS로 옮기면 0이 된다. (가) + CSS 지연 = 132,347 B(+313 B). 남은 몫은 `main.ts` 연결 코드다.

## 1. 바뀌는 것

1. **(가)를 쓴다.**
   - `path11-screens.ts`는 `./session`을 값으로 import하지 않는다. `Ui` 형은 `ReturnType<typeof import('./session').initialUiState>`처럼 타입 위치에서만 쓴다.
   - `liveRegionText`가 필요한 곳은 `main.ts`가 호출 인자로 넘긴다.
   - 새 공유 모듈은 만들지 않는다.
2. **경로 11 스타일은 새 `src/ui/path11.css`에만 둔다.**
   - `path11-screens.ts`가 `import './path11.css'`를 한다.
   - `src/ui/style.css`에서는 2차에서 더한 경로 11 규칙만 지운다.
3. **`main.ts`의 경로 11 연결은 지연 모듈의 위임 호출 하나로 모은다.** 대상은 2차에서 더한 `case 'p11-dialog'`·`case 'p11-close'` 갈래, `toggle` 등록 한 줄, `path11Prepare`·`path11Dialog`·`path11DialogHtml` 호출이다. `main.ts`에는 `opsScreens?.path11Handle(...)`처럼 진입점 몇 개만 남긴다.
4. **빌드 결과 고정 시험을 더한다**(`situation.test.ts:361` 방식, 실제 빌드).
   - 첫 화면 청크 집합은 `{ index, data }` JS와 index CSS 하나다.
   - `index.html`의 modulepreload는 data 하나뿐이다.
   - 원인이 무엇이든 공유 청크가 첫 화면에 생기면 이 시험이 실패한다.
   - 빌드 출력은 `/tmp/T77-*`에 두고 끝에 지운다.
5. **예산 탐침 셋.** 깨끗한 사본에서 같은 명령으로 잰다.
   - BASE(132,034 B)
   - 경로 11 화면을 넣되 `main.ts` 연결을 뺀 사본
   - 작업 뒤
   - 화면 몫 = 작업 뒤 − BASE ≤ 300 B다.
   - 넘으면 운영 시나리오 결산 조립(books 조립 포함)도 지연 모듈 함수 하나로 넘긴다. `main.ts`에는 비운영 결산만 남긴다. 그 뒤 다시 잰다.
   - 그래도 넘으면 멈추고 보고한다.
6. **변형을 더한다.**
   - V14: `path11-screens.ts`에 `./session` 값 import를 되돌린다. 4의 빌드 고정 시험이 실패해야 한다.
   - V15: 경로 11 규칙을 `style.css`로 되돌린다. 예산이 실패해야 한다.
   - V16: `main.ts`에 p11 click 갈래를 되돌린다. 예산 실패 또는 위임 시험 실패가 나야 한다.

## 2. 허용 파일(0077 2절에 더함)

- `src/ui/path11-screens.ts`, 새 `src/ui/path11.css`
- `src/ui/style.css`(2차에서 더한 경로 11 규칙 삭제만)
- `src/ui/main.ts`(경로 11 연결을 위임 호출로 모으기만)
- `src/ui/ops-screens.ts`(재수출 줄)
- 0077 시험 파일, 결과, MANIFEST
- `session.ts`는 바꾸지 않는다.

## 3. 순서

1. 1의 1~3을 반영하고 예산 탐침 셋을 잰다.
2. 통과하면 0077의 남은 일을 모두 한다.
   - 새 화면 시험 1~11
   - 허용된 기존 시험 정규화. 개정 3까지의 다섯 파일이며, 해시 값은 바꾸지 않는다.
   - 변형 V1~V16
   - 0077 완료 조건 전부(review_checks 18종 포함)
3. review_checks는 골든·판본 2 재현과 동시에 돌리지 않는다(TASK-0076 후속).
