# TASK-0015 평택 본사 전환: 자료·노선·검사기·저장 판본·시험

- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행 작업: TASK-0012(문화 화면) 반영 `102a23f`.
- 결정 근거:
  - `docs/DECISIONS.md` ‘평택 본사 전환 (2026-10-09 사용자 결정)’: 본사 평택, 부산은 1장 환적 거점으로 남김, 실제 평택 노선으로 재설계, TASK-0012 뒤 시작, 사람 사용성 시험은 부산 3판.
  - 같은 날 사용자가 Claude의 승인 묶음(노선 근거표·M1/M2 재설계안·평택판 문장)을 승인했다. 이 지시서의 값과 문장은 그 묶음의 권장안이다.

## 목표

한국 본사를 부산(`BUSAN`)에서 평택(`PYEONGTAEK`)으로 옮긴다. 부산은 지도에 1장 환적 거점으로 남는다. M1·M2의 노선을 실제 평택발 정기선 기준으로 바꾼다.

**핵심 사실:** 실제 선사 요일표로 센 일수가 지금 개발값과 같다. 평택→하이퐁은 5일(장금상선 IHP, 일요일 출항 → 금요일 접안, 중간 기항 없음), 평택→상하이는 4일(장금상선 PSS, 수요일 출항 → 일요일 접안, 인천 기항)이다. 그래서 **금액·날짜 기대값과 인수 명세 숫자는 바뀌지 않아야 한다.** 바뀌는 것은 도시 ID, 사건 ID, 이름 문구, 근거 표기, 지도 꺾은선, 검사기 고정값, 저장 판본이다.

경제 값(가격·운임·선복·임금·활동비·관세율)은 모두 DESIGN 합성값 그대로다. 실제로 맞추는 것은 지리·노선·운송일수·현실 설명뿐이다.

## 먼저 읽을 파일

- `docs/DECISIONS.md` ‘평택 본사 전환’, ‘M2a-4 도시 방문·문화 활동’, ‘TASK-0012 검수 결과’.
- 자료: `data/game_config.json`, `data/world.json`(거점 20곳·해협 6곳, `hub_selection_rule_ko`), `data/routes.json`, `data/market_offers.json`, `data/scenarios.json`, `data/venues.json`, `data/culture_activities.json`, `data/contacts.json`, `data/characters.json`, `data/employees.json`, `data/sources.json`, `data/curriculum_links.json`과 각 스키마(`schemas/`).
- `tools/validate_data.py`(특히 `CITY_HOME` 211행 부근, 거점 수 20·1장 거점 6 검사 435~440행 부근, M1 검산 581~639행, 영입 장소와 만남 도시 일치 405행 부근, 일반화 금지어 207행 부근), `tools/test_validate_data.py`.
- `src/content/scenario.ts`(도시 이름·사건 공지 문장 307행 부근, `dataVersion`), `src/engine/catalog.ts`(`cityName`), `src/engine/save*.ts`(판본 검사·이관), `src/engine/fixtures/save-v4-m2.json`.
- 시험: `src/engine/*.test.ts`, `src/ui/*.test.ts` 가운데 `BUSAN`·`부산`·`YOKOHAMA`·`요코하마`·`태양광`이 들어간 곳(`grep -rn`으로 찾는다).
- `tests/acceptance_cases.json`(P0-CITY-01~04의 `CITY_HOME`, P0-M2A-02·03의 ‘태양광’).
- 화면 고정 문구: `src/ui/recruitment.ts` 121행 부근 ‘부산 동료 영입’, `src/ui/main.ts`의 `PARTY_KO`(‘요코하마 의류 고객’, ‘태양광 모듈 화주’), `src/ui/map.ts` 278행 부근 이름표 배치.

## 범위

**포함**
1. 거점·본사(`world.json`, `game_config.json`)
2. 노선(`routes.json`)과 근거 블록
3. 견적·시나리오(`market_offers.json`, `scenarios.json`)
4. 장소·문화 활동·연락처·동료 이야기 문장(`venues.json`, `culture_activities.json`, `contacts.json`, `characters.json`, `employees.json`)
5. 출처(`sources.json`), 교과 연결(`curriculum_links.json`의 CA02 연결만)
6. 검사기(`tools/validate_data.py`, 회귀 시험 `tools/test_validate_data.py`)
7. 저장 판본과 시험 자료
8. 엔진·화면 시험 문자열, 인수 명세 문자열
9. 화면 고정 문구 3곳(아래 9절)

**제외**
- 엔진 규칙·장부·경제 값 변경. 환적(두 구간 예약)은 넣지 않는다.
- 반복 견적·지역 시세(M2a-5에서 한다).
- 지도 원본 재생성. 세계지도 위도 범위 변경.
- `docs/DESIGN_v0.4.md`(해시 대상, 수정 금지), `docs/STATUS.md`, `docs/DECISIONS.md`(Claude만 고친다), `docs/USABILITY_TEST_M2A.md`(사람 시험은 부산 3판으로 한다).
- 화면 배치·스타일 변경.

## 구현 지시

### 1. 거점·본사
- `world.json`에 `PYEONGTAEK` 거점을 새로 넣는다.
  - 좌표 약 37.0N, 126.8E(`precision_deg` 0.1, 공식 좌표와 대조하지 않았음을 `note_ko`에 적는다).
  - 단계: 1장, `PLAYABLE`(M1).
  - 역할: 본사. 스키마의 역할 열거값에 본사용 값(예 `HOME_BASE`)이 없으면 더하고, 검사기가 이 역할이면 ‘세계 중심 거점 지표 인용’ 규칙에서 면제하게 한다(하이퐁·자카르타의 `PRODUCTION_ORIGIN` 면제와 같은 방식).
  - `hub_note_ko`: “본사. 세계 중심 거점 선정 기준(물동량·금융·해운 서비스 상위)에는 들지 않으며, 교육·지역 기준으로 골랐다. 2025년 컨테이너 처리량은 전국 4위(약 95.6만 TEU), 총물동량은 전국 5위(운임톤)다. 컨테이너 상대국 비중은 중국이 82.3%다. 서울(GFCI 39 8위)은 내륙이라 지도 거점이 아니며, 환전과 지급 일정은 본사의 금융센터(가상)에서 본다.”
- `BUSAN`은 지우지 않는다. 본사 설명만 바꾼다.
  - `hub_note_ko`: “1장 환적 거점. 2025년 부산항 컨테이너 처리량의 약 57%가 환적 화물이다.” 부산의 기존 순위·환적 역할·근거는 부산 항목에 그대로 둔다. ‘금융센터 진입점이 국내 금융 업무를 맡는다’ 문장은 뺀다.
  - 단계는 1장 그대로다. 그래서 거점은 21곳, 1장 거점은 7곳이 된다.
- `HAIPHONG`은 M1 `PLAYABLE`로 올린다(M1·M2 노선의 도착항). `YOKOHAMA`는 M3 `PLANNED`로 내리고 `note_ko`에 ‘평택발 정기선이 없어 부산 환적으로 연다(M3)’를 적는다.
- `unique_content_status`에 남은 ‘BUSAN pilot only…’ 문자열을 평택 기준으로 고친다.
- `game_config.json`의 `home_city_id`를 `PYEONGTAEK`으로 바꾼다.

### 2. 노선
- `ROUTE01`: `PYEONGTAEK` → `HAIPHONG`, `transit_days` 5. 운임·선복·출항(2일 첫 출항, 7일 간격)은 그대로.
- `ROUTE02`: `PYEONGTAEK` → `SHANGHAI`, `transit_days` 4. 나머지 그대로.
- `ROUTE03~06`은 그대로 둔다. `ROUTE06`(부산→싱가포르)도 그대로다.
- 두 노선에 근거 블록 `schedule_basis`를 넣는다(스키마에 속성을 더한다).
  - 항목: `carrier_service_ko`(‘장금상선 IHP’처럼 선사를 함께), `departure_weekday`, `arrival_weekday`, `port_calls`(중간 기항), `day_count_rule_ko`(‘도착일 − 출항일, 달력 날짜 차이’), `source_refs`, `checked_on`(2026-10-09), `status`, `tolerance_days`(1), `note_ko`(‘요일표는 계획값이며 항차 날짜가 없다. 게임은 요일 없이 2일 첫 출항·7일 간격으로 단순화한다’).
  - ROUTE01: 장금상선 IHP, 일요일 출항, 금요일 접안, 중간 기항 없음, 5일.
  - ROUTE02: 장금상선 PSS, 수요일 출항, 일요일 접안, 인천 기항(같은 배), 4일. 같은 수요일에 떠나는 장금·흥아 BTS도 4일이다.
- 화면·엔진의 `carrier_id`는 가상 선사(`CARRIER_DEMO`) 그대로 둔다. 실제 선사 이름은 근거 블록과 `sources.json`에만 둔다.
- `numeric_values_status`(routes·scenarios 문서 머리)를 고친다: “ROUTE01·02 운송일수는 실제 선사 요일표에서 센 값이다. ROUTE03~06 운송일수와 모든 운임·선복은 합성 값이다.”
- 지도 꺾은선(`map_waypoints`, 표시 전용, DESIGN):
  - ROUTE01: (37.0,126.8)→(37.0,126.3)→(36.6,125.8)→(35.6,125.4)→(34.0,124.8)→(31.8,124.0)→(29.5,123.0)→(27.0,121.2)→(25.2,120.0)→(23.6,118.3)→(22.4,116.0)→(21.2,113.5)→(19.6,111.6)→(17.7,110.2)→(17.8,108.6)→(19.2,107.6)→(20.4,107.1)→(20.9,106.7)
  - ROUTE02: (37.0,126.8)→(37.0,126.3)→(36.6,125.8)→(35.6,125.4)→(34.2,124.8)→(32.8,123.8)→(31.7,122.8)→(31.35,122.2)→(31.25,121.75)→(31.2,121.5)
  - 지도 시험(`scripts/test_build_map.py`, `src/ui/projection.test.ts` 등)이 꺾은선이나 거점에 조건을 두면 맞춘다. 바다 칸 밖으로 나가는 곳은 끝 구간(항구 접근부)만 허용한다.

### 3. 견적·시나리오
- `market_offers.json`: `OFFER_BUY_01`·`OFFER_BUY_02`·`OFFER_FWD_01`·`OFFER_FWD_02`의 출발 도시를 `PYEONGTAEK`으로, `OFFER_SELL_01`과 `OFFER_FWD_01`·`OFFER_FWD_02`의 목적지를 `HAIPHONG`으로 바꾼다. 날짜·금액은 그대로.
- `OFFER_FWD_02`의 화물을 태양광 모듈 100개에서 **자동차 부품 200상자**로 바꾼다. 부피 8m³, 무게 2,400kg(합계 4,800kg, 한도 5,000kg 안). 서비스 대금·운임·납기·결제는 그대로. 화주 ID(`SHIPPER_DEMO_SOLAR` → 예 `SHIPPER_DEMO_AUTOPARTS`), 신고가액, `note`를 함께 고친다. 상품 정의가 `goods.json`에 없으면 기존 상품 형식대로 더한다(단위 ‘상자’).
- `OFFER_FWD_01` 가구 120점의 설명은 ‘현지 사무실·숙소를 여는 회사의 가구’로 적는다(DESIGN 설정).
- `scenarios.json`
  - 모든 `city_ids`를 고친다: M1 `[PYEONGTAEK, HAIPHONG]`(취소·지연 변형 포함), M2 `[PYEONGTAEK, HAIPHONG, SHANGHAI]`, 문화·직원 시나리오의 `[BUSAN]`은 `[PYEONGTAEK]`.
  - 지연 변형의 항만 제한: `EVI_M1_EV02_YOKOHAMA` → `EVI_M1_EV02_HAIPHONG`, 도시 `HAIPHONG`, 공지 5일·하역 중단 7~8일 그대로. 기후변화를 원인으로 단정하지 않는 규칙도 그대로.
  - `tax_rule.status` 두 곳: `DESIGN_not_actual_Japan_tariff` → `DESIGN_not_actual_destination_tariff`.
  - 영입 조사 장소(`recruitment.scout_sites`)의 도시를 `PYEONGTAEK`으로.
  - ‘부산 현지’ 같은 범위 메모 문자열을 평택으로.
  - `REJECT_FORWARDING_SAME_SAILING`의 메모와 경로 제목에서 ‘태양광’·‘4,400kg’을 새 화물과 무게로 고친다.

### 4. 장소·문화 활동·연락처·동료
- `venues.json`: ID·기능·제목은 그대로, 도시만 `PYEONGTAEK`. 장소 설명에 실제 지명·부두 이름·운영시간·입주 기업 이름을 넣지 않는다.
- `culture_activities.json`(CA01~03의 도시를 `PYEONGTAEK`으로, CA04~06도 본사 활동이면 함께). 지식 주제 ID `KT_BUSAN_*`는 `KT_PYEONGTAEK_*`으로 바꾼다. 콘텐츠 훅 ID(`DIALOGUE_*`, `TASK_*`)·비용·기간·효과 키는 그대로.
  - CA01 ‘말하지 않는 것’: “평택의 다른 상인이나 손님도 작은 포장을 원한다는 뜻이 아닙니다.” 나머지 줄은 글자 그대로.
  - CA02(바뀜):
    - 제목: ‘항만 전시관과 기록 산책’. 지식 주제: ‘항만 순위를 읽을 때 확인할 질문’.
    - 관찰 1: “가상 전시의 서로 다른 순위 설명을 비교하고 단위·연도·출처를 확인합니다.” 관찰 2: “순위는 확인한 2025년 통계만 쓰고, 실제 지역사는 서술하지 않습니다.”
    - 알게 된 점: 하람: “이 안내판은 ‘전국 4위’, 저 안내판은 ‘전국 5위’예요. 하나는 컨테이너를 20피트 상자 기준(TEU)으로, 하나는 모든 화물을 톤으로 셌대요. 무엇을 무슨 단위로 셌는지 보기 전에는 한쪽이 틀렸다고 할 수 없어요.”
    - 범위: “가상 전시 1곳의 안내판 2개를 안내자 1명(하람)과 읽었습니다. 둘 다 2025년 한 해의 순위입니다. 원래 통계표는 아직 직접 보지 않았습니다.”
    - 말하지 않는 것: “어느 순위가 더 중요한지, 다른 해에도 순위가 같은지, 그리고 평택항의 실제 역사(전시는 가상이고, 순위만 2025년 통계를 따릅니다).”
    - 아직 모르는 것: “전시의 ‘톤’이 무게만 센 것인지, 그리고 1위 항만과는 얼마나 차이 나는지.”
    - 교과 연결은 SOC04·SOC07·SCI01로 바꾼다(‘현행판 대조 미확인’ 표시는 그대로).
  - CA03 ‘말하지 않는 것’: “평택의 다른 상인도 같은 말을 같은 뜻으로 쓴다는 뜻이 아닙니다.” 나머지 줄은 글자 그대로.
- `contacts.json`: 이름·역할·외형은 그대로.
  - 윤서 `information_scope_ko`: “이 가상 판매점의 요구만 나타내며 평택이나 한국 전체의 소비 성향을 뜻하지 않습니다.”
  - 하람 `information_scope_ko`: “가상 활동의 진행 인물이며 실제 역사·산업·문화나 항만 통계에 대한 권위 있는 출처가 아닙니다.”
- `characters.json`의 `recruitment.story_clue`(바뀌는 6명):
  - EMP14 저어리: “서해안 갯벌 보전 모임의 물새 조사를 돕는 의뢰에서 만난다. 조사 장비 운송 일정을 지켜 주면 합류한다.” 보전 기록 출처에 환경부·국립생물자원관 2017-05-18 보도자료를 더한다.
  - EMP39 한새: “평택 문화 탐방에서 충남 예산 황새 복원 마을의 친환경 농산물 운송을 도우면 합류한다.” 출처를 황새생태연구원 연혁으로 바꾼다.
  - EMP38 방긋: “평택 항만 물류단지에서 서해 안강망 어선에 보낼 상괭이 탈출장치(그물에 다는 혼획 저감 장치) 운송을 도우면 합류한다.”
  - EMP49 단정이: “평택 문화 탐방에서 경기 북부 두루미 월동지 보전 모임의 겨울 먹이 운송을 도우면 합류한다.” 출처를 서울신문 2022-03-15(연천군 인용)로 바꾼다.
  - EMP37 달곰: “평택 문화 탐방에서 지리산 반달가슴곰 복원을 알리는 순회 홍보 행사를 돕는 의뢰를 마치면 합류한다.”
  - EMP13 범솔: “평택 무역회관의 신규 거래처 설명회에서 처음 만난다. 첫 거래처 소개 의뢰를 함께 마치면 합류를 제안한다.”
  - 위 6명과 EMP01~06·EMP10의 만남 도시(`encounter.city_id`)를 `PYEONGTAEK`으로 바꾼다. 문장에 ‘부산’이 없는 동료는 도시 ID만 바꾼다.
  - 피할 지명: 화성 매향리 일대, 주한미군 기지와 그 주변, 매립지 관할 분쟁 지역.
- `employees.json`과 시나리오의 직원 시작 위치를 `PYEONGTAEK`으로.

### 5. 출처
`sources.json`에 다음을 더한다(`checked_on` 2026-10-09, 형식은 기존 항목과 같게, `redistribution`은 `links_and_project_notes_only`).
- `SINOKOR-ROT-2026`: 장금상선 회전표(PSS·BTS·IHP·HPS2). URL `https://www.sinokor.co.kr/MapRoute/GetRotation?nacd=KR&svc=PSS`(같은 형식으로 서비스 코드만 바뀜). 기준일 표기 없음, 열람일 기준.
- `GPPC-STATS-2026-06`: 경기평택항만공사 월간통계 2026년 6월판(2025년 총물동량 114,986,269 R/T, 컨테이너 956,117 TEU, 자동차 1,616,086대; 컨테이너 상대국 중국 82.3%는 2025년 12월판). URL `https://www.gppc.or.kr/web/file/port_info/statistical_data/262/20260806153245_5F7Nr9.pdf`.
- `GPPC-ROUTE-2026-01`: 공사 컨테이너 항로 17개 표. URL `https://www.gppc.or.kr/ko/port-info/route`.
- `MOF-PORT-2025`: 해양수산부 보도자료 ‘2025년 전국 항만 물동량’(2026-01-29). URL `https://www.korea.kr/briefing/pressReleaseView.do?newsId=156741955`. 컨테이너 4위·총톤수 5위의 근거.
- `ME-NIBR-2017-SPOONBILL`(환경부·국립생물자원관 2017-05-18 저어새), `YESAN-STORK-HISTORY`(황새생태연구원 연혁), `SEOUL-2022-03-15-CRANE`(서울신문). URL은 원래 근거 문서에 있는 것을 쓰고, 찾지 못하면 `url: null`과 `verification_status`를 낮춘다.
- `verification_status`는 열어 본 것만 `CONTENT_READ`로 둔다. 상괭이 통계는 넣지 않는다(원문 404).

### 6. 검사기
- `CITY_HOME`을 고정 문자열 대신 `game_config.json`의 `home_city_id`에서 읽게 하고, 그 ID가 `world.json`에 있는지 검사한다.
- 거점 수 20 → 21, 1장 거점 6 → 7. 본사 역할의 지표 인용 면제.
- 일반화 금지어에 ‘평택 사람’, ‘평택 시민’을 더한다. 부산 금지어는 그대로 둔다(부산은 지도에 남는다).
- 새 검사:
  - `schedule_basis`가 있는 노선은 `transit_days`가 출항·접안 요일 차이(7로 나눈 나머지)와 맞는지.
  - 근거 블록의 `source_refs`가 `sources.json`에 있는지.
  - 본사 거점(`home_city_id`)의 `hub_note_ko`에 다른 거점의 순위 문구가 섞이지 않았는지: ‘7위’, ‘환적 화물’, ‘TRANSSHIPMENT’ 같은 부산 고유 문자열이 본사 항목에 없어야 한다.
- `tools/test_validate_data.py`에 위 검사의 실패 사례를 하나씩 더한다(기존 형식대로).

### 7. 저장 판본
- 자료 판본(`PACKAGE_STATUS.json`의 `package_version`, 저장의 `dataVersion`)을 `0.5.0`으로 올린다.
- 옛 판본(`0.4.x`) 저장은 불러오기를 거절하고, 이유를 한국어로 보인다(예: “이전 판(부산 본사)의 저장입니다. 이번 판에서는 열 수 없습니다.”). 이관 코드는 만들지 않는다(시제품 단계, Claude 기본값).
- `src/engine/fixtures/save-v4-m2.json`처럼 옛 판본 시험 자료를 쓰는 시험은 ‘옛 판본 거절’을 확인하도록 바꾸고, 새 판본 왕복 시험 자료가 필요하면 새로 만든다. 저장 형식 번호(`SAVE_FORMAT_VERSION`)는 구조가 바뀌지 않으면 그대로 둔다.
- `m2a-culture.test.ts`의 ‘0.4.1’ 단언, MANIFEST, README·START_HERE의 판본 표기를 함께 고친다(문서는 판본 숫자만).

### 8. 시험·인수 명세
- 엔진·화면 시험의 문자열을 고친다: `BUSAN`→`PYEONGTAEK`, `YOKOHAMA`→`HAIPHONG`(M1·M2 노선 관련만), ‘부산’→‘평택’, ‘요코하마항’→‘하이퐁항’, ‘태양광’→‘자동차 부품’, `EVI_M1_EV02_YOKOHAMA`→`EVI_M1_EV02_HAIPHONG`.
- ‘다른 도시’ 시험은 시나리오 안에 있는 도시를 쓴다(시나리오 밖 도시는 `cityName`이 ID를 돌려준다).
- `tests/acceptance_cases.json`: P0-CITY-01~04의 `CITY_HOME`, P0-M2A-02·03의 ‘태양광’ 문장을 고친다. 숫자는 바꾸지 않는다.
- **기대값 불변 확인:** M1 세 시나리오의 `expected_*`, P0-ACC-01·02·13·14, M2 `expected_paths_usd`·`expected_rejections`, P0-M2A-01~03이 이전과 같은 숫자로 통과해야 한다. 바뀌는 숫자가 있으면 고치지 말고 결과 보고에 이유와 함께 적는다.
- 부정 단언이 이름 변경으로 그냥 통과하게 되는 곳(예: `main.test.ts`의 `not.toContain('부산 동료 영입')`)은 영입 칸 자체(`id="recruit-h"` 등)가 없는지 확인하는 단언으로 바꾼다.

### 9. 화면 고정 문구 (최소)
- `src/ui/recruitment.ts`의 ‘부산 동료 영입’ 제목을 `cityName(config, config.homeCityId)`로 만든 ‘{도시} 동료 영입’으로 바꾼다.
- `src/ui/main.ts`의 `PARTY_KO`: ‘요코하마 의류 고객’ → ‘하이퐁 의류 고객’, ‘태양광 모듈 화주’ → ‘자동차 부품 화주’(새 화주 ID에 맞춰).
- `src/ui/map.ts`의 이름표 배치 목록에 `PYEONGTAEK`을 더한다. 평택·인천·서울 근처 이름표가 부산·상하이 이름표와 겹치지 않는 쪽(예: 왼쪽)으로 둔다. 화면 측정은 Claude가 한다.

## 시험

- 기존 시험 전체가 통과해야 한다(이름 문자열 수정 뒤). 기대값 숫자는 바뀌지 않아야 한다.
- 새 시험:
  1. 본사는 `PYEONGTAEK`이고, 문화 탭 제목이 ‘평택 현지’, 영입 제목이 ‘평택 동료 영입’이다.
  2. 부산은 1장 거점으로 지도 자료에 남아 있고 본사가 아니다. 평택 항목에 부산 고유 순위·환적 문구가 없다.
  3. ROUTE01은 평택→하이퐁 5일, ROUTE02는 평택→상하이 4일이며, `schedule_basis`의 요일 차이와 일치한다.
  4. 지연 변형의 항만 제한 도시는 ROUTE01 도착항(하이퐁)이고 공지 문장이 ‘하이퐁항 …’이다.
  5. 옛 판본(0.4.1) 저장은 거절되고 이유 문장이 보인다. 새 판본 저장은 왕복한다.
  6. 일반화 금지어 ‘평택 사람’·‘평택 시민’이 검사기에서 걸린다.
  7. 문화 활동 CA02의 네 줄이 위 문장과 글자까지 같다.
- 변형 확인: 결과 보고에 최소 5개 변형(예: ROUTE01 일수 6, 본사 ID를 BUSAN으로, 평택 설명에 ‘7위’ 넣기, 옛 판본 허용, 금지어 빼기)과 각각 실패하는 시험 이름을 적는다.

## 완료 조건

1. `tools/ai/review_checks.sh` 8종 모두 통과.
2. `grep -rn "BUSAN\|부산" data src tests tools`에서 남은 부산은 (a) 부산 거점 항목, (b) ROUTE06, (c) 부산 일반화 금지어, (d) 옛 판본 거절 시험 자료, (e) 출처 문장뿐이다. 남은 줄 목록을 결과 보고에 붙인다.
3. 금액·날짜 기대값과 인수 명세 숫자가 이전과 같다.
4. 평택 거점 항목에 부산 사실이 섞이지 않았다.
5. 결과 보고 `docs/ai/tasks/results/TASK-0015.md`(형식은 기존 결과 보고와 같다: 바꾼 파일, 설계 판단, 바꾼 기존 기대값, 실행한 검증, 완료 조건 대조, 범위 밖 발견, 질문).
