# TASK-0059-R3 ‘새로 고침’ 단추의 저장 확인(iPad)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `medium`
- 선행: `claude/m2a5-engine` `a197aa6`(TASK-0059-R2 검수 병합 뒤, 이하 `<BASE>`). `codex/TASK-0059` `a6c3208`과 `src/`가 같다. 기준 비교(`review_checks.sh`)는 `<BASE>`로 한다.
- 원 지시서·R1·R2의 원칙·손대지 않을 파일·지켜야 할 것은 이 문서가 바꾼 곳 말고 그대로다.
- 근거: TASK-0059 결과 보고 ‘R2 검수’ 절의 후속 F-R2-1.

## 무엇이 틀렸나

- R2는 상한에 닿은 실패에서 알림 띠에 ‘새로 고침’ 단추를 두었다. 단추는 바로 `location.reload()`를 부른다(`main.ts`의 클릭 처리 `case 'reload'`).
- R2 지시서는 저장하지 않은 진행이 있으면 기존 `beforeunload` 처리가 묻는다고 보았다. 그러나 iOS Safari는 `beforeunload` 확인 창을 띄우지 않는다(MDN 호환표).
- 알파 기기는 iPad다. 그래서 iPad에서는 이 단추가 저장하지 않은 진행(대기 중인 명령, 마지막 저장 뒤 진행한 날)을 묻지 않고 지운다. R2가 새로 만든 위험이다.

## 구현 지시

### 1. 단추에서 앱이 먼저 묻기

- `case 'reload'`에서 `hasUnsavedWork(ui.pending, state, savedState)`(기존 `beforeunload` 처리와 같은 판정)를 본다.
  - **저장하지 않은 진행이 있으면** `confirm`으로 묻는다. 기존 확인 창과 같은 네이티브 `confirm`을 쓰고 새 CSS·새 창은 만들지 않는다.
    - 문구는 기존 확인 문장 체계를 따른다: ‘새로 고침하면 저장하지 않은 진행과 오늘 할 일이 사라집니다. 새로 고칠까요?’
    - 취소하면 아무 일도 하지 않는다. 상태, 알림 띠, 단추가 그대로다.
  - **수락했거나 저장하지 않은 진행이 없으면** 아래 2의 표시를 켠 뒤 `location.reload()`를 부른다.

### 2. 데스크톱 이중 확인 막기

- 모듈 안에 ‘다음 `beforeunload` 한 번은 묻지 않음’ 표시(불 값 하나)를 둔다. 이름은 Codex가 정한다.
- `beforeunload` 처리의 맨 앞에서 이 표시를 본다. 켜져 있으면 끄고 바로 돌아간다(`preventDefault` 안 함). 표시는 **한 번만** 적용된다.
- 표시는 1에서 `location.reload()` 직전에만 켠다. 다른 곳(저장·불러오기·시나리오 바꾸기)은 건드리지 않는다.
- 저장하지 않은 진행이 없을 때는 기존 처리도 묻지 않는다. 그래도 같은 경로로 표시를 켜도 된다. 어느 쪽이든 결과 보고에 적는다.

### 3. 시험(`src/ui/code-split.test.ts`)

R2의 ‘새로 고침 단추’ 시험을 이 동작에 맞게 바꾼다. 이 시험은 앱이 묻지 않는 것(`confirm` 미호출)을 단언하고 있으므로 R3에서 단언을 바꾸는 것이 맞다. 다른 R2 시험의 단언은 바꾸지 않는다.

| 시험 | 확인할 것 |
|---|---|
| 저장 안 함 → 취소 | 대기열에 명령이 있는 상태에서 단추를 누르고 `confirm`이 `false`를 돌려준다. `confirm` 1번, 문구가 위 문장과 같다. `reload` 0번. 대기열과 알림 띠는 그대로다. 이어서 `beforeunload`를 보내면 기존처럼 `preventDefault`가 불린다(표시가 켜지지 않았음) |
| 저장 안 함 → 수락 | `confirm`이 `true`를 돌려주면 `reload` 1번. 그 뒤 첫 `beforeunload`는 `preventDefault`를 부르지 않는다. **두 번째** `beforeunload`는 기존처럼 `preventDefault`를 부른다(표시가 한 번만 적용됨) |
| 저장함 → 바로 | ‘저장’ 뒤 대기열이 빈 상태에서 단추를 누르면 `confirm` 0번, `reload` 1번 |

- `reload`는 지금 시험처럼 `location`을 흉내 낸다. 실제로 문서가 바뀌지 않으므로, 표시가 한 번만 적용되는지를 두 번째 `beforeunload`로 확인할 수 있다.

### 4. 변형 시험

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| 1 | 단추에서 `confirm`을 빼고 바로 `reload`(R2 동작) | 저장 안 함 → 취소 |
| 2 | 표시를 끄지 않음(한 번 켜면 계속 건너뜀) | 저장 안 함 → 수락(두 번째 `beforeunload`) |
| 3 | `confirm` 판정에 `hasUnsavedWork`를 쓰지 않고 늘 물음 | 저장함 → 바로 |

## 고칠 수 있는 파일

- `src/ui/main.ts`: `case 'reload'`와 `beforeunload` 처리, 표시 변수만.
- `src/ui/code-split.test.ts`
- `docs/ai/tasks/results/TASK-0059.md`(‘R3’ 절을 더한다. 앞 절은 지우지 않는다), `MANIFEST.json`

## 지켜야 할 것

- 원 지시서와 R1·R2의 보호 시험은 단언을 바꾸지 않고 통과한다. 예외는 위 3이 말한 R2 ‘새로 고침 단추’ 시험 하나다.
- 화면 HTML은 `<BASE>`와 바이트로 같다. 이번 변경은 클릭과 `beforeunload` 처리뿐이다.
- 첫 화면 gzip은 `<BASE>`보다 300 B 넘게 늘지 않는다. 결과 보고에 두 값을 적는다.

## 완료 조건

1. 지시 1~4 반영.
2. `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/validate_data.py`, `bash tools/ai/review_checks.sh --check <BASE>` 통과.
3. 변형 3개가 모두 잡힌다.
4. 바꾼 파일이 ‘고칠 수 있는 파일’ 안에 있다(`git diff --name-only <BASE>`, 이 R3 지시서는 빼고 본다).

## 세션 B가 잴 것 (Codex는 하지 않는다)

- R2 절차(Chromium 오프라인 흉내)에 더해, 대기열에 명령을 넣은 채 ‘새로 고침’을 누른다. 앱 확인 창이 한 번만 뜬다(브라우저 이탈 확인이 겹쳐 뜨지 않는다). 취소하면 그대로이고, 수락하면 새로 고쳐진다.
- WebKit은 잴 수 없다. iPad에서는 앱 확인 창이 유일한 확인이다. 알파 전에 실제 iPad로 한 번 눌러 보기를 권한다.

## 예상 질문과 기본값

- 확인 문구에 ‘저장하세요’를 넣는가? 넣지 않는다. 알림 띠 문장이 이미 ‘저장하고 새로 고침’을 말한다. `load` 경로에서는 저장하면 안 되기 때문에, 확인 문구는 두 경로에 같이 맞는 문장으로 둔다.
- `pagehide`로 바꾸는가? 아니다. 기존 `beforeunload` 처리는 그대로 두고 표시 한 줄만 더한다.
