# TASK-0061-R1 상황실 지도 1판 재작업: 보호 시험 두 곳 조각 정규화, 확인된 자료 채우기, 완료 조건 끝까지

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행: TASK-0061 1차 실행. 결과는 허브 스냅숏 `b481fc2`이고, 결과 보고는 `docs/ai/tasks/results/TASK-0061.md`다.
- 기준 비교: 원 지시서와 같은 `5792b5f`. `review_checks.sh`, 크기, 400회 `cmp`를 모두 이 기준과 비교한다.
- 이번 작업은 `b481fc2` 구현을 이어서 고친다. 처음부터 다시 쓰지 않는다.
  - 원 지시서 `docs/ai/tasks/TASK-0061-situation-map-v1.md`의 구현 지시·원칙·파일 범위·지켜야 할 것·완료 조건은 이 문서가 바꾼 곳 말고 모두 그대로다.
  - 먼저 원 지시서와 1차 결과 보고를 읽는다.

## 허브 검수 판단

1차 중단은 지시서 규칙대로 옳았다. 원 지시서가 ‘상황실’ 단추를 모든 시나리오에 넣으라고 하면서, 전체 HTML을 비교하는 다른 보호 시험 두 파일을 허용 목록에 넣지 않은 것은 **허브 지시서의 빈틈**이다. 두 파일도 같은 방식으로 정규화하도록 허용한다.

이 재작업에 세션 C가 원문으로 확인한 지도 자료를 함께 채운다.
- 근거: `docs/ai/design/research/ROUTE-4A-10B1-SOURCES.md` 3·8절, `docs/ai/design/research/situation-map-ports-ko.json`.
- 허브 결정(2026-10-14): 국가 지표는 8절의 4지표로 바꾼다.

## 구현 지시

### 1. 보호 시험 두 곳의 조각 정규화

- 대상:
  - `src/ui/m2a5-trade-ui.test.ts`의 “1일·첫 수락 뒤·결산을 기준 커밋 전체 문자열과 비교한다”(59행 근처)
  - `src/ui/m2a5-ops-ui.test.ts`의 “규칙 2 첫 화면은 이번 표·창고 행·지급 기준 설명을 빼면 정리 전 전체 문자열과 같다”(221행 근처)
- 두 시험이 비교하기 전에, 새 HTML에서 **진입 단추 조각 문자열 하나만 정확히** 뺀다. 지금 `code-split.test.ts`의 `SITUATION_BUTTON`과 같은 조각이다.
- **기대 문자열·sha256 값은 하나도 바꾸지 않는다.**
- 조각 상수는 한 곳에만 둔다. `src/ui/main-testkit.ts`에서 export하고, 세 시험 파일이 그것을 가져다 쓴다. 상수를 시험 파일마다 따로 적지 않는다.
- 단추에 `aria-haspopup="dialog"`를 더한다. 상황실은 대화상자를 연다. 조각 상수도 그에 맞게 바뀐다. 결과 보고에 최종 조각을 그대로 적는다.

### 2. 확인된 자료 채우기 (`data/situation_map.json`)

**국가 지표**
- `countries[].indicators`를 아래 4지표로 **바꾼다**. 값은 8절 JSON의 원값을 그대로 넣는다(반올림하지 않음). 화면 표시만 반올림한다.

| id | label_ko(화면) | unit_ko | 연도 |
|---|---|---|---|
| `NE.TRD.GNFS.ZS` | 무역(GDP 대비) | % | 2025 |
| `TX.VAL.MRCH.CD.WT` | 상품 수출액 | 달러 | 2025 |
| `NY.GDP.PCAP.CD` | 1인당 GDP | 달러 | 2025 |
| `LP.LPI.OVRL.XQ` | 물류성과지수(1~5) | 점 | 2022 |

- 화면 표시 규칙
  - 상품 수출액은 ‘억 달러’로 바꿔 정수로 보인다. 예: 709,330,000,000 → 7,093억 달러.
  - 1인당 GDP는 천 단위 쉼표의 정수 달러로 보인다.
  - 무역 비율은 정수 %로 보인다.
  - 물류성과지수는 소수 한 자리로 보인다.
  - 연도는 지표마다 따로 보인다. 물류성과지수는 2022년이므로 ‘2022년’이 꼭 보여야 한다.

**`countries` 층**
- `verification_status: 'verified'`, `retrieved_on: '2026-10-14'`.
- `license_tier`: 3절 등록부대로 `bundle_raw`(CC BY 4.0, 변경 표시).
- `credit_ko`: “World Bank 세계개발지표(CC BY 4.0). 상품 수출액 원자료 WTO, 물류성과지수는 World Bank 물류성과지수 조사. 표시 단위로 반올림함.”
- 지표마다 `source_updated: '2026-10-08'`을 둘 수 있게 스키마를 늘려도 된다.

**`ports` 층**
- `verification_status: 'verified'`.
- `provider`: ‘Natural Earth(ne_10m_ports)’. 판 번호는 세션 B가 받은 내려받기 판과 세션 C가 본 자료 판이 다를 수 있으므로 적지 않는다.
- `credit_ko`: “Natural Earth 자료로 만듦(퍼블릭 도메인). 항만 위치는 최대 약 30 km 오차가 있을 수 있음.” 원문은 20마일 오차다.

**`nightlights` 층**
- `pending`을 그대로 둔다.
- 이유: 세션 C가 확인한 것은 NASA SVS 30876 배포본의 이용 조건이다. 그런데 세션 B가 쓴 원본은 NASA Earth Observatory의 0.1° GeoTIFF다. 두 배포본의 조건이 같다는 확인이 아직 없다.
- `credit_ko`: “NASA Earth Observatory, Black Marble 2016(Suomi NPP VIIRS). 확인 전.”

**항만 한국어 이름**
- `situation-map-ports-ko.json`의 `i` 순서대로 `name_ko`를 채운다. 빈칸은 null로 둔다.
- 게임 도시와 겹치는 곳(`basis: G`)과 1차에서 25 km 규칙으로 넣은 이름이 다르면 **게임 도시 이름이 이긴다.** 결과 보고에 차이 목록을 적는다.

**항만 정리(세션 C 지적)**
- Nakhodka 두 줄(26·27, 좌표 같음)은 하나만 남긴다.
- Kokura(13)는 Kitakyushu(124)와 약 2 km라 지운다.
- 이름이 같고 좌표가 다른 쌍(Sorong, Bangkok, Guangzhou, Surabaya)은 서로 다른 시설일 수 있으므로 둘 다 남긴다.
- `id`는 지금처럼 유일하게 유지한다. 지운 줄 목록과 남은 항만 수를 결과 보고에 적는다.
- 영문 이름(`name_en`)은 원자료 그대로 둔다(예: Hankow). 한국어 표기만 세션 C 안을 쓴다.

**검사기**
- 국가 지표가 `verified` 층인데 `value`가 null이면 실패하는 검사를 더한다. 이제 값이 있어야 한다.
- 시험에 통과 1개·실패 1개를 더한다.

### 3. 원 지시서 완료 조건을 끝까지

- 위 수정 뒤 원 지시서의 시험, 빌드 시험, 완료 조건 1~5, 변형 7개를 모두 실행한다. 변형을 하나 더한다.
  - 변형 8: `m2a5-trade-ui.test.ts`에서 조각 정규화를 지운다. 그 보호 시험이 실패해야 한다.
- 크기 표: 첫 화면 gzip 증가 ≤300 B를 다시 잰다.
  - 이번 단추 속성 추가와 자료 증가는 상황실 청크와 자료 쪽이어야 한다. 첫 화면 쪽은 단추 조각만 늘어야 한다.
  - `data` 청크 변화는 0이어야 한다.
- 화면 실측: 1차 보고대로 이 환경에서 Chromium·Vite가 막히면 그렇다고 적는다. 세션 B가 허브 환경에서 잰다.

## 고칠 수 있는 파일

- 원 지시서 목록
- 추가: `src/ui/m2a5-trade-ui.test.ts`, `src/ui/m2a5-ops-ui.test.ts`(조각 정규화만), `src/ui/main-testkit.ts`(조각 상수 export만)

결과 보고는 `docs/ai/tasks/results/TASK-0061.md`에 ‘R1’ 절을 더해 쓴다. 1차 내용은 지우지 않는다.

## 결과 보고에 더할 것

- R1 바꾼 곳(파일·줄)과 이유
- 최종 단추 조각 문자열
- 항만 정리
  - 게임 이름과 25 km 규칙 이름의 차이 목록
  - 지운 항만 목록과 남은 수
- 원 지시서 결과 보고 절 전체를 R1 기준으로 다시 채운 것: 크기 표, 변형 표 8개, 실행한 검증, 보호 시험 이름과 통과 출력, 세션 B 실측 요청, 알파 관찰 항목, 범위 밖 발견, 질문
