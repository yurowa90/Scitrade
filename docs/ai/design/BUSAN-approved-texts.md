# 부산판 승인 문장 보관 (2026-10-09)

- 작성: Claude, 2026-10-09(S1a 문서 정합). 근거: 평택 본사 전환의 Claude 기본값 ‘부산판 승인 문장(문화 활동 ‘말하지 않는 것’, 연락처 설명, 동료 만남 이야기)은 문서에 보관했다가 나중 출장 콘텐츠에 다시 쓸 수 있게 한다’(`docs/DECISIONS.md` ‘평택 본사 전환’, :966).
- 왜 지금: TASK-0015(평택 본사 전환)가 아래 값을 평택판으로 덮어쓴다(TASK-0015 지시서 4절, 구현은 `codex/TASK-0015` 브랜치, 병합 대기). 지시서에는 보관 지시가 없고, 병합 뒤에는 이 문장들이 git 기록(`3b60314`)에만 남는다.
- 범위: 개발 브랜치 `3b60314`의 `data/culture_activities.json`, `data/contacts.json`, `data/characters.json`에서 TASK-0015가 바꾸는 플레이어 문장과, 부산을 배경으로 쓴 P1 활동 CA04~06의 문장이다. 평택판 문장은 이 문서에 옮기지 않는다(지시서 4절과 병합 뒤 자료가 기준).
- 들어온 경위(`git log -S`로 확인): CA01~03의 네 칸 기록 문장은 TASK-0011(`fc70406`, 2026-10-06, M2a-4 사용자 결정 뒤)에서 들어왔다. 연락처 범위 문장과 CA04~06은 처음 묶음(`9f68a76`, 2026-10-04)부터, 동료 이야기 6줄은 동료 48종 확장(`dd41f6d`, 2026-10-04)부터 있었다. DECISIONS는 이 묶음을 ‘부산판 승인 문장’이라 부른다(:966).
- 다시 쓸 때: 부산 출장 콘텐츠(M3 이후)에서 쓰려면 사실 섞임을 다시 검사한다. 예를 들어 반달가슴곰 이야기를 부산에 남기면 출장이 생기기 전에는 만날 수 없어서, 승인안은 평택의 ‘순회 홍보 행사’로 옮겼다(`docs/DECISIONS.md` ‘평택 노선 재설계 승인’ 5항).

## 표기와 검증

- 각 항목의 제목 줄은 `파일` · `JSON 경로`다. `items[id=CA01]`은 `items` 배열에서 `id`가 `CA01`인 항목이다.
- 코드 블록 안의 한 줄이 그 경로의 문자열 값 전체다. 따옴표(“ ” ‘ ’)와 가운뎃점(·)까지 원문 그대로다.
- **검증 (2026-10-09):** 이 문서의 코드 블록을 모두 읽어, 같은 경로의 `git show 3b60314:<파일>` 값과 UTF-8 바이트로 비교하는 스크립트를 돌렸다. 스크립트는 저장소 밖(작업 scratchpad)에 있다.
- **검증 결과:** 코드 블록 56개, 제목 줄 56개, 바이트 일치 56개, 불일치 0개. 한 글자를 바꾼 사본을 넣으면 그 1건을 불일치로 잡는 것도 확인했다.
- 블록으로 옮기지 않은 값: `data/employees.json`의 EMP01~06 `home_city_id`·`location_city_id`, `data/characters.json`의 한국 동료 13종(EMP01~06·10·13·14·37·38·39·49) `encounter.city_id`, `data/contacts.json`의 두 인물 `city_id`는 `3b60314`에서 모두 `BUSAN`이다. 같은 검증 스크립트로 확인했다.

## 1. 문화 활동 CA01~03 — 평택판에서 바뀌는 문장

### CA01 시장과 포장 요구 탐방

#### `data/culture_activities.json` · `items[id=CA01].report_ko.not_claimed_ko` — 이 기록이 말하지 않는 것
```text
부산의 다른 상인이나 손님도 작은 포장을 원한다는 뜻이 아닙니다.
```

### CA02 박물관과 항구 기록 산책 (평택판에서 주제가 바뀐다)

#### `data/culture_activities.json` · `items[id=CA02].title_ko` — 활동 제목
```text
박물관과 항구 기록 산책
```

#### `data/culture_activities.json` · `items[id=CA02].knowledge_topic.title_ko` — 기록 주제
```text
항구 기록을 읽을 때 확인할 질문
```

#### `data/culture_activities.json` · `items[id=CA02].observations_ko[0]` — 관찰 1
```text
가상 전시의 서로 다른 설명을 비교하고 출처와 시점을 확인합니다.
```

#### `data/culture_activities.json` · `items[id=CA02].observations_ko[1]` — 관찰 2
```text
실제 지역사 사실은 검증한 자료가 추가되기 전까지 서술하지 않습니다.
```

#### `data/culture_activities.json` · `items[id=CA02].report_ko.finding_ko` — 알게 된 점
```text
하람: “같은 배를 두고 전시 안내문과 옛 장부의 날짜가 달라요. 어느 쪽이 맞는지 정하기 전에, 각각 누가 언제 무엇을 보고 썼는지부터 확인해야 해요.”
```

#### `data/culture_activities.json` · `items[id=CA02].report_ko.scope_ko` — 범위
```text
가상 전시 1곳의 기록 2건을 안내자 1명(하람)과 비교했습니다. 어느 기록이 맞는지는 확인하지 않았습니다.
```

#### `data/culture_activities.json` · `items[id=CA02].report_ko.not_claimed_ko` — 이 기록이 말하지 않는 것
```text
두 기록 가운데 어느 쪽이 옳은지, 그리고 실제 부산항의 역사(이 전시는 가상입니다).
```

#### `data/culture_activities.json` · `items[id=CA02].report_ko.open_question_ko` — 아직 모르는 것
```text
두 기록을 쓴 사람·시점·근거, 그리고 둘 다 틀렸을 가능성.
```

### CA03 언어 교류와 주문 확인

#### `data/culture_activities.json` · `items[id=CA03].report_ko.not_claimed_ko` — 이 기록이 말하지 않는 것
```text
부산의 다른 상인도 같은 말을 같은 뜻으로 쓴다는 뜻이 아닙니다.
```

## 2. 연락처 정보 범위 문장

#### `data/contacts.json` · `items[id=NPC_MARKET].information_scope_ko` — 시장 상인 윤서
```text
이 가상 판매점의 요구만 나타내며 부산이나 한국 전체의 소비 성향을 뜻하지 않습니다.
```

#### `data/contacts.json` · `items[id=NPC_GUIDE].information_scope_ko` — 지역 기록 안내자 하람
```text
가상 활동의 진행 인물이며 실제 역사·산업·문화에 대한 권위 있는 출처가 아닙니다.
```

## 3. 동료 만남 이야기 6줄 (`recruitment.story_clue`)

#### `data/characters.json` · `items[id=EMP13].recruitment.story_clue` — 범솔(호랑이)
```text
부산 무역회관의 신규 거래처 설명회에서 처음 만난다. 첫 거래처 소개 의뢰를 함께 마치면 합류를 제안한다.
```

#### `data/characters.json` · `items[id=EMP14].recruitment.story_clue` — 저어리(저어새)
```text
부산 근교 갯벌 보전 모임의 물새 조사를 돕는 의뢰에서 만난다. 조사 장비 운송 일정을 지켜 주면 합류한다.
```

#### `data/characters.json` · `items[id=EMP37].recruitment.story_clue` — 달곰(반달가슴곰)
```text
부산 문화 탐방에서 지리산 반달가슴곰 복원 현장 홍보 행사를 돕는 의뢰를 마치면 합류한다.
```

#### `data/characters.json` · `items[id=EMP38].recruitment.story_clue` — 방긋(상괭이)
```text
부산 항만 물류단지에서 혼획을 줄이는 그물 개선 캠페인 물품 운송을 도우면 합류한다.
```

#### `data/characters.json` · `items[id=EMP39].recruitment.story_clue` — 한새(황새)
```text
부산 문화 탐방에서 황새 복원 마을의 친환경 농산물 운송을 도우면 합류한다.
```

#### `data/characters.json` · `items[id=EMP49].recruitment.story_clue` — 단정이(두루미)
```text
부산 문화 탐방에서 두루미 월동지 보전 모임의 겨울 먹이 운송을 도우면 합류한다.
```

## 4. 문화 활동 CA04~06 (P1, 부산 배경으로 쓴 문장. 평택 전환에서 글자는 그대로이고 도시만 옮겨진다)

### CA04 지역 행사 준비 이야기

#### `data/culture_activities.json` · `items[id=CA04].title_ko` — 활동 제목
```text
지역 행사 준비 이야기
```

#### `data/culture_activities.json` · `items[id=CA04].knowledge_topic.title_ko` — 기록 주제
```text
한 가상 행사의 준비 일정과 물류 질문
```

#### `data/culture_activities.json` · `items[id=CA04].observations_ko[0]` — 관찰 1
```text
가상 행사 준비 기록에서 물품·시간·보관 조건을 확인합니다.
```

#### `data/culture_activities.json` · `items[id=CA04].observations_ko[1]` — 관찰 2
```text
관람과 행사 납품 계약의 자격을 구분합니다.
```

#### `data/culture_activities.json` · `items[id=CA04].effects[1].required_interaction_ko` — 후속 확인 조건
```text
가이드와 후속 확인 약속을 잡음. 관람만으로 발주자 친밀도나 계약을 얻지 않음
```

### CA05 생산 현장과 환경 관찰

#### `data/culture_activities.json` · `items[id=CA05].title_ko` — 활동 제목
```text
생산 현장과 환경 관찰
```

#### `data/culture_activities.json` · `items[id=CA05].knowledge_topic.title_ko` — 기록 주제
```text
가상 생산 현장의 보관·환경 자료 확인
```

#### `data/culture_activities.json` · `items[id=CA05].observations_ko[0]` — 관찰 1
```text
본사 도시 안의 가상 시범 현장을 관찰하며 공정 설명과 측정 자료를 구분합니다.
```

#### `data/culture_activities.json` · `items[id=CA05].observations_ko[1]` — 관찰 2
```text
외부 산지로의 출장은 이동·경비 기능이 구현된 뒤 별도 활동으로 추가합니다.
```

#### `data/culture_activities.json` · `items[id=CA05].effects[1].required_interaction_ko` — 후속 확인 조건
```text
함께 관찰한 가이드와 미확인 항목의 후속 조사 방법을 협의함
```

### CA06 지역 프로젝트의 역할 협의

#### `data/culture_activities.json` · `items[id=CA06].title_ko` — 활동 제목
```text
지역 프로젝트의 역할 협의
```

#### `data/culture_activities.json` · `items[id=CA06].knowledge_topic.title_ko` — 기록 주제
```text
작은 가상 지역 프로젝트의 참여 조건
```

#### `data/culture_activities.json` · `items[id=CA06].observations_ko[0]` — 관찰 1
```text
두 참여자가 제안한 필요·역할·완료 조건을 비교합니다.
```

#### `data/culture_activities.json` · `items[id=CA06].observations_ko[1]` — 관찰 2
```text
하루 활동은 협의 단계이며 프로젝트 전체 완료나 후원 성과로 처리하지 않습니다.
```

#### `data/culture_activities.json` · `items[id=CA06].effects[1].required_interaction_ko` — 후속 확인 조건
```text
돈을 낸 사실이 아니라 직접 참여한 협의 내용에 따라 특정 인물과의 다음 대화가 열림
```

## 5. 함께 바뀌는 문장 아닌 값 (다시 맞출 때 필요)

플레이어에게 보이는 문장은 아니지만, 부산판을 다시 만들 때 같이 되돌려야 하는 값이다.

### 문화 활동 주제 ID와 도시

#### `data/culture_activities.json` · `items[id=CA01].knowledge_topic.id` — CA01 주제 ID
```text
KT_BUSAN_PACKAGING
```

#### `data/culture_activities.json` · `items[id=CA01].city_id` — CA01 도시
```text
BUSAN
```

#### `data/culture_activities.json` · `items[id=CA02].knowledge_topic.id` — CA02 주제 ID
```text
KT_BUSAN_PORT_RECORDS
```

#### `data/culture_activities.json` · `items[id=CA02].city_id` — CA02 도시
```text
BUSAN
```

#### `data/culture_activities.json` · `items[id=CA03].knowledge_topic.id` — CA03 주제 ID
```text
KT_BUSAN_ORDER_CLARIFICATION
```

#### `data/culture_activities.json` · `items[id=CA03].city_id` — CA03 도시
```text
BUSAN
```

#### `data/culture_activities.json` · `items[id=CA04].knowledge_topic.id` — CA04 주제 ID
```text
KT_BUSAN_EVENT_NEEDS
```

#### `data/culture_activities.json` · `items[id=CA04].city_id` — CA04 도시
```text
BUSAN
```

#### `data/culture_activities.json` · `items[id=CA05].knowledge_topic.id` — CA05 주제 ID
```text
KT_BUSAN_FIELD_OBSERVATIONS
```

#### `data/culture_activities.json` · `items[id=CA05].city_id` — CA05 도시
```text
BUSAN
```

#### `data/culture_activities.json` · `items[id=CA06].knowledge_topic.id` — CA06 주제 ID
```text
KT_BUSAN_PROJECT_REQUIREMENTS
```

#### `data/culture_activities.json` · `items[id=CA06].city_id` — CA06 도시
```text
BUSAN
```

#### `data/culture_activities.json` · `items[id=CA02].curriculum_refs[1]` — CA02 교과 연결 2
```text
SOC08
```

#### `data/culture_activities.json` · `items[id=CA02].curriculum_refs[2]` — CA02 교과 연결 3
```text
SOC12
```

### 보전 기록 출처 (동료 3종)

#### `data/characters.json` · `items[id=EMP14].conservation.sources[0]` — EMP14 출처 1
```text
BirdLife DataZone: Black-faced Spoonbill https://datazone.birdlife.org/species/factsheet/black-faced-spoonbill-platalea-minor
```

#### `data/characters.json` · `items[id=EMP14].conservation.checked_on` — EMP14 확인일
```text
2026-10-04
```

#### `data/characters.json` · `items[id=EMP14].conservation.check_level` — EMP14 확인 수준
```text
웹 2차 자료로 확인
```

#### `data/characters.json` · `items[id=EMP39].conservation.sources[0]` — EMP39 출처 1
```text
Wikipedia: Oriental stork https://en.wikipedia.org/wiki/Oriental_stork
```

#### `data/characters.json` · `items[id=EMP39].conservation.checked_on` — EMP39 확인일
```text
2026-10-04
```

#### `data/characters.json` · `items[id=EMP39].conservation.check_level` — EMP39 확인 수준
```text
웹 2차 자료로 확인 (옛말 유래는 확인 필요)
```

#### `data/characters.json` · `items[id=EMP49].conservation.sources[0]` — EMP49 출처 1
```text
작성자 지식 기반
```

#### `data/characters.json` · `items[id=EMP49].conservation.checked_on` — EMP49 확인일
```text
2026-10-04
```

#### `data/characters.json` · `items[id=EMP49].conservation.check_level` — EMP49 확인 수준
```text
작성자 지식 기반, 출처 대조 필요
```
