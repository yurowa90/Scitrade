# TASK-0024 배치 공통·A(오늘 할 일 단추·마지막 조작 열)·Esc 닫기·한 열 화면 코드 순서

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치에 TASK-0025(이번 항로 지도 폭 맞춤)가 병합된 뒤, 그 위에 이 지시서를 올린 커밋이 `<BASE>`다(`docs/ai/SESSION_TREE.md` 60행 ‘TASK-0025 병합 → B의 TASK-0024’). `<BASE>`에서 만든 `codex/TASK-0024`에서 작업한다.
  - `<BASE>`는 허브가 지시서를 올릴 때 해시로 바꾼다. 자리표시가 그대로 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0024-layout-a-esc.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - 지시서를 올린 커밋(`<BASE>`와 그 뒤의 다른 지시서 커밋)이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 diff에 나와도 이 작업의 변경으로 치지 않는다. 그 밖의 파일이 다르면 결과 보고에 적는다.
  - 모든 diff·검사 명령의 기준 커밋은 `<BASE>`다.
  - **줄 번호:** 아래 줄 번호는 개발 브랜치 `c284e79`(TASK-0026 병합 `2de22ca`, 세션 트리 운영) 기준이다. `src/ui/`·`tools/browser/`는 `eeb4f03`과 바이트까지 같고, `src/ui/`는 `e4f7dfa`와도 같다(Claude 확인).
  - **TASK-0025가 바꾸는 줄:** `<BASE>`에는 TASK-0025가 더 들어 있다. TASK-0025가 고치는 파일 가운데 이 작업이 읽거나 고치는 것은 셋뿐이다.
    - `tools/browser/lib.mjs`: 47행 측정 종류 목록은 같은 줄에서 두 이름이 늘고, 측정 처리(166행 뒤)에 7줄이 더해진다. 61·120~157행은 그대로이고 231행(단계당 15초 제한)은 238행이 된다(TASK-0025 검수 전 스냅숏 `ed7df9a` 기준, Claude 확인).
    - `tools/browser/lib.test.mjs`: 8행 `names` 끝에 `'route-map-fit'`이 붙고 49행에 시험 하나(13줄)가 더해진다. 69~90행(금지 문자열)은 82~103행, 99~124행(dry-run)은 112~137행이 된다.
    - `src/ui/map-integration.test.ts`: 132행 시험 앞에 시험 하나가 더해진다(8~31행 `start()`는 그대로).
    - `src/ui/main.ts`·`style.css`·`growth.ts`·`main-testkit.ts`·`main.test.ts`는 TASK-0025가 고치지 않는다(TASK-0025 ‘손대지 않을 파일’).
    - 줄 번호가 다르면 코드가 사실이다. 차이는 결과 보고에 적는다. `<BASE>`에 TASK-0025가 없으면 그대로 진행하고 결과 보고에 적는다.
- 이미 들어온 작업 (그 파일을 건드리지 않는다)
  - TASK-0025(허브 세션): `src/ui/map.ts`, `src/ui/map-fit.test.ts`, `src/ui/map-integration.test.ts`, `tools/browser/lib.mjs`, 새 `tools/browser/scenarios/route-map-fit.json`. `tools/browser/lib.test.mjs`는 이 작업이 8행 `names` 끝에 이름 다섯 개만 더한다.
  - TASK-0026(`2de22ca`, 자료 청크 분리와 빌드 크기 한도): `vite.config.ts`, `tools/bundle-size.mjs`·`tools/check_bundle_size.mjs`·`tools/check_bundle_size.test.mjs`, `tools/ai/review_checks.sh`. 자동 검사 묶음에 크기 한도 검사와 그 시험이 더해져 수정 모드 13종·확인 모드 14종이다. 이 작업의 코드가 크기 한도 검사를 통과해야 한다(‘지켜야 할 것’).
  - 글꼴 내장(D16, `eeb4f03`): `index.html`, `public/**`, `tools/fonts/**`.
  - `vite.config.ts`·`tools/ai/`·`package.json` 등은 허브만 쓰는 파일이다(`docs/ai/SESSION_TREE.md` 63~66행).
- 결정 근거:
  - `docs/DECISIONS.md`
    - 1068~1103행 ‘사용자 결정 일괄 채택 (2026-10-10, 사용자: “다 추천대로 해줘”)’.
      - 1086행 D13: Esc로 맨 위 열린 칸을 닫고 연 버튼으로 초점 복귀. 다른 단축키 없음. 배치 작업(TASK-0024)에 함께 넣는다.
      - 1095행 B53: 공통 수정 + A(제자리 고치기). 한 열 Tab 순서는 화면 코드 순서와 맞추는 방향으로 같은 작업에서 본다. K1은 결정 대기.
      - 1098행: 3차 실행 순서의 ‘배치 공통+A·Esc(B53·D13, TASK-0024)’.
    - 1110행(글꼴 내장 반영): 1024×768에서 머리 줄의 남는 폭이 빌드 표시 글 폭에 따라 모자라 저장·불러오기 묶음이 둘째 줄로 내려간다(위쪽 막대 아래 166.3 ↔ 219.9px). 배치 작업(TASK-0024)에서 고친다.
    - 1063행: 새 문장마다 반례 상태 하나를 지시서에 적는다. 측정 시나리오는 지시서를 쓸 때 dry-run과 단계 시간을 확인한다.
    - 1064행: 터치 크기는 `any-pointer: coarse`로만 건다.
    - 1065행: 비교 빌드는 빌드 표시 글의 폭이 같아야 한다(1024·1000px 머리 영역 줄바꿈 경계).
    - 1036행: 키보드 시험은 실제 Chromium 순서와 같아야 한다.
    - 928행: 패널 열고 닫기에도 500ms 두 번 누름 막기를 건다.
    - 895행: 세 열의 Tab 순서 미룬 항목(화면 코드 순서를 바꾸지 않는다).
    - 1113~1118행 ‘자료 청크 분리와 빌드 크기 한도’: 1116행 한도(JS 청크 하나 500,000 B, 첫 화면 JS·CSS 합계 600,000 B·gzip 140,000 B), 1117행 ‘첫 화면 원본 합계의 여유가 약 44 KB라 큰 화면 기능을 더할 때 이 검사가 먼저 걸린다’.
    - 1120~1132행 ‘세션 트리 운영 (2026-10-10 사용자 결정)’과 `docs/ai/SESSION_TREE.md`: 52행 `src/ui/*`·`tools/browser/*`는 B 세션, 58행 한 번에 한 작업만 여는 파일(`main.ts`·`main.test.ts`·`main-testkit.ts`·`style.css`·`growth.ts`·`lib.mjs`·`lib.test.mjs`), 60행 순서 ‘TASK-0025 병합 → B의 TASK-0024’, 63~66행 허브만 쓰는 파일.
  - `docs/STATUS.md` 461행: 받아들인 대가 ‘한 열(1000×700)에서 Tab이 거꾸로 튀는 곳 증가 — 배치안 결정(B53)과 함께 정한다’.
  - `docs/ai/design/layout-ux04-05/README.md`(배치 시안, `3b60314` 기준으로 만들고 잼)
    - 15~28행 §2 공통·A, 296~304행 §6 장단점(공통·A), 318~329행 §7 권고, 331~355행 §8 ‘Sol 지시서에 넣을 것’.
    - 248~257행 ‘패널 순서’와 그 단서(TASK-0023 뒤 한 열에서 Tab이 거꾸로 튐).
    - 시안 코드: 같은 폴더 `proto-A.patch`(로컬 브랜치 `claude/S1c-proto-A`와 같다). TASK-0018·0023 전에 만들었다. 합치지 말고 아래 구현 지시대로 다시 넣는다.
  - `docs/ai/design/DECISION-PACKET-2026-10.md` 379~395행 D13(W3C APG 대화 상자 패턴: ‘Escape: Closes the dialog’, ‘focus returns to the element that invoked the dialog’).
  - `docs/UI_SPEC.md` 51행: 키보드 탐색·명확한 포커스.
  - `docs/ai/tasks/results/TASK-0023.md` 167~186행 Tab 순서 표(정적), 373~376행 검수의 받아들인 대가.
  - `src/ui/pixel.ts` 82행: `typeof window.matchMedia !== 'function'`이면 지도 다시 재기를 걸지 않는다. 구현 지시 7의 확인 호출과 같은 선례다.
  - Claude 사전 작업(2026-10-10, 저장소 밖 작업 폴더라 찾지 않아도 된다). 결과는 아래 ‘사전 측정’에 옮겨 적었다.
    - 한 열 Tab 순서 시안 넷(O1 격자 문자열, O2 화면 코드 순서, O3a CSS `reading-flow`, O3b 한 열이면 순서를 바꿔 그림)을 7개 프로필로 쟀다. **O3b를 고른다.**
    - `eeb4f03` 사본에 이 지시서의 설계 전체(공통·A·Esc·O3b·머리 줄)를 넣은 시제품을 만들어 시험·변형 시험·측정 시나리오·키보드 측정을 돌렸다. 부록 A·B는 그 시제품의 시험 키트 추가와 시험 파일이다.
    - 같은 변경을 `c284e79` 사본에 다시 넣어(패치가 그대로 들어감) 형 검사·vitest·빌드·크기 한도·node 시험·시나리오 dry-run과 실행을 다시 돌렸다(‘사전 측정’ 2절 첫 줄).

## 목표

1. **공통 — 상세는 누른 곳 바로 아래 (UX-05·PPL-11):** 동료 카드로 고르면 성장·훈련 상세를 그 카드 바로 아래(카드 칸 한 줄 전체)에 둔다. 운영표 줄로 골랐거나 필터로 고른 카드가 숨으면 지금처럼 운영표 아래에 둔다.
2. **공통 — 펼치면 실행 단추를 띠 안으로 (P14-05):** 상세를 펼치면 ‘일반 훈련’ 단추를, 면담을 펼치면 고용 단추를 보이는 띠 안으로 최소 거리만 굴린다. 누른 뒤 생길 아래쪽 알림 자리 72px을 미리 비운다. 칸 제목은 막대 아래에 남긴다.
3. **공통 — 훈련 단추 칸(F1):** 훈련 단추와 ‘일반 훈련 예정’을 `data-action-slot` 칸으로 감싸 누른 자리를 지킨다.
4. **A — ‘오늘 할 일 N건’ 단추 (UX-04):** 고정 막대의 ‘하루 진행’ 바로 왼쪽에 둔다. 누르면 ‘오늘 할 일’ 제목으로 가서 초점을 둔다. M2만.
5. **A — 하루 진행 뒤 읽던 자리: 마지막 조작 열 (UX-23·PPL-35):** 세 열에서 마지막 조작이 오른쪽 칸(동료·자원 예약·오늘 할 일)이면 그 칸의 후보로 읽던 자리를 지킨다. M2만.
6. **Esc 닫기 (D13, UX-11):** Esc로 맨 위 열린 칸(현지 패널·성장 상세·면담·기록장)을 닫고 그 칸을 연 단추로 초점을 돌려준다.
7. **한 열 화면 코드 순서 (B53 단서):** 한 열(1000px 이하)일 때 패널을 한 열에 보이는 순서로 그린다. 세 열은 지금 순서 그대로다.
8. **머리 줄:** 빌드 표시를 머리 문구 둘째 줄에 둬 1024·1000px에서 머리 줄이 빌드 표시 글 길이와 무관하게 한 줄로 남게 한다.
9. **측정 시나리오 5개:** Claude가 Chromium으로 잴 JSON.

**바꾸지 않는 것:**
- 격자 영역 문자열과 `grid-template-rows`(`style.css` 86~116행). 세 열 화면 코드 순서(`main.ts` 881~889행의 패널 순서).
- 거래 칸 안 순서(견적판 → 진행 중 계약), 수락 뒤 새 계약 제목으로 가는 규칙(`queue()` 174~181행).
- 고정 막대의 높이(7개 프로필에서 마우스 72.3px·터치 79·79.5px)와 막대의 금액 칸.
- 주 열의 읽던 자리 규칙(`endDay()` 195~222행, 248~249행)과 끝나는 날 분기(235~246행).
- TASK-0018의 Tab·Shift+Tab 처리(97~106행)의 기존 줄, `focusWithoutScroll`(76~88행), 건너뛰기 두 단추.
- M1 화면: 세 열 HTML 전체가 `<BASE>`와 같다(대기 명령 ID만 다름). 한 열에서는 패널 순서만 다르다.
- 엔진·자료·저장 형식, 지도(`map.ts`), K1(주 열 미리 보기 아래 계약, 결정 대기).

## 사전 측정 (Claude)

- 빌드: `eeb4f03`를 `git archive`로 푼 사본(기준)과 그 위에 이 설계를 넣은 시제품. 둘 다 저장소 밖에서 빌드해 빌드 표시가 `dev`로 같다(DECISIONS 1065행). 키보드·읽던 자리·UX-23 측정은 이 두 빌드로 했다.
- `c284e79`(TASK-0026 자료 청크 분리 뒤) 사본에도 같은 변경을 넣어 다시 빌드했다. 새 시나리오 5개는 이 두 빌드로 다시 쟀다(아래 표의 값). `src/ui/`가 `eeb4f03`과 같고, 청크 분리는 화면 코드를 바꾸지 않는다.
- Chromium 141.0.7390.37, `tools/browser/profiles.json`의 7개 프로필. 시나리오는 `tools/browser/measure.mjs`(실제 배율 `--force-device-scale-factor`, viewport null)로 쟀다. 키보드·읽던 자리·UX-23은 Claude 측정기(저장소 밖, Playwright 기기 흉내)로 기준과 시제품을 같은 방법으로 쟀다.

### 1. 한 열 Tab 순서 시안 (O3b 선택)

**먼저 바로잡을 점.** 지금까지 쓴 기준 t1000 수치 ‘1/1/2/3/2’의 알림 상태 3은 실제로 2다. Claude 측정기 판정이 현지 패널 영역을 `panel local`로, 그 안의 정지점을 `culture`로 이름 붙여 ‘현지 패널 닫기 → 현지 탭’ 이동을 거꾸로 튐 1건으로 셌다. 모든 빌드에 똑같이 붙는 측정기 문제다. 아래 표는 이름을 맞춘 판정이다.

| | 거꾸로 Tab t1000 (1일/수락 뒤/2일/알림/90일 끝) | 거꾸로 Tab 세 열 6개 | 한 열 ‘오늘 할 일’ 1일 y / T1 뒤 띠 아래 | 하루 진행 → 오늘 할 일 Tab 수 (1일·T1·2일, t1000) | vitest | 읽던 자리 32사례 |
|---|---|---|---|---|---|---|
| 기준 | 1/1/2/2/2 | 0 | 2680 / 133.5px | 26·31·30 | 973 통과 | – |
| O1 한 열 격자만 바꿈 | 0 | 0 | **5057 / 2508.5px** | 26·31·30 | 1개 실패 | 차이 0 |
| O2 화면 코드 순서 바꿈 | 0 | **1/1/2/2/2** | 2680 / 133.5 | 10·15·14 | 2개 실패 | 차이 0 |
| O3a CSS `reading-flow: grid-rows` | 0 (Chromium만) | 0 | 2680 / 133.5 | 10·15·14 | 0 실패 | 차이 0 |
| **O3b 한 열이면 순서 바꿔 그림** | **0** | **0** | 2680 / 133.5 | 10·15·14 | 0 실패 | 차이 0 |

- O1(`"trade" "crew" "resources" "queue" "world" "report" "log"`): 한 열에서 ‘오늘 할 일’이 2,377px 아래로 간다. TASK-0014(MF-3)의 ‘거래 → 오늘 할 일’ 순서가 되돌아간다. 실패 시험 `main.test.ts:834`(한 열 격자 문자열).
- O2(화면 코드에서 오늘 할 일을 동료 앞, 보고를 지도 앞): 문제가 한 열에서 세 열 6개 프로필로 옮겨 간다(오늘 할 일 일정 단추 → 동료 필터, 보고 계약 링크 → 지도 단추). 실패 시험 `main.test.ts:1276`·`:1606`.
- O3a: CSS 한 줄이지만 Chromium 137 이상만 지원한다. iPad Safari·Firefox에서는 기준과 같은 1/1/2/2/2로 돌아갈 것으로 본다(이 환경에 WebKit이 없어 재지 못했다).
- O3b: t1000 화면 코드 순서가 보이는 순서와 같아진다(거래 → 오늘 할 일 → 동료 → 자원 → 보고 → 지도 → 기록). 처음 만든 O3b는 창 폭이 1000px을 넘나들 때 화면 밖에 있던 초점을 ‘하루 진행’으로 옮겼다(기존 초점 복원 규칙). 같은 조작에 초점을 남기게 고친 판(O3b2)은 1180→1000 전환 직후 초점·위치가 기준과 같다(아래 2절 ‘창 폭 전환’).
- 다섯 빌드 × 7개 프로필 모두에서 Shift+Tab 튐 거리 0, ‘결과 보기’까지 Tab 1번과 그 뒤 초점, 가려진 정지점 수가 기준과 같았고 쪽 오류는 0이었다.

### 2. 이 설계 전체의 시제품 (공통·A·Esc·O3b·머리 줄)

- **`c284e79`에서 다시 확인(TASK-0025 전):**
  - 형 검사 통과. vitest 기준 32개 파일·973개 → 시제품 33개 파일·1013개 통과(할 일 1).
  - 위 사본들은 git 밖이라 빌드 표시가 `dev`다. 검토 때 시제품을 git 작업 트리로 만들어(빌드 표시가 해시) `npx vitest run src/ui`를 돌리자 처음 판의 시험 40이 실패했다(빌드 표시를 `dev`로 고정). 식을 고친 부록 B 판은 13개 파일·429개 모두 통과했다.
  - `node --test tools/browser/lib.test.mjs` 10개, `node --test tools/check_bundle_size.test.mjs` 11개 통과(둘 다 기준과 같음).
  - 크기 한도(`node tools/check_bundle_size.mjs dist`) 통과:
    - 코드 청크 212,001 → 216,915 B(+4,914).
    - 첫 화면 JS·CSS 합계 555,863 → 561,362 B(한도 600,000), gzip 127,974 → 129,567 B(한도 140,000).
    - 자료 청크 317,893 B 그대로.
  - 자료 검사 기준 25,817건(시제품은 MANIFEST를 다시 만들지 않아 재지 않음).
  - 새 시나리오 5개 `--dry-run` 종료 코드 0(구현 지시 9).
  - 시제품에 빈 결과 보고 파일을 두고 MANIFEST를 다시 만들면 자료 검사 25,817 → 25,829건(+12, 완료 조건 2).
- **TASK-0025를 얹은 사본에서도 확인(검토 Claude, 2026-10-10):** `c284e79`에 TASK-0025 검수 전 스냅숏(`ed7df9a`)의 `src`·`tools` 변경을 얹고 시제품 변경을 넣었다. 충돌은 `lib.test.mjs` 8행 하나였고 지시대로 `'route-map-fit'` 뒤에 다섯 이름을 더했다.
  - vitest 34개 파일·1040개 통과(할 일 1), `lib.test.mjs` 11개 통과, 크기 한도 통과(코드 청크 217,138 B, 첫 화면 561,585 B·gzip 129,679 B), 시나리오 5개 dry-run 종료 코드 0·단계 수 같음.
  - 이 사본 빌드와 TASK-0025만 얹은 빌드(둘 다 `dev`)로 시나리오 5개를 7개 프로필에서 실제로 돌렸다. 값은 아래 표와 같았다. 시제품은 모두 통과, 기준은 `card-detail-low`만 통과, 쪽 오류 0.
  - 단계 시간(부하 평균 약 2~5): 단계 하나의 최장 1.5초(`interview-hire`의 `"end-day", "times": 2`), 프로필 하나의 단계 합 최장 10.9초(`side-anchor`).
- 시험: 새 시험 파일 하나에 40개(부록 B). 기존 시험 가운데 바꾼 단언은 1개(아래 ‘바꿔도 되는 기존 단언’)이고, 그것을 바꾸기 전에는 그 1개만 실패했다.
- HTML: M1 세 열 1일·수락·배정·예약·카드 선택 뒤·2일의 `#app` HTML이 기준과 같다(대기 명령 ID만 지우고 비교). M2 세 열 1일·수락 뒤·2일은 막대의 단추 한 줄만 다르다.
- 변형 시험: 아래 ‘완료 조건 4’의 M01~M28이 모두 지정한 시험에서 실패했다(`eeb4f03`·`c284e79` 두 사본에서 같은 결과). 검토 때 TASK-0025를 얹은 사본에서 M29~M33을 더해 33종을 다시 돌렸고, 변형마다 실패한 시험이 그 표의 ‘실패해야 하는 시험’과 같았다. 살아남은 변형은 없다.
- Esc(Chromium, 실제 키 입력, l1366·ipadAirL·t1000): 상세를 펼치고 400px 내린 뒤 Esc → 상세 닫힘, 초점은 상세 단추, 단추가 띠 안. 열린 칸이 없을 때 Esc → 굴림·초점 변화 없음. 기록장 → Esc → 기록장 닫힘·초점 기록장 단추 → Esc → 현지 패널 닫힘·초점 현지 탭(연 자리로 복원). 초점을 뺀(본문) 상태에서 Esc → 가장 최근 칸(상세) 닫힘. 쪽 오류 0.

**측정 시나리오 5개 (기준 → 시제품, 아래 ‘구현 지시 9’의 JSON):**

값은 막대 아래 끝에서 잰 px(`top-from-bar`) 또는 이동 px(`moved`)다. 칸마다 ‘기준 → 시제품’, 같으면 한 번만 적는다. 프로필 순서는 l1366 · cb1366t · ipadAirL · ipadminiL · ipadmini6L · l1920 · t1000. `eeb4f03` 빌드와 `c284e79` 빌드에서 두 빌드(기준·시제품)의 모든 값이 같았다.

| 시나리오 | 값 | 7개 프로필 | 판정 |
|---|---|---|---|
| `queue-chip` | 수락·배정·예약(T1) 뒤 오늘 할 일 제목 | 779.3 · 767.3 · 662.8 · 555.3 · 620.8 · 844.3 · 711.8 (같음) | 기록만 |
| | 막대의 단추 | 없음 → −54.4 · −62 · −62.5 · −62.5 · −62.5 · −54.4 · −62.5 (높이 35.6·44, 막대 안) | 기준은 실행 오류 |
| | 단추를 누른 뒤 오늘 할 일 제목 | – → 0.3 · 0.3 · −0.2 · −0.2 · −0.2 · 0.3 · −0.2 | 시제품 통과 |
| | 그때 첫 줄 | – → 207.4 · 207.4 · 206.9 · 206.9 · 206.9 · 207.4 · 145.1 (높이 51~73) | 시제품 통과 |
| `card-detail` | 카드(막대 아래 40)를 누른 뒤 카드 | −317.8 · −339 · −180.9 · −232.9 · −256.9 · −5.8 · 14.9 → 39.2 · 39 · 39.1 · 39.1 · 39.1 · 39.2 · 39.9 | 기준 실패 7 |
| | 상세 단추 | 547.7 · 534.5 · 696.4 · 644.4 · 620.4 · 859.7 · 576.3 → 382.3 · 382 · 384 · 384 · 384 · 382.3 · 401.9 | |
| | 펼친 뒤 ‘일반 훈련’ 제목 | 834.5 · 828 · 989.9 · 937.9 · 913.9 · 1146.5 · 869.7 → 117 · 103.5 · 265.9 · 213.9 · 189.9 · 429 · 264.4 | |
| | 펼친 뒤 훈련 단추 | 1185 · 1178.5 · 1340.3 · 1288.3 · 1264.3 · 1497 · 1102.1 → 467.6 · 454 · 616.3 · 564.3 · 540.3 · 779.6 · 496.7 | 기준 실패 |
| | 훈련을 넣은 뒤 예정 표시(알림 위 끝 537.6 · 530.9 · 693.4 · 641.4 · 617.4 · 849.6 · 573.4) | 시제품 447.9 · 434.3 · 596.6 · 544.6 · 520.6 · 759.9 · 496.7 (알림 위) | 기준은 상세 단추를 눌러 굴린 뒤라 비교하지 않음 |
| `card-detail-low` | 누르기 전 카드 | 175.8 · 197.4 · 198.9 · 198.9 · 198.9 · 175.8 · 360.1 (세 열은 페이지 맨 위라 더 내리지 못함) | 기록만 |
| | 누른 뒤 카드 | −317.8 · −339 · −180.9 · −232.9 · −256.9 · −5.8 · 14.9 → 174.7 · 191 · 197.8 · 197.8 · 197.8 · 174.7 · 214.4 | 기록만(t1000은 상세 단추를 띠 안으로 가져오며 −145.7) |
| | 상세 단추 | 547.7 · 534.5 · 696.4 · 644.4 · 620.4 · 859.7 · 576.3 → 517.7 · 534 · 542.7 · 542.7 · 542.7 · 517.7 · 576.4 | 둘 다 통과 |
| `interview-hire` | 면담 단추를 막대 아래 120에 두고 펼친 뒤 고용 단추 | 540.1 · 543.5 · 543.9 · 543.9 · 543.9 · 540.1 · 373.2 → 467.1 · 454.5 · 543.9 · 543.9 · 540.4 · 540.1 · 373.2 | 기준 실패 3(72px 예약 없음) |
| | 막대 아래 480에 두고 펼친 뒤 고용 단추 | 900.1 · 903.5 · 903.9 · 903.9 · 903.9 · 900.1 · 733.2 → 467.1 · 454.5 · 616.4 · 564.4 · 540.4 · 779.1 · 496.7 | 기준 실패 7 |
| | 면담 제목(막대 아래 120 / 480에 두고 펼친 뒤) | 183.9~188 / 543.9~548 → 98.3~188 / 98.3~422.9 | 시제품 통과(7px 이상) |
| `side-anchor` | 현지 패널을 연 채 오른쪽 오늘 할 일 제목을 누르고 막대 아래 120에서 읽다 하루 진행 | −101.6 · −117 · −136.5 · −136.5 · −136.5 · −101.6 · 0.1 → 0.4 · 0 · 0 · 0 · 0 · 0.4 · 0.1 | 기준 실패 6 |
| | 자원 예약 제목으로 같은 일 | 0 · 0 · 0 · 0 · 0 · 0 · −2450.9 (같음, t1000은 기대 없음) | |
| | 주 열 거래 제목으로 같은 일(대조) | 0 (모두 같음) | |

- 시제품은 다섯 시나리오의 기대를 모두 통과했다. 쪽 오류 0, 가로 넘침 0. 기준은 `card-detail-low` 하나만 통과한다(세 열에서 카드가 페이지 맨 위라 상세 단추가 원래 보인다).
- 시안 그대로(‘띠에 걸친 첫 후보’)였던 시제품 1판은 `side-anchor`의 오늘 할 일에서 +174.4px(l1366)였다. 구현 지시 5의 ‘막대 아래에서 시작하는 후보 우선’으로 고친 값이 위 표다.

**키보드(Claude 측정기, 이름 보정 판정):**

상태 다섯은 1일 첫 화면 / 수락 뒤 / 2일 / 알림(현지 결과) / 90일 끝이다.

| 항목 | 기준 | 시제품 |
|---|---|---|
| 거꾸로 튀는 Tab, t1000 | 1/1/2/2/2 | **0/0/0/0/0** |
| 거꾸로 튀는 Tab, 세 열 6개 프로필 | 0 | 0 |
| 정지점 수(7개 프로필 같음) | 36/41/45/54/33 | 37/42/46/55/34 |
| 세 열 정지점 목록 | – | 기준 목록에 `queue-jump` 하나가 ‘처음부터’(머리, `restart`)와 ‘하루 진행’(막대) 사이에 더해진 것과 같다 |
| t1000 정지점 목록 | – | 같은 정지점에 단추 하나. 오늘 할 일(`unqueue`·`schedule-toggle`)이 거래 바로 뒤로, 보고(`goto-contract`)가 지도 앞으로 옮겨 간다 |
| 가려진 정지점 수 | l1366 0. 그 밖에는 1일·2일만 1개(t1000은 2개) | 같음 |
| Shift+Tab으로 고정 영역에 갈 때 마지막 튐(먼 곳·차례로, 1일/수락/알림) | 0 / 0 | 0 / 0 |
| 하루 진행 뒤 ‘결과 보기’까지 Tab 수, Enter 뒤 초점 | 1, 결과 카드 제목 | 같음 |
| 하루 진행에서 오늘 할 일까지 Tab 수(1일·T1·2일) | t1000 26·31·30, 세 열 26·31·30 | t1000 **10·15·14**, 세 열 26·31·30 |
| ‘오늘 할 일’ 위치: 1일 페이지 y / T1 뒤 띠 아래 | t1000 2680 / 133.5px. 세 열 l1366 2879 / 241.7px 등 | 7개 프로필 모두 같음 |
| 읽던 자리 32사례(TASK-0012 측정기 17개 스크립트) | – | 7개 프로필 모두 기준과 1px 넘게 다른 곳 0 |
| 쪽 오류 | 0 | 0 |

- 읽던 자리 32사례 가운데 ‘키보드로 하루 진행에 가서 Enter’ 4사례(Tab·Shift+Tab × 빠름·느림)는 처음에 시제품에서 측정이 멈췄다. 측정기가 ‘처음부터’에서 Tab 한 번이면 ‘하루 진행’이라고 가정했는데, 시제품은 그 사이에 ‘오늘 할 일 N건’ 단추가 있다. ‘하루 진행’ 바로 앞 정지점(기준 ‘처음부터’, 시제품 단추)에서 Tab 하도록 측정기를 고쳐 두 빌드를 다시 쟀다. 두 빌드의 값이 같았다(7개 프로필, 계약 제목 이동 −0.4~0.4px).

**창 폭 전환(1180×820 → 1000×700 → 1180×820, Claude 측정기):**

| 초점 | 단계 | 기준 | 시제품 |
|---|---|---|---|
| 일정 단추(2일, 아래쪽) | 1000px으로 바꾼 직후: 초점 / 단추 위 / scrollY | 일정 단추 / 264 / 2681 | 같음 |
| | 한 열에서 Tab 한 번 → Shift+Tab 한 번 | 지도 단추(아래로 건너뜀) → 일정 단추 | 동료 필터(보이는 다음 칸) → 일정 단추 |
| | 1180px으로 되돌린 뒤 | 일정 단추 / 532 / 2577 | 일정 단추 / 428 / 2681(처음 자리) |
| 동료 필터 ‘전체’(맨 위) | 세 단계 모두 | 초점 유지, 1000px 3096 / 0, 되돌린 뒤 −2472 / 2729 | 같음 |

- 되돌린 뒤 기준 값이 다른 것은 한 열 Tab이 지도 단추로 건너뛰며 쪽을 굴렸기 때문이다. 폭 전환 자체로 생긴 차이는 없다. 쪽 오류 0.

**UX-23 하루 진행 뒤 읽던 자리(배치 README 3절 방법, Claude 측정기 `ec.js`, 기준 → 시제품):**

현지 패널을 연 채 읽던 요소를 막대 아래 40px에 두고, 그 칸 위에서 실제 굴림 동작(마우스 휠·터치 끌기)으로 120px을 굴린 뒤 하루 진행. 값은 읽던 요소의 이동 px. 프로필 순서는 위와 같다(t1000은 한 열이라 열 규칙을 쓰지 않는다).

| 사례 | 읽던 요소 | 기준 | 시제품 |
|---|---|---|---|
| RQ | 오른쪽 ‘오늘 할 일’ 제목 | −101.6 · −117.1 · −117.1 · −117.1 · −117.1 · −101.6 · 0.4 | 0.4 · −0.1 · −0.1 · −0.1 · −0.1 · 0.4 · 0.4 |
| RQB | 같음, 현지 미리 보기를 띄운 상태 | −488.6 · −511.1 · −511.1 · −511.1 · −511.1 · −488.6 · 0 | 0.4 · −0.1 · −0.1 · −0.1 · −0.1 · 0.4 · 0 |
| RR | 오른쪽 ‘자원 예약’ 제목 | −80.9 · −96.3 · −96.3 · −96.3 · −96.3 · −80.9 · 15.1 | 0.1 · −0.3 · −0.3 · −0.3 · −0.3 · 0.1 · 15.1 |
| MQ(대조) | 주 열 셋째 견적 제목 | 0.1 · 0.4 · 0.4 · 0.3 · 0.4 · 0.1 · 0.4 | 같음 |
| K1(대조, 결정 대기) | 4일, 미리 보기 아래 계약 제목 | −413.8 · −420.5 · −420.5 · −420.5 · −420.5 · −413.8 · −420.5 | 같음 |

- 대가(설계대로, 배치 README 6절): 오른쪽을 지킨 만큼 주 열이 움직인다. 시제품에서 셋째 견적 제목은 RQ +102.1~+117.4px, RR +81.1~+96.4px, RQB +489~+511px(세 열 6개 프로필). 기준은 0~0.4px.
- 쪽 오류 0.

**머리 줄(빌드 표시 글을 바꿔 잰 위쪽 막대 아래 끝, px):**

| 빌드 표시 | 1366×657 마우스 | 1366×657 터치 | 1180×820 | 1024×768 | 1133×744 | 1920×969 | 1000×700 |
|---|---|---|---|---|---|---|---|
| 기준 `dev` | 149.8 | 165.8 | 166.3 | 166.3 | 166.3 | 149.8 | 166.3 |
| 기준 `eeb4f03` | 149.8 | 165.8 | 166.3 | **219.9** | 166.3 | 149.8 | **219.9** |
| 기준 `eeb4f03+수정` | 149.8 | 165.8 | 166.3 | **219.9** | 166.3 | 149.8 | **219.9** |
| 시제품 `dev`·`eeb4f03`·`eeb4f03+수정` | 149.8 | 165.8 | 166.3 | 166.3 | 166.3 | 149.8 | 166.3 |

- 기준에서 1024px의 남는 폭은 `dev` 24.1px, `eeb4f03` −2.2px, `+수정` −30.8px다. 1000px은 `dev`도 0.1px뿐이다. 시제품은 머리 문구 폭이 186.2 → 152px로 줄어 1024px 58.2px, 1000px 34.2px가 남는다. 머리 영역 높이(마우스 77.5·터치 86.8px)와 고정 막대 높이는 7개 프로필 모두 같다.
- ‘시제품 · 모든 숫자는 가상값 ·’의 폭은 139.7px, ‘빌드’까지 넣으면 164px다(IBM Plex Sans KR 12px). 9.5rem(152px)은 그 사이라 빌드 표시가 늘 둘째 줄에 간다. 둘째 줄 ‘빌드 eeb4f03+수정’은 98.5px다.

**반례와 대가 (사실만 적는다):**
- **세로 태블릿·휴대폰의 고정 막대:** ‘오늘 할 일 N건’ 단추(폭 107.4px + 간격 19.2px)만큼 막대 한 줄의 폭이 늘어, 막대가 두 줄로 접히는 폭이 715px 아래에서 842px 아래로 올라간다. 768×1024에서 79 → 135.1px, 700px 이하(2열 격자)에서 102.7 → 148.3px다. 7개 프로필(모두 가로)에서는 높이가 같다. 받아들인다(아래 ‘예상 질문’).
- **창 폭이 1000px을 넘나들 때 다시 그린다:** 회전·창 크기로 한 열 여부가 바뀌면 화면을 다시 그린다(가로 iPad를 세로로 돌리면 1180 → 820px라 해당한다). 그때 열어 둔 `<details>`(현금 일정 미리 보기, 이 계약의 돈 흐름 등)는 닫힌다. 초점이 id도 `data-action`도 없는 요소(예: `<summary>`)에 있었으면 다시 그린 뒤 본문으로 간다. 다른 모든 다시 그리기와 같다. 지금 빌드는 폭이 바뀌어도 다시 그리지 않아 닫히지 않는다.
- **A의 읽던 자리:** 오래전 오른쪽 조작이 남아 있으면 하루 진행 때 주 열이 그만큼 움직인다. 시제품 실측(UX-23 표)으로 주 열 셋째 견적이 RQ +102~+117px, RR +81~+96px, RQB +489~+511px다(세 열 6개 프로필). 스크롤 막대만 끌거나 주 열에 초점을 둔 채 키보드로 오른쪽을 읽으면 주 열 기준이다(배치 README 6절).
- **한 열의 자원 예약:** 현지 패널을 연 채 한 열에서 자원 예약을 읽다 견적이 만료되는 날 하루를 진행하면 자원 제목이 −2,450.9px 움직인다(기준·시제품 같음). 한 열은 A의 열 규칙을 쓰지 않는다(설계대로). ‘범위 밖 발견’에 적는다.
- **카드 아래 상세:** 카드를 띠 아래쪽에 두고 누르면 상세 단추를 띠 안으로 가져오느라 카드가 위로 움직인다(`card-detail-low`: t1000 −145.7px, 세 열 −1.1~−6.4px). 상세 길이(300px 칸에서 약 641px)는 그대로다. 훈련 단추를 띠에 넣으면 카드와 ‘○○ 성장 기록’ 제목은 화면 위로 나간다. 누구의 훈련인지는 단추의 접근 이름(‘○○ 일반 훈련’)에 있다.
- **창 폭 전환 뒤 Tab:** 한 열로 바꾼 직후 Tab은 보이는 다음 칸으로 간다(일정 단추 → 동료 필터). 기준은 지도 단추로 건너뛰며 쪽을 굴렸다. 그래서 1180px으로 되돌린 뒤의 쪽 위치가 기준과 다르다(시제품은 일정 단추가 처음 자리, 기준은 104px 아래). 기록만 한다.
- **Esc 뒤 500ms:** Esc로 닫은 뒤 500ms 안의 누름(키보드 Enter의 click 포함)은 무시된다. 패널 열고 닫기의 기존 규칙(DECISIONS 928행)과 같다. 시제품 l1366에서 Esc 뒤 300ms에 누른 Enter가 무시됐다.

## 먼저 읽을 파일

- 화면 (`src/ui/main.ts`) — 이 작업이 고치는 파일
  - 44행 `lastTabAt`, 54행 `ignoreClicksUntil`, 55행 `activation`, 57~59행 `actionSizes`·`actionOffsets`.
  - 76~88행 `focusWithoutScroll`(화면 밖 대상은 ‘하루 진행’으로).
  - 94~106행 TASK-0018 Tab 기록(97~100행 keydown, capture)과 고정 영역 복원(101~106행 focusin).
  - 120~127행 `resetUi`.
  - 155~183행 `queue()`(161~163행 누른 칸 기억, 175행 다시 그리기, 176~181행 새 계약 제목).
  - 185~251행 `endDay()`: 195~196행 막대·띠, 198~222행 주 열 후보, 223행 `reading`, 235~246행 끝나는 날 분기, 247~249행 읽던 자리 복원.
  - 288~320행 `topbar()`: 297행 머리 문구, 311~318행 고정 막대, 317행 `.day-action`.
  - 772~797행 `crewPanel()`: 773행 `shown`, 782행 운영표 줄, 788행 카드 칸, 793행 상세, 794행 영입.
  - 840~852행 `queuePanel()`(845행 `queue-h`).
  - 864~941행 `render()`: 870~876행 초점 기억, 877~889행 화면 HTML(881~889행 `<main>`과 패널 순서), 893~897행 누른 칸 보정, 931~940행 초점 복원.
  - 943~947행 `showGrowthControl`, 955~968행 `openCulture`(960행), 970~985행 `closeCulture`(976~980행 최소 이동).
  - 1007~1151행 click 처리: 1014~1020행 `skip-to`, 1029~1033행 `schedule-toggle`, 1034~1039행 현지 탭·닫기·결과 보기, 1054~1058행 `culture-book`, 1061~1065행 `detail`, 1070~1074행 `interview`, 1077~1078행 `end-day`, 1103~1107행 `select-card`.
  - 1153~1161행 keydown(카드 Enter·Space), 1163~1192행 change, 1194~1206행 `loadText`.
- 화면 도우미 (**읽기만** 하는 파일과 고칠 한 줄)
  - `src/ui/growth.ts` 57~70행 `trainingBlock`(65행 훈련 단추·예정 표시 — 이 줄만 고친다), 73~86행 `employeeDetail`(78행 상세 단추, 79행 `section.employee-detail`).
  - `src/ui/recruitment.ts` 96~106행 `interviewBlock`(96행 `#interview-…` 칸, 97행 `interview-h-…`, 104행 고용 칸 `hire-…`), 134행 면담 단추. 142·147행 카드·운영표 줄 HTML. **읽기만.**
  - `src/ui/culture.ts` 129행 현지 탭 `#local-tab`, 177행 기록장 단추, 234행 현지 패널 `#local`, 241행 끝 닫기 단추. **읽기만.**
  - `src/ui/card.ts` 53행 카드 `<article class="card attr-bg-… is-selected"`. `src/ui/focus.ts` 8행 `FIXED_REGION_SELECTOR`. **읽기만.**
- CSS (`src/ui/style.css`): 61~84행 머리·막대(76~78행 `.brand`·`.sub`), 86~116행 격자(112~116행 한 열), 302~304행 `.crew-cards`, 413~414행 `.training`, 440~446행 터치 크기, 459~460행 `.training > .pill`, 514~516행 건너뛰기, 521~546행 TASK-0023 블록(파일 끝).
- 시험 틀 (`src/ui/main-testkit.ts` 전체): 12~18행 `window` 흉내, 51~61행 `document`, 64~90행 렌더 요소와 `closest` 흉내, 96~104행 `app`, 111~130행 돌려주는 도우미. 사건 이름마다 수신기 하나를 저장한다(같은 이름을 다시 등록하면 덮어씀).
- 시험 (`src/ui/main.test.ts`): 80~100행(TASK-0013 막대 비교, 89행), 799~806행(카드 두 번), 831~868행(격자·막대 CSS), 1234~1244행(열고 닫기 두 번), 1265~1274행(건너뛰기 CSS), 1275~1288행(세 열 화면 코드 순서), 1289~1296행(건너뛰기 첫 정지점), 1297~1311행(Shift+Tab 복원), 1318~1322행(결과 보기 Tab 한 번), 1380~1386행(빌드 표시), 1606~1617행(오늘 할 일·보고 칸 자르기), 1658~1670행(새 조작의 영역).
- `src/ui/map-integration.test.ts` 8~31행 `start()`: 29행 `window` 흉내에 `matchMedia`가 없다(구현 지시 7의 확인 호출 이유). **TASK-0025가 고친 파일이다. 읽기만.**
- 측정 도구(**읽기만**, `lib.test.mjs` 8행 한 줄만 고침): `tools/browser/lib.mjs`(47행 측정 종류, 61행 단계 종류, 120~137행 `tap` — 누르기 전 560ms·뒤 80ms, 145~151행 `scroll-to`, 152~157행 `remember`는 id가 있어야 함, 231행 단계당 15초 제한), `tools/browser/lib.test.mjs`(8행 `names`, 69~90행 금지 문자열, 99~124행 dry-run), `tools/browser/profiles.json`, 기존 시나리오 8개(TASK-0025 뒤 9개). `<BASE>`에서 `lib.mjs` 231행은 238행, `lib.test.mjs` 69~90·99~124행은 82~103·112~137행이다(머리말 ‘TASK-0025가 바꾸는 줄’).
- 크기 한도: `tools/check_bundle_size.mjs`(TASK-0026)와 `tools/ai/review_checks.sh`(빌드 뒤 크기 한도 검사). **읽기만.**
- 위 ‘결정 근거’의 문서 줄. 특히 배치 README 15~28·296~304·331~355행.

## 범위

**포함 (이 순서로 한다)**
1. 공통: 카드 아래 상세(구현 지시 1), 펼침 띠(구현 지시 2), 훈련 칸(구현 지시 3).
2. A: ‘오늘 할 일 N건’ 단추(구현 지시 4), 마지막 조작 열(구현 지시 5).
3. Esc 닫기(구현 지시 6).
4. 한 열 화면 코드 순서(구현 지시 7).
5. 머리 줄(구현 지시 8).
6. 측정 시나리오 5개(구현 지시 9).
7. 시험, 기존 단언 하나 고치기, 결과 보고.

**제외**
- 배치안 B·C(진행 중 계약을 견적판 위로, 오른쪽 칸 묶음 `.sidecol`, 오른쪽 창).
- K1(주 열 미리 보기 아래 계약을 읽던 중) 대책 (가)·(나). 결정 대기다.
- Esc로 닫는 대상 늘리기: 일정 펼침(`schedule-toggle`), `<details>`, 현지 미리 보기. 다른 단축키(한 글자·조합 키).
- 격자 문자열 바꾸기(O1), CSS `reading-flow`(O3a), 세 열 화면 코드 순서 바꾸기(O2).
- 세로 태블릿·휴대폰에서 막대가 두 줄로 접히는 것을 줄이는 일(‘사전 측정’ 대가). ‘질문’에 의견만 적는다.
- `session.ts`의 `initialUiState`에 필드 더하기. 이 작업의 화면 상태는 `main.ts` 모듈 변수로 두고 `resetUi`에서 되돌린다(구현 지시 0).
- 지도, 엔진, 자료, 사용성 시험 절차서(`docs/USABILITY_TEST_M2A.md`의 T5·‘가로 세 열에서 볼 것’ 문단은 반영 때 Claude가 고친다).
- 브라우저 측정. Sol 샌드박스에서는 Chromium이 죽는다(`docs/ai/tasks/results/TASK-0012.md` 99~102행). 시나리오는 `--dry-run`만 한다. Claude가 잰다.

**시간이 모자라면 뺄 수 있음** (1번부터 뺀다)
1. 측정 시나리오 5개와 `lib.test.mjs` 한 줄(구현 지시 9). Claude가 직접 쓴다.
- 뺀 항목은 결과 보고 ‘완료 조건 대조’에 ‘미충족(시간)’으로 적는다. 그 밖의 것은 빼지 않는다.

## 고칠 수 있는 파일

- `src/ui/main.ts`
- `src/ui/style.css`: 파일 끝에 새 규칙 블록을 더하기만 한다(구현 지시 1·3·4·8). 기존 규칙 줄은 바꾸거나 지우지 않는다.
- `src/ui/growth.ts`: 65행 한 줄만(구현 지시 3).
- `src/ui/main-testkit.ts`: 흉내와 도우미를 **더하기만** 한다. 기존 흉내의 동작은 바꾸지 않는다(부록 A).
- `src/ui/main.test.ts`: 89행 단언 하나만 바꾸고, 그 시험 안에 줄을 더한다(아래 ‘바꿔도 되는 기존 단언’). 그 밖에는 손대지 않는다.
- 새 파일 `src/ui/layout.test.ts`(부록 B).
- 새 측정 시나리오 5개: `tools/browser/scenarios/queue-chip.json`, `card-detail.json`, `card-detail-low.json`, `interview-hire.json`, `side-anchor.json`.
- `tools/browser/lib.test.mjs`: 8행 `names` 배열 끝(TASK-0025가 더한 `'route-map-fit'` 뒤)에 위 다섯 이름을 더하는 한 줄만. 배열의 기존 이름은 지우거나 순서를 바꾸지 않는다.
- `docs/ai/tasks/results/TASK-0024.md` (결과 보고)
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - TASK-0025 파일(허브 세션 소유): `src/ui/map.ts`, `src/ui/map-fit.test.ts`, `src/ui/map-integration.test.ts`, `tools/browser/lib.mjs`, `tools/browser/scenarios/route-map-fit.json`.
  - TASK-0026 파일: `vite.config.ts`, `tools/bundle-size.mjs`, `tools/check_bundle_size.mjs`, `tools/check_bundle_size.test.mjs`, `tools/ai/**`(`review_checks.sh` 포함).
  - 글꼴(D16): `index.html`, `public/**`(`public/fonts/**` 포함), `tools/fonts/**`.
  - 허브만 쓰는 저장소 설정(`docs/ai/SESSION_TREE.md` 63~66행): `CLAUDE.md`, `AGENTS.md`, `.github/**`, `tools/ai/**`, `package.json`, `package-lock.json`, `vite.config.ts`, `PACKAGE_STATUS.json`.
  - `src/ui/session.ts`, `recruitment.ts`, `culture.ts`, `card.ts`, `focus.ts`, `reports.ts`, `schedule.ts`, `crew-status.ts`, `trade.ts`, `html.ts`, `assets.ts`, `pixel.ts`, `projection.ts`, `sprite.ts`.
  - 위 목록에 없는 시험 파일(`growth.test.ts`, `culture.test.ts`, `recruitment.test.ts`, `schedule.test.ts` 등).
  - `src/engine/**`, `src/content/**`, `data/**`, `tests/**`, `schemas/**`, `scripts/**`.
  - `tools/browser/measure.mjs`, `profiles.json`, `README.md`, 기존 시나리오(TASK-0025의 `route-map-fit.json`까지 9개).
  - `tsconfig.json`. 새 npm 의존성을 넣지 않는다.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/VALIDATION.md`, `docs/USABILITY_TEST_M2A.md`, `docs/art/**`
  - `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/SESSION_TREE.md`, `docs/ai/CONTEXT_MAP.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `docs/ai/design/**`, 지난 지시서(`docs/ai/tasks/TASK-*.md`)
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `references/**`

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다.
- 기존 시험의 단언은 ‘바꿔도 되는 기존 단언’의 하나만 바꾼다. 다른 기존 시험이 실패하면 설계가 어긋난 것이다. 원인을 찾고, 못 찾으면 보고한다.
- **시험 환경을 피하려고 `?.` 선택 호출이나 존재 확인을 새로 넣지 않는다. 시험 틀을 넓힌다(TASK-0014 검수 기록).** 예외는 하나다: `window.matchMedia`가 함수인지 확인하는 줄(구현 지시 7). 지도 연결 시험 틀(`map-integration.test.ts`, TASK-0025가 고친 파일이고 이 작업에서는 손대지 않는다)의 `window`에 `matchMedia`가 없기 때문이다. 같은 확인이 `pixel.ts` 82행에 이미 있다. 이 확인 말고는 `?.`·`typeof … === 'function'`을 시험 때문에 쓰지 않는다. 실제 DOM에서 없을 수 있는 요소(`querySelector` 결과 등)를 다루는 `?.`·`if`는 괜찮다.
- 키보드·초점 시험은 실제 Chromium 순서를 따른다: Tab keydown → (화면 이동) → focusin → Enter keydown → click. Esc는 document의 keydown 하나로 온다(DECISIONS 1036행).
- 새로 쓰는 시험 줄에 도시·견적·노선·사건·직원·계약·업무·장소 ID와 도시 이름을 쓰지 않는다.
  - 금지 예: `PYEONGTAEK`, `BUSAN`, `HAIPHONG`, `SHANGHAI`, `OFFER_*`, `ROUTE01`, `EVI_*`, `EMP01`, `EMP04`, `CT001`, `TASK001`, `VEN_PORT`, ‘평택’, ‘부산’, ‘하이퐁’, ‘상하이’.
  - 값은 설정·상태·렌더된 단추에서 꺼낸다. 예: `config.employees[0]!.id`, `config.recruitment!.scoutSites[0]!.venueId`, `ui.rendered({action:'interview'}).dataset.candidate`, `ui.rendered({action:'cancel'}).dataset.contract`.
  - 시나리오 ID 상수(`'SCENARIO_M2_MULTI_TRADE'`, `'SCENARIO_M1_ONE_TRADE'`)는 써도 된다.
- 문장은 전체를 단언한다. 새 단추는 HTML 전체 문자열로 단언한다(부록 B `chip()`).
- 학생이 읽는 글을 이 지시서가 정한 것(구현 지시 4의 단추 글과 접근 이름) 말고는 새로 쓰거나 바꾸지 않는다. 결과 보고 ‘화면 문구’ 절에 적는다.
- 모든 글을 `esc()`로 넣는다. 양수 `tabindex`를 쓰지 않는다. 오늘 할 일·경영 보고 칸 안에 `<section>`을 새로 넣지 않는다(`main.test.ts` 1606행).
- 새 CSS는 파일 끝에 더하기만 한다. 터치 크기는 `@media (any-pointer: coarse)`로만 건다(DECISIONS 1064행). 기존 규칙 문자열을 바꾸지 않는다(`main.test.ts` 831~868·1078~1090·1265~1274·1710~1726행이 고정한다).
- 새로 여닫거나 옮기는 동작(‘오늘 할 일’ 단추, Esc 닫기)에는 500ms 누름 막기(`ignoreClicksUntil`)를 건다(DECISIONS 928행).
- **크기 한도(TASK-0026):** `npm run build` 뒤 `node tools/check_bundle_size.mjs dist`가 통과해야 한다(DECISIONS 1116행). 새 의존성·큰 표·그림 자료를 코드에 넣지 않는다. Claude 시제품은 코드 청크 +4,914 B, 첫 화면 합계 561,362 B(한도 600,000 B)였다. 이 작업의 증가가 8,000 B를 넘으면 결과 보고 ‘설계 판단’에 이유를 적는다.
- 코드 주석은 한국어로, 짧은 문장으로 쓴다.
- **시험 제목과 인수 명세:** 사례 ID(`P0-…`, `P1-…`, `P2-…`, `CHAR-ACC-…`)가 든 기존 제목은 바꾸지 않는다. 새 시험 제목에 사례 ID를 넣지 않는다.
- 네트워크 조사는 하지 않는다.

## 구현 지시

### 0. 공통 규칙

**화면 상태 (`main.ts` 모듈 변수, 59행 `actionOffsets` 바로 뒤에 둔다)**

```ts
/** 세 열 배치의 오른쪽 세 칸. */
const SIDE_PANELS = '.crew, .resources, .queue';
/** 하루 진행 뒤 오른쪽 칸에서 읽던 자리 후보. */
const SIDE_ANCHORS = '.crew h2, .crew h3, .crew h4, .crew article.card, .crew tbody tr, .resources h2, .resources h3, .resources li, .queue h2, .queue li, .queue .growth-notices';
/** 마지막으로 누르거나 굴리거나 초점을 둔 열(배치안 A). */
let lastColumn: 'main' | 'side' | null = null;
/** 동료를 카드로 골랐으면 상세를 그 카드 바로 아래에 둔다. 운영표 줄로 골랐으면 운영표 아래. */
let detailUnder: 'card' | 'roster' = 'card';
/** Esc로 닫는 칸. 안쪽 칸이 앞이다(기록장은 현지 패널 안). */
type LayerKey = 'book' | 'local' | 'interview' | 'detail';
const LAYER_ORDER: LayerKey[] = ['book', 'local', 'interview', 'detail'];
/** 칸마다 마지막으로 열거나 그 안을 누르거나 초점을 둔 순번. */
const layerTouched: Record<LayerKey, number> = { book: 0, local: 0, interview: 0, detail: 0 };
let layerSeq = 0;
```

- `resetUi()`(120~127행) 끝에 세 줄을 더한다: `lastColumn = null;`, `detailUnder = 'card';`, `for (const key of LAYER_ORDER) layerTouched[key] = 0;`. 불러오기·가져오기·처음부터·시나리오 바꾸기 뒤에 되돌아간다.
- `session.ts`는 고치지 않는다. 이 상태는 저장 파일에 들어가지 않는다.

**시나리오별 적용**
- M2만(`config.culture`가 있을 때): ‘오늘 할 일 N건’ 단추(구현 지시 4), 카드 아래 상세(구현 지시 1), 마지막 조작 열(구현 지시 5).
- 성장·영입이 있는 화면에만 생기는 것(M2): 펼침 띠(구현 지시 2), 훈련 칸(구현 지시 3).
- 모든 시나리오: Esc(구현 지시 6, M1에는 닫을 칸이 없어 아무 일도 하지 않는다), 한 열 화면 코드 순서(구현 지시 7), 머리 줄(구현 지시 8).

### 1. 공통 — 카드 아래 상세 (`crewPanel` 772~797행, click 1103~1107행, keydown 1153~1161행)

- 고른 출처를 기억한다. `select-card`의 click 처리(1103행)와 keydown 처리(1155~1159행)에서 `ui.selectedCard`를 바꾸기 바로 전에:
  ```ts
  detailUnder = el.tagName === 'ARTICLE' ? 'card' : 'roster';
  ```
  - 카드는 `<article data-action="select-card">`(`card.ts` 53행, `recruitment.ts` 142행)다. 운영표는 `<tr data-action="select-card">`와 그 안의 이름 단추 `<button class="roster-pick" data-action="select-card">`(`recruitment.ts` 147행)다. 둘 다 운영표다. click의 `el`은 `closest('[data-action]')`라 이름 단추를 누르면 BUTTON, 줄의 다른 칸을 누르면 TR이다.
- `crewPanel`: 793행의 상세 식을 `detail` 상수로 한 번만 만들고, 카드 아래에 둘지 정한다. 두 상수는 782행 `rows` 바로 뒤(`return` 앞)에 둔다.
  ```ts
  const detail = ui.selectedCard && employedDefs(view,config).some((e)=>e.id===ui.selectedCard) ? employeeDetail(view,config,config.employees.find((e)=>e.id===ui.selectedCard)!,ui.detailId===ui.selectedCard,ui.pending.some((p)=>p.type==='START_TRAINING' && p.employeeId===ui.selectedCard)) : '';
  // 배치 공통: 카드로 골랐고 그 카드가 보이면 상세를 카드 바로 아래에 둔다(M2만).
  const inline = Boolean(config.culture && detail && detailUnder === 'card' && shown.some((entry) => entry.def.id === ui.selectedCard));
  ```
  - 788행 카드 칸: 고른 카드 바로 뒤에 `<div class="card-detail">${detail}</div>`를 붙인다(`inline`일 때만). 나머지 카드는 그대로다.
  - 793행: `${inline ? '' : detail}`.
- `showGrowthControl()`(943~947행)은 그대로다. 카드를 고르면 상세 단추를 `scrollIntoView({block:'nearest'})`로 가져오고 초점을 둔다. 상세 단추가 카드 바로 아래라 카드는 거의 움직이지 않는다.
- CSS(파일 끝):
  ```css
  /* 배치 공통(TASK-0024): 카드로 고른 동료의 성장·훈련 상세는 그 카드 바로 아래 한 줄 전체를 쓴다. */
  .crew-cards > .card-detail { grid-column: 1 / -1; min-width: 0; }
  .card-detail .growth-detail { margin-top: 0; }
  ```
- 필터(상태·직무·속성)로 고른 카드가 `shown`에서 빠지면 `inline`이 거짓이라 운영표 아래에 그린다. 필터를 풀면 카드 아래로 돌아온다(`detailUnder`는 그대로).

### 2. 공통 — 펼치면 실행 단추를 띠 안으로 (`revealBelow`)

- 새 함수(`endDay` 뒤, ‘화면 조각’ 앞):
  ```ts
  /** 펼친 칸의 실행 단추를 띠 안으로 최소 거리만 가져온다. 칸 제목은 막대 아래 8px 밑에 남긴다. 누른 뒤 생길 아래쪽 알림 자리 72px을 미리 비운다. */
  function revealBelow(target: HTMLElement | null, head: HTMLElement | null) {
    if (!target) return;
    const top = app.querySelector<HTMLElement>('.statusbar')!.getBoundingClientRect().bottom;
    const bottom = Math.min(window.innerHeight - 72, app.querySelector<HTMLElement>('.flash-toast')?.getBoundingClientRect().top ?? Infinity);
    let dy = target.getBoundingClientRect().bottom + 8 - bottom;
    if (dy < 1) return;
    if (head) dy = Math.min(dy, head.getBoundingClientRect().top - top - 8);
    if (dy >= 1) window.scrollBy(0, dy);
  }
  ```
  - 72px은 현지 미리 보기(`showCulturePreview` 995행)와 같은 예약이다. 단추를 누르면 생기는 아래쪽 알림(약 40~60px)에 예정 표시가 가리지 않게 한다.
- `detail` 처리(1061~1065행): `render()` 뒤, 500ms 줄 앞에서 펼쳤을 때만 부른다.
  ```ts
  if (ui.detailId) revealBelow(app.querySelector<HTMLElement>(`[data-action="train"][data-emp="${ui.detailId}"]`) ?? document.getElementById(`status-train-${ui.detailId}`),
    app.querySelector<HTMLElement>(`#growth-${ui.detailId} .training h4`));
  ```
- `interview` 처리(1070~1074행): 같은 자리에서 펼쳤을 때만.
  ```ts
  if (ui.interviewId) revealBelow(app.querySelector<HTMLElement>(`[data-action="hire"][data-candidate="${ui.interviewId}"]`) ?? document.getElementById(`status-hire-${ui.interviewId}`),
    document.getElementById(`interview-h-${ui.interviewId}`));
  ```
- 접을 때는 굴리지 않는다. 초점은 `render()`의 기존 복원(931~940행)이 누른 단추에 둔다. `revealBelow`는 초점을 옮기지 않는다.
- 훈련 단추가 꺼져 있어도(훈련할 수 없음) 단추 자리로 가져온다. 거절 이유 문장이 단추 바로 뒤에 있다.

### 3. 공통 — 훈련 단추 칸 (F1, `growth.ts` 65행)

- 65행의 삼항 식 전체를 칸으로 감싼다. 판정·문구는 그대로다.
  ```ts
  <div data-action-slot="train-${esc(def.id)}">${trainingQueued ? `<span class="pill" id="status-train-${esc(def.id)}" tabindex="-1">일반 훈련 예정</span>` : `<button data-action="train" data-emp="${esc(def.id)}" aria-label="${esc(def.nameKo)} 일반 훈련" ${preview.allowed ? '' : 'disabled'}>일반 훈련</button>`}</div>
  ```
- 그러면 `queue()`의 누른 칸 기억(161~163행)과 다시 그린 뒤 보정(893~897행)이 훈련에도 적용된다. 위 내용이 늘면 늘어난 만큼 굴려 ‘일반 훈련 예정’을 누른 높이에 둔다. 줄면 굴리지 않는다(기존 규칙).
- CSS(파일 끝). 기존 `.training > .pill` 두 줄(459~460행)은 그대로 둔다(`main.test.ts` 840행이 고정).
  ```css
  /* 훈련 단추를 감싼 칸 안의 예정 표시도 단추와 같은 높이를 지킨다. */
  .training > [data-action-slot] > .pill { display: inline-flex; align-items: center; min-height: 34px; }
  @media (any-pointer: coarse) { .training > [data-action-slot] > .pill { min-height: 44px; } }
  ```

### 4. A — ‘오늘 할 일 N건’ 단추 (`topbar` 317행, click 처리)

- 317행 `<div class="day-action">` 바로 앞에 M2만 넣는다. 줄바꿈 없이 붙인다.
  ```ts
  ${config.culture ? `<button class="queue-chip" id="queue-chip" data-action="queue-jump" aria-label="오늘 할 일 ${ui.pending.length}건 보기">오늘 할 일 <b>${ui.pending.length}</b>건</button>` : ''}<div class="day-action">…
  ```
  - 건수는 `ui.pending.length`, 곧 오늘 할 일 칸 목록(`ol.pending`)의 줄 수다.
  - 접근 이름 ‘오늘 할 일 N건 보기’는 보이는 글 ‘오늘 할 일 N건’을 그대로 품는다(WCAG 2.5.3).
- click 처리에 더한다(`end-day` 1077~1078행 뒤):
  ```ts
  case 'queue-jump': {
    const heading = document.getElementById('queue-h')!;
    heading.scrollIntoView({ block: 'start' });
    heading.focus({ preventScroll: true });
    ignoreClicksUntil = Date.now() + 500;
    return;
  }
  ```
  - 알림(`ui.flash`)·알림 영역에 쓰지 않는다. 다시 그리지 않는다.
- CSS(파일 끝):
  ```css
  /* 배치안 A: 고정 막대의 ‘오늘 할 일 N건’. 하루 진행 바로 왼쪽. */
  .queue-chip { margin-left: auto; display: inline-flex; align-items: baseline; gap: .2rem; padding: .3rem .7rem; font-size: .85rem; white-space: nowrap; border-color: var(--sky-deep); color: var(--sky-deep); background: #f6fbff; }
  .queue-chip b { font-size: 1rem; color: var(--navy); }
  .queue-chip + .day-action { margin-left: 0; }
  ```
  - 터치 44px은 기존 `@media (any-pointer: coarse) { button … { min-height: 44px; } }`(440~446행)가 준다. 새 터치 규칙은 필요 없다.
- 단추는 `.statusbar` 안이라 TASK-0018의 고정 영역 처리(101~106행)를 그대로 받는다. Shift+Tab으로 단추에 들어오면 Tab 누름 때의 화면 위치로 되돌린다.
- **새 문장과 반례 상태(DECISIONS 1063행)**
  | 문장 | 반례 상태 | 처리 |
  |---|---|---|
  | `오늘 할 일 N건`, 접근 이름 `오늘 할 일 N건 보기` | 수락(A) 뒤 배정(B)을 넣고 A를 ‘빼기’로 뺀 상태. B는 실행할 수 없는 줄(`<li class="bad">`)로 목록에 남는다 | 목록에 보이는 줄 수를 센다(1건). 목록과 단추가 어긋나지 않는다. 시험한다(부록 B ‘M2 막대의 단추는…’) |
  | 같은 문장 | 90일 캠페인이 끝난 상태. 마지막 하루 진행이 대기 명령을 비우고(`endDay()` 229행), 끝난 뒤 넣는 명령은 거절된다(`queue()` 165~167행) | `오늘 할 일 0건`. 누르면 ‘캠페인이 끝났습니다’·‘결산 보기’가 있는 오늘 할 일 칸으로 간다. 거짓이 아니다. 시험하지 않는다(종료 화면은 TASK-0023 시험이 덮는다) |
  | 같은 문장 | 하루를 막 시작해 대기 명령이 없는 상태 | `오늘 할 일 0건`. 거짓이 아니다 |
  | 같은 문장 | 수락 하나에 배정·예약을 함께 고른 계획 수락(`accept-plan`) | 명령 하나, 목록 한 줄이라 `1건`이다. 목록과 단추가 어긋나지 않는다 |

### 5. A — 하루 진행 뒤 읽던 자리: 마지막 조작 열

- 마지막 조작 열 기억. `app` 수신기를 더한다(capture, passive). 위치는 90행 `const app` 정의 뒤, `render()` 정의 앞의 모듈 최상위다. `app`을 정의하기 전(예: 59행 상태 변수 옆)에 두면 모듈을 읽는 순간 `app` 초기화 전 접근 오류가 난다(Claude 시제품은 `queuePanel` 뒤, 구현 지시 7의 블록 다음에 뒀다).
  ```ts
  for (const type of ['pointerdown', 'wheel', 'touchstart', 'focusin']) {
    app.addEventListener(type, (ev) => {
      const el = ev.target as HTMLElement;
      if (el.closest(SIDE_PANELS)) lastColumn = 'side';
      else if (el.closest('.layout')) lastColumn = 'main';
      if (type === 'pointerdown' || type === 'focusin') touchLayers(el);   // 구현 지시 6
    }, { capture: true, passive: true });
  }
  ```
  - 오른쪽 세 칸 → `side`. 그 밖의 `<main class="layout">` 안(주 열·현지 패널·지도·보고·기록) → `main`. 고정 막대·건너뛰기·아래쪽 알림은 바꾸지 않는다. 그래서 ‘하루 진행’을 눌러도 열 기억이 남는다.
  - 배치 README의 시안은 주 열을 `.maincol, .trade`로만 봤다. 이 지시서는 바닥 줄(지도·보고·기록)도 주 열로 본다. 바닥 줄을 읽다 하루를 진행하면 오래된 오른쪽 기억으로 주 열이 움직이지 않게 하려는 것이다.
  - 코드가 옮긴 초점도 focusin이라 열 기억을 바꾼다. 설계대로다. ‘오늘 할 일 N건’ 단추·‘오늘 할 일로 바로 가기’는 초점을 `#queue-h`(오른쪽)로 옮기므로 오른쪽이 되고, 이어서 하루를 진행하면 세 열에서 ‘오늘 할 일’ 제목을 붙잡는다. 수락 뒤 새 계약 제목으로 초점이 가면(`queue()` 176~181행) 주 열이 된다. 코드 초점을 거르는 조건을 더하지 않는다.
- `endDay()`: 223행 `reading` 바로 뒤에 더한다.
  ```ts
  // 배치안 A: 세 열에서 마지막 조작이 오른쪽 칸이면 그 칸의 후보를 기준으로 삼는다(M2만).
  // 막대 아래에서 시작하는 후보를 먼저 쓴다. 없으면 막대에 걸친 후보를 쓴다.
  const sideBoxes = config.culture && lastColumn === 'side' && !isOneColumn()
    ? Array.from(app.querySelectorAll<HTMLElement>(SIDE_ANCHORS)).map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height > 0 && r.bottom > barBottom + 1 && r.top < bandBottom).sort((a, b) => a.r.top - b.r.top)
    : [];
  const sideReading = [...sideBoxes.filter(({ r }) => r.top >= barBottom - 1), ...sideBoxes.filter(({ r }) => r.top < barBottom - 1)]
    .map(({ el, r }) => ({ key: sideKey(el), top: r.top }));
  ```
  - **막대 아래에서 시작하는 후보 우선:** 배치 README의 시안은 ‘띠에 걸친 첫 후보’를 썼다. Claude 시제품 측정에서 오늘 할 일 제목을 막대 아래 120px에 두고 읽을 때, 막대에 반쯤 가린 자원 예약 목록 줄(위 −23px)이 기준이 되어 하루 진행 뒤 선복 목록이 두 줄 늘자 오늘 할 일 제목이 +174.4px 밀렸다. 막대 아래에서 시작하는 후보를 먼저 쓰자 0~0.4px였다(사전 측정 `side-anchor`).
- 247~249행: `render()` 뒤 복원을 둘로 나눈다. 주 열 쪽 두 줄은 글자 그대로 `else` 안으로 옮긴다.
  ```ts
  render();
  if (sideReading.length) {
    const all = Array.from(app.querySelectorAll<HTMLElement>(SIDE_ANCHORS));
    const hit = sideReading.map((s) => ({ ...s, element: all.find((el) => sideKey(el) === s.key) })).find((s) => s.element);
    if (hit) { const dy = hit.element!.getBoundingClientRect().top - hit.top; if (Math.abs(dy) >= 1) window.scrollBy(0, dy); }
  } else {
    const remaining = reading.map((head) => ({ ...head, element: document.getElementById(head.id) })).find((head) => head.element);
    if (remaining) { const dy = remaining.element!.getBoundingClientRect().top - remaining.top; if (Math.abs(dy) >= 1) window.scrollBy(0, dy); }
  }
  ignoreClicksUntil = Date.now() + 500;
  ```
- 후보 열쇠:
  ```ts
  /** 오른쪽 칸 후보의 열쇠. 다시 그린 뒤에도 같은 열쇠로 찾는다. id → 직원 → 칸·태그·글자 앞 24자. */
  function sideKey(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    const panel = el.closest(SIDE_PANELS)!.classList[1];
    return `${panel}|${el.tagName}|${el.dataset.emp ?? (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 24)}`;
  }
  ```
- 끝나는 날 분기(235~246행)는 그대로다. 그 분기가 먼저 `return`하므로 오른쪽 보정도 돌지 않는다.
- 한 열(`isOneColumn()`, 구현 지시 7)과 M1에서는 `sideBoxes`가 비어 지금 규칙 그대로다.

### 6. Esc 닫기 (D13)

**규칙**
- 맨 위 칸 = 지금 열린 칸 가운데 **가장 최근에 열거나, 그 칸 안이나 그 칸을 연 단추를 누르거나(pointerdown) 초점을 둔(focusin) 칸**. 같은 순번이면 안쪽 칸(`LAYER_ORDER` 앞)이다.
  - 왜 초점만으로 정하지 않나: iPad Safari·macOS Safari는 단추를 눌러도 초점을 주지 않는다(본문에 남음). 화면을 다시 그리면 초점이 ‘하루 진행’으로 가기도 한다(`focusWithoutScroll`). 그래서 ‘연 순서 + 그 안의 조작’으로 정한다.
- Esc는 그 칸을 닫고, 그 칸을 연 단추로 초점을 돌려준다. 단추가 띠(막대 아래 8px ~ 아래쪽 알림 위 8px) 밖이면 최소 거리만 굴린다(APG: 연 요소로 초점 복귀, 초점은 보여야 한다).
- 열린 칸이 없거나, 같은 키를 누르고 있어 반복된 입력(`repeat`)이거나, 조합 키(Ctrl·Alt·Meta·Shift)와 함께거나, 입력기 조합 중(`isComposing`)이면 아무것도 하지 않고 기본 동작도 막지 않는다.
- 다른 단축키는 넣지 않는다.

**칸 정의**

| 칸 | 열린 조건 | 칸 안 판정(`closest`) | 연 단추 | 닫기 | 초점 복귀 |
|---|---|---|---|---|---|
| 기록장 `book` | `ui.cultureOpen && ui.cultureBookOpen` | `#culture-book-body, [data-action="culture-book"]` | `[data-action="culture-book"]`(`culture.ts` 177행) | `ui.cultureBookOpen = false; render(true)` | 기록장 단추, `revealOpener` |
| 현지 패널 `local` | `ui.cultureOpen` | `#local, #local-tab` | `#local-tab`(`culture.ts` 129행) | `closeCulture()` 그대로(970~985행) | `closeCulture`가 한다: 열기 전 탭 위치 복원 또는 최소 이동, 탭에 초점, 500ms |
| 면담 `interview` | `ui.interviewId`이고 `#interview-${id}`가 있음 | `#interview-${id}, [data-action="interview"][data-candidate="${id}"]` | 그 후보의 면담 단추(`recruitment.ts` 134행) | `ui.interviewId = null; render(true)` | 면담 단추, `revealOpener` |
| 성장 상세 `detail` | `ui.detailId`가 `ui.selectedCard`와 같고 `#growth-${id}`가 있음 | `#growth-${id}, [data-action="detail"][data-emp="${id}"]` | 그 직원의 상세 단추(`growth.ts` 78행) | `ui.detailId = null; render(true)` | 상세 단추, `revealOpener` |

- 기록장은 현지 패널 안이다. 기록장 안을 누르면 두 칸이 같은 순번을 받고, 안쪽인 기록장이 먼저 닫힌다. 다음 Esc가 현지 패널을 닫는다.
- 현지 패널을 아래쪽 알림의 ‘결과 보기’로 열었으면 그 단추는 알림과 함께 사라진다(`openCulture(true)`가 `ui.flash = null`). 그래서 연 단추는 언제나 현지 탭이다(APG: 연 요소가 없으면 논리적으로 가까운 요소). `closeCulture`는 이때 `ui.cultureTabTop`이 없어 탭을 띠 안으로 최소 거리만 옮긴다.
- 연 단추를 찾지 못하면(예상하지 못한 경우) `#crew-h`에 초점을 둔다.

**코드**

```ts
// 97~100행 keydown(capture) 수신기 안, if/else 다음 줄에 한 줄만 더한다. 기존 두 분기는 그대로다.
  if (ev.key === 'Escape' && !ev.repeat && !ev.isComposing && !ev.ctrlKey && !ev.altKey && !ev.metaKey && !ev.shiftKey) closeTopLayer(ev);
```

- 이 수신기는 document 수신기다. 초점이 본문에 있어도 Esc를 받는다. 시험 틀이 사건 이름마다 수신기 하나만 저장하므로(부록 A), Esc를 위한 document·app keydown 수신기를 따로 등록하지 않는다. 따로 등록하면 TASK-0018 시험이 깨진다.
- Esc는 Tab이 아니므로 기존 else 분기가 `lastTabAt`을 지운다. 그대로 둔다.

```ts
/** 열린 칸과 그 칸의 안 판정 선택자·연 단추. 안쪽 칸이 앞이다. */
function openLayers(): { key: LayerKey; within: string; opener: () => HTMLElement | null }[] {
  const layers: { key: LayerKey; within: string; opener: () => HTMLElement | null }[] = [];
  if (ui.cultureOpen && ui.cultureBookOpen) layers.push({ key: 'book', within: '#culture-book-body, [data-action="culture-book"]', opener: () => app.querySelector<HTMLElement>('[data-action="culture-book"]') });
  if (ui.cultureOpen) layers.push({ key: 'local', within: '#local, #local-tab', opener: () => document.getElementById('local-tab') });
  const iv = ui.interviewId;
  if (iv && document.getElementById(`interview-${iv}`)) layers.push({ key: 'interview', within: `#interview-${iv}, [data-action="interview"][data-candidate="${iv}"]`, opener: () => app.querySelector<HTMLElement>(`[data-action="interview"][data-candidate="${iv}"]`) });
  const dt = ui.detailId;
  if (dt && dt === ui.selectedCard && document.getElementById(`growth-${dt}`)) layers.push({ key: 'detail', within: `#growth-${dt}, [data-action="detail"][data-emp="${dt}"]`, opener: () => app.querySelector<HTMLElement>(`[data-action="detail"][data-emp="${dt}"]`) });
  return layers;
}
/** 누르거나 초점을 둔 곳이 열린 칸 안이면 그 칸을 맨 위로 올린다. */
function touchLayers(el: HTMLElement) {
  const seq = ++layerSeq;
  for (const layer of openLayers()) if (el.closest(layer.within)) layerTouched[layer.key] = seq;
}
function markOpened(key: LayerKey) { layerTouched[key] = ++layerSeq; }
/** 닫은 칸을 연 단추를 띠 안으로 최소 거리만 옮기고 초점을 둔다(closeCulture 976~980행과 같은 띠). */
function revealOpener(el: HTMLElement | null) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const top = app.querySelector<HTMLElement>('.statusbar')!.getBoundingClientRect().bottom + 8;
  const bottom = Math.min(window.innerHeight, app.querySelector<HTMLElement>('.flash-toast')?.getBoundingClientRect().top ?? Infinity) - 8;
  const dy = rect.top < top ? rect.top - top : rect.bottom > bottom ? rect.bottom - bottom : 0;
  if (Math.abs(dy) >= 1) window.scrollBy(0, dy);
  el.focus({ preventScroll: true });
}
/** D13: Esc로 맨 위 칸을 닫고 연 단추로 초점을 돌려준다. */
function closeTopLayer(ev: KeyboardEvent) {
  const layers = openLayers();
  if (!layers.length) return;
  const top = layers.reduce((a, b) => (layerTouched[b.key] > layerTouched[a.key] ? b : a));
  ev.preventDefault();
  if (top.key === 'local') return closeCulture();
  if (top.key === 'book') ui.cultureBookOpen = false;
  if (top.key === 'interview') ui.interviewId = null;
  if (top.key === 'detail') ui.detailId = null;
  render(true);
  revealOpener(top.opener() ?? document.getElementById('crew-h'));
  ignoreClicksUntil = Date.now() + 500;
}
```

- `markOpened`를 부르는 곳(열 때만):
  - `openCulture()` 960행 `ui.cultureOpen = true;` 바로 뒤: `markOpened('local');`(현지 탭으로 열 때와 ‘결과 보기’로 열 때 모두).
  - `culture-book`(1054행): 토글 뒤 `if (ui.cultureBookOpen) markOpened('book');`.
  - `detail`(1061행): 토글 뒤 `if (ui.detailId) markOpened('detail');`.
  - `interview`(1070행): 토글 뒤 `if (ui.interviewId) markOpened('interview');`.
- `touchLayers`는 구현 지시 5의 `app` 수신기에서 pointerdown·focusin에만 부른다. wheel·touchstart는 칸을 올리지 않는다(굴리기만으로 맨 위가 바뀌지 않게).
- 닫힌 칸은 `openLayers()`에 없어 순번이 바뀌지 않는다.
- Esc는 500ms 막기에 걸리지 않는다(키보드다). 닫은 뒤에는 500ms 막기를 건다(현지 패널은 `closeCulture`가 건다).
- Esc는 알림(`ui.flash`)·알림 영역·저장 상태·위쪽 막대를 바꾸지 않는다.

### 7. 한 열 화면 코드 순서 (O3b)

- `render()` 앞(모듈 최상위)에 둔다.
  ```ts
  /** 한 열 배치 조건. style.css 112행 `@media (max-width: 1000px)`와 같은 글자다. */
  const ONE_COLUMN_QUERY = '(max-width: 1000px)';
  // 지도 연결 시험 틀(map-integration.test.ts)의 window에는 matchMedia가 없다. 그 틀에서만 세 열로 본다.
  const oneColumnQuery = typeof window.matchMedia === 'function' ? window.matchMedia(ONE_COLUMN_QUERY) : null;
  function isOneColumn(): boolean { return oneColumnQuery !== null && oneColumnQuery.matches; }
  /** 한 열 여부가 바뀌면(회전·창 크기) 패널 순서를 다시 그린다. 초점은 같은 조작에 그대로 두고 굴리지 않는다. */
  function onColumnChange() {
    const was = document.activeElement as HTMLElement | null;
    const key = was && was !== document.body ? { id: was.id, tag: was.tagName, data: { ...was.dataset } } : null;
    render(true);
    if (!key || (!key.id && !key.data.action)) return;
    const again = (key.id ? document.getElementById(key.id) : null) ?? Array.from(app.querySelectorAll<HTMLElement>('[data-action]'))
      .find((el) => el.tagName === key.tag && Object.entries(key.data).every(([k, v]) => el.dataset[k] === v));
    if (again) again.focus({ preventScroll: true });
  }
  if (oneColumnQuery) oneColumnQuery.addEventListener('change', onColumnChange);
  ```
  - `render(true)`는 기존 초점 복원(931~940행)을 건너뛴다. 기존 복원은 화면 밖 대상을 ‘하루 진행’으로 보낸다(`focusWithoutScroll`). 폭이 바뀌는 순간 초점은 화면 밖일 수 있으므로 쓰지 않는다(O3b → O3b2 수정).
  - `window.matchMedia` 확인은 ‘지켜야 할 것’의 유일한 예외다. 결과 보고 ‘설계 판단’에 적는다.
- 883~888행의 여섯 줄을 아래 한 덩어리로 바꾼다. **세 열 HTML은 패널 사이 글자(줄바꿈·공백)까지 지금과 같아야 한다.** 패널 함수들은 `\n  <section …`처럼 줄바꿈으로 시작하므로, 지금 템플릿과 같은 `'\n      '`로 잇는다.
  ```ts
      ${(isOneColumn() ? [queuePanel, crewPanel, resourcePanel, reportPanel, worldMap, logPanel]
        : [crewPanel, resourcePanel, queuePanel, worldMap, reportPanel, logPanel]).map((panel) => panel()).join('\n      ')}
  ```
  - 한 열 순서는 `style.css` 114행 한 열 격자(`"trade" "queue" "crew" "resources" "report" "world" "log"`)와 같다. 세 열 순서는 지금 그대로다.
  - 패널 함수의 부르는 순서가 바뀌어도 결과가 같다(Claude 확인: `newId`를 부르는 곳은 모두 `tradePanel` 안이고 거래 칸은 늘 먼저 그린다).
- `style.css`의 격자는 바꾸지 않는다.

### 8. 머리 줄 (DECISIONS 1110행)

- CSS(파일 끝)에 한 규칙을 더한다. HTML(297행 머리 문구)은 바꾸지 않는다(`main.test.ts` 1381행이 글자를 고정한다).
  ```css
  /* 머리 줄: 빌드 표시를 둘째 줄에 둬 표시 글 길이와 무관하게 1001~1100px에서도 저장·불러오기 묶음이 첫 줄에 남는다. */
  .brand .sub { max-width: 9.5rem; }
  ```
- 효과(사전 측정): 머리 문구가 ‘시제품 · 모든 숫자는 가상값 ·’ / ‘빌드 …’ 두 줄이 된다. 머리 영역 높이와 위쪽 막대 아래 끝은 7개 프로필에서 `dev` 빌드와 같고, 7자 해시·‘+수정’ 빌드에서도 같다.

### 9. 측정 시나리오 5개 (시간이 모자라면 뺄 수 있음 1번)

`tools/browser/scenarios/`에 아래 JSON을 그대로 쓴다. 선택자는 화면 속성과 id만 쓴다. 도시·견적·직원 ID가 없다(`lib.test.mjs` 69~90행 검사).

- `scroll-to`를 두 번 쓰는 이유: 페이지 맨 위에서 한 번 굴리면 머리 영역이 사라져 막대 아래 끝이 위로 올라간다. 첫 굴림 뒤의 막대 기준으로 다시 맞춘다. 세 열에서 동료 칸은 페이지 맨 위에 있어 더 위로 굴릴 수 없으면 맨 위 그대로다(`card_before`가 40보다 크다).
- 기대의 프로필별 상한은 ‘띠 아래 끝 − 단추 높이’다. 막대 높이 마우스 72.3px·터치 79·79.5px, 단추 높이 마우스 37.3px·터치 44px, 화면 높이는 `profiles.json`이다. 펼침 띠 상한은 72px 예약과 8px 여백을 뺀 ‘화면 높이 − 80 − 단추 높이 − 막대 높이 + 1’이다(+1은 반올림 여유).
- 예정 표시 상한은 시제품에서 잰 아래쪽 알림 위 끝(`toast_from_bar`) − 예정 표시 높이다. 알림 글은 ‘오늘 할 일에 넣었습니다. …’로 고정이다.

`tools/browser/scenarios/queue-chip.json`

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "queue-chip",
  "title_ko": "수락·배정·예약 뒤 ‘오늘 할 일 N건’ 단추로 오늘 할 일 보기",
  "source_ko": "TASK-0024 구현 지시 4·9",
  "profiles": "all",
  "steps": [
    {"do": "tap", "selector": "[data-action=\"accept\"][data-buy]", "index": 1},
    {"do": "tap", "selector": "[data-action=\"assign\"]:not([disabled])"},
    {"do": "tap", "selector": "[data-action=\"book\"]:not([disabled])"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "queue_from_bar_t1", "what": "top-from-bar", "selector": "#queue-h"},
    {"do": "measure", "name": "chip_from_bar", "what": "top-from-bar", "selector": "#queue-chip"},
    {"do": "measure", "name": "chip_h", "what": "height", "selector": "#queue-chip"},
    {"do": "tap", "selector": "#queue-chip"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "queue_from_bar", "what": "top-from-bar", "selector": "#queue-h"},
    {"do": "measure", "name": "first_item_from_bar", "what": "top-from-bar", "selector": ".queue .pending > li"},
    {"do": "measure", "name": "first_item_h", "what": "height", "selector": ".queue .pending > li"},
    {"do": "measure", "name": "overflow_x", "what": "overflow-x"}
  ],
  "expect": [
    {"value": "chip_from_bar", "min": -72, "max": -36, "profiles": "mouse", "source_ko": "TASK-0024 구현 지시 4(단추가 마우스 막대 72.3px 안)"},
    {"value": "chip_from_bar", "min": -79, "max": -44, "profiles": "touch", "source_ko": "TASK-0024 구현 지시 4(단추가 터치 막대 79px 안)"},
    {"value": "queue_from_bar", "min": -2, "max": 8, "profiles": "all", "source_ko": "TASK-0024 구현 지시 4(제목으로 이동)"},
    {"value": "first_item_from_bar", "min": 0, "max": 300, "profiles": "all", "source_ko": "TASK-0024 구현 지시 4(첫 항목이 띠 안)"},
    {"value": "overflow_x", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0024 구현 지시 9(가로 넘침 0)"}
  ]
}
```

`tools/browser/scenarios/card-detail.json`

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "card-detail",
  "title_ko": "동료 카드를 눌러 상세·일반 훈련까지: 카드 제자리와 실행 단추 위치",
  "source_ko": "TASK-0024 구현 지시 1~3·9",
  "profiles": "all",
  "steps": [
    {"do": "scroll-to", "selector": ".crew-cards > article.card", "offset_from_bar": 40},
    {"do": "scroll-to", "selector": ".crew-cards > article.card", "offset_from_bar": 40},
    {"do": "measure", "name": "card_before", "what": "top-from-bar", "selector": ".crew-cards > article.card"},
    {"do": "tap", "selector": ".crew-cards > article.card"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "card_after", "what": "top-from-bar", "selector": ".crew-cards > article.card"},
    {"do": "measure", "name": "detail_btn_from_bar", "what": "top-from-bar", "selector": "[data-action=\"detail\"]"},
    {"do": "tap", "selector": "[data-action=\"detail\"]"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "train_head_from_bar", "what": "top-from-bar", "selector": ".training h4"},
    {"do": "measure", "name": "train_btn_from_bar", "what": "top-from-bar", "selector": "[data-action=\"train\"]"},
    {"do": "measure", "name": "train_btn_h", "what": "height", "selector": "[data-action=\"train\"]"},
    {"do": "tap", "selector": "[data-action=\"train\"]"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "pill_from_bar", "what": "top-from-bar", "selector": "[id^=\"status-train-\"]"},
    {"do": "measure", "name": "pill_h", "what": "height", "selector": "[id^=\"status-train-\"]"},
    {"do": "measure", "name": "toast_from_bar", "what": "top-from-bar", "selector": ".flash-toast"},
    {"do": "measure", "name": "overflow_x", "what": "overflow-x"}
  ],
  "expect": [
    {"value": "card_after", "min": 38, "max": 42, "profiles": "all", "source_ko": "TASK-0024 구현 지시 1(카드가 2px 넘게 움직이지 않음, 누르기 전 40)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 548.4, "profiles": ["l1366"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 535, "profiles": ["cb1366t"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 697.5, "profiles": ["ipadAirL"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 645.5, "profiles": ["ipadminiL"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 621.5, "profiles": ["ipadmini6L"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 860.4, "profiles": ["l1920"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "detail_btn_from_bar", "min": 0, "max": 577.5, "profiles": ["t1000"], "source_ko": "TASK-0024 구현 지시 1(상세 단추가 띠 안)"},
    {"value": "train_head_from_bar", "min": 7, "max": 900, "profiles": "all", "source_ko": "TASK-0024 구현 지시 2(일반 훈련 제목이 막대 아래)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 468.4, "profiles": ["l1366"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 455, "profiles": ["cb1366t"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 617.5, "profiles": ["ipadAirL"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 565.5, "profiles": ["ipadminiL"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 541.5, "profiles": ["ipadmini6L"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 780.4, "profiles": ["l1920"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "train_btn_from_bar", "min": 0, "max": 497.5, "profiles": ["t1000"], "source_ko": "TASK-0024 구현 지시 2(훈련 단추가 72px 예약 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 503.6, "profiles": ["l1366"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 486.9, "profiles": ["cb1366t"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 649.4, "profiles": ["ipadAirL"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 597.4, "profiles": ["ipadminiL"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 573.4, "profiles": ["ipadmini6L"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 815.6, "profiles": ["l1920"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "pill_from_bar", "min": 0, "max": 529.4, "profiles": ["t1000"], "source_ko": "TASK-0024 구현 지시 2·3(예정 표시가 알림 위)"},
    {"value": "overflow_x", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0024 구현 지시 9(가로 넘침 0)"}
  ]
}
```

`tools/browser/scenarios/card-detail-low.json`

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "card-detail-low",
  "title_ko": "화면 아래쪽 동료 카드를 누를 때 상세 단추 위치",
  "source_ko": "TASK-0024 구현 지시 1·9",
  "profiles": "all",
  "steps": [
    {"do": "scroll-to", "selector": ".crew-cards > article.card", "offset_from_bar": 360},
    {"do": "scroll-to", "selector": ".crew-cards > article.card", "offset_from_bar": 360},
    {"do": "measure", "name": "card_before_low", "what": "top-from-bar", "selector": ".crew-cards > article.card"},
    {"do": "tap", "selector": ".crew-cards > article.card"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "card_after_low", "what": "top-from-bar", "selector": ".crew-cards > article.card"},
    {"do": "measure", "name": "detail_btn_low_from_bar", "what": "top-from-bar", "selector": "[data-action=\"detail\"]"},
    {"do": "measure", "name": "detail_btn_h", "what": "height", "selector": "[data-action=\"detail\"]"},
    {"do": "measure", "name": "overflow_x", "what": "overflow-x"}
  ],
  "expect": [
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 548.4, "profiles": ["l1366"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 535, "profiles": ["cb1366t"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 697.5, "profiles": ["ipadAirL"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 645.5, "profiles": ["ipadminiL"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 621.5, "profiles": ["ipadmini6L"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 860.4, "profiles": ["l1920"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "detail_btn_low_from_bar", "min": 0, "max": 577.5, "profiles": ["t1000"], "source_ko": "TASK-0024 구현 지시 1(아래쪽 카드도 상세 단추가 띠 안)"},
    {"value": "overflow_x", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0024 구현 지시 9(가로 넘침 0)"}
  ]
}
```

`tools/browser/scenarios/interview-hire.json`

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "interview-hire",
  "title_ko": "4일 면담을 펼칠 때 고용 단추 위치",
  "source_ko": "TASK-0024 구현 지시 2·9",
  "profiles": "all",
  "steps": [
    {"do": "tap", "selector": "[data-action=\"scout\"]:not([disabled])"},
    {"do": "end-day", "times": 1},
    {"do": "tap", "selector": "[data-action=\"recruit-quest\"]:not([disabled])"},
    {"do": "end-day", "times": 2},
    {"do": "scroll-to", "selector": "[data-action=\"interview\"]", "offset_from_bar": 120},
    {"do": "scroll-to", "selector": "[data-action=\"interview\"]", "offset_from_bar": 120},
    {"do": "tap", "selector": "[data-action=\"interview\"]"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "iv_head_from_bar", "what": "top-from-bar", "selector": "[id^=\"interview-h-\"]"},
    {"do": "measure", "name": "hire_from_bar", "what": "top-from-bar", "selector": "[data-action=\"hire\"]"},
    {"do": "measure", "name": "hire_h", "what": "height", "selector": "[data-action=\"hire\"]"},
    {"do": "tap", "selector": "[data-action=\"interview\"]"},
    {"do": "wait", "ms": 350},
    {"do": "scroll-to", "selector": "[data-action=\"interview\"]", "offset_from_bar": 480},
    {"do": "scroll-to", "selector": "[data-action=\"interview\"]", "offset_from_bar": 480},
    {"do": "tap", "selector": "[data-action=\"interview\"]"},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "iv_head_low_from_bar", "what": "top-from-bar", "selector": "[id^=\"interview-h-\"]"},
    {"do": "measure", "name": "hire_low_from_bar", "what": "top-from-bar", "selector": "[data-action=\"hire\"]"},
    {"do": "measure", "name": "overflow_x", "what": "overflow-x"}
  ],
  "expect": [
    {"value": "iv_head_from_bar", "min": 7, "max": 900, "profiles": "all", "source_ko": "TASK-0024 구현 지시 2(면담 제목이 막대 아래)"},
    {"value": "hire_from_bar", "min": 0, "max": 468.4, "profiles": ["l1366"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "hire_from_bar", "min": 0, "max": 455, "profiles": ["cb1366t"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "hire_from_bar", "min": 0, "max": 617.5, "profiles": ["ipadAirL"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "hire_from_bar", "min": 0, "max": 565.5, "profiles": ["ipadminiL"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "hire_from_bar", "min": 0, "max": 541.5, "profiles": ["ipadmini6L"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "hire_from_bar", "min": 0, "max": 780.4, "profiles": ["l1920"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "hire_from_bar", "min": 0, "max": 497.5, "profiles": ["t1000"], "source_ko": "TASK-0024 구현 지시 2(고용 단추가 72px 예약 위)"},
    {"value": "iv_head_low_from_bar", "min": 7, "max": 900, "profiles": "all", "source_ko": "TASK-0024 구현 지시 2(면담 제목이 막대 아래)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 468.4, "profiles": ["l1366"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 455, "profiles": ["cb1366t"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 617.5, "profiles": ["ipadAirL"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 565.5, "profiles": ["ipadminiL"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 541.5, "profiles": ["ipadmini6L"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 780.4, "profiles": ["l1920"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "hire_low_from_bar", "min": 0, "max": 497.5, "profiles": ["t1000"], "source_ko": "TASK-0024 구현 지시 2(아래쪽 면담도 고용 단추가 72px 예약 위)"},
    {"value": "overflow_x", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0024 구현 지시 9(가로 넘침 0)"}
  ]
}
```

`tools/browser/scenarios/side-anchor.json`

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "side-anchor",
  "title_ko": "현지 패널을 연 채 오른쪽 칸(오늘 할 일·자원 예약)과 주 열(거래)을 읽다 하루 진행",
  "source_ko": "TASK-0024 구현 지시 5·9",
  "profiles": "all",
  "steps": [
    {"do": "end-day", "times": 1},
    {"do": "tap", "selector": "#local-tab"},
    {"do": "tap", "selector": "[data-action=\"culture-act\"]"},
    {"do": "tap", "selector": "[data-action=\"culture-emp\"]:not([disabled])"},
    {"do": "tap", "selector": "[data-action=\"culture-queue\"]"},
    {"do": "tap", "selector": "#queue-h"},
    {"do": "scroll-to", "selector": "#queue-h", "offset_from_bar": 120},
    {"do": "scroll-to", "selector": "#queue-h", "offset_from_bar": 120},
    {"do": "remember", "name": "queue", "selector": "#queue-h"},
    {"do": "end-day", "times": 1},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "queue_moved", "what": "moved", "ref": "queue"},
    {"do": "tap", "selector": "#res-h"},
    {"do": "scroll-to", "selector": "#res-h", "offset_from_bar": 120},
    {"do": "scroll-to", "selector": "#res-h", "offset_from_bar": 120},
    {"do": "remember", "name": "res", "selector": "#res-h"},
    {"do": "end-day", "times": 1},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "res_moved", "what": "moved", "ref": "res"},
    {"do": "tap", "selector": "#trade-h"},
    {"do": "scroll-to", "selector": "#trade-h", "offset_from_bar": 40},
    {"do": "scroll-to", "selector": "#trade-h", "offset_from_bar": 40},
    {"do": "remember", "name": "trade", "selector": "#trade-h"},
    {"do": "end-day", "times": 1},
    {"do": "wait", "ms": 350},
    {"do": "measure", "name": "trade_moved", "what": "moved", "ref": "trade"},
    {"do": "measure", "name": "overflow_x", "what": "overflow-x"}
  ],
  "expect": [
    {"value": "queue_moved", "min": -1, "max": 1, "profiles": "all", "source_ko": "TASK-0024 구현 지시 5(오른쪽 오늘 할 일을 읽던 자리)"},
    {"value": "res_moved", "min": -1, "max": 1, "profiles": ["l1366", "cb1366t", "ipadAirL", "ipadminiL", "ipadmini6L", "l1920"], "source_ko": "TASK-0024 구현 지시 5(오른쪽 자원 예약을 읽던 자리, 세 열)"},
    {"value": "trade_moved", "min": -1, "max": 1, "profiles": "all", "source_ko": "TASK-0024 구현 지시 5(주 열 대조는 그대로)"},
    {"value": "overflow_x", "min": 0, "max": 0, "profiles": "all", "source_ko": "TASK-0024 구현 지시 9(가로 넘침 0)"}
  ]
}
```

- `lib.test.mjs` 8행 `names` 끝(TASK-0025의 `'route-map-fit'` 뒤)에 `'queue-chip', 'card-detail', 'card-detail-low', 'interview-hire', 'side-anchor'`를 더한다. 그래서 ‘묶음 시나리오 검증’·‘금지 이름·ID’·‘명령줄 dry-run’이 새 시나리오도 본다. node 시험 수는 그대로다(시작 값).
- **Claude 확인(dry-run과 단계 시간, `c284e79`의 `lib.mjs`):**
  - 다섯 시나리오 `--dry-run` 모두 종료 코드 0. 출력은 `{"dry_run": true, "scenario": "<이름>", "profiles": ["l1366", "cb1366t", "ipadAirL", "ipadminiL", "ipadmini6L", "l1920", "t1000"], "steps": <수>}`이고 `steps`는 queue-chip 13, card-detail 18, card-detail-low 9, interview-hire 20, side-anchor 27.
  - 위 다섯 이름을 넣은 `lib.test.mjs` 10개 통과(금지 문자열 검사 포함). TASK-0025의 측정 종류 두 개는 이 시나리오들이 쓰지 않는다(`top-from-bar`·`height`·`moved`·`overflow-x`만 쓴다).
  - 실제 실행(7개 프로필, 시제품 빌드, 부하 평균 약 10): 7개 프로필 합으로 queue-chip 46초, card-detail 46초, card-detail-low 30초, interview-hire 75초, side-anchor 90초. 프로필 하나에 가장 긴 side-anchor가 약 13초(쪽 열기 포함, 27단계)이고, 단계 하나는 평균 0.5초 안팎이다.
  - 가장 긴 단계는 `"end-day", "times": 2`(누름 두 번 × 대기 560ms + 80ms, 가려졌으면 +100ms, 하루 처리 포함 약 1.5~2초)다. 단계당 15초 제한(`lib.mjs` 231행)의 1/7 아래다. 부하 평균이 13~38일 때(`eeb4f03` 빌드로 잰 첫 측정)도 side-anchor 7개 프로필 합이 100초(프로필당 약 14초, 단계당 평균 약 0.5초)였다. `end-day`는 한 단계에 2번까지만 쓴다.
  - 값은 `eeb4f03` 빌드와 `c284e79` 빌드에서 두 빌드(기준·시제품) 모두 7개 프로필의 모든 값이 같았다.

### 10. 결과 보고

아래 ‘결과 보고’ 형식으로 `docs/ai/tasks/results/TASK-0024.md`를 쓴다.

## 바꿔도 되는 기존 단언

하나다.

- `src/ui/main.test.ts` 89행(TASK-0013 ‘금액 기준 안내는 위쪽 막대에 한 번 나오고 오늘 대기 명령을 금액에 반영하지 않는다’): `expect(header()).toBe(original);`
  - 이유: 막대 HTML 전체를 고정한다. ‘오늘 할 일 N건’의 건수가 수락 뒤 바뀐다. 시험의 뜻(대기 명령을 막대 금액에 반영하지 않는다)은 금액 칸으로 지킨다(배치 README 344행).
  - 바꾸는 법: 83행 `const original = header();` 다음에 두 줄을 더하고 89행만 바꾼다. 다른 줄은 그대로다.
    ```ts
    // 막대의 ‘오늘 할 일 N건’ 단추는 대기 명령 수를 센다. 금액 칸만 비교한다(TASK-0024).
    const stats = () => [...header().matchAll(/<div class="stat">[\s\S]*?<\/div>/g)].map((m) => m[0]).join('');
    const originalStats = stats();
    …
    expect(stats()).toBe(originalStats);   // 89행
    ```
  - **Claude 확인:** 시제품에서 이 단언을 바꾸기 전에는 이 시험 하나만 실패했다. 바꾼 뒤 32개 기존 파일·973개가 모두 통과했다.
- 그 밖에 기존 시험 파일에서 지울 수 있는 줄은 없다. `main.test.ts`에서 지운 줄은 89행 하나, `lib.test.mjs`에서 지운 줄은 8행 하나여야 한다(완료 조건 3).

## 테스트

새 시험 파일은 `src/ui/layout.test.ts` 하나다. vitest는 시작 값보다 파일 1개·시험 40개가 늘어야 한다(Claude 시제품 `c284e79`: 32 → 33개 파일, 973 → 1013개. `<BASE>`에는 TASK-0025의 `map-fit.test.ts`와 지도 연결 시험 하나가 더 있다). Claude 시제품의 시험 키트 추가는 부록 A, 시험 파일은 부록 B에 있다. 제목·단언은 부록과 같아야 한다. 코드는 그대로 써도 된다.

### 시험 키트 (`main-testkit.ts`, 부록 A)

더하기만 한다. 기존 시험이 쓰는 흉내의 결과는 바뀌지 않는다.

| 더할 것 | 동작 |
|---|---|
| `win.matchMedia(query)` | 받은 조건을 `mediaQueries`에 적고 `{ media, matches, addEventListener('change', …) }`를 돌려준다. `matches`는 `setOneColumn`으로 정한 값(시작은 거짓, 세 열). 조건 글자와 무관하다(틀린 조건이면 시험이 잡는다) |
| `setOneColumn(on)` | `matches`를 바꾸고 등록된 change 수신기를 모두 부른다 |
| `mediaQueries` | `matchMedia`에 들어온 조건 목록 |
| `fireApp(name, ev)` | `app`에 단 수신기(pointerdown·wheel·touchstart·focusin)를 부른다 |
| 렌더 요소 `closest` | 오른쪽 칸(`PANEL_OF`: 동료 칸 단추·선택, 오늘 할 일 칸의 빼기·일정 단추), `.layout`(고정 막대·건너뛰기·알림 결과 보기 밖의 모든 단추), `.statusbar`의 `queue-jump`, Esc 칸 판정(현지 패널 안 단추 → `#local`, 현지 탭 → `#local-tab`, 기록장 단추, 그 직원의 훈련 단추 → `#growth-…`, 상세 단추, 그 후보의 고용 단추 → `#interview-…`, 면담 단추), `[data-action-slot]`의 훈련 칸 `train-…` |
| id 흉내(`getElementById`·초점 뒤 `activeElement`)의 `closest` | `local-h`·`culture-…` → `#local`, `crew-h`·`growth-h-…`·`candidate-h-…`·`site-h-…`·`interview-h-…` → `.crew`, `res-h` → `.resources`, `queue-h` → `.queue`, `status-h` 밖의 id → `.layout` |
| 위치 열쇠 | id가 없는 요소의 위치는 `bounds['동작:첫째 data 값']`(예: `train:<직원>`, `detail:<직원>`, `hire:<후보>`), `#growth-<직원> .training h4`는 `bounds['training-h-<직원>']` |
| `app.querySelector` | `[data-action="…"][data-…="…"]` 꼴(단, 기존 특수 처리 `[data-action="detail"]`·`end-day`·`culture-result`는 그대로), `#growth-<직원> .training h4` |
| `app.querySelectorAll(SIDE_ANCHORS)` | 렌더 HTML의 `crew-h`·`res-h`·`queue-h` 제목, 카드(`ARTICLE`)·운영표 줄(`TR`)을 후보로 돌려준다. 위치는 `bounds`(제목 id 또는 `ARTICLE:<직원>`·`TR:<직원>`)에 준 것만 화면 안이고, 나머지는 막대 위(위 −100)다 |

### `layout.test.ts` (부록 B, 40개)

`describe('배치 공통: 카드 아래 상세·펼침 띠·훈련 칸')`
1. **카드로 고르면 상세가 그 카드 바로 뒤에, 운영표 줄·이름 단추로 고르면 운영표 뒤에 있다:** 카드 click → `<div class="card-detail">`가 고른 카드 뒤·다음 카드 앞이고 그 안에 `section.employee-detail`이 있으며 운영표보다 앞. 운영표 줄(TR) click → `card-detail` 없음, 상세가 운영표 `</table>` 뒤. 다시 카드 → 카드 아래. 이름 단추(BUTTON) → 운영표 아래. 카드에 Enter(keydown) → 카드 아래.
2. **고른 카드가 필터로 숨으면 상세는 운영표 뒤에 있고 필터를 풀면 카드 아래로 돌아온다:** 상태 필터 ‘업무·교육 중’(1일엔 아무도 없음) → 운영표 뒤. ‘전체’ → 카드 아래.
3. **펼친 상세는 훈련 단추 아래 끝 + 8px이 알림 자리 72px 위에 오게 한 번 굴리고 제목은 막대 아래 8px에 남긴다:** 훈련 단추 아래 797, 제목 400 → `scrollBy(0, 797+8−(800−72))`. 접을 때 굴림 없음. 제목 150 → `scrollBy(0, 150−100−8)`. 단추 아래 637(필요 없음) → 굴림 없음.
4. **알림이 있으면 펼친 상세의 띠 아래 끝은 알림 위 끝이다:** 알림 위 600 → `scrollBy(0, 640+8−600)`.
5. **펼친 면담은 고용 단추를 같은 규칙으로 띠 안에 두고 접을 때는 굴리지 않는다:** 면담 준비 저장(설정에서 꺼낸 장소·후보·직원). 고용 단추 아래 744 → `scrollBy(0, 744+8−728)`.
6. **훈련을 넣고 위 내용이 늘면 예정 표시를 누른 높이에 둔다:** 칸 위 180 → 230 → `scrollBy(0, 50)`. HTML에 `<div data-action-slot="train-…"><span class="pill" id="status-train-…" tabindex="-1">일반 훈련 예정</span></div>`.
7. **M1 화면에는 카드 아래 상세·오늘 할 일 단추·훈련 칸이 없다.**

`describe('배치안 A: 오늘 할 일 단추')`
8. **M2 막대의 단추는 하루 진행 바로 앞이고 건수는 오늘 할 일 목록의 줄 수다:** 0건 → 수락 1건 → 배정 2건 → 수락 빼기 뒤 `<li class="bad">` 1줄과 1건. 단추 HTML 전체 문자열 + 바로 뒤 `<div class="day-action">`.
9. **단추를 누르면 오늘 할 일 제목으로 굴리고 초점을 두며 500ms 동안 다른 누름을 막고 알림은 그대로다:** `scrollIds`·`focusIds` = `['queue-h']`, `focus({preventScroll:true})` 한 번, 499ms 수락 무시, 500ms 수락 받음. 알림 영역은 그 수락의 한 번만 늘어난다.
10. **키보드 순서(Tab → focusin → Enter → click)에서 단추는 고정 막대 안이라 Shift+Tab 위치 복원을 받고 같은 곳으로 간다.**

`describe('배치안 A: 하루 진행 뒤 마지막 조작 열')` — 공통 상태: 첫 직접 무역을 수락만 한 1일. 오늘 할 일 제목 300 → 380(+80), 계약 제목 250 → 200(−50).
11~14. **오른쪽 칸에서 %s 뒤 하루 진행은 오른쪽 후보 하나로 한 번 보정한다**(`it.each` pointerdown·wheel·touchstart·focusin): `scrollBy` 호출 `[[0, 80]]`.
15. **막대 아래에서 시작하는 후보를 막대에 걸친 후보보다 먼저 쓴다:** 동료 제목이 막대에 걸침(80~130) → 그래도 `[[0, 80]]`.
16. **주 열을 누른 뒤에는 계약 제목 규칙 그대로다:** `[[0, -50]]`.
17. **고정 막대를 눌러도 마지막 열은 그대로다:** `[[0, 80]]`.
18. **한 열이면 오른쪽을 눌렀어도 계약 제목 규칙이다:** `[[0, -50]]`.
19. **M1이면 오른쪽을 눌렀어도 계약 제목 규칙이다:** `[[0, -50]]`.
20~23. **%s 뒤에는 마지막 열이 비워진다**(`it.each` load·import·restart·scenario): 오른쪽을 누른 뒤 되돌리면 `[[0, -50]]`.

`describe('Esc로 맨 위 칸 닫기')`
24. **열린 상세를 닫고 상세 단추로 초점을 돌려주며 띠 안으로 최소 거리만 옮기고 500ms 동안 누름을 막는다:** `preventDefault` 한 번, 상세 단추 `aria-expanded="false"`, `activeElement.dataset` = `{action:'detail', emp}`, 단추 위 50 → `scrollBy(0, 50−108)`, 499ms 누름 무시, 500ms 받음. 다시 펼친 뒤 단추가 띠 아래(아래 끝 814)면 `scrollBy(0, 814−792)`.
25. **단추가 띠 안이면 굴리지 않고 초점만 돌려준다.**
26. **면담을 닫고 면담 단추로 초점을 돌려준다:** 상세를 먼저 열고 면담을 열면 Esc는 면담을 닫고 상세는 펼친 채 둔다.
27. **기록장을 먼저 닫고 다음 Esc로 현지 패널을 닫아 열기 전 탭 위치로 되돌리고 현지 탭에 초점을 둔다:** 두 번째 Esc 뒤 `scrollBy(0, 70)`(TASK-0012 닫기 시험과 같은 수).
28. **맨 위 칸은 가장 최근에 열거나 그 안을 누르거나 초점을 둔 칸이다:** 현지 → 상세 순으로 열면 Esc가 상세를. 상세 → 현지면 현지를. 훈련 단추 pointerdown 뒤면 상세를. 현지 안 단추 focusin 뒤면 현지를. 현지를 다시 연 뒤 상세 안에서 wheel만 하면 현지를(굴리기는 맨 위를 바꾸지 않는다).
29~35. **%s이면 Esc가 아무것도 하지 않는다**(`it.each` 열린 칸 없음·반복·Ctrl·Alt·Meta·Shift·입력 조합 중): `preventDefault` 없음, HTML 그대로.
36. **Esc는 위쪽 막대와 알림 영역을 바꾸지 않고 Tab 기록을 지운다:** Tab keydown → Esc → focusin(하루 진행) 뒤 `scrollTo` 없음.

`describe('한 열 화면 코드 순서')`
37. **한 열이면 한 열 격자 순서, 세 열이면 세 열 격자 순서로 그리고 미디어 조건은 CSS와 같다:** 순서는 CSS에서 읽은 격자에서 만든다. 수락·전 세계 지도·세 열로 되돌림·M1(세 열·한 열)에서 확인. `mediaQueries` = CSS 한 열 `@media` 조건 하나.
38. **패널 사이 글자는 기존 화면 코드와 같은 줄바꿈과 들여쓰기다:** 세 열·한 열 모두 `</…>\n      \n  <section|aside class="panel …"`.
39. **폭이 바뀌어 다시 그려도 초점은 같은 조작에 남고 굴리지 않는다:** 화면 밖(위 2000)의 일정 단추에 초점 → 한 열 전환 → `focusIds` = `['schedule-toggle']`, `focus({preventScroll:true})` 한 번, `scrollBy`·`scrollTo` 없음. id 없는 단추(상태 필터)도 data 값으로 되찾는다. 초점이 없으면 `focus`를 부르지 않는다.

`describe('머리 줄')`
40. **빌드 표시 문구 폭을 9.5rem으로 묶어 빌드 표시를 둘째 줄에 두고 문구는 그대로다:** 빌드 표시 글은 `main.test.ts` 1381행과 같은 식(`dev` 또는 7자 해시와 ‘+수정’)으로 받는다. vitest도 `vite.config.ts`의 `define`을 써서 git 작업 트리(Sol 작업 사본·자동 검사·CI)에서는 해시가 들어가기 때문이다. `dev`로 고정하면 저장소 안에서 이 시험이 실패한다(검토 때 git 사본에서 확인).

## 측정 시나리오 (Claude가 잰다)

- Codex는 dry-run만 한다(구현 지시 9). Claude가 아래를 잰다.
- 명령(두 빌드에 같은 명령, 둘 다 저장소 밖 `git archive` 사본에서 빌드해 빌드 표시를 `dev`로 맞춤):
  ```
  node tools/browser/measure.mjs --dist <빌드> --scenario tools/browser/scenarios/<이름>.json --out <저장소 밖>/<이름>-<빌드>.json
  ```
- 기준(`<BASE>`) 빌드에서는 새 시나리오가 실패해야 한다(고치기 전 상태를 잡는다). `queue-chip`은 단추가 없어 실행 오류, `card-detail`·`interview-hire`·`side-anchor`는 기대 실패. `card-detail-low`는 기준도 통과한다(`c284e79` 실측: 세 열에서는 카드가 페이지 맨 위라 낮게 둘 수 없고, t1000에서는 상세 단추가 원래 띠 안이다).
- 시나리오 말고 Claude 측정기(저장소 밖)로 잴 것: 키보드 5개 상태(거꾸로 튀는 Tab·정지점 목록·Shift+Tab·결과 보기), 한 열 ‘오늘 할 일’ 위치와 Tab 수, 창 폭 전환, 읽던 자리 32사례, UX-23의 RQ·RQB·RR·MQ·K1, Esc 실제 키, 머리 줄의 빌드 표시 세 가지. 목표는 ‘완료 조건 5’, 시제품 값은 ‘사전 측정’이다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 배치 시안 코드(`proto-A.patch`)를 합칠까 | 합치지 않는다. TASK-0018·0023 전 코드다. 이 지시서의 구현 지시대로 다시 넣는다 |
| 화면 상태를 `session.ts`의 `initialUiState`에 둘까 | 두지 않는다(고치지 않는 파일). `main.ts` 모듈 변수 + `resetUi` |
| 오른쪽 후보를 ‘띠에 걸친 첫 후보’로 할까(시안) | 하지 않는다. 막대 아래에서 시작하는 후보가 먼저다(구현 지시 5, 시제품 +174.4px → 0.4px) |
| 바닥 줄(지도·보고·기록) 조작은 어느 열인가 | 주 열이다(구현 지시 5) |
| 한 열에서도 마지막 조작 열을 쓸까 | 쓰지 않는다. 한 열은 창 하나다(배치 README 2절) |
| ‘오늘 할 일 N건’을 M1에도 둘까 | 두지 않는다. M1 화면은 그대로다(배치 README 22행) |
| 건수에 실행할 수 없는 줄도 넣나 | 넣는다. 목록에 보이는 줄 수다(구현 지시 4 반례) |
| 단추를 막대 왼쪽·오른쪽 어디에 | ‘하루 진행’ 바로 왼쪽. 판단은 하루 진행 단추 앞에서 일어난다(배치 README 323행) |
| 훈련 칸을 띠에 넣으면 카드와 ‘○○ 성장 기록’ 제목이 화면 위로 나간다. ‘일반 훈련’ 제목에 이름을 붙일까(배치 README 6절 공통 대가가 지시서에서 정하라고 한 것) | 붙이지 않는다. 새 문장은 ‘오늘 할 일 N건’ 하나다. 누구의 훈련인지는 단추의 접근 이름(‘○○ 일반 훈련’)과 바로 앞에서 누른 ‘○○ 성장·훈련 상세’ 단추에 있다. 사용성 시험에서 헷갈림이 보이면 다시 본다 |
| 세로 태블릿·휴대폰에서 막대가 두 줄로 접힌다 | 받아들인다. 시험 기기는 가로다(DECISIONS 868행 ‘사용성 시험 기기 — 가로 기기로 결정’). 7개 프로필의 높이는 같다. 줄일 방법 의견은 ‘질문’에 적어도 된다 |
| Esc의 ‘맨 위’를 초점으로만 정할까 | 정하지 않는다. Safari는 누른 단추에 초점을 주지 않는다. 연 순서 + 그 안 누름·초점(구현 지시 6) |
| 초점이 다른 칸(예: 거래 칸)에 있어도 Esc가 열린 칸을 닫나 | 닫는다. 그 칸이 맨 위면 닫고 연 단추로 간다(APG). 다른 칸 안을 누르거나 초점을 둬도 열린 칸의 순번은 바뀌지 않는다 |
| Esc로 일정 펼침·`<details>`·현지 미리 보기도 닫을까 | 닫지 않는다. D13이 정한 네 칸만. 의견은 ‘질문’에 |
| Esc를 따로 document keydown 수신기로 둘까 | 두지 않는다. 시험 틀이 이름마다 수신기 하나만 저장해 TASK-0018 수신기를 덮는다. 기존 수신기에 한 줄을 더한다 |
| 닫은 뒤 500ms 막기는 키보드에 불편하지 않나 | 건다. 패널 열고 닫기의 규칙(DECISIONS 928행)과 같고, 현지 패널은 `closeCulture`가 이미 건다 |
| Esc로 닫을 때 굴리지 않을까 | 연 단추가 띠 밖이면 최소 거리만 굴린다. 초점은 보여야 한다 |
| 한 열 판정을 `innerWidth <= 1000`으로 할까 | 하지 않는다. `matchMedia`가 CSS와 같은 판정이다. 소수 폭(확대)에서 어긋나지 않는다 |
| `matchMedia` 확인 호출은 규칙 위반 아닌가 | 유일한 예외로 허용한다. 지도 연결 시험 틀(TASK-0025가 고친 파일, 이 작업은 손대지 않음)에 흉내가 없다. `pixel.ts` 82행에 같은 확인이 있다. 병합 뒤 Claude가 그 틀에 흉내를 넣고 확인을 지울지 정한다 |
| `<BASE>`에 TASK-0025가 없다 | 그대로 진행한다. `lib.test.mjs` 8행 `names`는 지금 목록 끝에 다섯 이름을 더한다. 결과 보고에 적는다 |
| `lib.test.mjs` 8행에 TASK-0025의 `'route-map-fit'`이 있다 | 그 뒤에 다섯 이름을 더한다. 기존 이름은 그대로 둔다 |
| 크기 한도 검사가 실패한다 | 이 작업이 더한 코드에서 원인을 찾는다. `vite.config.ts`·검사기·한도를 고치지 않는다(허브 전용·TASK-0026). 못 줄이면 멈추고 결과 보고에 적는다 |
| 자동 검사 종 수가 13·14와 다르다 | 출력 끝줄을 그대로 적는다. 검사 스크립트를 고치지 않는다 |
| 한 열 전환 때 열린 `<details>`를 되살릴까 | 되살리지 않는다. 모든 다시 그리기와 같다(‘반례와 대가’) |
| 한 열 전환 때 굴림 위치를 보정할까 | 하지 않는다. 격자 영역이 위치를 정하므로 화면 코드 순서가 바뀌어도 보이는 배치는 같다(시제품 측정: 1180→1000 전환 직후 초점·위치가 기준과 같다) |
| 머리 줄을 `flex-wrap: nowrap`·글자 줄이기로 고칠까 | 하지 않는다. 9.5rem 한 규칙. 머리 높이와 막대 위치가 7개 프로필에서 같다(사전 측정) |
| 머리 문구 HTML에 줄바꿈을 넣을까 | 넣지 않는다. `main.test.ts` 1381행이 글자를 고정한다 |
| 시나리오 기대를 `<BASE>` 빌드가 통과해야 하나 | 아니다. 고치기 전 상태에서는 실패하는 것이 정상이다(‘측정 시나리오’) |
| 시나리오에 키보드 단계(Esc·Tab)를 넣을까 | 넣지 않는다. 측정 도구에 키 단계가 없고 `lib.mjs`는 손대지 않는 파일이다. 키보드는 Claude 측정기로 잰다 |
| 새 시험을 `main.test.ts`에 넣을까 | 새 파일 `layout.test.ts`에 모은다. 배치 README 8절은 `main.test.ts`에 새 시험을 적었지만, 같은 내용을 새 파일에 두어 `main.test.ts`의 변경을 89행 하나로 묶는다 |
| 목록 밖 기존 시험이 실패한다 | 기대값을 고치지 않는다. 원인을 찾고, 못 찾으면 보고한다 |
| 시간이 모자란다 | ‘범위’의 ‘시간이 모자라면 뺄 수 있음’ 순서대로 뺀다 |

## 완료 조건

1. 구현 지시 0~10이 반영되었다. 뺀 항목이 있으면 ‘시간이 모자라면 뺄 수 있음’ 순서이고 결과 보고에 ‘미충족(시간)’으로 적었다.
2. **검증**
   - 시작 전에 아래를 한 번 돌려 기준 값을 결과 보고에 적는다.
     ```
     npx vitest run
     python3 tools/validate_data.py
     node --test tools/browser/lib.test.mjs
     node --test tools/check_bundle_size.test.mjs
     npm run --silent build && node tools/check_bundle_size.mjs dist
     ```
     - Claude 확인값(`c284e79`, TASK-0025 전): vitest 32개 파일·973개 통과(할 일 1), 자료 검사 25,817건, `lib.test.mjs` 10개, `check_bundle_size.test.mjs` 11개, 코드 청크 212,001 B·첫 화면 합계 555,863 B(gzip 127,974 B).
     - `<BASE>`에는 TASK-0025가 들어 있어 vitest 파일·시험, `lib.test.mjs` 시험, 자료 검사 건수, 코드 청크가 위보다 많다. 시작 값은 직접 잰 값을 쓴다.
   - 끝내기 전에 결과 보고 파일을 먼저 만든 뒤 아래를 순서대로 실행한다.
     ```
     bash tools/ai/review_checks.sh <BASE>
     bash tools/ai/review_checks.sh --check <BASE>
     ```
     - 수정 모드 13종, 확인 모드 14종이 모두 통과해야 한다(TASK-0026의 크기 한도 검사와 그 시험 포함). 종 수가 다르면 출력 끝줄을 그대로 적는다.
     - vitest: 시작 값 + 파일 1개(`layout.test.ts`) + 시험 40개, 모두 통과(할 일 1). Claude 시제품은 `c284e79`에서 32개 파일·973개 → 33개 파일·1013개였다.
     - 자료 검사 PASS, 시작 값 + 12건(시나리오 5개 + 결과 보고 1개가 MANIFEST에 든다. `src/`는 MANIFEST에 없다). 다르면 새로 든 파일 목록을 보고에 적는다.
     - 파이썬 시험: 그림 도구 21개, 지도 21개(3개 건너뜀), 자료 검사기 74개, 사실 섞임 20개 그대로. 사실 섞임 검사 PASS.
     - node 시험: `lib.test.mjs`는 시작 값 그대로(이름만 늘어남), `check_bundle_size.test.mjs` 11개 통과.
     - 크기 한도 검사 통과. 결과 보고에 `node tools/check_bundle_size.mjs dist` 출력 전체를 붙이고, 코드 청크와 첫 화면 합계의 시작 값 대비 증가를 적는다(Claude 시제품 +4,914 B·+5,499 B).
   - 시나리오 5개 `node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/<이름>.json --dry-run`이 종료 코드 0이고, 출력의 `profiles`가 7개 이름(`l1366`·`cb1366t`·`ipadAirL`·`ipadminiL`·`ipadmini6L`·`l1920`·`t1000`), `steps`가 구현 지시 9의 수와 같다.
3. **바꾼 범위 확인** (출력을 결과 보고에 붙인다)
   - `git diff --name-only <BASE>`와 `git status --short --untracked-files=all`의 파일이 모두 ‘고칠 수 있는 파일’ 안에 있다.
   - 다음 출력이 비어 있다:
     ```
     git diff <BASE> -- src/engine src/content data tests schemas scripts vite.config.ts index.html public package.json package-lock.json tsconfig.json CLAUDE.md AGENTS.md .github PACKAGE_STATUS.json src/ui/session.ts src/ui/recruitment.ts src/ui/culture.ts src/ui/card.ts src/ui/focus.ts src/ui/reports.ts src/ui/schedule.ts src/ui/map.ts src/ui/map-fit.test.ts src/ui/map-integration.test.ts src/ui/pixel.ts tools/browser/lib.mjs tools/browser/measure.mjs tools/browser/profiles.json tools/browser/README.md tools/ai tools/bundle-size.mjs tools/check_bundle_size.mjs tools/check_bundle_size.test.mjs tools/fonts docs/USABILITY_TEST_M2A.md docs/STATUS.md docs/DECISIONS.md docs/ai/SESSION_TREE.md docs/ai/WORKFLOW.md
     git diff <BASE> -- tools/browser/scenarios ':!tools/browser/scenarios/queue-chip.json' ':!tools/browser/scenarios/card-detail.json' ':!tools/browser/scenarios/card-detail-low.json' ':!tools/browser/scenarios/interview-hire.json' ':!tools/browser/scenarios/side-anchor.json'
     ```
   - 지운 줄 확인. 각 출력의 줄 수가 괄호 안과 같다:
     ```
     git diff <BASE> -- src/ui/main.test.ts | grep '^-[^-]'          # 1줄(89행)
     git diff <BASE> -- tools/browser/lib.test.mjs | grep '^-[^-]'   # 1줄(8행)
     git diff <BASE> -- src/ui/growth.ts | grep '^-[^-]'             # 1줄(65행)
     git diff <BASE> -- src/ui/style.css | grep '^-[^-]'             # 0줄
     git diff <BASE> -- src/ui/main-testkit.ts | grep '^-[^-]'       # 결과 보고에 모두 적고 이유를 단다(더하기만이 원칙)
     ```
     - `main-testkit.ts`는 기존 줄을 늘려 쓰느라 지운 줄이 생길 수 있다(시제품 기준 7줄: `getElementById` 흉내의 `closest`·`focus` 두 줄, 렌더 요소의 위치 줄, `closest`의 건너뛰기 줄과 칸 판정 줄, `app.querySelector`·`querySelectorAll` 첫 줄). 그 줄의 옛 동작이 그대로인지 결과 보고에 줄마다 적는다.
   - `main.ts`의 기존 줄 가운데 지운 줄은 결과 보고에 옛 줄 → 새 줄로 모두 적는다. 시제품 기준으로는 97~100행 수신기 안 0줄, 223행 뒤 0줄, 248~249행 2줄(같은 글자로 `else` 안에 다시 씀), 317행 1줄, 788·793행 2줄, 883~888행 6줄, 960행 0줄, 1061~1074행의 `render()` 앞뒤 0줄, `select-card` 두 곳 0줄이다.
   - 새 시험 줄·새 시나리오에 금지 문자열이 없다(결과 0건):
     ```
     { git diff <BASE> -- src/ui/main.test.ts src/ui/main-testkit.ts tools/browser/lib.test.mjs | grep '^+'; cat src/ui/layout.test.ts; } | grep -nE "PYEONGTAEK|BUSAN|SHANGHAI|HAIPHONG|YOKOHAMA|SINGAPORE|JAKARTA|HONG_KONG|OFFER_|EVI_|ROUTE[0-9]|EMP[0-9]|CT[0-9]{3}|TASK[0-9]{3}|VEN_|CA0[0-9]|평택|부산|상하이|하이퐁|요코하마|싱가포르|자카르타|홍콩"
     cat tools/browser/scenarios/queue-chip.json tools/browser/scenarios/card-detail.json tools/browser/scenarios/card-detail-low.json tools/browser/scenarios/interview-hire.json tools/browser/scenarios/side-anchor.json | grep -nE "PYEONGTAEK|BUSAN|OFFER_|EMP[0-9]|CT[0-9]{3}|ROUTE[0-9]|VEN_|평택|부산|하이퐁|상하이"
     ```
   - 화면 문구: `main.ts`·`growth.ts`에서 주석이 아닌 더한 줄에만 있는 한글 낱말 묶음은 ‘오늘 할 일 N건’ 단추의 셋뿐이다. 지운 줄에만 있던 한글은 없다.
     ```
     d() { git diff <BASE> -- src/ui/main.ts src/ui/growth.ts; }
     k() { LC_ALL=C.utf8 grep -oP '[\x{AC00}-\x{D7A3}][\x{AC00}-\x{D7A3} ]*' | sed 's/ *$//' | sort -u; }
     diff <(d | grep '^-[^-]' | k) <(d | grep '^+[^+]' | grep -vE '^\+\s*(//|/\*\*|\*)' | k)
     ```
     - 출력에서 `>`로 시작하는 줄이 `> 건`, `> 건 보기`, `> 오늘 할 일` 셋이고 `<`로 시작하는 줄이 없어야 한다(Claude 시제품 출력과 같다). 카드 칸 줄(`이 조건의 동료가 없습니다.`)과 훈련 칸 줄(`일반 훈련 예정`·`일반 훈련`)은 옛 글을 그대로 옮긴 것이라 나오지 않는다.
   - 양수 `tabindex`가 새로 생기지 않았다(결과 0): `git diff <BASE> -- src/ui | grep '^+' | grep -cE 'tabindex="[1-9]'`
4. **변형 시험.** 아래를 하나씩 넣고 `npx vitest run src/ui/layout.test.ts src/ui/main.test.ts`에서 실패하는 시험 이름을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다. git으로 되돌리거나 stash하지 않는다. ‘실패해야 하는 시험’은 Claude 시제품에서 실제로 실패한 목록이다(번호는 위 ‘테스트’ 번호).

   | 변형 | 바꾸는 곳 | 실패해야 하는 시험 |
   |---|---|---|
   | M01 출처 구분 제거 | `detailUnder = el.tagName === 'ARTICLE' ? …` → `detailUnder = 'card'`(click) | 1 |
   | M02 72px 예약 제거 | `revealBelow`의 `window.innerHeight - 72` → `window.innerHeight` | 3, 5 |
   | M03 제목 상한 제거 | `if (head) dy = Math.min(…)` 줄 지움 | 3 |
   | M04 훈련 칸 제거 | `growth.ts` 65행 `data-action-slot` 지움 | 6 |
   | M05 오른쪽 보정 제거 | `sideBoxes`의 `config.culture` → `false` | 11, 12, 13, 14, 15, 17 |
   | M06 세 열 판정 제거 | `&& !isOneColumn()` 지움 | 18 |
   | M07 M1에도 단추 | 단추 조건 `config.culture` → `true` | 7 |
   | M08 Esc 고정 순서 | `closeTopLayer`의 `reduce(…)` → `layers[0]!` | 28 |
   | M09 Esc 초점 복귀 없음 | `revealOpener(…)` 줄 지움 | 24 |
   | M10 Esc 뒤 500ms 없음 | `closeTopLayer`의 `ignoreClicksUntil` 줄 지움 | 24 |
   | M11 열린 칸이 없어도 기본 동작 막음 | `ev.preventDefault()`를 `if (!layers.length) return;` 앞으로 | 24, 29 |
   | M12 반복 Esc 허용 | `!ev.repeat &&` 지움 | 30 |
   | M13 한 열 분기 제거 | `isOneColumn() ?` → `false ?` | 37, 38 |
   | M14 한 열 보고·지도 순서 바꿈 | 한 열 배열의 `reportPanel, worldMap` → `worldMap, reportPanel` | 37 |
   | M15 change 수신기 제거 | `oneColumnQuery.addEventListener('change', …)` 줄 지움 | 37, 38, 39 |
   | M16 폭 바뀜 초점 유지 제거 | `if (again) again.focus(…)` 줄 지움 | 39 |
   | M17 초기화에서 열 기억 남김 | `resetUi`의 `lastColumn = null;` 지움 | 20, 21, 22, 23 |
   | M18 바닥 줄을 주 열에서 뺌 | `el.closest('.layout')` → `el.closest('.maincol, .trade')` | 16 |
   | M19 칸 안 조작으로 맨 위 바꾸지 않음 | 수신기의 `touchLayers(el)` 줄 지움 | 28 |
   | M20 조합 키 Esc 허용 | `&& !ev.ctrlKey && !ev.altKey && !ev.metaKey && !ev.shiftKey` 지움 | 31, 32, 33, 34 |
   | M21 막대 아래 후보 우선 제거 | `sideReading`을 `[...sideBoxes]`로 | 15 |
   | M22 패널 사이 줄바꿈 없음 | `.join('\n      ')` → `.join('')` | 38 |
   | M23 폭 바뀜에 기존 초점 복원 | `onColumnChange`를 `render(); return;`으로 | 39 |
   | M24 단추 뒤 500ms 없음 | `queue-jump`의 `ignoreClicksUntil` 줄 지움 | 9 |
   | M25 머리 줄 규칙 제거 | `.brand .sub { max-width: 9.5rem; }` 지움 | 40 |
   | M26 상세를 열 때 순번 없음 | `if (ui.detailId) markOpened('detail');` 지움 | 28 |
   | M27 필터로 숨은 카드에도 카드 아래 | `inline`의 `&& shown.some(…)` 지움 | 2, `main.test.ts` ‘훈련 대기→완료→레벨 알림→저장 재개를 연결하고 버튼이 꺼지면 상세 제목으로 초점을 옮긴다’ |
   | M28 닫힌 칸 바깥 조작도 맨 위로 | `touchLayers`의 `if (el.closest(layer.within))` 지움 | 28 |
   | M29 Esc 뒤 띠 아래 단추를 옮기지 않음 | `revealOpener`의 `const dy = …`에서 `rect.bottom > bottom ? rect.bottom - bottom :` 지움 | 24 |
   | M30 면담을 열 때 순번 없음 | `if (ui.interviewId) markOpened('interview');` 지움 | 26 |
   | M31 굴리기도 맨 위로 | 수신기의 `if (type === 'pointerdown' \|\| type === 'focusin')` 조건 지움(`touchLayers(el);`만 남김) | 28 |
   | M32 현지 패널을 열 때 순번 없음 | `openCulture`의 `markOpened('local');` 지움 | 28 |
   | M33 기록장을 열 때 순번 없음 | `if (ui.cultureBookOpen) markOpened('book');` 지움 | 27 |

   - M29~M33은 검토(2026-10-10) 때 더했다. M29~M31은 처음 판 부록 B에서 살아남아 시험 24·26·28에 단언을 더했다. 33종 모두 지금 부록 B로 지정한 시험에서 실패한다(TASK-0025를 얹은 사본에서 확인).
   - Claude도 검수 때 이 표를 다시 돌린다.
5. **Claude가 잴 것 (Codex는 하지 않는다).** Chromium 7개 프로필. 시나리오는 `tools/browser/measure.mjs`(실제 배율, `docs/ai/WORKFLOW.md` 119~121행), 키보드·읽던 자리·UX-23·창 폭 전환은 Claude 측정기(저장소 밖)로 잰다. `<BASE>` 빌드와 이 작업 빌드를 같은 명령으로, 둘 다 저장소 밖 `git archive` 사본에서 빌드해 빌드 표시를 `dev`로 맞춰 잰다(DECISIONS 1065행). 괄호 안은 Claude 시제품 값이다(‘사전 측정’).
   - **키보드(현지 패널 이름 보정 판정):**
     - Tab이 거꾸로 튀는 곳: t1000 5개 상태(1일 첫 화면·수락 뒤·2일·알림·90일 끝) 0/0/0/0/0, 세 열 6개 프로필 0.
     - 세 열 정지점 목록 = `<BASE>` 목록 + ‘오늘 할 일 N건’ 단추 하나(‘처음부터’(머리)와 ‘하루 진행’ 사이). 정지점 수는 5개 상태 모두 `<BASE>` + 1.
     - Shift+Tab으로 고정 영역에 갈 때 마지막 튐 0±8px(0). 가려진 정지점 수가 `<BASE>`와 같다.
     - 하루 진행 뒤 ‘결과 보기’까지 Tab 1번, Enter 뒤 초점이 결과 카드 제목(같음).
   - **한 열 위치:** t1000 1일 ‘오늘 할 일’ 페이지 y 2680±1, T1 뒤 띠 아래 133.5±1px, 하루 진행에서 오늘 할 일까지 Tab 10·15·14(1일·T1·2일). 세 열 6개 프로필은 `<BASE>`와 같은 값(26·31·30).
   - **창 폭 전환(1180×820 → 1000×700 → 1180×820):** 일정 단추·동료 필터 ‘전체’에 초점을 둔 두 경우 모두, 1000px으로 바꾼 직후 초점이 같은 조작에 있고 그 단추 위치·`scrollY`가 `<BASE>`와 같다(264 / 2681, 3096 / 0). 한 열에서 Tab 한 번은 일정 단추 → 동료 필터로 간다. 1180px으로 되돌린 뒤에도 초점이 같은 조작에 있다. 쪽 오류 0.
   - **읽던 자리 32사례(TASK-0012 측정기):** `<BASE>`보다 1px 넘게 나빠진 곳 0(7개 프로필). 키보드 4사례는 ‘하루 진행’ 바로 앞 정지점에서 Tab 한다.
   - **UX-23(배치 README 3절 방법, 현지 패널을 연 채 그 칸 위에서 굴려 읽다 하루 진행):**
     - RQ·RQB·RR: 읽던 제목 이동이 세 열 6개 프로필에서 ±1px(−0.3~0.4).
     - MQ(주 열 셋째 견적)와 K1(4일 미리 보기 아래 계약): `<BASE>`와 ±1px 안에서 같은 값(MQ 0.1~0.4, K1 −413.8·−420.5).
     - t1000은 기대 없음(한 열은 열 규칙을 쓰지 않는다). `<BASE>`와 같은 값이어야 한다.
     - 주 열이 오른쪽을 지킨 만큼 움직이는 대가(RQ +102~+117, RR +81~+96, RQB +489~+511px)는 기록만 한다.
   - **기존 시나리오 9개(TASK-0025의 `route-map-fit` 포함):** 두 빌드 모두 기대를 통과하고 값이 ±1px 안에서 같다. `smoke`의 `bar_bottom_day1`이 같다(마우스 149.8, 1366 터치 165.8, iPad·1000 166.3).
   - **새 시나리오 5개:** 이 작업 빌드가 모든 기대를 통과한다. `<BASE>` 빌드는 `card-detail-low` 말고는 실패해야 한다(고치기 전 상태를 잡는다).
     - UX-04: ‘오늘 할 일 N건’ 단추가 7개 프로필 모두 막대 안(마우스 막대 아래 −72~−36, 터치 −79~−44; −54.4·−62·−62.5). 누르면 ‘오늘 할 일’ 제목이 막대 아래 −2~8px(−0.2~0.3), 첫 줄이 막대 아래 0~300px(145.1~207.4).
     - UX-05·PPL-11: 카드를 막대 아래 40에 두고 누르면 카드가 38~42(39~39.9), 상세 단추가 띠 안. 카드를 낮게 두고 눌러도 상세 단추가 띠 안.
     - P14-05: 상세를 펼치면 ‘일반 훈련’ 제목이 막대 아래 7px 이상, 훈련 단추가 72px 예약 위. 훈련을 넣은 뒤 ‘일반 훈련 예정’이 아래쪽 알림 위. 면담을 막대 아래 120·480에 두고 펼쳐도 고용 단추가 72px 예약 위, 면담 제목이 막대 아래 7px 이상.
     - UX-23: `side-anchor`의 오늘 할 일·자원 예약(세 열) 이동 ±1px, 거래 제목(대조) ±1px.
     - 7개 프로필 모두 가로 넘침 0, 쪽 오류 0.
   - **고정 막대 높이:** 7개 프로필에서 마우스 72.3px, 터치 79px(1366)·79.5px(iPad·1000)로 `<BASE>`와 같다. 단추가 막대를 두 줄로 만들지 않는다.
   - **머리 줄:** 빌드 표시를 `dev`·7자 해시·‘7자 해시+수정’으로 바꾼 빌드에서 1024×768·1000×700의 `bar_bottom_day1`이 166.3px로 같다. 머리 영역 높이(마우스 77.5·터치 86.8px)가 `<BASE>` `dev` 빌드와 같다.
   - **Esc(실제 키):** 상세·면담·기록장·현지 패널을 Esc로 닫으면 연 단추에 초점이 있고 그 단추가 띠 안이다. 초점을 본문으로 뺀 상태에서도 가장 최근 칸이 닫힌다. 열린 칸이 없으면 굴림·초점 변화가 없다.
   - **배치 README 8절 완료 조건:** 1일 첫 화면의 거래 제목·첫 견적 위치(1px 이내), M1 1일·수락 뒤·2일 HTML과 패널 위치가 같음(세 열), 가로 넘침·칸 넘침 0.
   - M1·M2 1→8일(M2는 현지 패널을 연 채)을 마우스·키보드로 번갈아 진행하고, M2 1→90일(`campaign-end`의 3개 프로필)을 진행해 쪽 오류 0, 가로 넘침 0.
   - 새 단추가 터치 프로필에서 44px 이상, 가장 작은 글자 12px 이상.
6. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0024.md`에 머리말 형식(`CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유. `matchMedia` 확인 호출(구현 지시 7)을 여기 적는다.
- **실행한 검증과 결과:** 시작 HEAD 해시와 `git diff --name-only <BASE> HEAD` 출력, `<BASE>`에 TASK-0025가 들어 있는지(`git log --oneline -3 -- src/ui/map.ts`). 시작 전 기준 값(vitest 파일·시험, 자료 검사 건수, node 시험 두 묶음의 수, 코드 청크·첫 화면 합계). 명령별 통과·실패와 개수, `review_checks.sh` 두 모드의 끝줄. `node tools/check_bundle_size.mjs dist` 출력 전체와 시작 값 대비 증가. 시나리오 `--dry-run` 출력 다섯 개.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거. 뺀 항목은 ‘미충족(시간)’.
- **바꾼 기존 단언:** 89행 하나. 완료 조건 3의 `grep '^-[^-]'` 출력을 붙인다.
- **기존 줄 변경 목록:** `main.ts`·`main-testkit.ts`의 지운 줄을 옛 줄 → 새 줄로.
- **변형 시험 표**
- **Tab 순서 표 (정적):** M2 1일 HTML에서 셈한 Tab 정지점 순서(영역 단위). TASK-0023 결과 보고(167~186행)의 38개와 비교한다. 늘어난 곳은 ‘오늘 할 일 N건’ 단추 하나(막대, 하루 진행 바로 앞)여야 한다. 카드를 고르고 상세를 펼친 상태의 상세 안 정지점 위치(카드 바로 뒤)도 적는다. 한 열(`setOneColumn(true)`) 순서도 같은 표로 적는다.
- **화면 문구:** 새로 보이는 문장(‘오늘 할 일 N건’, 접근 이름 ‘오늘 할 일 N건 보기’), 구현 지시 4의 반례 상태 네 가지가 시험·코드로 어떻게 처리되는지, 완료 조건 3의 한글 검사 출력.
- **범위 밖 발견:** 고치지 않은 문제. 적어도 다음을 확인해 적는다.
  - 면담 제목(`recruitment.ts` 97행)에 `tabindex="-1"`이 없어 제목으로 초점을 옮길 수 없다. 이 작업은 면담 단추로 초점을 돌려주므로 필요 없었는지.
  - 한 열에서 현지 패널을 연 채 자원 예약을 읽다 견적이 만료되는 날 하루를 진행하면 자원 제목이 크게 움직이는 것(‘반례와 대가’)이 시험 틀로 재현되는지.
  - 세로 태블릿 폭(768~840px)에서 고정 막대가 두 줄로 접히는 폭.
  - `window.matchMedia` 확인을 지울 수 있게 지도 연결 시험 틀에 넣을 흉내(한 줄 제안).
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’. 적어도 Esc 대상 확대(일정 펼침·`<details>`) 의견과 세로 태블릿 막대 의견을 적는다.

브라우저 측정은 하지 않는다. 했다면 실제 배율 방식(WORKFLOW 119~121행)인지 적는다.

## 부록 A. `src/ui/main-testkit.ts` 추가 (Claude 시제품, `c284e79` 기준 diff)

```diff
--- a/src/ui/main-testkit.ts
+++ b/src/ui/main-testkit.ts
@@ -11,10 +11,14 @@
   const scrollBy = vi.fn();
   const windowListeners: Record<string, (ev: any) => unknown> = {};
   const documentListeners: Record<string, (ev: any) => unknown> = {};
+  // 한 열 여부(style.css의 max-width: 1000px). 시작은 세 열. setOneColumn이 change 사건을 보낸다.
+  let oneColumn = false; const mediaListeners: ((ev: any) => void)[] = []; const mediaQueries: string[] = [];
   const win = { innerHeight: 800, scrollBy, scrollX: 0, scrollY: 0,
     scrollTo: vi.fn((x:number,y:number)=>{win.scrollX=x;win.scrollY=y;}),
     addEventListener:(name:string,callback:(ev:any)=>unknown)=>{windowListeners[name]=callback;},
     requestAnimationFrame:(cb:FrameRequestCallback)=>setTimeout(()=>cb(0),16),
+    matchMedia:(query:string)=>{mediaQueries.push(query);return {media:query,get matches(){return oneColumn;},
+      addEventListener:(name:string,callback:(ev:any)=>void)=>{if(name==='change')mediaListeners.push(callback);},removeEventListener:()=>undefined};},
   };
   vi.stubGlobal('window', win);
   const announcements: string[] = [];
@@ -53,30 +57,56 @@
     body:{insertAdjacentHTML:vi.fn()},
     createElement:vi.fn(() => ({ href:'', download:'', click:vi.fn() })),
     getElementById:(id:string)=> id==='live-status' ? liveStatus : html.includes(`id="${id}"`) ? {
-      id, dataset:{}, getBoundingClientRect:()=>bounds[id] ?? rect(), closest:()=>null,
+      id, dataset:{}, getBoundingClientRect:()=>bounds[id] ?? rect(), closest:(selector:string)=>idClosest(id,selector),
       parentElement:id.startsWith('status-') ? {getBoundingClientRect:()=>slotRect(id.slice(7))} : null,
       querySelector:()=>null,
-      focus:(options?:FocusOptions)=>{focusIds.push(id);focus(options);doc.activeElement={id,dataset:{},closest:()=>null};},
+      focus:(options?:FocusOptions)=>{focusIds.push(id);focus(options);doc.activeElement={id,dataset:{},closest:(selector:string)=>idClosest(id,selector)};},
       scrollIntoView:(options?:ScrollIntoViewOptions)=>{scrollIds.push(id);scroll(options);},
     } : null };
+  // 제목 id가 든 칸. 현지 패널 안 제목, 오른쪽 칸 제목만 흉내 낸다.
+  const ID_PANEL: Record<string,string> = { 'crew-h':'crew', 'res-h':'resources', 'queue-h':'queue' };
+  const idClosest = (id:string, selector:string) => {
+    const selectors=selector.split(',').map((s)=>s.trim());
+    if (selectors.includes('#local') && /^(local-h|culture-)/.test(id)) return {};
+    const panel = ID_PANEL[id] ?? (/^(growth-h-|candidate-h-|site-h-|interview-h-)/.test(id) ? 'crew' : undefined);
+    if (panel && selectors.includes(`.${panel}`)) return {classList:['panel',panel]};
+    if (selectors.includes('.layout') && id!=='status-h') return {};
+    return null;
+  };
+  // 오른쪽 칸 요소의 칸 이름. 자원 예약 칸에는 data-action 요소가 없다.
+  const PANEL_OF: Record<string,string> = { 'select-card':'crew','crew-filter':'crew','crew-role':'crew','crew-attr':'crew','detail':'crew','train':'crew',
+    'scout':'crew','recruit-emp':'crew','recruit-quest':'crew','interview':'crew','hire':'crew','unqueue':'queue','schedule-toggle':'queue' };
+  const OUTSIDE_LAYOUT = ['scenario','save','load','export','restart','end-day','queue-jump','skip-to','culture-result'];
   const newFrame = () => ({ dataset:{} as Record<string,string>,innerHTML:'',scrollLeft:0,scrollWidth:2000,clientWidth:930,querySelector:()=>null });
   let frame = newFrame();
   const elements = () => [...html.matchAll(/<(button|article|tr|select)\b([^>]*\bdata-action="[^"]*"[^>]*)>/g)].map((match) => {
     const attrs = Object.fromEntries([...match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1]!, unescape(m[2]!)]));
     const dataset = Object.fromEntries(Object.entries(attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[key.slice(5).replace(/-([a-z])/g,(_m,c:string)=>c.toUpperCase()),value]));
     const element = Object.assign(match[1] === 'button' ? new Button() : {}, {
-      id:attrs.id ?? '', dataset, tagName:match[1]!.toUpperCase(), disabled:/\sdisabled(?:\s|$)/.test(match[2]!), getBoundingClientRect:()=>bounds[attrs.id!] ?? rect(),
+      id:attrs.id ?? '', dataset, tagName:match[1]!.toUpperCase(), disabled:/\sdisabled(?:\s|$)/.test(match[2]!), getBoundingClientRect:()=>bounds[attrs.id!] ?? bounds[dataKey(dataset)] ?? rect(),
       focus:(options?:FocusOptions)=>{if(attrs.id)focusIds.push(attrs.id);focus(options);doc.activeElement=element;},
       closest:(selector:string)=>{
         closestSelectors.push(selector);
         const selectors=selector.split(',').map((s)=>s.trim());
         if ((selectors.includes('.statusbar') && dataset.action==='end-day')
           || (selectors.includes('.flash-toast') && dataset.action==='culture-result')
-          || (selectors.includes('.skip-links') && dataset.action==='skip-to')) return element;
+          || (selectors.includes('.skip-links') && dataset.action==='skip-to')
+          || (selectors.includes('.statusbar') && dataset.action==='queue-jump')) return element;
+        const panel=PANEL_OF[dataset.action!];
+        if (panel && selectors.includes(`.${panel}`)) return {classList:['panel',panel]};
+        if (selectors.includes('.layout')) return OUTSIDE_LAYOUT.includes(dataset.action!) ? null : {};
+        // Esc 칸: 현지 패널 안 단추, 연 단추, 상세·면담 안 실행 단추.
+        if (selectors.includes('#local') && dataset.action!.startsWith('culture-') && !['culture-tab','culture-result'].includes(dataset.action!)) return {};
+        if (selectors.includes('#local-tab') && dataset.action==='culture-tab') return element;
+        if (selectors.includes('[data-action="culture-book"]') && dataset.action==='culture-book') return element;
+        if (dataset.action==='train' && selectors.includes(`#growth-${dataset.emp}`)) return {};
+        if (dataset.action==='detail' && selectors.includes(`[data-action="detail"][data-emp="${dataset.emp}"]`)) return element;
+        if (dataset.action==='hire' && selectors.includes(`#interview-${dataset.candidate}`)) return {};
+        if (dataset.action==='interview' && selectors.includes(`[data-action="interview"][data-candidate="${dataset.candidate}"]`)) return element;
         if(selectors.includes('[data-action]')) return element;
         if(selectors.includes('[data-action-slot]')) {
           const slot=dataset.action==='assign' ? `assign-${dataset.task}` : dataset.action==='book' ? `book-${dataset.contract}`
-            : dataset.action==='culture-queue' ? `culture-${dataset.activity}-${dataset.emp}` : '';
+            : dataset.action==='culture-queue' ? `culture-${dataset.activity}-${dataset.emp}` : dataset.action==='train' ? `train-${dataset.emp}` : '';
           return slot && html.includes(`data-action-slot="${slot}"`) ? {dataset:{actionSlot:slot},getBoundingClientRect:()=>slotRect(slot)} : null;
         }
         if (selectors.includes('.contract') && ['assign','book','cancel'].includes(dataset.action!)) return {querySelector:()=>({id:`contract-h-${dataset.contract ?? 'CT001'}`})};
@@ -88,6 +118,13 @@
     });
     return element;
   });
+  // id가 없는 요소의 위치 열쇠: '동작:첫째 값', 예 'train:<직원 ID>'.
+  const dataKey = (dataset:Record<string,string>) => `${dataset.action}:${Object.entries(dataset).filter(([k])=>k!=='action')[0]?.[1] ?? ''}`;
+  // 오른쪽 칸 읽던 자리 후보 흉내: bounds에 위치를 준 후보만 화면 안이고, 나머지는 막대 위(위 −100)에 있다.
+  const sideAnchors = () => [
+    ...Object.entries(ID_PANEL).filter(([id])=>html.includes(`id="${id}"`)).map(([id,panel])=>({ id, tagName:'H2', dataset:{} as Record<string,string>, textContent:'', key:id, panel })),
+    ...elements().filter((e)=>e.tagName==='ARTICLE' || e.tagName==='TR').map((e)=>({ id:'', tagName:e.tagName, dataset:e.dataset, textContent:'', key:`${e.tagName}:${e.dataset.emp}`, panel:'crew' })),
+  ].map((a)=>({ ...a, getBoundingClientRect:()=>bounds[a.key] ?? {top:-100,bottom:-60,height:40}, closest:(selector:string)=>selector.split(',').map((s)=>s.trim()).includes(`.${a.panel}`) ? {classList:['panel',a.panel]} : null }));
   const rendered = (dataset:Record<string,string>) => {
     const element=elements().find((e)=>Object.entries(dataset).every(([key,value])=>e.dataset[key]===value));
     if(!element) throw new Error(`렌더된 요소 없음: ${JSON.stringify(dataset)}`);
@@ -96,8 +133,10 @@
   const app = {
     get innerHTML() { return html; }, set innerHTML(value:string) { html=value; frame=newFrame(); const after=afterRender; afterRender=undefined; after?.(); },
     addEventListener:(name:string,callback:typeof listeners[string])=>{listeners[name]=callback;},
-    querySelector:(selector:string)=>selector==='.trade' ? (bounds.trade ? {getBoundingClientRect:()=>bounds.trade} : null) : selector==='.flash-toast' ? (html.includes('class="flash-toast') ? {getBoundingClientRect:()=>({top:toastTop,bottom:792,height:792-toastTop})} : null) : selector==='.statusbar' ? {getBoundingClientRect:()=>({top:0,bottom:statusbarHeight,height:statusbarHeight})} : selector === '[data-action="detail"]' && html.includes('data-action="detail"') ? Object.assign(rendered({action:'detail'}),{scrollIntoView:scroll}) : selector === '[data-action="end-day"]' ? rendered({action:'end-day'}) : selector==='[data-map-frame]' || (selector === '.map-frame.is-world' && html.includes('class="map-frame is-world"')) ? frame : null,
-    querySelectorAll:(selector:string)=>selector==='[data-action-slot]' ? [...html.matchAll(/data-action-slot="([^"]+)"/g)].map((m)=>({dataset:{actionSlot:m[1]},getBoundingClientRect:()=>slotRect(m[1]!)}))
+    querySelector:(selector:string)=>/^(\[data-action="[^"]+"\])(\[data-[a-z-]+="[^"]*"\])*$/.test(selector) && selector!=='[data-action="detail"]' && selector!=='[data-action="end-day"]' && selector!=='[data-action="culture-result"]' ? (()=>{const d=Object.fromEntries([...selector.matchAll(/\[data-([a-z-]+)="([^"]*)"\]/g)].map((m)=>[m[1]!.replace(/-([a-z])/g,(_x,c:string)=>c.toUpperCase()),m[2]!]));return elements().find((e)=>Object.entries(d).every(([k,v])=>e.dataset[k]===v)) ?? null;})()
+      : /^#growth-[^ ]+ \.training h4$/.test(selector) ? (html.includes(`id="${selector.slice(1).split(' ')[0]}"`) ? {getBoundingClientRect:()=>bounds[`training-h-${selector.slice(8).split(' ')[0]}`] ?? rect()} : null)
+      : selector==='.trade' ? (bounds.trade ? {getBoundingClientRect:()=>bounds.trade} : null) : selector==='.flash-toast' ? (html.includes('class="flash-toast') ? {getBoundingClientRect:()=>({top:toastTop,bottom:792,height:792-toastTop})} : null) : selector==='.statusbar' ? {getBoundingClientRect:()=>({top:0,bottom:statusbarHeight,height:statusbarHeight})} : selector === '[data-action="detail"]' && html.includes('data-action="detail"') ? Object.assign(rendered({action:'detail'}),{scrollIntoView:scroll}) : selector === '[data-action="end-day"]' ? rendered({action:'end-day'}) : selector==='[data-map-frame]' || (selector === '.map-frame.is-world' && html.includes('class="map-frame is-world"')) ? frame : null,
+    querySelectorAll:(selector:string)=>selector.startsWith('.crew h2,') ? sideAnchors() : selector==='[data-action-slot]' ? [...html.matchAll(/data-action-slot="([^"]+)"/g)].map((m)=>({dataset:{actionSlot:m[1]},getBoundingClientRect:()=>slotRect(m[1]!)}))
       // 계약 카드 위치는 제목 위치를 따른다.
       : selector==='.contract' ? [...html.matchAll(/id="(contract-h-[^"]+)"/g)].map((m)=>({getBoundingClientRect:()=>{const h=bounds[m[1]!] ?? rect();return {top:h.top-10,bottom:h.top+290,height:300};},querySelector:(q:string)=>q==='h3[id]' ? doc.getElementById(m[1]!) : null}))
       : elements(),
@@ -127,5 +166,9 @@
     importText:async(text:string)=>{const input=new Input(); input.files=[{text:async()=>text}]; await listeners.change!({target:input});},
     focusTrain:(emp:string)=>{ doc.activeElement=rendered({action:'train',emp}); },
     measure:(width:number,dpr:number)=>measureCallback!(frame as unknown as HTMLElement,width,dpr),
+    // app에 단 수신기(pointerdown·wheel·touchstart·focusin)를 부른다.
+    fireApp:(name:string,ev:any)=>listeners[name]!(ev),
+    mediaQueries,
+    setOneColumn:(on:boolean)=>{oneColumn=on;mediaListeners.forEach((callback)=>callback({matches:on}));},
   };
 }
```

## 부록 B. `src/ui/layout.test.ts` (Claude 시제품, 40개)

검토(2026-10-10)에서 시험 24·26·28에 단언을 더하고(변형 M29~M31) 시험 40의 빌드 표시 식을 고쳤다. 고친 판이 `c284e79` 사본, TASK-0025를 얹은 사본, git 작업 트리 사본(빌드 표시가 해시) 모두에서 40개 통과했다.

```ts
// TASK-0024: 배치 공통·배치안 A·Esc 닫기·한 열 화면 코드 순서·머리 줄.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadScenario } from '../content/scenario';
import { createGame, openDay } from '../engine/engine';
import { serializeSave } from '../engine/save';
import { runDays } from '../engine/testkit';
import { startUi } from './main-testkit';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
type Ui = Awaited<ReturnType<typeof startUi>>;
const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
const first = config.employees[0]!.id;
const header = (html: string) => html.match(/<header class="topbar">[\s\S]*?<\/header>/)![0];
const chip = (n: number) => `<button class="queue-chip" id="queue-chip" data-action="queue-jump" aria-label="오늘 할 일 ${n}건 보기">오늘 할 일 <b>${n}</b>건</button><div class="day-action">`;
const button = (html: string, action: string, key: string, value: string) => html.match(new RegExp(`<button[^>]*data-action="${action}" data-${key}="${value}"[^>]*>`))![0];
const pressEsc = (ui: Ui, extra: Record<string, unknown> = {}) => { const ev = { key: 'Escape', preventDefault: vi.fn(), ...extra }; ui.fireDoc('keydown', ev); return ev; };
const readCss = async () => (await vi.importActual<{ readFileSync: (p: URL, e: string) => string }>('node:fs')).readFileSync(new URL('./style.css', import.meta.url), 'utf8');
/** 4일 면담 준비 저장: 1일 첫 현장 조사(둘째 직원), 2일 발견한 후보 영입 의뢰(첫 직원). ID는 설정·상태에서 꺼낸다. */
const interviewSave = () => {
  const scout = { id: 'S', type: 'SCOUT_SITE' as const, venueId: config.recruitment!.scoutSites[0]!.venueId, employeeId: config.employees[1]!.id };
  const candidate = runDays(createGame(config), config, 1, { 1: [scout] }).state.recruitment.candidates.find((c) => c.stage === 'DISCOVERED')!.employeeId;
  const quest = { id: 'Q', type: 'START_RECRUIT_QUEST' as const, candidateId: candidate, employeeId: first };
  return serializeSave(openDay(runDays(createGame(config), config, 3, { 1: [scout], 2: [quest] }).state, config).state);
};

describe('배치 공통: 카드 아래 상세·펼침 띠·훈련 칸', () => {
  it('카드로 고르면 상세가 그 카드 바로 뒤에, 운영표 줄·이름 단추로 고르면 운영표 뒤에 있다', async () => {
    const ui = await startUi();
    const underCard = () => {
      const html = ui.app.innerHTML, card = html.search(new RegExp(`<article class="card [^"]*is-selected" data-action="select-card" data-emp="${first}"`));
      const detail = html.indexOf('<div class="card-detail">');
      return card >= 0 && detail > card && html.indexOf('<article', card + 1) > detail && html.indexOf('<section class="employee-detail"') > detail
        && html.indexOf('<section class="employee-detail"') < html.indexOf('<table class="roster">');
    };
    const underRoster = () => {
      const html = ui.app.innerHTML;
      return !html.includes('<div class="card-detail">') && html.indexOf('<section class="employee-detail"') > html.indexOf('</table>', html.indexOf('<table class="roster">'));
    };
    ui.click({ action: 'select-card', emp: first }); expect(underCard()).toBe(true);
    const row = () => ui.app.querySelectorAll('[data-action]').find((e) => 'tagName' in e && e.tagName === 'TR' && e.dataset.emp === first)!;
    vi.advanceTimersByTime(501); ui.clickTarget(row()); expect(underRoster()).toBe(true);
    ui.click({ action: 'select-card', emp: first }); expect(underCard()).toBe(true);
    const pick = ui.app.querySelectorAll('[data-action]').find((e) => 'tagName' in e && e.tagName === 'BUTTON' && e.dataset.action === 'select-card' && e.dataset.emp === first)!;
    vi.advanceTimersByTime(501); ui.clickTarget(pick); expect(underRoster()).toBe(true);
    ui.keydown(ui.rendered({ action: 'select-card', emp: first }), 'Enter'); expect(underCard()).toBe(true);
  });
  it('고른 카드가 필터로 숨으면 상세는 운영표 뒤에 있고 필터를 풀면 카드 아래로 돌아온다', async () => {
    const ui = await startUi(); ui.click({ action: 'select-card', emp: first });
    ui.click({ action: 'crew-filter', filter: 'busy' });
    const html = ui.app.innerHTML;
    expect(html).not.toContain('<div class="card-detail">');
    expect(html.indexOf('<section class="employee-detail"')).toBeGreaterThan(html.indexOf('<table class="roster">'));
    ui.click({ action: 'crew-filter', filter: 'all' }); expect(ui.app.innerHTML).toContain('<div class="card-detail">');
  });
  it('펼친 상세는 훈련 단추 아래 끝 + 8px이 알림 자리 72px 위에 오게 한 번 굴리고 제목은 막대 아래 8px에 남긴다', async () => {
    const ui = await startUi(); ui.click({ action: 'select-card', emp: first });
    ui.bounds[`train:${first}`] = { top: 760, bottom: 797, height: 37 };
    ui.bounds[`training-h-${first}`] = { top: 400, bottom: 420, height: 20 };
    ui.scrollBy.mockClear(); ui.click({ action: 'detail', emp: first });
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 797 + 8 - (800 - 72));
    ui.scrollBy.mockClear(); ui.click({ action: 'detail', emp: first }); expect(ui.scrollBy).not.toHaveBeenCalled();
    ui.bounds[`training-h-${first}`] = { top: 150, bottom: 170, height: 20 };
    ui.click({ action: 'detail', emp: first }); expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 150 - 100 - 8);
    ui.click({ action: 'detail', emp: first }); ui.bounds[`train:${first}`] = { top: 600, bottom: 637, height: 37 };
    ui.scrollBy.mockClear(); ui.click({ action: 'detail', emp: first }); expect(ui.scrollBy).not.toHaveBeenCalled();
  });
  it('알림이 있으면 펼친 상세의 띠 아래 끝은 알림 위 끝이다', async () => {
    const ui = await startUi(); ui.click({ action: 'accept' }); ui.setToastTop(600);
    ui.click({ action: 'select-card', emp: first });
    ui.bounds[`train:${first}`] = { top: 603, bottom: 640, height: 37 }; ui.bounds[`training-h-${first}`] = { top: 400, bottom: 420, height: 20 };
    ui.scrollBy.mockClear(); ui.click({ action: 'detail', emp: first });
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 640 + 8 - 600);
  });
  it('펼친 면담은 고용 단추를 같은 규칙으로 띠 안에 두고 접을 때는 굴리지 않는다', async () => {
    const ui = await startUi(); await ui.importText(interviewSave());
    const candidate = ui.rendered({ action: 'interview' }).dataset.candidate!;
    ui.setToastTop(790); // 불러오기 알림이 떠 있다. 알림 위 끝(790)보다 72px 예약(728)이 더 위다.
    ui.bounds[`hire:${candidate}`] = { top: 700, bottom: 744, height: 44 }; ui.bounds[`interview-h-${candidate}`] = { top: 300, bottom: 330, height: 30 };
    ui.scrollBy.mockClear(); ui.click({ action: 'interview', candidate });
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 744 + 8 - (800 - 72));
    ui.scrollBy.mockClear(); ui.click({ action: 'interview', candidate }); expect(ui.scrollBy).not.toHaveBeenCalled();
  });
  it('훈련을 넣고 위 내용이 늘면 예정 표시를 누른 높이에 둔다', async () => {
    const ui = await startUi(); ui.click({ action: 'select-card', emp: first }); ui.click({ action: 'detail', emp: first });
    ui.scrollBy.mockClear(); ui.afterRender(() => { ui.slotTops[`train-${first}`] = 230; });
    ui.click({ action: 'train', emp: first });
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 50);
    expect(ui.app.innerHTML).toContain(`<div data-action-slot="train-${first}"><span class="pill" id="status-train-${first}" tabindex="-1">일반 훈련 예정</span></div>`);
  });
  it('M1 화면에는 카드 아래 상세·오늘 할 일 단추·훈련 칸이 없다', async () => {
    const ui = await startUi(); ui.change({ action: 'scenario' }, 'SCENARIO_M1_ONE_TRADE');
    ui.click({ action: 'select-card' }); ui.click({ action: 'accept' });
    for (const part of ['class="card-detail"', 'queue-chip', 'data-action-slot="train-']) expect(ui.app.innerHTML).not.toContain(part);
  });
});

describe('배치안 A: 오늘 할 일 단추', () => {
  it('M2 막대의 단추는 하루 진행 바로 앞이고 건수는 오늘 할 일 목록의 줄 수다', async () => {
    const ui = await startUi();
    const rows = () => (ui.app.innerHTML.match(/<ol class="pending">([\s\S]*?)<\/ol>/)?.[1]?.match(/<li\b/g) ?? []).length;
    expect(header(ui.app.innerHTML)).toContain(chip(0));
    ui.click({ action: 'accept' }); expect(header(ui.app.innerHTML)).toContain(chip(1)); expect(rows()).toBe(1);
    ui.click({ action: 'assign' }); expect(header(ui.app.innerHTML)).toContain(chip(2));
    // 앞 명령을 빼면 남은 배정은 실행할 수 없는 줄(bad)로 남는다. 그 줄도 센다.
    ui.click({ action: 'unqueue', index: '0' });
    expect(ui.app.innerHTML).toContain('<li class="bad">'); expect(rows()).toBe(1); expect(header(ui.app.innerHTML)).toContain(chip(1));
  });
  it('단추를 누르면 오늘 할 일 제목으로 굴리고 초점을 두며 500ms 동안 다른 누름을 막고 알림은 그대로다', async () => {
    const ui = await startUi(); const before = ui.announcements.length;
    ui.scrollIds.length = 0; ui.focusIds.length = 0; ui.focus.mockClear();
    ui.click({ action: 'queue-jump' });
    expect(ui.scrollIds).toEqual(['queue-h']); expect(ui.focusIds).toEqual(['queue-h']);
    expect(ui.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true }); expect(ui.scroll).toHaveBeenLastCalledWith({ block: 'start' });
    vi.advanceTimersByTime(499); ui.clickNow({ action: 'accept' }); expect(header(ui.app.innerHTML)).toContain(chip(0));
    vi.advanceTimersByTime(1); ui.clickNow({ action: 'accept' }); expect(header(ui.app.innerHTML)).toContain(chip(1));
    expect(ui.announcements).toHaveLength(before + 1);
  });
  it('키보드 순서(Tab → focusin → Enter → click)에서 단추는 고정 막대 안이라 Shift+Tab 위치 복원을 받고 같은 곳으로 간다', async () => {
    const ui = await startUi(); ui.win.scrollY = 1200;
    ui.fireDoc('keydown', { key: 'Tab', shiftKey: true }); ui.win.scrollY = 800;
    ui.fireDoc('focusin', { target: ui.rendered({ action: 'queue-jump' }) });
    expect(ui.win.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 1200);
    ui.fireDoc('keydown', { key: 'Enter' }); ui.scrollIds.length = 0; vi.advanceTimersByTime(501); ui.clickNow({ action: 'queue-jump' }, 0);
    expect(ui.scrollIds).toEqual(['queue-h']); expect(ui.doc.activeElement.id).toBe('queue-h');
  });
});

describe('배치안 A: 하루 진행 뒤 마지막 조작 열', () => {
  const side = (ui: Ui, type = 'pointerdown') => ui.fireApp(type, { target: ui.rendered({ action: 'schedule-toggle' }) });
  const endDayScroll = async (before: (ui: Ui) => unknown, start = () => startUi()) => {
    const ui = await start(); ui.click({ action: 'accept' });
    const contract = ui.rendered({ action: 'cancel' }).dataset.contract!;
    await before(ui);
    ui.bounds['queue-h'] = { top: 300, bottom: 330, height: 30 }; ui.bounds[`contract-h-${contract}`] = { top: 250, bottom: 280, height: 30 };
    ui.afterRender(() => { ui.bounds['queue-h'] = { top: 380, bottom: 410, height: 30 }; ui.bounds[`contract-h-${contract}`] = { top: 200, bottom: 230, height: 30 }; });
    ui.scrollBy.mockClear(); ui.click({ action: 'end-day' });
    return ui.scrollBy.mock.calls;
  };
  it.each(['pointerdown', 'wheel', 'touchstart', 'focusin'])('오른쪽 칸에서 %s 뒤 하루 진행은 오른쪽 후보 하나로 한 번 보정한다', async (type) => {
    expect(await endDayScroll((ui) => side(ui, type))).toEqual([[0, 80]]);
  });
  it('막대 아래에서 시작하는 후보를 막대에 걸친 후보보다 먼저 쓴다', async () => {
    expect(await endDayScroll((ui) => { side(ui); ui.bounds['crew-h'] = { top: 80, bottom: 130, height: 50 }; })).toEqual([[0, 80]]);
  });
  it('주 열을 누른 뒤에는 계약 제목 규칙 그대로다', async () => {
    expect(await endDayScroll((ui) => { side(ui); ui.fireApp('pointerdown', { target: ui.rendered({ action: 'cancel' }) }); })).toEqual([[0, -50]]);
  });
  it('고정 막대를 눌러도 마지막 열은 그대로다', async () => {
    expect(await endDayScroll((ui) => { side(ui); ui.fireApp('pointerdown', { target: ui.rendered({ action: 'end-day' }) }); })).toEqual([[0, 80]]);
  });
  it('한 열이면 오른쪽을 눌렀어도 계약 제목 규칙이다', async () => {
    expect(await endDayScroll((ui) => { ui.setOneColumn(true); side(ui); })).toEqual([[0, -50]]);
  });
  it('M1이면 오른쪽을 눌렀어도 계약 제목 규칙이다', async () => {
    const ui = await startUi(); ui.change({ action: 'scenario' }, 'SCENARIO_M1_ONE_TRADE');
    ui.click({ action: 'accept' }); ui.click({ action: 'assign' }); ui.click({ action: 'book' });
    const contract = ui.rendered({ action: 'cancel' }).dataset.contract!;
    ui.fireApp('pointerdown', { target: ui.rendered({ action: 'unqueue' }) });
    ui.bounds['queue-h'] = { top: 300, bottom: 330, height: 30 }; ui.bounds[`contract-h-${contract}`] = { top: 250, bottom: 280, height: 30 };
    ui.afterRender(() => { ui.bounds['queue-h'] = { top: 380, bottom: 410, height: 30 }; ui.bounds[`contract-h-${contract}`] = { top: 200, bottom: 230, height: 30 }; });
    ui.scrollBy.mockClear(); ui.click({ action: 'end-day' });
    expect(ui.scrollBy.mock.calls).toEqual([[0, -50]]);
  });
  it.each(['load', 'import', 'restart', 'scenario'])('%s 뒤에는 마지막 열이 비워진다', async (how) => {
    const save = serializeSave(openDay(createGame(config), config).state);
    vi.stubGlobal('localStorage', { getItem: () => save, setItem: () => undefined });
    expect(await endDayScroll(() => undefined, async () => {
      const ui = await startUi(); side(ui);
      if (how === 'load') ui.click({ action: 'load' });
      if (how === 'import') await ui.importText(save);
      if (how === 'restart') ui.click({ action: 'restart' });
      if (how === 'scenario') ui.change({ action: 'scenario' }, config.id);
      return ui;
    })).toEqual([[0, -50]]);
  });
});

describe('Esc로 맨 위 칸 닫기', () => {
  it('열린 상세를 닫고 상세 단추로 초점을 돌려주며 띠 안으로 최소 거리만 옮기고 500ms 동안 누름을 막는다', async () => {
    const ui = await startUi(); ui.click({ action: 'select-card', emp: first }); ui.click({ action: 'detail', emp: first });
    ui.bounds[`detail:${first}`] = { top: 50, bottom: 94, height: 44 };
    ui.scrollBy.mockClear(); ui.focus.mockClear(); vi.advanceTimersByTime(501);
    const ev = pressEsc(ui);
    expect(ev.preventDefault).toHaveBeenCalledOnce();
    expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="false"');
    expect(ui.doc.activeElement.dataset).toEqual({ action: 'detail', emp: first });
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 50 - (100 + 8));
    expect(ui.focus).toHaveBeenLastCalledWith({ preventScroll: true });
    vi.advanceTimersByTime(499); ui.clickNow({ action: 'detail', emp: first }); expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="false"');
    vi.advanceTimersByTime(1); ui.clickNow({ action: 'detail', emp: first }); expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="true"');
    // 단추가 띠 아래에 있으면 아래 끝을 띠 아래 끝(화면 800 − 8)에 맞춘다.
    ui.bounds[`detail:${first}`] = { top: 770, bottom: 814, height: 44 };
    ui.scrollBy.mockClear(); vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 814 - (800 - 8)); expect(ui.doc.activeElement.dataset).toEqual({ action: 'detail', emp: first });
  });
  it('단추가 띠 안이면 굴리지 않고 초점만 돌려준다', async () => {
    const ui = await startUi(); ui.click({ action: 'select-card', emp: first }); ui.click({ action: 'detail', emp: first });
    ui.scrollBy.mockClear(); vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.scrollBy).not.toHaveBeenCalled(); expect(ui.doc.activeElement.dataset.action).toBe('detail');
  });
  it('면담을 닫고 면담 단추로 초점을 돌려준다', async () => {
    const ui = await startUi(); await ui.importText(interviewSave());
    const candidate = ui.rendered({ action: 'interview' }).dataset.candidate!;
    // 상세를 먼저 열었어도 나중에 연 면담이 맨 위다.
    ui.click({ action: 'select-card', emp: first }); ui.click({ action: 'detail', emp: first });
    ui.click({ action: 'interview', candidate }); vi.advanceTimersByTime(501); pressEsc(ui);
    expect(button(ui.app.innerHTML, 'interview', 'candidate', candidate)).toContain('aria-expanded="false"');
    expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="true"');
    expect(ui.doc.activeElement.dataset).toEqual({ action: 'interview', candidate });
  });
  it('기록장을 먼저 닫고 다음 Esc로 현지 패널을 닫아 열기 전 탭 위치로 되돌리고 현지 탭에 초점을 둔다', async () => {
    const ui = await startUi(); ui.bounds['local-tab'] = { top: 240, bottom: 284, height: 44 };
    ui.click({ action: 'culture-tab' }); ui.click({ action: 'culture-book' });
    vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.app.innerHTML).toContain('id="local"'); expect(ui.app.innerHTML).toContain('data-action="culture-book" aria-expanded="false"');
    expect(ui.doc.activeElement.dataset.action).toBe('culture-book');
    ui.scrollBy.mockClear(); ui.afterRender(() => { ui.bounds['local-tab'] = { top: 310, bottom: 354, height: 44 }; });
    vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.app.innerHTML).not.toContain('id="local"'); expect(ui.doc.activeElement.id).toBe('local-tab');
    expect(ui.scrollBy).toHaveBeenCalledExactlyOnceWith(0, 70);
  });
  it('맨 위 칸은 가장 최근에 열거나 그 안을 누르거나 초점을 둔 칸이다', async () => {
    const ui = await startUi(); ui.click({ action: 'culture-tab' }); ui.click({ action: 'select-card', emp: first }); ui.click({ action: 'detail', emp: first });
    vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.app.innerHTML).toContain('id="local"'); expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="false"');
    ui.click({ action: 'detail', emp: first }); ui.click({ action: 'culture-tab' }); ui.click({ action: 'culture-tab' });
    vi.advanceTimersByTime(501); pressEsc(ui); expect(ui.app.innerHTML).not.toContain('id="local"');
    ui.click({ action: 'culture-tab' }); ui.fireApp('pointerdown', { target: ui.rendered({ action: 'train', emp: first }) });
    vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.app.innerHTML).toContain('id="local"'); expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="false"');
    ui.click({ action: 'detail', emp: first }); ui.fireApp('focusin', { target: ui.rendered({ action: 'culture-act' }) });
    vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.app.innerHTML).not.toContain('id="local"'); expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="true"');
    // 굴리기(wheel·touchstart)만으로는 맨 위 칸이 바뀌지 않는다.
    ui.click({ action: 'culture-tab' }); ui.fireApp('wheel', { target: ui.rendered({ action: 'train', emp: first }) });
    vi.advanceTimersByTime(501); pressEsc(ui);
    expect(ui.app.innerHTML).not.toContain('id="local"'); expect(button(ui.app.innerHTML, 'detail', 'emp', first)).toContain('aria-expanded="true"');
  });
  it.each([['열린 칸 없음', {}], ['반복', { repeat: true }], ['Ctrl', { ctrlKey: true }], ['Alt', { altKey: true }], ['Meta', { metaKey: true }], ['Shift', { shiftKey: true }], ['입력 조합 중', { isComposing: true }]])('%s이면 Esc가 아무것도 하지 않는다', async (_name, extra) => {
    const ui = await startUi(); if (Object.keys(extra).length) ui.click({ action: 'culture-tab' });
    const before = ui.app.innerHTML; vi.advanceTimersByTime(501);
    const ev = pressEsc(ui, extra);
    expect(ev.preventDefault).not.toHaveBeenCalled(); expect(ui.app.innerHTML).toBe(before);
  });
  it('Esc는 위쪽 막대와 알림 영역을 바꾸지 않고 Tab 기록을 지운다', async () => {
    const ui = await startUi(); ui.click({ action: 'culture-tab' }); ui.click({ action: 'culture-book' });
    const bar = header(ui.app.innerHTML), count = ui.announcements.length;
    vi.advanceTimersByTime(501); pressEsc(ui); vi.advanceTimersByTime(501); pressEsc(ui);
    expect(header(ui.app.innerHTML)).toBe(bar); expect(ui.announcements).toHaveLength(count);
    ui.win.scrollY = 1200; ui.fireDoc('keydown', { key: 'Tab', shiftKey: true }); pressEsc(ui); ui.win.scrollY = 800;
    ui.fireDoc('focusin', { target: ui.rendered({ action: 'end-day' }) });
    expect(ui.win.scrollTo).not.toHaveBeenCalled();
  });
});

describe('한 열 화면 코드 순서', () => {
  const PANEL: Record<string, string> = { trade: '<section class="panel trade"', crew: '<aside class="panel crew"', resources: '<section class="panel resources"',
    queue: '<section class="panel queue"', world: '<section class="panel world"', report: '<section class="panel report"', log: '<section class="panel log"' };
  const domOrder = (html: string) => Object.keys(PANEL).sort((a, b) => html.indexOf(PANEL[a]!) - html.indexOf(PANEL[b]!));
  const areaOrder = (areas: string) => [...new Set(areas.match(/"([^"]+)"/g)!.flatMap((row) => row.slice(1, -1).trim().split(/\s+/)))];
  it('한 열이면 한 열 격자 순서, 세 열이면 세 열 격자 순서로 그리고 미디어 조건은 CSS와 같다', async () => {
    const css = await readCss();
    const three = areaOrder(css.match(/\.layout \{[^}]*grid-template-areas:([^;]+);/)![1]!);
    const one = areaOrder(css.match(/@media \(max-width: 1000px\) \{[^}]*\}[^}]*grid-template-areas:([^;]+);/)![1]!);
    const ui = await startUi();
    expect(domOrder(ui.app.innerHTML)).toEqual(three);
    ui.setOneColumn(true); expect(domOrder(ui.app.innerHTML)).toEqual(one);
    ui.click({ action: 'accept' }); expect(domOrder(ui.app.innerHTML)).toEqual(one);
    ui.click({ action: 'map-mode', mode: 'world' }); expect(domOrder(ui.app.innerHTML)).toEqual(one);
    ui.setOneColumn(false); expect(domOrder(ui.app.innerHTML)).toEqual(three);
    ui.change({ action: 'scenario' }, 'SCENARIO_M1_ONE_TRADE'); expect(domOrder(ui.app.innerHTML)).toEqual(three);
    ui.setOneColumn(true); expect(domOrder(ui.app.innerHTML)).toEqual(one);
    expect(ui.mediaQueries).toEqual([css.match(/@media (\([^)]*\)) \{\n {2}\.layout, \.layout\.map-wide \{ grid-template-rows: none; \}/)![1]]);
  });
  it('패널 사이 글자는 기존 화면 코드와 같은 줄바꿈과 들여쓰기다', async () => {
    const ui = await startUi(); const gap = '\n      \n  ';
    const pairs = (html: string, order: string[]) => order.slice(1).every((key, i) => html.includes(`${i === 0 ? '</div>' : order[i] === 'crew' ? '</aside>' : '</section>'}${gap}${PANEL[key]}`));
    expect(pairs(ui.app.innerHTML, ['trade', 'crew', 'resources', 'queue', 'world', 'report', 'log'])).toBe(true);
    ui.setOneColumn(true); expect(pairs(ui.app.innerHTML, ['trade', 'queue', 'crew', 'resources', 'report', 'world', 'log'])).toBe(true);
  });
  it('폭이 바뀌어 다시 그려도 초점은 같은 조작에 남고 굴리지 않는다', async () => {
    const ui = await startUi(); ui.click({ action: 'accept' }); ui.click({ action: 'end-day' });
    ui.doc.activeElement = ui.rendered({ action: 'schedule-toggle' }); ui.focusIds.length = 0; ui.focus.mockClear();
    ui.bounds['schedule-toggle'] = { top: 2000, bottom: 2044, height: 44 };
    ui.setOneColumn(true);
    expect(ui.focusIds).toEqual(['schedule-toggle']); expect(ui.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    expect(ui.scrollBy).not.toHaveBeenCalled(); expect(ui.win.scrollTo).not.toHaveBeenCalled();
    ui.doc.activeElement = ui.rendered({ action: 'crew-filter', filter: 'free' }); ui.focusIds.length = 0;
    ui.setOneColumn(false); expect(ui.doc.activeElement.dataset).toEqual({ action: 'crew-filter', filter: 'free' }); expect(ui.focusIds).toEqual([]);
    ui.doc.activeElement = null; ui.focus.mockClear(); ui.setOneColumn(true); expect(ui.focus).not.toHaveBeenCalled();
  });
});

describe('머리 줄', () => {
  it('빌드 표시 문구 폭을 9.5rem으로 묶어 빌드 표시를 둘째 줄에 두고 문구는 그대로다', async () => {
    expect(await readCss()).toMatch(/\.brand \.sub \{ max-width: 9\.5rem; \}/);
    const ui = await startUi();
    // 빌드 표시는 git 작업 트리에서 해시(+수정), 밖에서 dev다(main.test.ts ‘빌드 표시는 머리 문구에 있고…’와 같은 식).
    expect(ui.app.innerHTML).toMatch(/<div class="brand"><span class="logo">Scitrade<\/span><span class="sub">시제품 · 모든 숫자는 가상값 · 빌드 (dev|[0-9a-f]{7}(\+수정)?)<\/span><\/div>/);
  });
});
```
