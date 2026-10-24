# TASK-0005 성장 화면 + 영입 검수 잔여 정리

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: TASK-0004·0008·0007 반영(개발 브랜치, 2026-10-06). TASK-0007의 픽셀 렌더링이 `card.ts`(카드 그림 줄)·`main.ts`(지도 연결)·`style.css`를 바꿨으므로 그 위에서 작업한다.
- 결정 근거:
  - `docs/DECISIONS.md`의 다음 절: ‘M2a-2 동료 영입 구현의 세부 결정’, ‘M2a-3 경험치·레벨·일반 훈련 구현의 세부 결정’, ‘취소 정산 결함 수정과 저장 무결성’.
  - Claude 범위 조사. 영입 검수에서 미뤄 둔 11건이 현재 코드에 남아 있는지 재현으로 확인했고, 성장 화면에 필요한 것을 정리했다.

## 목표

- **A. 정리:** 영입 검수에서 미뤄 둔 접근성·이스케이프·상태 초기화·테스트 문제를 고친다. 원화 보고서와 취소 안내 금액을 엔진 값과 맞춘다.
- **B. 성장 화면:** 경험치·레벨·능력과 일반 훈련을 화면에 연결한다. 판정과 수치는 모두 엔진에서 받는다. 엔진에 이미 있는 읽기 함수:
  - `taskSubjectKo`(`src/engine/tasks.ts`)
  - `levelProgress`(`growth.ts`)
  - `trainingPreview`, `payrollRunwayDay`(`previews.ts`)

**순서:** A를 먼저 끝내고 검증을 통과시킨 뒤 B를 한다. 보고서도 A·B를 나눠 쓴다.

**지키는 것:**
- 엔진 규칙·기대값은 바꾸지 않는다.
- 화면은 자금·바쁨·레벨을 다시 계산하지 않는다. 엔진 함수나 `planState`/`tryCommand` 결과를 쓴다.

## 먼저 읽을 파일

- `src/ui/main.ts`, `src/ui/recruitment.ts`, `src/ui/card.ts`, `src/ui/recruitment.test.ts`, `src/ui/html.ts`, `src/ui/style.css`.
- `src/ui/map-integration.test.ts`(실제 `main` 모듈을 가짜 `document`로 불러와 시험하는 틀), `src/ui/pixel.test.ts`.
- `src/engine/tasks.ts`, `growth.ts`(`levelProgress`, `statsFor`), `previews.ts`, `reports.ts`, `reservations.ts`(`fundsPosition`, `trainingAvailableMinor`), `save.ts`.
- `tests/character_acceptance_cases.json`의 CHAR-ACC-01·02·08.
- `docs/UI_SPEC.md`, `docs/CHARACTERS_AND_ORGANIZATION.md`의 교육·능력 부분, `docs/ART_DIRECTION.md` 맨 위 절(픽셀아트, 본문 글자 유지).

## 테스트할 수 있게 만드는 원칙

`main.ts`는 불러오는 순간 DOM을 건드린다. DOM 테스트 라이브러리는 설치하지 않는다. `src/ui/map-integration.test.ts`가 가짜 `document`와 `./pixel` 흉내로 실제 `main`을 불러와 시험하는 틀을 이미 갖고 있다. 이 틀은 `innerHTML`·`addEventListener`·`querySelector`만 흉내 내므로, 새 DOM 호출(예: 초점 복원)을 넣으면 그 흉내에 메서드를 더해야 한다. 그래도 다음을 지킨다.
- 새 판단과 HTML 생성은 **순수 모듈**에 둔다. `main.ts`는 연결만 한다.
- 예: `src/ui/session.ts`, `src/ui/growth.ts`, `src/ui/reports.ts`, `src/ui/trade.ts`. 모듈 이름은 자유다.
- 데이터에서 온 문자열은 넣는 자리에서 모두 `esc()`한다. 텍스트 자리와 속성 자리 모두다.

## A. 정리

1. **화면 상태 초기화 하나로:**
   - `initialUiState()`(순수)를 만들고, ‘처음부터·시나리오 전환’과 ‘불러오기·가져오기 성공’이 모두 이것을 쓴다.
   - 비울 것: 대기 명령, 알림, 선택 카드, 필터, 열린 면담, 영입 담당 선택, 계획 선택(`plans`·`touchedPlans`), 그리고 B에서 생길 열린 상세·훈련 선택.
   - 지금 `loadText`는 `plans`·`touchedPlans`·`selectedCard`를 비우지 않아, 불러온 뒤 지난 선택이 엔진 기본값을 덮는다.
   - 불러오기 실패 때는 지금 게임을 그대로 둔다.
   - 지도 상태(측정 기억 `mapMeasurements.clear()`, `resetMapScroll = true`, `mapScrollRatio = undefined`)도 처음부터·시나리오 전환·불러오기·가져오기 모두에서 같은 초기화 경로로 비운다. `src/ui/map-integration.test.ts`의 ‘시나리오 전환’과 ‘저장을 불러오면…’ 시험이 그대로 통과해야 한다. 가져오기(파일) 경로에도 같은 시험을 더한다.
2. **불러오기 순수 함수 `loadSaveText(text)`:**
   - 결과는 `{ config, state } | { errorKo }`. 시나리오 확인, `deserializeSave`(설정과 규칙 판본 전달), `openDay`를 한다.
   - 손상 저장은 한국어 메시지로 거절한다(TASK-0004·0008의 SaveError 메시지).
   - **하루 진행 보호:** ‘하루 진행’의 `commitDay` 예외를 잡아 알림으로 보여 주고, 게임 상태를 유지한다.
3. **이스케이프 전수:** `main.ts`에서 상태·자료에서 온 문자열을 모두 `esc()`한다. 지금 빠진 곳은 다음과 같다.
   - 견적판의 보고자 줄(‘의 보고’ 문구, 직접 무역·운송 주선 두 곳), 준비 업무 배정 버튼(`data-action="assign"`)의 직원 이름과 속성.
   - 계약 번호, 도시 이름, 수량 문구.
   - 알림의 제목·본문·근거(`n.titleKo` 등 공지 카드).
   - 시험: 위험 문자열(`공통<&"'문자>`, `<img src=x onerror=alert(1)>`)을 이름·알림 본문·계약 번호에 넣은 저장을 렌더링한다. 원문이 그대로 나오지 않고 이스케이프된 형태가 나와야 한다.
4. **내부 ID 대신 이름:**
   - 계약 담당 표시 ‘귀솔 (EMP01)’에서 ID를 뺀다(`['담당', …employeeName(c.ownerEmployeeId)…]` 줄).
   - 카드의 직원 ID 표시(`card.ts`)는 화면에서 빼고 접근 이름에도 넣지 않는다.
   - 노선·출항편·계약 번호는 플레이어에게 보이는 값으로 남긴다.
   - 업무 대상 문구는 `taskSubjectKo`를 쓴다(카드 일정, 운영표, 자원 패널, 계획 선택지, 배정 버튼 보조 문구).
5. **취소 안내 금액:**
   - 지금 `main.ts`의 ‘취소하면:’ 줄은 고정 환급(150 USD)을 보여 준다. ROUTE02 예약은 실제로 130 USD를 환급한다.
   - 그 계약의 `CANCEL_CONTRACT`를 `planState`로 미리 계획해, 엔진이 만든 정산 항목의 환급·취소비를 보여 준다. 화면이 따로 계산하지 않는다.
   - 시험: ROUTE01 150/50, ROUTE02 130/50.
6. **원화 보고서 행:**
   - 순수 함수 `krwReportRows(report, config)`를 만든다. 행 순서는 다음과 같다:
     1. 시작 운영 자금(`openingEquity`)
     2. 급여
     3. 영입 계약금
     4. 훈련비
     5. 운영 손익
     6. 미지급 급여
     7. 현금
   - 현금 = 시작 운영 자금 + 운영 손익 + 미지급 급여로 맞아떨어져야 한다.
   - 각주는 ‘계약금·훈련비는 한 번 내는 원화 비용’을 설명한다.
   - 시험: 고용 1회 + 훈련 1회 뒤 숫자가 맞는지.
7. **접근 이름:**
   - 조사·의뢰 버튼의 `aria-label`에 보이는 글자(`(1pt)`, `(3pt)`)가 들어가야 한다(WCAG 2.5.3 Label in Name).
   - 시험: 패널의 모든 버튼에서 `aria-label`이 보이는 글자를 포함하는지 일괄 확인한다.
8. **영입 테스트 보강** (`recruitment.test.ts`):
   - 면담 영역의 `aria-labelledby` 대상 `h4 id`가 실제로 있는지 확인한다. 모든 `aria-labelledby`·`aria-controls` 대상 id가 같은 HTML에 있는지 일괄 확인한다.
   - 후보 카드 접근 이름을 모든 단계(발견·의뢰 진행 중·면담 가능·고용됨)로 시험한다.
   - 엔진이 허용할 때 고용 버튼이 켜지고 이유 문단이 없는지 확인한다.
   - 면담 값을 라벨과 짝지어 확인한다(`dt`→`dd` 정확한 값).
   - 카드 선택(후보 카드/직원 카드) 로직을 `crewEntryCard` 하나로 합치고, `main.ts`와 테스트가 같은 함수를 쓰게 한다.
9. **영입 계약금 0원 거절 문구:**
   - 미지급 때문에 계약금 0원 고용이 거절될 때 ‘필요 0원’ 대신 미지급이 원인임을 말한다.
   - 이 문구는 엔진이 만든다. 엔진 문구를 바꾸지 말고 화면에서 덧붙이는 방법을 찾는다. 불가능하면 보고서의 ‘질문’에 적는다.
10. **검사기·자료:**
    - `tests/acceptance_cases.json`의 `review_summary`를 실제 값(18건, P0 13·P1 4·P2 1)으로 고친다.
    - `tools/validate_data.py`가 개수를 대조하게 한다.
    - 시나리오 검사에서 영입 블록 키가 빠져도 예외 없이 `check()` 실패로 보고하는지 확인한다(시나리오 검산의 `scenario['recruitment']['signing_fee_wage_days']`처럼 키를 바로 읽는 곳에서 KeyError가 나면 고친다).
11. **문구:** 직원 패널 각주의 ‘레벨은 이후 단계에서 켭니다’를 고친다.
    - 새 문구: ‘레벨·능력은 성장 기록으로 보여 주며 아직 처리량(하루 Npt)에는 쓰지 않습니다. 레벨이 올라도 급여·직책은 바뀌지 않습니다.’
    - 이 문장은 함수(`crewNoteKo(config)`)로 만들어 시험한다.

## B. 성장 화면 (성장이 켜진 시나리오에서만. M1은 그대로)

12. **직원 상세 영역:**
    - 선택한 직원의 상세를 펼침 버튼(`aria-expanded`·`aria-controls`)과 이름 있는 영역(`role="region"`, `aria-labelledby`)으로 보여 준다.
    - 담을 것:
      - 레벨.
      - 누적 경험치와 다음 레벨까지(예: ‘경험치 320 / 600’, 최대 레벨이면 ‘최대 레벨’).
      - 6개 업무 능력의 한국어 이름과 숫자.
        - 이름: 교섭·운영·분석·기술·탐사·협업.
        - 주능력·부능력은 글자로 표시한다.
        - 여섯 숫자의 합계나 ‘전투력’ 같은 종합 수치는 만들지 않는다.
    - 값은 `levelProgress`에서 받는다.
13. **카드와 운영표:** 카드 하단에 레벨과 주·부 능력(예: ‘교섭 75 · 협업 65’)을 보여 준다. 운영표에도 레벨을 보여 준다. 처리량 열은 그대로 둔다(2pt/일 등).
14. **일반 훈련 블록** (상세 영역 안):
    - 표시 항목:
      - 훈련비, 기간, 완료 시 경험치.
      - 급여는 훈련비와 별도라는 설명.
      - 지금 원화 사용 가능액과 훈련 뒤 금액(`trainingPreview`).
      - 예상 변화: ‘완료하면 레벨 2 (교섭 +2, 협업 +1)’ 또는 ‘레벨 변화 없음 — 다음 레벨까지 40’. 완료할 때 반영된다는 점을 적는다.
      - 원화 급여 지급 가능일: ‘지금 N일까지 → 훈련하면 M일까지’(`payrollRunwayDay`). 표시 전용이다.
    - 버튼:
      - `data-action="train" data-emp=ID`, 접근 이름에 직원 이름을 넣는다.
      - 엔진이 거절하면 끄고, 바로 옆에 엔진 이유를 보여 준다(`trainingPreview.reasonKo`).
      - 누르면 `START_TRAINING`을 대기 명령에 넣는다.
    - 문구 주의:
      - 영입 면담의 ‘사용 가능’과 훈련의 ‘사용 가능’은 계산이 다를 수 있다. 훈련 쪽은 ‘훈련에 쓸 수 있는 원화’처럼 다른 이름으로 부른다.
      - 모든 금액은 `formatMoney`를 쓴다.
15. **‘교육 중’ 상태:**
    - 훈련 중인 직원은 ‘◆ 교육 중 0/1일’처럼 기호와 글자로 ‘● 업무 중’과 구별한다.
    - 표시할 곳: 카드 표시, 운영표, 자원 패널, 계획 선택지, 계약 배정 버튼 보조 문구, 영입 담당 선택지.
    - 상태 글자는 함수 하나(`crewStatusKo`)로 만든다.
16. **레벨 달성·경험치 알림:**
    - 하루 진행 뒤, 진행 전과 후의 `levelProgress`를 비교한다. 알림(`role="status"`)에 다음을 보여 준다:
      - ‘귀솔 레벨 3 달성 (교섭 +4, 협업 +2)’.
      - 그날 받은 경험치 ‘+60 경험치’. `state.xpAwardAmounts`에서 그날 완료분을 읽는다.
    - 같은 내용을 다시 그리거나 저장·불러오기를 해도 두 번 나오지 않는다.
    - 반짝임 같은 움직임은 넣지 않는다(그림 일괄 제작 때 `MO-LEVEL-UP`).
17. **초점 복원:**
    - 훈련 버튼을 눌러 버튼이 사라지거나 꺼지면, 그 직원 상세 영역의 제목(`tabindex="-1"`)으로 초점을 옮긴다.
    - 대체 선택자 목록을 상수로 빼서 시험한다.

## 테스트 (vitest, 순수 모듈 대상)

- **A:** 항목마다 위에 적은 시험. 특히 3·5·6·8은 망가뜨리는 변형을 넣으면 실패해야 한다.
- **B:**
  - CHAR-ACC-02 경로(xp 90 → +230): ‘레벨 3’, ‘레벨 2 달성’·‘레벨 3 달성’, 능력 54/42.
  - CHAR-ACC-08 경로: 훈련비·급여 행, ‘+60 경험치’ 한 번.
  - M1 시나리오에는 `data-action="train"`·‘경험치’가 없다.
  - 훈련 미리 보기는 거절 이유 9종 중 3종 이상(바쁨·자금·미고용)에서 버튼이 꺼지고 이유가 보인다.
  - xp 0·99·100·320·4499·4500의 경험치 문구.
- **기존 기대값을 바꾸지 않는다.**

## 범위

**포함:** `src/ui/**`(새 모듈 포함), `tests/acceptance_cases.json`의 `review_summary`, `tools/validate_data.py`의 개수 대조·영입 키 방어, 이 작업의 테스트.

**제외:**
- `src/engine/**`. 엔진 변경이 필요해 보이면 질문에 적는다.
- `data/**`의 값.
- `docs/STATUS.md`·`docs/DECISIONS.md`·`docs/ai/tasks/README.md`·`docs/art/*.md`.
- 지도·픽셀 렌더링 코드(`map.ts`·`pixel.ts`·`sprite.ts`). 다만 카드 그림 줄과 충돌하지 않게 둔다.
- `main.ts`의 지도 연결부(측정 기억 `mapMeasurements`, `applyPixelScale` 콜백, 지도 스크롤 저장·복원)의 동작.
- `src/ui/map-integration.test.ts`·`src/ui/pixel.test.ts`의 단언을 약하게 바꾸지 않는다. 가짜 DOM에 메서드를 더하는 것은 허용한다.
- 움직임 효과, 새 패키지.

## 결과 보고

`docs/ai/tasks/results/TASK-0005.md`. A·B를 나눠 쓴다. 변형 시험 결과를 표로 적는다.

## 완료 조건

1. A-1~11, B-12~17이 반영되었다.
2. 다음 변형을 넣으면 테스트가 실패하는 것을 확인하고 보고서에 적는다. 확인한 뒤에는 원래 코드로 되돌린다.
   - 이스케이프 하나 제거.
   - `initialUiState`에서 `plans` 비우기 제거.
   - 취소 안내를 고정 환급으로 되돌림.
   - 원화 보고 행 하나 누락.
   - 고용 버튼 항상 꺼짐.
   - 훈련 버튼이 엔진 판정을 무시하고 항상 켜짐.
   - 레벨 달성 알림 중복.
3. 기존 기대값을 바꾸지 않았다.
4. 머리말의 검증 다섯 개가 통과한다.

브라우저 확인은 Claude가 한다. 확인할 것: 훈련 전 과정, 초점, 390px 폭, 배율 1·1.5·2의 카드 그림 자리.
