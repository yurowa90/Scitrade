# TASK-0050 보전 기록 구조: 대표 학명·CITES 확인 상태 칸과 검사

- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- 선행 작업: 개발 브랜치 `<BASE>` 위에 만든 `codex/TASK-0050`에서 작업한다.
  - `<BASE>`는 허브가 실행 전에 해시로 바꾼다. 자리표시가 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0050-conservation-fields.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - 줄 번호는 `37b2633`(claude/research) 기준이다. 개발 브랜치에 TASK-0047 반영(`7df8059`)과 EMP53 Ⅱ 반영이 들어간 뒤 실행한다. `<BASE>`에서 다르면 코드가 사실이고, 차이를 결과 보고에 적는다.
- 병렬 작업: `tools/validate_data.py`·`data/characters.json`·`schemas/characters.schema.json`을 여는 다른 작업과 동시에 돌리지 않는다(SESSION_TREE ‘한 번에 한 작업만 여는 파일’).
- 결정 근거:
  - **사용자 결정(2026-10-12, 허브 세션):** 질문 3에 “대표 학명 + 확인일 둘 다(추천)”. 확인하지 않은 값을 검사기가 잡게 한다.
  - **허브 지시(2026-10-12):** ‘판정 보류’ 상태를 표현할 수 있게 한다. 처음 떠올린 사례는 EMP53(알바트로스)였으나, 미국 어류야생동물국 공지로 Ⅱ가 확인되어 지금 자료에는 판정 보류가 없다. 새 칸은 `CHARACTER_FIELDS`에 넣지 않는다(화면·엔진이 읽지 않고 검사기만 읽는다).
  - 근거 문서: `docs/ai/design/research/CONSERVATION-RECHECK.md`(TASK-0046), `docs/ai/design/research/CONSERVATION-BULK.md`(TASK-0047).
    - 실재 동물 41종 가운데 19종의 CITES 값이 틀렸다. 원인은 `cites_appendix: null`이 ‘미등재’와 ‘확인 안 함’을 함께 뜻한 것이다.

## 목표

1. `conservation`에 네 칸을 더한다.
   - `scientific_name`: 동료의 대표 학명.
   - `scientific_name_rank`: 그 학명의 분류 단계.
   - `cites_status`: CITES 확인 상태.
   - `cites_checked_on`·`cites_basis`: 확인일과 근거 문장.
2. 실재 동물 41종 모두에 값을 채운다(아래 표).
3. `tools/validate_data.py`가 상태와 값이 어긋나거나 확인하지 않은 기록을 실패로 잡는다.

플레이어가 보는 글과 빌드는 바뀌지 않는다. `conservation`은 `src/content/character-fields.ts`의 `CHARACTER_FIELDS`에 없다.

## 먼저 읽을 파일

- `schemas/characters.schema.json` 522~590행(`conservation`, `additionalProperties: false`).
- `tools/validate_data.py`:
  - 22행 `check`, 96~136행 `shape`(스키마 검사. `pattern`·날짜 형식은 지원하지 않는다).
  - 936~965행 캐릭터 검사, 954~955행 ‘real animal conservation record’.
  - 1034행 근처 `check_m2a(tables)` 호출부(새 검사 함수를 부를 자리를 고른다).
- `tools/test_validate_data.py` 1~35행(표를 읽어 고친 뒤 검사 함수를 직접 부르는 방식).
- `data/characters.json`의 `conservation` 41개.
- `src/content/character-fields.ts` 1~26행. **읽기만 한다.**

## 범위

**포함**
1. 스키마에 네 칸(구현 1).
2. 자료 41종에 값 채우기(구현 2, 아래 표 그대로).
3. 검사 함수와 시험(구현 3).

**제외**
- IUCN 칸의 확인 상태(이번에는 CITES만).
- `cites_appendix`·`national_protection_ko`·`note_ko`·`sources`·`check_level`의 기존 값 바꾸기.
  - EMP53은 이 작업 전에 Ⅱ로 반영된다(표의 ‘지금 cites_appendix’ 칸).
- 화면·엔진·`CHARACTER_FIELDS`·`data/sources.json`·문서.

## 고칠 수 있는 파일

- `schemas/characters.schema.json`
- `data/characters.json`
- `tools/validate_data.py`
- `tools/test_validate_data.py`
- `docs/ai/tasks/results/TASK-0050.md` (결과 보고)
- `MANIFEST.json`(`python3 tools/build_package.py --manifest-only`로만)

## 지켜야 할 것

- `data/characters.json`은 `json.dumps(…, ensure_ascii=False, indent=2) + '\n'` 형식을 지킨다(지금 파일이 이 형식이다). 손으로 고치지 말고 스크립트로 칸을 넣는다. 스크립트는 저장소에 남기지 않는다.
- 새 칸은 각 `conservation` 객체에서 `cites_appendix` 바로 뒤에 `cites_status`·`cites_checked_on`·`cites_basis`를 둔다. `scientific_name`·`scientific_name_rank`는 객체 맨 앞에 둔다.
- 아래 표의 글을 바꾸지 않는다. 표와 자료가 어긋나면(예: `<BASE>`의 `cites_appendix`가 표의 ‘지금 값’과 다름) 멈추고 결과 보고 ‘질문’에 적는다.

## 구현 지시

### 1. 스키마

`conservation.properties`에 더하고, 다섯 칸 모두 `required`에 더한다.

- `scientific_name`: `{"type": "string"}`
- `scientific_name_rank`: `{"type": "string", "enum": ["species", "subspecies", "genus", "family"]}`
- `cites_status`: `{"type": "string", "enum": ["listed", "not_listed", "unresolved", "unchecked"]}`
- `cites_checked_on`: `{"type": ["string", "null"]}`
- `cites_basis`: `{"type": ["string", "null"]}`

각 칸에 한국어 `description`을 단다. 예: `cites_status`는 “listed=부속서 등재, not_listed=확인했고 미등재, unresolved=원문끼리 엇갈려 판정 보류, unchecked=확인 안 함(검사 실패)”.

### 2. 자료 값

- 모든 41종: `cites_checked_on`은 `"2026-10-11"`이다.
- `cites_basis`는 `「국제적멸종위기종 목록」 기후에너지환경부고시 제2026-63호: ` 뒤에 아래 표의 마지막 칸을 붙인 문자열이다.
- EMP53(알바트로스)은 개발 브랜치에 Ⅱ로 반영된 뒤 실행한다(허브 결정 2026-10-12). 표대로 `listed`다.
- **지금 자료에는 `unresolved`가 없다.** 시험 7번(`unresolved` 허용)은 시험 안에서 값을 바꿔 확인한다. PASS 출력의 ‘CITES 판정 보류 n건’ 줄은 지금 자료에서 나오지 않는 것이 정상이다.

| id | species_ko | 지금 cites_appendix | scientific_name | scientific_name_rank | cites_status | cites_basis (앞에 「국제적멸종위기종 목록」 제2026-63호: 를 붙인다) |
|---|---|---|---|---|---|---|
| EMP01 | 사막여우 | II | Vulpes zerda | species | listed | 종 단위 Ⅱ |
| EMP02 | 수달 | I | Lutra lutra | species | listed | 종 단위 Ⅰ |
| EMP03 | 하늘다람쥐 | None | Pteromys volans | species | not_listed | 미등재(Pteromys 없음) |
| EMP05 | 레서판다 | I | Ailurus fulgens | species | listed | 종 단위 Ⅰ |
| EMP13 | 호랑이 | I | Panthera tigris | species | listed | 종 단위 Ⅰ |
| EMP14 | 저어새 | None | Platalea minor | species | not_listed | 미등재(같은 속 P. leucorodia만 Ⅱ) |
| EMP15 | 대왕판다 | I | Ailuropoda melanoleuca | species | listed | 종 단위 Ⅰ |
| EMP16 | 황금들창코원숭이 | I | Rhinopithecus roxellana | species | listed | 들창코원숭이속 전종 Ⅰ |
| EMP19 | 일본원숭이 | II | Macaca fuscata | species | listed | 영장목 전종 Ⅱ |
| EMP20 | 이리오모테살쾡이 | II | Prionailurus bengalensis iriomotensis | subspecies | listed | 고양이과 전종 Ⅱ(Ⅰ은 P. b. bengalensis 방글라데시·인도·태국 개체군만) |
| EMP24 | 물소 | None | Bubalus bubalis | species | not_listed | 가축화된 Bubalus bubalis는 협약 적용 제외(야생 B. arnee는 Ⅲ, 네팔) |
| EMP25 | 사올라 | I | Pseudoryx nghetinhensis | species | listed | 종 단위 Ⅰ |
| EMP26 | 천산갑 | I | Manis | genus | listed | 종 단위 Ⅰ(M. javanica·M. pentadactyla 모두) |
| EMP27 | 델라쿠르랑구르 | II | Trachypithecus delacouri | species | listed | 영장목 전종 Ⅱ |
| EMP30 | 쥐사슴 | None | Tragulus kanchil | species | not_listed | 미등재 |
| EMP31 | 코뿔새 | II | Anthracoceros albirostris | species | listed | 검은코뿔새속 전종 Ⅱ |
| EMP32 | 코모도왕도마뱀 | I | Varanus komodoensis | species | listed | 종 단위 Ⅰ |
| EMP33 | 오랑우탄 | I | Pongo | genus | listed | 종 단위 Ⅰ(Pongo 3종 모두) |
| EMP34 | 자바코뿔소 | I | Rhinoceros sondaicus | species | listed | 코뿔소과 전종 Ⅰ |
| EMP35 | 극락조 | II | Paradisaeidae | family | listed | 극락조과 전종 Ⅱ |
| EMP37 | 반달가슴곰 | I | Ursus thibetanus | species | listed | 종 단위 Ⅰ |
| EMP38 | 상괭이 | I | Neophocaena asiaeorientalis | species | listed | 종 단위 Ⅰ(고시 국명 ‘양쯔강상괭이’) |
| EMP39 | 황새 | I | Ciconia boyciana | species | listed | 종 단위 Ⅰ |
| EMP40 | 양쯔강악어 | I | Alligator sinensis | species | listed | 종 단위 Ⅰ |
| EMP41 | 중국장수도롱뇽 | I | Andrias davidianus | species | listed | 장수도롱뇽속 전종 Ⅰ |
| EMP42 | 아마미검은멧토끼 | None | Pentalagus furnessi | species | not_listed | 미등재 |
| EMP43 | 따오기 | I | Nipponia nippon | species | listed | 종 단위 Ⅰ |
| EMP44 | 붉은다리두크원숭이 | I | Pygathrix nemaeus | species | listed | 납작코원숭이속 전종 Ⅰ |
| EMP45 | 양쯔강대왕자라 | II | Rafetus swinhoei | species | listed | 종 단위 Ⅱ(고시 국명 ‘상하이자라’) |
| EMP46 | 래플스반다랑구르 | II | Presbytis femoralis | species | listed | 영장목 전종 Ⅱ |
| EMP47 | 발리찌르레기 | I | Leucopsar rothschildi | species | listed | 종 단위 Ⅰ |
| EMP48 | 말레이맥 | I | Tapirus indicus | species | listed | 맥과 전종 Ⅰ |
| EMP49 | 두루미 | I | Grus japonensis | species | listed | 종 단위 Ⅰ |
| EMP50 | 혹등돌고래 | I | Sousa chinensis | species | listed | 혹등참흰돌고래속 전종 Ⅰ |
| EMP52 | 넓적부리도요 | None | Calidris pygmaea | species | not_listed | 미등재 |
| EMP53 | 알바트로스 | II | Phoebastria albatrus | species | listed | 부속서 Ⅱ(제2023-45호부터). 미국 어류야생동물국 공지(2023-01-13)가 CoP19 Ⅰ→Ⅱ 이동(2023-02-23 발효, CITES Notification 2023/005)을 적음 |
| EMP55 | 투구게 | None | Tachypleus tridentatus | species | not_listed | 미등재 |
| EMP56 | 매부리바다거북 | I | Eretmochelys imbricata | species | listed | 바다거북과 전종 Ⅰ |
| EMP58 | 말레오 | I | Macrocephalon maleo | species | listed | 종 단위 Ⅰ(고시 국명 ‘셀레베스메거포우드’) |
| EMP59 | 실러캔스 | I | Latimeria menadoensis | species | listed | 실러캔스속 전종 Ⅰ |
| EMP60 | 고래상어 | I | Rhincodon typus | species | listed | 종 단위 Ⅰ(개정이유: CoP20 Ⅱ→Ⅰ) |

### 3. 검사 함수

`tools/validate_data.py`에 `check_conservation(tables)`를 두고 `main`에서 부른다(캐릭터 표를 읽은 뒤면 어디든 좋다. 고른 자리를 보고에 적는다). `conservation`이 있는 캐릭터마다 다음을 확인한다. 실패 문구는 한국어로 `"{id}: …"` 꼴이다.

1. `scientific_name`이 빈 문자열이 아니다.
2. `cites_status`와 `cites_appendix`가 맞는다.
   - `listed` ⇔ `cites_appendix`가 `I`·`II`·`III` 가운데 하나다.
   - `not_listed`·`unresolved`·`unchecked`면 `cites_appendix`가 `null`이다.
3. `listed`·`not_listed`·`unresolved`면 다음 둘을 확인한다.
   - `cites_checked_on`이 `YYYY-MM-DD`이고 `datetime.date.fromisoformat`로 읽히는 날짜다.
   - `cites_basis`가 공백만이 아닌 문자열이다.
4. `unchecked`면 `"{id}: CITES 확인 안 함(cites_status unchecked)"`로 실패한다. 확인일·근거가 있어도 실패다.
5. `unresolved`인 캐릭터 수를 PASS 출력 둘째 줄 뒤에 한 줄로 알린다.
   - 실패가 아니다. 판정 보류가 남아 있음을 보이기 위해서다.
   - 예: `CITES 판정 보류 1건: EMP00`(지금 자료에는 0건).
   - 0건이면 줄을 쓰지 않는다.

## 테스트

`tools/test_validate_data.py`에 클래스 하나를 더한다(기존 방식: 표를 읽고 고친 뒤 `validator.ERRORS.clear()`, 검사 함수 호출, `ERRORS` 확인).

1. 지금 자료(이 작업 반영 뒤)에서 `check_conservation` 실패 0.
2. `listed`인데 `cites_appendix` null → 실패.
3. `not_listed`인데 `cites_appendix` `"I"` → 실패.
4. `cites_checked_on` `"2026-13-01"`·`"2026/10/11"`·`None`(listed일 때) → 각각 실패.
5. `cites_basis` `"  "` → 실패.
6. `unchecked`(appendix null, 확인일·근거 있음) → ‘CITES 확인 안 함’ 실패.
7. `unresolved`(appendix null, 확인일·근거 있음) → 실패 없음.
8. `scientific_name` `""` → 실패.

## 완료 조건

- `python3 tools/validate_data.py` PASS. 검사 수 전후를 적는다.
- `python3 tools/test_validate_data.py` 통과. 시험 수 전후를 적는다.
- `npx vitest run` 통과. 투영 시험(`src/content/character-fields.test.ts`)이 새 칸 때문에 깨지지 않는지 확인한다. 새 칸은 투영 밖이라 빌드에 실리지 않아야 한다.
- `bash tools/ai/review_checks.sh --check <BASE>` 통과.
- 결과 보고 `docs/ai/tasks/results/TASK-0050.md`에 다음을 적는다.
  - 바꾼 칸 요약.
  - 시험 목록과 질문.
