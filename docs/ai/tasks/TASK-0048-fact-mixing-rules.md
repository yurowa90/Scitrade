# TASK-0048 사실 섞임 검사 규칙 개정: 표기 변형·이름 경계·허용 목록 열쇠

- codex_model: `gpt-6-astra`
- reasoning_effort: `medium`
- 선행 작업: 개발 브랜치 `<BASE>` 위에 만든 `codex/TASK-0048`에서 작업한다.
  - `<BASE>`는 허브가 실행 전에 해시로 바꾼다. 자리표시가 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0048-fact-mixing-rules.md`의 해시를 쓰고 결과 보고에 적는다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - 아래 줄 번호는 `23351bd`(claude/research) 기준이다. `tools/check_fact_mixing.py`·`tools/test_check_fact_mixing.py`는 그 뒤 개발 브랜치에서 바뀌지 않았다(세션 C 소유 파일). `<BASE>`에서 다르면 코드가 사실이고, 차이를 결과 보고에 적는다.
- 병렬 작업: 이 작업은 위 두 파일만 고친다. 다른 세션 작업과 파일이 겹치지 않는다(`MANIFEST.json`은 병합 때 다시 만든다).
- 결정 근거:
  - `docs/ai/tasks/results/TASK-0019.md` 259~264행 ‘알려진 한계’ 1~5. 이 작업은 2·3·4를 고친다. 1·5는 제외 이유를 아래 ‘범위’에 적었다.
  - `docs/DECISIONS.md` 972행(이름만 바꾼 사본 실험에서 검사기가 사실 섞임을 놓쳤다)과 1038행(2차로 넘긴 ‘사실 섞임 규칙 개정(표기 변형·허용 목록 열쇠)’).
  - `docs/STATUS.md` 463행 ‘남은 일’의 ‘사실 섞임 규칙 개정’.
  - 세션 C 시제품(2026-10-11):
    - 이 지시서의 규칙을 `tools/check_fact_mixing.py` 사본에 구현했다. 지금 자료에서 `PASS`가 나왔다(허용 목록 8건 모두 사용, 문장 7,594개, 사실 표지 53개).
    - 기존 시험 20개 가운데 18개가 그대로 통과했다. 01(허용 목록 열쇠 비교)과 13(새 필수 키)만 바뀐다.
    - 시제품은 저장소에 없다. 찾지 않아도 된다.

## 목표

`tools/check_fact_mixing.py`의 세 가지 구멍을 막는다. 바꾼 뒤에도 지금 자료는 그대로 `PASS`여야 한다.

1. **표기 변형(한계 2):** 수량·비율을 비교할 때 표기만 다른 같은 값을 같은 값으로 본다.
   - 예: `57 %`·`57%`·`57％`, `5506만TEU`·`55,060,000 TEU`.
2. **이름·순위 오인(한계 3):**
   - `14위안`(위안화 가격)을 순위로 읽지 않는다.
   - 한글 거점 별칭이 다른 낱말 안에 들어 있으면 그 거점을 부른 것으로 보지 않는다. 예: ‘부산물’ 안의 ‘부산’.
   - 관문 이름 안의 별칭도 마찬가지다. 예: ‘파나마 운하’ 안의 ‘파나마’.
3. **허용 목록 열쇠(한계 4):** 허용 항목이 특정 문장에만 걸리게 한다. 같은 필드·같은 순위 낱말의 새 누출을 함께 가리지 않게 한다. 다른 거점을 부른 결과(`FACT_NAMES_OTHER_HUB`)는 상대 거점까지 열쇠에 넣는다.

시제품의 변형 대조(원래 검사기 → 이 지시서 규칙):

| 변형 | 원래 | 개정 |
|---|---|---|
| 상하이·부산 메모에 `57 %`·`57％` | PASS | FACT_SHARED_BETWEEN_HUBS |
| `5506만TEU`·`55,060,000 TEU` | PASS | FACT_SHARED_BETWEEN_HUBS |
| ‘택시 기본요금은 14위안이다.’ | RANK_WITHOUT_BASIS | PASS |
| ‘수산 부산물 수출이 늘어 3위 닝보·저우산항과 경쟁한다.’(상하이) | FACT_NAMES_OTHER_HUB | PASS |
| ‘파나마 운하를 거치는 물량이 국내 1위다.’(산투스) | FACT_NAMES_OTHER_HUB | PASS |
| ‘홍콩은 세계 6위 금융 도시다.’(홍콩, 허용된 6위와 같은 필드) | PASS(허용 항목이 가림) | RANK_WITHOUT_BASIS |
| ‘부산은 환적 3위 항만이다.’(상하이) | FACT_NAMES_OTHER_HUB | FACT_NAMES_OTHER_HUB, RANK_WITHOUT_BASIS |
| ‘부산항 물동량은 2,488만TEU다.’(상하이) | FACT_NAMES_OTHER_HUB | FACT_NAMES_OTHER_HUB(그대로) |

## 먼저 읽을 파일

- `tools/check_fact_mixing.py` 전체(294행).
  - 11행 `RANK_RE`, 12~13행 `QTY_RE`·`SHARE_RE`.
  - 34~43행 `ALLOWLIST`.
  - 62~72행 `Finding`과 `key`, 77행 `normalized`, 116행 `finding`.
  - 164~176행 `validate_allowlist`.
  - 192행 `aliases`, 199행 `own`, 203행 `shared_tokens`.
  - 220행 별칭 검사, 222행 자기 항목 검사, 258~269행 중복 제거와 허용 목록 적용.
- `tools/test_check_fact_mixing.py` 전체(174행). 30~35행 시험 01, 112~115행 시험 13, 117~124행 시험 14, 131~132행 `synthetic`(관문에 `name_ko`가 없다).
- `data/world.json`의 `sea_gates[].name_ko`(말라카 해협·호르무즈 해협·바브엘만데브 해협·수에즈 운하·파나마 운하·희망봉). **읽기만 한다.**
- `docs/ai/tasks/results/TASK-0019.md` 259~264행.

## 범위

**포함 (이 순서로 한다)**
1. 수량·비율 정규화(구현 1).
2. `위안` 제외와 별칭 경계(구현 2).
3. 허용 목록 열쇠(구현 3).
4. 시험(아래 ‘테스트’).

**제외**
- **한계 1(본사 항목의 ‘국내/전국 N위’·‘국내 최대’):** 평택 자기 순위(4위·5위)를 허용하려고 일부러 둔 규칙이다. 비교할 근거 자료 칸이 없어 이 작업에서 바꾸지 않는다. 검수 grep으로 본다.
- **한계 5(장소 문장 공유 검사):** `venues.json`은 지금 모두 평택(5건)이다. 장소의 활동 설명 칸(`activity_execution_ko` 등)은 도시가 늘면 일부러 같은 문장을 쓸 수 있다. 장소가 다른 도시로 늘 때 칸을 골라 다시 정한다.
- `data/**`·`schemas/**`·다른 도구·문서. 새 허용 항목 추가(지금 자료에서 새 결과가 나오면 아래 ‘지켜야 할 것’).

## 고칠 수 있는 파일

- `tools/check_fact_mixing.py`
- `tools/test_check_fact_mixing.py`
- `docs/ai/tasks/results/TASK-0048.md` (결과 보고)
- `MANIFEST.json`: `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

위 목록에 없는 모든 파일. 공통 금지 파일은 `CODEX_PREAMBLE.md`를 따른다.

## 지켜야 할 것

- 지금 자료에서 `python3 tools/check_fact_mixing.py`가 `PASS`이고 허용 목록 8건을 모두 써야 한다.
  - 새 결과가 나오면 허용 항목을 더해 덮지 않는다. 결과 보고 ‘질문’에 그 결과(코드·파일·레코드·문장)를 적고 멈춘다.
- 허용 항목의 `reason` 글은 바꾸지 않는다. 새 키만 더한다.
- 새 의존성 없음(표준 라이브러리만). 주석과 출력은 한국어 짧은 문장으로 쓴다.
- 시험은 임시 폴더만 쓴다. 저장소 안에 파일을 남기지 않는다.

## 구현 지시

### 1. 수량·비율 정규화

- `SHARE_RE`가 전각 퍼센트 `％`도 잡게 한다: 끝을 `\s?[%％]`로.
- 새 함수 `canonical(token: Token) -> str`를 둔다.
  - `QTY`·`SHARE`가 아니면 `token.text`를 그대로 돌려준다.
  - `QTY`·`SHARE`면 다음을 차례로 한다.
    - `％`→`%`, `−`→`-` 바꾸기, 공백과 쉼표 지우기.
    - `(-?[0-9.]+)(만|억)?(TEU|R/T|운임톤|dwt|%)`에 맞으면 수에 만=10,000·억=100,000,000을 곱한다.
    - 소수점 아래 0을 지운 수 문자열에 단위를 붙인다. 예: `5506만TEU`→`55060000TEU`, `57 %`→`57%`.
    - 맞지 않으면 공백·쉼표만 지운 문자열을 돌려준다.
- 비교에 쓰는 세 곳을 `canonical(t)`로 바꾼다.
  - 199행 `own[hid]`의 수량·비율 집합.
  - 203행 `shared_tokens` 열쇠.
  - 222행 `FACT_NOT_IN_OWN_ENTRY`의 비교.
- 결과의 `token`(보고에 나오는 글)은 원래 표기 `t.text` 그대로 둔다.

### 2. `위안` 제외와 별칭 경계

- `RANK_RE` 끝의 부정 전방 탐색 `(?![치험해원반쪽])`에 `안`을 더한다.
  - ‘1위 안에’처럼 띄어 쓴 경우는 그대로 순위다(공백이 먼저 온다).
- 새 함수 `names_hub(sentence, names, gate_names) -> bool`로 220행의 별칭 검사를 바꾼다.
  - ASCII 별칭: 지금처럼 `\b`로 찾는다.
  - 한글 별칭: 나온 자리마다 다음을 본다.
    - (가) `gate_names`(관문 `name_ko`) 가운데 하나가 문장에서 차지하는 구간 안에 있으면 건너뛴다.
    - (나) 바로 뒤 글자가 한글인데 아래 조사·접미 목록으로 시작하지 않으면 건너뛴다.
    - 한 자리라도 남으면 참이다.
  - 조사·접미 목록(긴 것부터 대조): `으로 에서 까지 부터 보다 처럼 과의 와의 에는 에도 이나 은 는 이 가 을 를 의 에 와 과 도 로 만 나 항 시 권 발 행`.
    - ‘부산항’·‘부산발’·‘부산은’은 부른 것이다.
    - ‘부산물’은 부른 것이 아니다.
- `gate_names`는 `check_documents`에서 `[g['name_ko'] for g in world.get('sea_gates', []) if g.get('name_ko')]`로 만든다. 시험의 `synthetic` 관문에는 `name_ko`가 없다.

### 3. 허용 목록 열쇠

- **결과 칸:** `Finding`에 `other: str = ''` 칸을 더한다(마지막 칸, 기본값 있음).
  - `finding()`이 `other`를 채운다(`FACT_NAMES_OTHER_HUB`에서 상대 거점 ID).
  - `key()`는 `(code, file, record, field, token, other)`를 돌려준다.
- **허용 항목의 필수 키:** `sentence_contains`(8자 이상 문자열)를 더한다.
  - `FACT_NAMES_OTHER_HUB` 항목은 `other`도 필수다.
  - 어기면 `AllowlistError`. 중복 판정 열쇠는 `(code, file, record, field, token, other, sentence_contains)`다.
- **중복 제거(258행):** 결과를 `key() + (normalized(sentence),)`로 모은다. 같은 열쇠의 다른 문장이 하나로 합쳐져 가려지지 않게 하기 위해서다.
- **허용 적용:** 항목마다 `key()`가 같고 `sentence_contains`가 그 결과의 `sentence`에 들어 있는 결과만 지운다.
  - 하나도 없으면 지금처럼 `ALLOWLIST_UNUSED`를 낸다.
- **지금 8건에 더할 값:** 아래 문자열은 지금 자료의 문장에서 그대로 땄다.

| record | token | 더할 키 |
|---|---|---|
| PYEONGTAEK | 8위 | `sentence_contains: '서울(GFCI 39 8위)'` |
| SHANGHAI | 3위 | `sentence_contains: '3위 닝보·저우산항'` |
| SINGAPORE | 10위 | `sentence_contains: '10위 포트클랑(말레이시아)'` |
| HONG_KONG | 6위 | `sentence_contains: '6위 광저우가 가까워'` |
| MUMBAI | 1위 | `sentence_contains: '총화물량 1위는 구자라트의 문드라항'` |
| ROTTERDAM | 3위 | `sentence_contains: '3위 함부르크는 로테르담 권역'` |
| PANAMA | 1위 | `other: 'SANTOS'`, `sentence_contains: '산투스에 1위를 내주기 전까지'` |
| CA02 | 1위 | `sentence_contains: '1위 항만과는 얼마나 차이 나는지'` |

- **명령줄 출력:** `FACT_NAMES_OTHER_HUB` 결과의 출력 줄에 상대 거점을 보인다. 예: `… 「1위」(상대 SANTOS) — …`. `--json` 출력에는 `other` 칸이 자연히 생긴다.

## 테스트

`python3 tools/test_check_fact_mixing.py`(또는 `python3 -m unittest` 방식, 기존 실행 방식 그대로).

- **기존 시험 고치기:**
  - 01: 비교 열쇠를 `(code, file, record, field, token, other)`로 바꾼다. 허용 항목에서는 `entry.get('other', '')`를 쓴다.
  - 13: 낡은 항목 예시에 `sentence_contains`를 넣는다.
  - 14: 경우를 더한다. `sentence_contains` 없음, 7자 이하, `FACT_NAMES_OTHER_HUB`의 `other` 없음.
- **새 시험(각각 하나의 `test_` 함수):**
  1. 표기 변형: 두 거점 `hub_note_ko`에 `57 %`/`57％`(문장에 ‘비중’ 포함) → `FACT_SHARED_BETWEEN_HUBS`. 또 `5506만TEU`/`55,060,000 TEU` → 같은 결과.
  2. `canonical` 단위 시험: `57 %`·`57％`·`57%`가 같다. `5506만TEU`·`55,060,000 TEU`가 같다. `5.5만 TEU`와 `55,000TEU`가 같다. `57%`와 `57.1%`는 다르다.
  3. `14위안` → 순위 표지가 없다. `1위 안에`(띄어 씀) → 순위 표지가 있다.
  4. 별칭 경계(`names_hub` 직접 시험):
     - ‘부산물’ 거짓, ‘부산항’·‘부산은’·‘부산발’ 참.
     - 관문 이름 목록에 ‘파나마 운하’를 주면 ‘파나마 운하를 거쳐’ 거짓, ‘파나마는’ 참.
  5. 허용 열쇠: 실제 자료 복사본의 홍콩 `hub_note_ko`에 ‘홍콩은 세계 6위 금융 도시다.’를 더하면 `RANK_WITHOUT_BASIS`가 나온다(허용 항목은 원래 문장만 가린다).
  6. 상대 거점 열쇠: 파나마 허용 항목의 `other`를 다른 거점 ID로 바꾸면 `ALLOWLIST_UNUSED`와 원래 `FACT_NAMES_OTHER_HUB`가 함께 나온다.
- **변형 확인(결과 보고에 표로):** 위 ‘목표’의 변형 대조 8행을 자기 구현으로 다시 돌려 같은 결과를 적는다. 다르면 이유를 적는다.

## 완료 조건

- `python3 tools/check_fact_mixing.py` → `PASS … 허용 목록 8건 모두 사용`.
- 사실 섞임 시험 모두 통과. 기존 20개 + 새 6개 이상. 시험 수를 결과 보고에 적는다.
- `bash tools/ai/review_checks.sh --check <BASE>` 통과(모드·검사 수 그대로).
- 결과 보고 `docs/ai/tasks/results/TASK-0048.md`에 다음을 적는다.
  - 바꾼 줄 요약, 변형 대조 표.
  - 시험 수 전후, 기준 커밋.
  - ‘질문’(없으면 ‘없음’).
