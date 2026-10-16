# TASK-0061 상황실 지도 1판: 레이어 토글·사건 브리핑·출처 등록부(지연 청크)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: TASK-0060 반영 기록과 세션 B 정적 모형 병합 뒤 개발 브랜치 머리(이하 `BASE`). 기준 비교(`review_checks.sh`)는 `BASE`로 한다.
  - `BASE`는 이 지시서를 더한 커밋의 부모다. `git log -1 --format=%h -- docs/ai/tasks/TASK-0061-situation-map-v1.md`로 찾은 커밋의 부모 해시를 결과 보고 첫 줄에 적는다.
- 순서: 제작 계획(`docs/ai/design/production-plan-2026-10-14/PLAN.md`) 단계 1의 경로 10b-1. 사용자가 단계 1로 앞당겼고(2026-10-14), 세션 B 모형을 보고 ‘다듬어서 구현’을 골랐다.
- 근거 문서(먼저 읽는다): `docs/ai/design/situation-map-10b1/README.md`(세션 B 모형: 화면 4장, 레이어 표, 크기 추정, 판단거리 1~5, 접근성 메모), `mock/mock.js`, `mock/situation.css`.

## 목표

SuperPower 2처럼 지도 위에 무역·경제 정보 층을 겹쳐 보는 **상황실** 화면을 만든다. 1판은 **이미 있는 게임 상태와 정적 공공 자료만** 쓴다.
- 실행 중 외부 호출은 0이다.
- 엔진은 바꾸지 않는다.
- 첫 화면 크기도 사실상 바꾸지 않는다. 상황실은 지연 청크로만 붙인다.

## 사용자 결정과 허브 다듬기(세션 B 판단거리 반영)

| 세션 B 판단거리 | 이번 구현 |
|---|---|
| 1. 야간 불빛이 거점 이름을 묻음 | 야간 불빛은 **기본 끔**. 브리핑에서는 켜지 않는다. 켜면 지도 아래에 4단계 범례와 NASA 크레딧을 보인다. 바탕 지도는 켤 때만 55% 밝기로 낮춘다 |
| 2. 국가 카드가 지도를 가림 | 국가 카드는 **오른쪽 칸**(레이어 토글 아래)에 둔다. 지도에는 국가 이름 휘장만 둔다. 1024 폭에서 오른쪽 칸 세로 스크롤은 허용하되, 레이어 토글과 브리핑 카드는 스크롤 없이 보여야 한다 |
| 3. 항만 135곳이 어지러움, 영·한 섞임 | 항만은 **점만** 찍고 지도에 이름은 쓰지 않는다. 두 단계로 그린다: 게임 거점(`world.json`의 도시)에서 50 km 안이거나 게임 항로(`map_waypoints`) 선에서 50 km 안인 항만은 또렷하게, 나머지는 옅게(불투명도 0.35 안팎). 이름은 누르기·‘표로 보기’에서만 보인다 — `name_ko`가 있으면 그것, 없으면 영문 이름 뒤에 ‘(영문 표기)’ |
| 4. 브리핑 확대 배율 | 사건 위치와 도착 항만이 **함께 들어오는 최소 영역**에 여백 15%를 더한다. 최소 크기는 560×400 지도 단위, 지도 범위 밖으로 나가지 않게 자른다 |
| 5. 껍데기 위험 | 게임 상태와 이어진 층(내 화물·선박, 항로, 브리핑)을 기본으로 켠다. 결과 보고 ‘알파 관찰 항목’에 “지연 항만을 본 뒤 다음 계약의 도착 항을 바꾸는가”를 적는다 |

## 구현 지시

### 1. 자료 `data/situation_map.json`(새 파일)과 스키마·검사

- **구조**(키 이름은 바꿔도 되지만 의미는 지킨다):
  - `layers[]`: `id`(`cargo`·`routes`·`ports`·`nightlights`·`countries`), `title_ko`, `provider`, `license`, `license_tier`(`bundle_raw`·`derived_only`·`banned` 중 하나), `verification_status`(`pending`·`verified`), `retrieved_on`(YYYY-MM-DD 또는 null), `credit_ko`(화면에 보일 출처 문장), `source_url`.
    - `cargo`·`routes`는 `provider: '게임 자료(가상)'`, `license_tier: 'bundle_raw'`, `verification_status: 'verified'`.
  - `ports[]`: `id`, `name_en`, `name_ko`(null 가능), `lon`, `lat`, `scalerank`.
    - 세션 B의 `docs/ai/design/situation-map-10b1/data/ports-ea.json`(135곳, `[이름, 경도, 위도, 등급]`)을 그대로 옮긴다.
    - `name_ko`는 게임 도시(`world.json`의 `geo_position`)에서 25 km 안이면 그 도시의 한국어 이름을 넣고, 아니면 null로 둔다. 나머지 한국어 표기는 세션 C가 나중에 채운다.
  - `countries[]`: `KOR`·`CHN`·`VNM` 각각 `name_ko`와 `indicators[]`(`id`, `label_ko`, `value`(null 가능), `unit_ko`, `year`(null 가능), `source_layer`: `countries`).
    - 지표 4개는 세션 B 모형과 같다: 1인당 GDP, 수출/GDP, 컨테이너 물동량, 소비자물가.
    - **값은 모두 null**로 둔다. 세션 C가 라이선스·값을 확인한 뒤 자료만 고친다.
  - 출처 칸의 초기값:
    - `ports`: Natural Earth v5.1, 퍼블릭 도메인, `license_tier: 'bundle_raw'`, `verification_status: 'pending'`.
    - `nightlights`: NASA Earth Observatory Black Marble 2016, `derived_only`, `pending`.
    - `countries`: World Bank WDI, CC BY 4.0, `derived_only`, `pending`.
    - `retrieved_on`은 세션 B가 받은 날 2026-10-14로 둔다. WDI는 값을 받지 않았으므로 null이다.
- **`schemas/situation_map.schema.json`** 을 새로 만든다. 지금 검사기의 `shape()`가 아는 키워드만 쓴다.
- **`tools/validate_data.py` 검사**(문서 하나 단위):
  - 층 `id`가 다섯 개이고 겹치지 않는다. `license_tier`·`verification_status` 값은 정해진 목록 안이다.
  - `banned` 층은 화면에 쓰일 수 없다. 이번 자료에는 없어야 한다.
  - `verified`인 층은 `retrieved_on`이 날짜다.
  - 항만 좌표는 지도 범위(`world.json`의 1장 지도 경계 또는 지도 자산 경계 — 실제 쓰는 경계를 읽고 결과 보고에 적는다) 안이다. `id`는 겹치지 않는다.
  - 국가 지표 `value`가 null이 아니면 `year`가 정수이고, 그 층이 `verified`여야 한다. 값만 먼저 들어가는 것을 막는다.
  - `tools/test_validate_data.py`에 위 규칙마다 통과 1개·실패 1개 이상을 더한다.
- **이 파일은 첫 화면 자료 청크에 들어가면 안 된다.** `vite.config.ts` 79행의 `data` 묶음 규칙(`/[\\/]data[\\/][^\\/]+\.json$/`)이 모든 자료를 첫 화면 청크로 모은다. 이 규칙에서 `situation_map.json`만 빼고, 주석으로 이유를 적는다. 그래서 상황실 지연 청크와 함께 받게 한다.

### 2. 야간 불빛 그림

- 세션 B의 `docs/ai/design/situation-map-10b1/data/nightlights-ea.png`(17,166 B, 지도 논리 격자 546×615, 4단계)를 그대로 `public/assets/situation/nightlights-ea.png`에 복사한다.
- 다시 만들 필요가 있으면 같은 폴더의 `harness/nightlights.py`를 쓴다. 이번에는 원본 tif가 저장소에 없으므로 복사만 한다.
- 그림은 **상황실에서 야간 불빛을 처음 켤 때만** 받는다.
  - `index.html`, 첫 화면 CSS, 첫 화면 JS에 이 주소가 없어야 한다.
  - 미리 받기에도 넣지 않는다.

### 3. 화면 `src/ui/situation.ts`(새 파일, 지연 청크)

배치는 세션 B 모형(`mock/mock.js`, 화면 4장)을 따르고, 위 표의 다듬기를 적용한다.

**대화상자**
- 전체 화면 대화상자다(`role="dialog"`, `aria-modal="true"`). 기존 지도 칸(`map-detail`)의 Escape·초점 복귀 규칙을 따른다.
- 닫으면 ‘상황실’ 열기 단추로 초점이 돌아온다.

**머리 줄**
- 제목 ‘상황실 지도’.
- 프리셋 단추 묶음 ‘브리핑 / 자유 탐색’(`role="group"`, `aria-pressed`).
- ‘상황실 화면’ 켬·끔. 기본은 **켬**이다.
  - 스캔라인·비네트는 **지도 영역에만** 입힌다. 오른쪽 칸과 글자 위에는 입히지 않는다.
  - `prefers-reduced-motion`일 때는 비네트만 남긴다. CSS는 `mock/situation.css`를 바탕으로 한다.
- 오늘 날짜(‘N일 / 90 · 시간 정지’). 상황실이 열린 동안 하루 진행은 없다.
- ‘표로 보기’, ‘닫기’.

**지도**
- 지금 지도 렌더러를 다시 쓴다. 새 그리기 라이브러리는 금지다(PLAN.md ‘기술 기반 판정’).
- 바탕 지도와 ①·②층은 `src/ui/map.ts`의 `renderWorldMap`·`mapMarks` 등 지금 함수가 그린 것을 그대로 쓴다.
- ③ 항만, ④ 불빛, ⑤ 국가 휘장은 그 위에 얹는다. 좌표 변환은 `src/ui/projection.ts`의 `project`를 쓴다.
- 지금 함수가 필요한 값을 내보내지 않으면 **동작을 바꾸지 않는** 범위에서 export만 더한다.

**오른쪽 칸(위에서 아래로)**
1. 브리핑 카드(브리핑일 때만).
2. 레이어 토글 5개: 진짜 `<input type="checkbox">`와 `<label>`. 칸 높이는 44px 목표다.
   - 줄 끝에 개수를 둔다(‘운항 N척’, ‘항로 N개’, ‘항만 N곳’, ‘2016’, ‘3개국’).
   - 켜고 끌 때 살아 있는 영역에서 ‘야간 불빛 켬’처럼 한 번 낭독한다.
3. 국가 카드 3장: 값이 null이면 ‘—’로 두고 ‘값·기준일 확인 전’을 보인다.
4. 출처 등록부 표: 자료, 제공·라이선스, 기준일, 등급(`verified`면 ‘확인’, `pending`이면 ‘확인 전’).
   - 맨 아래에 ‘실시간 외부 호출 없음. 모든 층은 저장소 안 스냅숏’ 문장을 둔다.

**사건 브리핑**
- 엔진을 바꾸지 않고 **지금 상태에서 읽을 수 있는 사건만** 모은다.
  - 항만 공지: `state.notices`, 지금은 `PORT_RESTRICTION`.
  - 도착 예정이 처음보다 늦어진 운송.
  - 오늘 도착한 운송.
  - 규칙 2의 지급 경고: 지금 화면이 쓰는 읽기 함수.
- 어느 함수·칸에서 읽었는지 결과 보고에 표로 적는다.
- 사건마다 위치(항만·도시)를 정해 위 ‘최소 영역’으로 확대한다.
  - 카드는 `role="status"`로 낭독한다.
  - ‘이전 / 다음 사건 / 브리핑 끝내기’ 단추를 둔다.
  - 사건이 0개면 ‘오늘 확인할 사건이 없습니다’를 보이고 자유 탐색 화면을 그대로 둔다.
- `prefers-reduced-motion`이면 이동 애니메이션 없이 바로 바꾼다.

**표로 보기(필수)**
- 표 1: 운항 중 화물(계약, 항로, 출발, 도착 예정, 지연 이유).
- 표 2: 항만(이름, 나라, 게임 거점 여부, 또렷/옅게).
- 표 3: 국가 지표(값, 기준일, 출처).
- 야간 불빛은 표가 아니라 설명 문장과 출처로 대신한다.

**금지**
- 군사·감시 톤 요소: 조준선, 탐지 상자, 열화상·야간투시 색, 타임코드.
- 깜빡임과 움직이는 노이즈.

### 4. 진입점과 지연 불러오기(`src/ui/main.ts` 최소 변경)

- 지도 칸 머리에 ‘상황실’ 열기 단추 하나를 더한다. 모든 시나리오에서 보인다.
- `src/ui/lazy.ts`의 `lazyScreen`으로 `situation` 묶음을 만든다. 실패하면 R2와 같은 1회 재시도와 ‘저장하고 새로 고침’ 안내를 쓴다.
- 지금 `prefetchScreens`(main.ts 1612행 근처)에 상황실 **코드만** 더할지는 결과 보고에 판단을 적는다. 권고는 더하는 쪽이다. 그림·자료는 미리 받지 않는다.
- 상황실 대화상자가 열린 동안 하루 진행 단추와 단축키는 동작하지 않는다.

## 보호 시험과 기준값

- TASK-0033 규칙 1 sha256 세 개(`src/ui/code-split.test.ts` 194행 근처)는 **값을 바꾸지 않는다.**
  - 이번 변경으로 규칙 1 HTML에 생기는 차이는 ‘상황실’ 단추 조각 하나뿐이어야 한다.
  - 시험은 새 HTML에서 **그 조각 문자열 하나만 정확히 빼면** 기존 sha256 세 개와 같아짐을 확인하는 방식으로 고친다. TASK-0058의 규칙 2 비교 정규화와 같은 방식이다.
  - 조각 문자열은 시험 안에 상수로 두고, 결과 보고에 그대로 적는다.
- 그 밖의 보호 시험(TASK-0056 저장 거부, TASK-0057 실패 화면 초점, TASK-0059 첫 렌더·재시도·새로 고침 확인)의 단언은 바꾸지 않는다.
- 구현 결함으로 보호 시험이 실패하면 구현을 고친다. 단언을 바꿔야만 통과할 때만 멈추고 보고한다(TASK-0059-R1 규칙).

## 시험

- **`src/ui/situation.test.ts`(새 파일)**
  1. 레이어 토글: 기본 상태는 cargo·routes·ports·countries 켬, nightlights 끔. 켜고 끔이 SVG 층과 낭독 문장을 바꾼다.
  2. 항만 두 단계: 또렷한 항만 집합이 거점·항로 50 km 규칙과 같다. 경계값 시험을 하나 이상 둔다.
  3. 브리핑 확대 영역: 사건 위치와 도착 항만을 포함하고, 여백 15%, 최소 560×400, 지도 경계 안이다. 지도 가장자리 사건을 하나 이상 넣는다.
  4. 사건 모음: M1 항만 지연 사례 8일에 지연 사건 1개 이상, 사건 0개인 날에 안내 문장.
  5. 표로 보기 표 3개의 행 수가 자료·상태와 같다.
  6. reduced-motion이면 이동 애니메이션 클래스가 붙지 않고 스캔라인이 없다.
  7. 대화상자 Escape 닫기, 초점 복귀, 열린 동안 하루 진행 막힘.
  8. 야간 불빛을 켜기 전에는 그림 주소를 요청하지 않는다. 가짜 이미지 로더나 DOM에 그림 요소가 없는지로 확인한다.
- **`src/ui/code-split.test.ts`에 더할 것**
  - 첫 렌더가 상황실 모듈을 불러오지 않는다.
  - 규칙 1 sha256 조각 정규화.
- **빌드 시험**(TASK-0059와 같은 방식)
  - `check_bundle_size`에서 상황실 청크가 ‘나중에 받음’이다.
  - `situation_map.json`이 `data` 청크에 없다.
  - 첫 화면 JS·CSS에 그림 주소가 없다.

## 고칠 수 있는 파일

- 새 파일:
  - `src/ui/situation.ts`
  - `src/ui/situation.css` 또는 `situation.ts`가 불러오는 CSS. 상황실 청크에만 들어가야 한다.
  - `src/ui/situation.test.ts`
  - `data/situation_map.json`
  - `schemas/situation_map.schema.json`
  - `public/assets/situation/nightlights-ea.png`
- 고칠 파일:
  - `src/ui/main.ts`: 진입 단추, 지연 묶음, 열린 동안 진행 막기만.
  - `src/ui/map.ts`·`src/ui/projection.ts`: export 추가만. 동작은 바꾸지 않는다.
  - `src/ui/code-split.test.ts`: 위 두 시험과 조각 정규화만.
  - `src/ui/style.css`: 진입 단추 모양만. 상황실 모양은 상황실 CSS에 둔다.
  - `vite.config.ts`: `data` 묶음 규칙의 예외만.
  - `tools/validate_data.py`, `tools/test_validate_data.py`: situation_map 검사만.
- 문서와 생성 파일: `docs/ai/tasks/results/TASK-0061.md`, `MANIFEST.json`(생성만).

## 손대지 않을 파일

- `src/engine/**`, `src/content/**`. 상황실에 필요한 자료는 화면 쪽에서 읽는다. 엔진 읽기 함수가 부족하면 멈추지 말고 화면에서 상태를 읽는 방식으로 하되, 결과 보고에 적는다.
- 그 밖의 `data/**`, `tests/**`, 다른 `schemas/**`.
- `docs/ai/design/situation-map-10b1/**`: 근거 문서는 고치지 않는다.

## 지켜야 할 것

- 결정성: 엔진과 400회 `run` 출력이 기준과 바이트로 같다.
- 실행 중 외부 호출 0.
- 실명 기업·선박 이름 0. 자료의 영문 항만 이름은 지명이라 괜찮다.
- 통화와 단위 표시는 지금 규칙을 따른다.
- 첫 화면 gzip 증가는 **300 B 이하**다(진입 단추·지연 묶음 연결). TASK-0059-R2와 같은 상한이다.

## 완료 조건

1. 지시 1~4 반영.
2. 다음이 모두 통과한다. 400회 `cmp`는 동일해야 한다.
   - `npx vitest run` 실패 0
   - `npm run typecheck`
   - `python3 tools/validate_data.py`
   - `python3 tools/test_validate_data.py`
   - `bash tools/ai/review_checks.sh --check BASE` 실패 0
3. 크기 표: 빌드 표시를 맞춘 BASE 사본과 현재 사본으로 잰다. 다음을 적는다.
   - 첫 화면 JS·CSS 원본과 gzip, 증가량(≤300 B)
   - 상황실 청크 원본과 gzip
   - 그림 바이트
   - `data` 청크 바이트(변화 0이어야 함)
4. 변형 시험: 사본·편집기·되돌림·`cmp` 순서로 한다.

| 번호 | 변형 | 실패해야 하는 시험 |
|---|---|---|
| 1 | 야간 불빛 기본 켬 | 레이어 기본 상태 시험 |
| 2 | 항만 또렷 기준 50 km → 500 km | 항만 두 단계 경계 시험 |
| 3 | 브리핑 영역에서 도착 항만을 뺌 | 확대 영역 시험 |
| 4 | `vite.config.ts` 예외를 지움 | 빌드 시험(data 청크에 situation_map) |
| 5 | 그림을 상황실 첫 열기 때 바로 받음 | 그림 미요청 시험 |
| 6 | 상황실 열린 동안 하루 진행 허용 | 대화상자 시험 |
| 7 | 규칙 1 조각 정규화에서 조각 문자열을 한 글자 바꿈 | sha256 시험 |

5. 결과 보고 `docs/ai/tasks/results/TASK-0061.md`(공통 머리말 형식). 다음을 적는다.
   - 바꾼 파일·줄
   - 설계 판단(특히 사건 모음의 읽기 출처 표, 지도 경계 출처, 미리 받기 판단)
   - 크기 표, 변형 표, 실행한 검증
   - 보호 시험 이름과 통과 출력
   - 세션 B 실측 요청: 1024×768 터치, 1366×768, 400% 확대, 화면 낭독, reduced-motion
   - 알파 관찰 항목
   - 범위 밖 발견, 질문
