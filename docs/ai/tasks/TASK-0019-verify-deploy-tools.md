# TASK-0019 검증·배포 도구: MANIFEST 확인 모드·사실 섞임 검사·정적 배포 준비·브라우저 측정 스크립트 (도구만, 게임 코드 변경 없음)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `medium`
- 선행 작업: 평택 본사 전환(TASK-0015)이 개발 브랜치에 `548c53c`로 반영됐다. 개발 브랜치 `78e28c7` 위에 만든 `codex/TASK-0019`에서 작업한다. 모든 diff·검사 명령의 기준 커밋은 `78e28c7`다.
  - 이 작업이 고치거나 읽는 도구·설정 파일은 평택 구현 스냅숏 `4de152a`와 `78e28c7`가 같고, 자료는 Claude 검수 2차(`80d36bd`)의 출처·보전 기록 정정만 다르다. 아래 Claude 확인값은 `4de152a` 사본과 개발 브랜치 `c6f0d2d`에서 냈다(사실 섞임 원형 결과가 같다).
  - 작업 브랜치는 이 지시서를 올린 커밋에서 시작한다. 그 커밋이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 `git diff 78e28c7` 결과에 나와도 이 작업의 변경으로 치지 않는다.
  - 시작할 때 `git rev-parse HEAD`를 결과 보고에 적는다.
  - TASK-0016·0017·0018은 별도 작업 트리에서 구현됐고 검수 중이다. 이 작업 트리에는 없다. 고치는 파일은 겹치지 않는다.
- 결정 근거:
  - `docs/DESIGN_v0.4.md` 503행: ‘겉보기 현실성 — 합성 항구·가격·직원 값이 실측값으로 표시되지 않음’.
  - `docs/DECISIONS.md` 972행(‘평택 본사 전환’의 위험): 이름만 바꾼 사본에서 검사기는 통과했지만 평택 항목에 부산의 순위·환적 역할·금융 문장이 남았다. ‘검사기는 사실 섞임을 잡지 못한다.’
  - `docs/ai/WORKFLOW.md` 54행(ZIP은 생성물), 78행(review_checks 구성), 119~121행(실제 배율 측정), 125~142행(정적 배포 절차).
  - `docs/ai/tasks/CODEX_PREAMBLE.md` 23~31행: Codex의 마감 검증 다섯 줄에 파이썬 시험이 없다. `tools/ai/review_checks.sh` 14행은 확인이 아니라 MANIFEST 다시 쓰기다.
  - `docs/ai/tasks/results/TASK-0012.md` 99~102행: Sol 샌드박스에서 dev 서버(`listen EPERM`)와 Chromium(`setsockopt`)이 실패했다.
  - 2026-10-09 남은 일 점검 계획의 1차 세션 S5: B21(TPD-07), B22(TPD-10), B23(TPD-09), B24(TPD-27·29). **B23의 규칙은 Claude(총괄)가 이 지시서 ‘사실 섞임 규칙’ 절에 정했다.**

## 목표

검수·배포에 쓰는 도구 네 가지를 저장소에 둔다. 게임 코드·자료·화면은 바꾸지 않는다.

1. **확인 모드(B22):** MANIFEST를 다시 쓰지 않고 맞는지만 보는 `build_package.py --check`, 그리고 그것을 쓰는 `review_checks.sh --check`. 새 검사도 review_checks에 넣는다.
2. **사실 섞임 검사(B23):** 한 도시의 순위·물동량·환적 비율이 다른 도시 문장에 남는 것, 거점 사이 같은 문장, DESIGN 값이 실측 확인 수준을 단 것을 잡는다. 새 파일 `tools/check_fact_mixing.py`.
3. **정적 배포 준비(B24):** 깨끗한 트리 확인 → 빌드 → 배포 폴더(netlify.toml·_headers·robots.txt·version.txt)를 만드는 스크립트. 개발 자료 ZIP은 `dist/` 밖으로 옮긴다.
4. **브라우저 측정(B21):** 실제 배율 7개 프로필로 화면 위치를 재는 스크립트와 시나리오. Claude가 이것으로 TASK-0012 측정값을 다시 잰다.

## Claude가 미리 확인한 사실

`4de152a` 사본과 Claude 환경에서 확인했다. 원형 코드는 저장소에 넣지 않았다.

1. **MANIFEST 범위.** `build_package.py` 12~23행은 루트 파일 6개(`.gitignore` 포함)와 `docs·data·schemas·references·tests·tools` 아래 파일을 **디스크에서** 모두 모은다. git 추적 여부와 무관하고 `__pycache__`·`.pyc`만 뺀다.
   - 그래서 `tools/` 아래 새 파일과 `.gitignore` 변경은 MANIFEST를 바꾼다.
   - 도구의 출력(측정 JSON, 배포 폴더, 글꼴 캐시)을 `tools/` 등 위 폴더에 쓰면 MANIFEST가 더러워진다. 출력은 저장소 밖에 둔다.
2. **자료 검사의 해시 검사.** `validate_data.py` 766~772행은 MANIFEST의 파일마다 존재·해시 2건을 센다. 새 파일 하나에 검사 2건이 는다. 건수가 느는 것은 정상이다.
   - 이 작업의 새 파일은 13개다(`tools/` 아래 12개, 결과 보고 1개). 그래서 끝의 자료 검사는 24,673 + 26 = **24,699건**이어야 한다.
3. **vitest·tsc 범위.** `vite.config.ts`의 `test.include`는 `src/**/*.test.ts`, `tsconfig.json`의 `include`는 `src`·`vite.config.ts`다. `tools/browser/`의 `.mjs`는 vitest·tsc에 잡히지 않는다. vitest 파일·시험 수는 바뀌지 않아야 한다.
4. **ZIP이 지워지는 이유.** Vite의 출력 폴더는 기본값 `dist/`이고 빌드 때 비운다. `build_package.py` 50~53행이 ZIP을 `dist/`에 쓰므로 `npm run build`가 ZIP을 지운다. 순서가 바뀌면 ZIP이 배포 폴더에 섞일 수 있다.
5. **기준 수치.** `4de152a`를 `git archive`로 풀어 돌렸다(vitest·빌드는 `node_modules`를 연결해서).
   - `python3 tools/validate_data.py`: PASS, 24,673건.
   - 파이썬 시험: 그림 도구 21개, 지도(`scripts`) 21개(건너뜀 3), 자료 검사기 19개.
   - `npx vitest run`: 27개 파일·803개 통과. `npm run build`: `index-*.js` 503.59 kB(gzip 116.05 kB). 시작 전에 직접 세어 적고, 다르면 시작 값을 기준으로 삼는다.
6. **사실 섞임 규칙 원형.** 아래 규칙을 저장소 밖 원형으로 `4de152a` 자료에 돌렸다.
   - 허용 목록 없이 결과 8건이 나온다. 모두 ‘허용 목록’ 표의 8건이다. 허용 목록을 넣으면 0건(PASS)이다.
   - 참고값: 문장 약 6,928개, 사실 표지 53개. 문장 수는 잎 문자열을 세는 방식에 따라 조금 다를 수 있다.
   - 6절 시험 3~13·15의 자료 변형을 넣으면 각각 표의 기대 코드가 새로 나왔다.
   - 병합된 개발 브랜치 `c6f0d2d`의 자료에도 같은 원형을 돌렸다. 결과가 같다(허용 목록 없이 같은 8건, 허용 목록을 넣으면 PASS, 문장 약 6,933개·표지 53개, 시험 3~13·15의 기대 코드도 같음). 병합 뒤 허용 목록을 고칠 필요가 없을 것으로 본다.
   - `check_home_city`(`validate_data.py` 409~418행)는 본사 항목에서 ‘7위’·‘환적 화물’·‘TRANSSHIPMENT’만 본다. 새 검사는 모든 거점에 일반 규칙을 쓴다. 겹쳐도 어느 쪽도 지우지 않는다.
7. **브라우저 원형.** Claude 환경(Chromium 141, `/opt/node-tools/node_modules/playwright` 1.56.1)에서 저장소 밖 원형으로 쟀다.
   - `--force-device-scale-factor=<배율>`, `--window-size=<폭>,<높이+87>`, `newContext({ viewport: null })`이면 `innerWidth·innerHeight`가 프로필 값과 같다(1366×657×1, 1024×768×2, 1000×700×2 확인). WORKFLOW 120행의 `<폭>,1000`은 창 높이를 프로필에 맞추지 않는다. 범위 밖 발견으로 적는다.
   - `3b60314` 빌드 값:
     - 하루 진행 뒤 읽던 자리(계약 제목을 막대 30px 위에 둠): −0.4px(1366×657), 0.0px(1024×768).
     - 흐름 3 결과 제목(막대 아래): 터치 43.8~43.9px(5개 프로필), 마우스 36.8px.
     - 현지 탭 위 끝: 175.6~246.2px(7개 프로필).
     - 가로 넘침 0.
   - 평택판 빌드(1000×700 터치): −0.1px, 43.9px, 246.2px, 넘침 0. 같은 선택자로 돈다.
   - TASK-0012 검수 전 Sol 빌드에서 같은 읽던 자리 시나리오는 −1,733.4px(1366×657), −1,910.5px(1024×768)였다. 시나리오가 회귀를 잡는다.
   - 글꼴은 Google Fonts에서 온다(`index.html` 9~11행). 캐시 키 ‘sha1(url + CSS 요청이면 user-agent)’는 Claude의 기존 글꼴 캐시와 같은 방식이다.
8. **Codex 샌드박스 한계.** 포트를 열 수 없고 Chromium이 죽는다(TASK-0012.md 101~102행). 그래서 측정 스크립트는 `context.route`로 `dist`를 직접 내준다(포트 없음). 실제 브라우저 실행 확인은 Claude가 한다.
9. **review_checks 지금 구성(28행).** 8종: manifest(14행, 다시 쓰기), 자료 검사, typecheck, vitest, build, 그림 도구, 지도, 자료 검사기 회귀. 인수 `$1`은 diff 기준이다(25~26행).

## 먼저 읽을 파일

줄 번호는 `4de152a` 기준이다.
- `tools/ai/review_checks.sh` 전체(28행), `tools/build_package.py` 전체(65행), `.gitignore` 전체(10행).
- `tools/validate_data.py`: `check` 21행, `check_home_city` 409~418행, `check_route_schedules` 421행, `check_world_hubs` 444행, MANIFEST 해시 검사 766~772행. 읽기만 한다.
- `tools/test_validate_data.py` 1~10행(시험 파일 형식, `import validate_data as validator`).
- 자료(읽기만):
  - `data/world.json`: `items[]`의 `id`·`name_ko`·`hub_roles`·`hub_note_ko`·`selection_basis[]`(`source_id`·`indicator_ko`·`value_ko`), `sea_gates[]`의 `check_level`·`source_refs`.
  - `data/sources.json`: `kind`·`verification_status`.
  - `data/venues.json`·`contacts.json`·`culture_activities.json`: 항목의 `city_id`와 `_ko` 문장.
  - `data/characters.json`: 항목의 `data_basis`, `recruitment.story_clue`, `conservation.check_level`.
  - `data/routes.json`: `schedule_basis`. `data/game_config.json`: `config.home_city_id`.
- `docs/ai/WORKFLOW.md` 47~54행, 72~86행, 113~142행.
- `docs/ai/tasks/CODEX_PREAMBLE.md` 23~33행.
- `docs/ai/tasks/results/TASK-0012.md` 99~102행, 149행, 167행. `docs/ai/tasks/TASK-0012-culture-ui.md` 535~586행(브라우저 측정 기준 1~8. 기준 2는 552행, 기준 7 흐름 3은 581행, 기준 8은 584행).
- 화면 선택자(읽기만): `src/ui/main.ts` 252행(`.masthead`), 255행(`[data-action="scenario"]`), 267행(`.statusbar`), 273행(`[data-action="end-day"]`), 320행(`[data-action="accept"][data-buy]`), 497행(`contract-h-`). `src/ui/culture.ts` 129행(`#local-tab`), 149행(`culture-result-h-`), 224행(`culture-act`), 231행(`culture-emp`), 233행(`culture-queue`), 234행(`culture-close` `data-where="head"`).
- `vite.config.ts`, `tsconfig.json`, `package.json`, `index.html`. 읽기만 한다.

## 범위

**포함**
1. `tools/build_package.py`: `--check` 모드, ZIP 출력 폴더를 `dist-package/`로.
2. `tools/ai/review_checks.sh`: `--check` 모드, 새 검사 3종 추가, 검사 수 요약.
3. `.gitignore`: `dist-package/` 한 줄.
4. 새 `tools/deploy/prepare_static.sh`.
5. 새 `tools/check_fact_mixing.py`와 `tools/test_check_fact_mixing.py`.
6. 새 `tools/browser/` 아래 파일(프로필 JSON, 공용 모듈, 명령줄, 시나리오 4개, Node 내장 시험, 사용법).
7. 결과 보고 `docs/ai/tasks/results/TASK-0019.md`.

**제외**
- `CODEX_PREAMBLE.md`·`WORKFLOW.md`·`README.md` 수정. 바꿀 문안은 결과 보고에만 적는다(Claude가 병합 때 고친다).
- `package.json`의 `scripts.check`(나중에 Claude), CI(GitHub Actions, 사용자 결정).
- 실제 배포와 Netlify 사이트 이름(B73). 스크립트는 폴더만 만든다.
- `validate_data.py`에 규칙을 넣는 것. 자료(`data/**`)를 고치는 것. 자료가 틀려 보여도 고치지 않고 보고한다.
- 화면 코드, 빌드 해시 표시(B25, TASK-0018), 글꼴 내장(B26), 청크 분할(B27).
- 실기기·WebKit·Firefox 측정.
- 측정 기준 출력 JSON을 저장소에 넣는 것.

**시간이 모자라면 뺄 수 있음** (앞에서부터 뺀다. 뺀 것은 결과 보고 ‘완료 조건 대조’에 적는다)
1. ‘테스트’ 4의 선택 단계(깨끗한 사본). Claude가 검수 때 한다.
2. ‘테스트’ 5의 실제 브라우저 실행 시도.
3. 시나리오 단계 `select`(묶음 시나리오 네 개는 쓰지 않는다). 빼면 `validateScenario`가 모르는 `do`로 거절한다.
4. 완료 조건 9 변형 표의 마지막 네 행(`build_package`·`prepare_static`·`resolveDistPath`·`selectProfiles`). 앞의 여덟 행은 뺄 수 없다.
- 그 밖(구현 지시 1~7, 시험 1~20, `lib.test.mjs`, `runProfile`)은 빼지 않는다. `runProfile`은 샌드박스에서 돌려 보지 못해도 지시대로 쓴다. Claude가 실제 실행으로 확인한다.

## 고칠 수 있는 파일

이 목록 밖의 파일을 만들거나 고치지 않는다.
- `tools/build_package.py`
- `tools/ai/review_checks.sh`
- `.gitignore`
- 새 파일:
  - `tools/deploy/prepare_static.sh`(실행 권한 `chmod +x`)
  - `tools/check_fact_mixing.py`
  - `tools/test_check_fact_mixing.py`
  - `tools/browser/README.md`
  - `tools/browser/profiles.json`
  - `tools/browser/lib.mjs`
  - `tools/browser/measure.mjs`
  - `tools/browser/lib.test.mjs`
  - `tools/browser/scenarios/smoke.json`
  - `tools/browser/scenarios/day-anchor.json`
  - `tools/browser/scenarios/culture-result-flow3.json`
  - `tools/browser/scenarios/local-tab-position.json`
- `docs/ai/tasks/results/TASK-0019.md`
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/**`, `index.html`, `vite.config.ts`(TASK-0018 소유), `package.json`(TASK-0017 소유), `package-lock.json`, `tsconfig.json`.
  - `scripts/**`, `tools/art/**`, `tools/ai/codex_task.sh`, `schemas/**`, `public/**`.
  - `tools/validate_data.py`, `tools/test_validate_data.py`.
  - `data/**`(읽기만), `tests/acceptance_cases.json`, `tests/**`.
- 공통 금지 파일: `docs/DESIGN_v0.4.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `references/**`.
- 새 npm 의존성을 넣지 않는다. `npm install`을 하지 않는다. 파이썬도 표준 라이브러리만 쓴다.

## 지켜야 할 것

- **출력은 저장소 밖.** 측정 JSON, 배포 폴더, 글꼴 캐시, 임시 파일은 `/tmp` 같은 저장소 밖에 둔다. 도구가 저장소 안 출력 경로를 받으면 거절한다. 시험 중 만든 임시 파일은 지운다.
  - 예외는 무시 폴더 두 개뿐이다: Vite 빌드의 `dist/`, `build_package.py` ZIP의 `dist-package/`. 시험이 끝나면 `dist-package/`는 지운다.
- **Git.** 커밋·푸시·브랜치 전환을 하지 않는다. `checkout`·`switch`·`stash`·`reset`·`worktree`를 쓰지 않는다. 읽기용 `rev-parse`·`status`·`show`·`diff`·`ls-files`·`archive`만 쓴다. `git clone`은 ‘테스트’의 선택 단계에서 저장소 밖 사본을 만들 때만 쓴다.
- **ID를 모르는 시험.** `tools/test_check_fact_mixing.py`와 `tools/browser/` 아래 모든 파일(시험·시나리오·README·모듈)에 실제 도시 이름·도시 ID·견적 ID·사건 ID·직원 ID·활동 ID·장소 ID·인물 ID를 쓰지 않는다. 주석·오류 문구에도 쓰지 않는다. 시험은 ID를 자료에서 읽어 쓴다. 완료 조건 10의 ‘ID 검사 명령’이 이것을 확인한다.
  - **예외(이 지시서가 허용):** `check_fact_mixing.py`의 `ALLOWLIST` 상수. 아래 표의 거점 ID·활동 ID를 그대로 쓴다.
- **네트워크.** 웹에 접속하지 않는다. 글꼴 내려받기는 Claude 환경의 측정 실행에서만 일어난다. 샌드박스에서 브라우저를 띄워 볼 때는 `--offline-fonts`를 쓴다. `chainportal.co.kr`에는 접속하지 않는다. robots.txt를 지킨다.
- **글.** 출력 문구와 주석은 한국어로 쓴다. 실제 회사 이름을 출력 문구에 넣지 않는다. 오류 코드 이름(`FACT_…`)은 영어 대문자다.
- **기존 동작 유지.** `build_package.py`의 기존 두 모드(인수 없음, `--manifest-only`)와 `review_checks.sh`의 기본 모드(인수 없이 또는 기준만)는 지금처럼 MANIFEST를 다시 쓴다. Codex 마감 절차가 여기에 기대고 있다.

## 사실 섞임 규칙 (Claude 결정)

이 규칙을 바꾸지 않는다. 규칙대로 구현했는데 결과가 이상하면 고치지 말고 결과 보고 ‘질문’에 적는다.

### 사실 표지

한 문장 안에서 다음을 찾는다. 찾은 글자를 ‘표지’라 한다.

| 종류 | 정규식(Python) | 정규화 |
|---|---|---|
| RANK 순위 | `(?<![0-9.,])(?:(전국\|국내)\s?)?([0-9]{1,3})\s?위(?![치험해원반쪽])` | 범위어가 있으면 `'<범위어> <N>위'`, 없으면 `'<N>위'` |
| QTY 물동량 | `(?<![0-9.,])[0-9][0-9,.]*\s?(?:만\|억)?\s?(?:TEU\|R/T\|운임톤\|dwt)` | 공백을 한 칸으로 |
| SHARE 비율 | `(?<![0-9.,])[−-]?[0-9]+(?:\.[0-9]+)?\s?%` — **같은 문장에** `환적\|비중\|점유\|물동량`이 있을 때만 | 공백을 한 칸으로 |
| CLAIM 국내 최상 주장 | `(전국\|국내)\s?(최대\|최다)` | 공백을 한 칸으로 |

(표의 `\|`는 정규식의 `|`다.)
- RANK의 `(?![치험해원반쪽])`는 ‘위치·위험·위해·위원·위반·위쪽’을 거른다.
- 문장 나누기: `re.split(r'(?<=[.!?。])\s+|\n+', 문자열)`. 앞뒤 공백을 지우고 빈 조각을 버린다.

### 문장의 주인

`data/*.json`의 **모든 문자열 잎**(키 이름과 무관)을 문장으로 나눠 주인을 정한다.
- `world.json`의 `items[]` 항목 → 그 거점(`id`).
- `world.json`의 `sea_gates[]` 항목 → 그 해역 관문(`id`). 관문은 거점이 아니다.
- `world.json`의 나머지 머리 키(`hub_selection_rule_ko` 등) → 주인 없음.
- `venues.json`·`contacts.json`·`culture_activities.json`의 `items[]` 항목 → 항목의 `city_id` 거점. `city_id`가 world 거점이 아니면 `UNKNOWN_CITY_ID` 하나를 내고 그 항목의 문장은 주인 없음으로 다룬다. 이 세 파일의 머리 키는 주인 없음.
- `sources.json` → **검사하지 않는다**(출처 설명은 여러 도시 값을 함께 적는다).
- 그 밖의 모든 파일(`characters.json`, `scenarios.json`, `market_offers.json`, `routes.json` 등) → 주인 없음.

각 문장 단위는 `(file, record, field, 주인, 주인 종류, 문장)`을 가진다.
- `record`: 항목의 `id`(항목 밖이면 `None`).
- `field`: 항목 안 경로. 배열 번호를 빼고 키를 점으로 잇는다. 예: `hub_note_ko`, `selection_basis.value_ko`, `report_ko.open_question_ko`, `observations_ko`.

### 거점 별칭

- 각 거점의 `name_ko`를 `·`, `(`, `)`로 나눈 2글자 이상 조각. 한글 조각은 부분 문자열로 찾는다(‘부산항’ 안의 ‘부산’도 맞다).
- 거점 `id`(ASCII)는 단어 경계 `\b`로 찾는다.

### 규칙과 결과 코드

| 코드 | 규칙 |
|---|---|
| `FACT_OUTSIDE_HUB_TEXT` | 주인 없는 문장에 표지가 있다. 도시 고유 사실은 그 도시의 world 항목, 그 도시의 장소·인물·문화 문장, `sources.json`에만 둔다. |
| `FACT_NAMES_OTHER_HUB` | 주인이 거점이나 관문인 문장에 표지가 있고, **다른 거점**의 별칭이 같은 문장에 있다. 관문 문장에서는 모든 거점이 ‘다른 거점’이다. |
| `FACT_NOT_IN_OWN_ENTRY` | 장소·인물·문화 문장(세 파일)의 표지가 그 도시의 OWN 집합에 없다. OWN(h) = 거점 h의 world 항목 모든 문자열에서 뽑은 정규화 표지. RANK는 범위어를 뺀 `'<N>위'`도 함께 넣는다. |
| `RANK_WITHOUT_BASIS` | world 항목의 `hub_note_ko`에 있는 RANK 표지 가운데 범위어(전국·국내)가 없는 것의 숫자가, 같은 거점 `selection_basis[].value_ko`에서 뽑은 RANK 숫자들에 없다. |
| `FACT_SHARED_BETWEEN_HUBS` | (a) QTY·SHARE 표지(정규화)가 두 거점 이상의 world 항목에 있다. (b) `selection_basis`의 `(source_id, indicator_ko, value_ko)`가 두 거점 이상에서 같다. |
| `SENTENCE_SHARED_BETWEEN_HUBS` | 아래 문장 필드에서 정규화한 같은 문장이 두 거점 이상에 있다. 정규화: 공백을 한 칸으로. 대상: 공백을 뺀 15자 이상이고 한글이 있는 문장. 문장 필드: world `hub_note_ko`, contacts `information_scope_ko`·`individual_request_ko`, culture `observations_ko`·`report_ko.finding_ko`·`report_ko.scope_ko`·`report_ko.not_claimed_ko`·`report_ko.open_question_ko`. |
| `DESIGN_WITH_OBSERVED_LEVEL` | 한 객체(dict)에 DESIGN 표시와 실측 확인 수준이 함께 있다(정의는 아래). `sources.json`은 이 규칙 대신 다음 규칙을 쓴다. |
| `DESIGN_SOURCE_LEVEL` | `sources.json` 항목의 `kind == 'project_design'`과 `verification_status`가 `LOCAL_DESIGN`으로 시작하는 것이 서로 다르다(한쪽만 참). |
| `DESIGN_AS_OBSERVED` | 실측 근거 객체가 인용하는 출처(`source_id`와 `source_refs`)가 하나 이상이고 **모두** `kind == 'project_design'`이다. 실측 근거 객체: 실측 확인 수준이 있는 객체, `source_id`와 `value_ko`를 함께 가진 객체(`selection_basis` 항목), `schedule_basis` 키의 값. `sources.json`은 제외. `sources.json`에 없는 ID는 이 규칙에서 건너뛴다(자료 검사기가 본다). |
| `UNKNOWN_CITY_ID` | 위 ‘문장의 주인’ 참고. |
| `ALLOWLIST_UNUSED` | 허용 목록 항목이 이번 실행의 어떤 결과와도 맞지 않는다. 낡은 항목을 지우게 한다. |

- **DESIGN 표시:** 같은 객체의 키 K와 문자열 값 V가 다음 가운데 하나다.
  - K가 `data_basis`·`basis`이거나 `_basis`로 끝나고, V가 `DESIGN`이거나 `DESIGN_`으로 시작.
  - K가 `status`로 끝나고 V가 `DESIGN_`으로 시작(예: `DESIGN_not_actual_destination_tariff`).
- **실측 확인 수준:** 같은 객체에
  - `verification_status`가 있고 값이 `LOCAL_DESIGN`으로 시작하지 않으며 `NOT_VERIFIED`가 아니다. 또는
  - `check_level`이 공백이 아닌 문자열이고, `author_knowledge`가 아니며 `작성자 지식`으로 시작하지 않는다.
- 같은 키 `(code, file, record, field, token)`의 결과는 하나로 합친다(첫 문장을 남긴다).
- `FACT_SHARED_BETWEEN_HUBS`·`SENTENCE_SHARED_BETWEEN_HUBS`의 키: `file` = 관련 파일 이름을 정렬해 쉼표로 이은 값, `record` = 관련 거점 ID를 정렬해 쉼표로 이은 값, `field` = `''`, `token` = (a) 정규화 표지, (b) `'<source_id> / <indicator_ko> / <value_ko>'`, 문장 규칙은 정규화한 문장 전체.
- `DESIGN_*`의 키: `record` = 가장 가까운 상위 객체의 `id`(없으면 `None`), `field` = 파일 머리부터의 경로(배열 번호 없이), `token` = `''`. `DESIGN_SOURCE_LEVEL`은 `record` = 출처 ID, `field` = `verification_status`, `token` = 그 값.

### 알려진 한계 (고치지 않고 결과 보고에 적는다)

- RANK 대조는 숫자만 본다. 우연히 같은 숫자는 통과한다(예: 로테르담 `hub_note_ko`의 ‘2위 앤트워프’는 자기 근거 ‘해양 도시 종합 2위’와 숫자가 같아 통과한다).
- 거점을 지우고 이름만 바꾼 사본은 비교할 상대가 없어서 잡지 못한다. 그 경우는 `check_home_city`와 검수 grep이 맡는다.

### 허용 목록 (초기 8건)

`check_fact_mixing.py`의 모듈 상수 `ALLOWLIST`(dict 목록)에 그대로 넣는다. 키 여섯 개가 모두 있어야 한다.

| code | file | record | field | token | reason |
|---|---|---|---|---|---|
| `RANK_WITHOUT_BASIS` | `world.json` | `PYEONGTAEK` | `hub_note_ko` | `8위` | 서울의 국제 금융센터 지수 순위다. 서울은 지도 거점이 아니며 본사 금융 설명에만 쓴다. |
| `RANK_WITHOUT_BASIS` | `world.json` | `SHANGHAI` | `hub_note_ko` | `3위` | 인접 닝보·저우산항의 세계 컨테이너항 순위다. 상하이 권역으로 묶는 이유를 설명한다. |
| `RANK_WITHOUT_BASIS` | `world.json` | `SINGAPORE` | `hub_note_ko` | `10위` | 인접 포트클랑의 세계 컨테이너항 순위다. 싱가포르 권역 설명이다. |
| `RANK_WITHOUT_BASIS` | `world.json` | `HONG_KONG` | `hub_note_ko` | `6위` | 인접 광저우의 세계 컨테이너항 순위다. 홍콩 권역으로 묶는 이유를 설명한다. |
| `RANK_WITHOUT_BASIS` | `world.json` | `MUMBAI` | `hub_note_ko` | `1위` | 문드라항의 인도 총화물량 순위다. 컨테이너와 총화물 기준이 다르다는 설명이다. |
| `RANK_WITHOUT_BASIS` | `world.json` | `ROTTERDAM` | `hub_note_ko` | `3위` | 인접 함부르크의 순위다. 로테르담 권역으로 묶는 이유를 설명한다. |
| `FACT_NAMES_OTHER_HUB` | `world.json` | `PANAMA` | `selection_basis.value_ko` | `1위` | 콜론항이 라틴아메리카 1위를 산투스에 내준 순위 변화 설명이다. 산투스의 값을 파나마의 사실로 쓰지 않는다. |
| `FACT_NOT_IN_OWN_ENTRY` | `culture_activities.json` | `CA02` | `report_ko.open_question_ko` | `1위` | 본사 항만의 사실이 아니라 ‘1위 항만과의 차이’를 묻는 열린 질문이다. 값을 주장하지 않는다. |

- 허용 목록 오류(종료 코드 2, 결과가 아니라 설정 오류로 본다): 키 누락, `reason`이 비었거나 공백뿐, 같은 키 `(code, file, record, field, token)` 중복, ‘규칙과 결과 코드’ 표의 11개 코드가 아닌 `code`.
- 허용 목록 항목 하나는 같은 키의 결과를 모두 지운다.

## 구현 지시

### 1. `tools/build_package.py`

- 함수로 나눈다. 동작이 같으면 모양은 바꿔도 된다.
  - `source_files()` — 지금 그대로.
  - `build_manifest(status: dict, files: list[Path]) -> dict` — 지금 32~42행의 dict.
  - `manifest_text(manifest: dict) -> str` — 지금과 같은 직렬화 `json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'`.
  - `manifest_differences(current: dict, expected: dict) -> list[str]` — 차이 줄 목록.
  - `check_manifest() -> int` — `--check`의 본체.
- 인수: `--manifest-only`와 `--check`는 함께 쓸 수 없다(`argparse`의 상호 배타 묶음).
- `--check`
  - 아무 파일도 쓰지 않는다. `validate_data.py`도 돌리지 않는다.
  - 디스크로 기대 MANIFEST를 만든다. 지금 `MANIFEST.json`의 바이트가 `manifest_text(기대)`와 같으면 `MANIFEST 일치: <N>개 파일`을 찍고 0으로 끝난다.
  - 다르면 차이 줄을 경로 순서로 찍고, 마지막 줄 `MANIFEST 불일치 — python3 tools/build_package.py --manifest-only로 다시 만든다`를 찍은 뒤 1로 끝난다. 차이 줄 형식:
    - `머리 값 다름: <키> <현재> → <기대>` (`files` 밖의 키)
    - `목록에 없음(추가 필요): <경로>`
    - `디스크에 없음(빼야 함): <경로>`
    - `해시·크기 다름: <경로>`
    - 차이 목록은 비었는데 바이트만 다르면(들여쓰기·순서) `형식만 다름`.
  - `MANIFEST.json`이 없거나 JSON이 깨졌으면 그 사실을 한 줄로 찍고 1.
- ZIP 출력 폴더를 `ROOT / 'dist-package'`로 바꾼다(상수 `PACKAGE_DIR`). 이름·내용·무결성 확인은 그대로다. 출력 문구 `Created …`도 그대로다.
- 기존 두 모드의 나머지 동작과 문구(`Manifest refreshed: N source files`)는 바꾸지 않는다.

### 2. `tools/ai/review_checks.sh`

- 첫 주석 3줄은 그대로 두고, 사용법 주석을 더한다.
  - `사용법: tools/ai/review_checks.sh [--check] [기준]`
  - `--check: MANIFEST.json을 다시 쓰지 않고 확인만 한다. 검사 전후 작업 트리 상태가 같은지도 본다.`
- 인수 해석: 순서와 무관하다. `--check`는 모드, `-h`·`--help`는 사용법을 찍고 0. 그 밖의 `-`로 시작하는 인수는 `알 수 없는 옵션`과 사용법을 찍고 2. 위치 인수는 0개 또는 1개(기준, 기본 `HEAD`). 2개 이상이면 2.
- `run` 함수의 출력 형식(`▶`, `통과`, `실패 (…)`)과 키 변수 제거는 그대로 두고, 검사 수(`total`)와 실패 수(`fails`)를 세게 한다.
- 검사 순서:
  1. 기본 모드 `run python3 tools/build_package.py --manifest-only`, 확인 모드 `run python3 tools/build_package.py --check`
  2. `run python3 tools/validate_data.py`
  3. `run npm run --silent typecheck`
  4. `run npx vitest run`
  5. `run npm run --silent build`
  6. `run python3 tools/art/test_pixel_tools.py`
  7. `run python3 -m unittest discover -s scripts -p 'test_*.py'`
  8. `run python3 tools/test_validate_data.py`
  9. `run python3 tools/check_fact_mixing.py` (새)
  10. `run python3 tools/test_check_fact_mixing.py` (새)
  11. `run node --test tools/browser/lib.test.mjs` (새)
- 확인 모드에서는 1 전에 작업 트리 상태를 저장하고, 11 뒤에 다시 비교한다(12번째 검사로 센다).
  - 상태는 아래 함수의 출력이다. `git status`만 보면 이미 바뀐 파일(` M`)이 또 바뀌어도 같은 줄이라 못 잡는다. 그래서 diff와 추적하지 않는 파일의 해시도 함께 본다. 이렇게 해야 Codex의 더러운 트리에서도 시험이 뜻을 가진다.
    ```bash
    tree_state() {
      git status --porcelain=v1 --untracked-files=all
      git diff --binary HEAD | sha256sum
      git ls-files --others --exclude-standard -z | xargs -0 -r sha256sum
    }
    ```
  - 같으면 `▶ 작업 트리 변화 없음` `통과`.
  - 다르면 `실패 (검사가 작업 트리를 바꿨다)`와 두 출력의 차이(`diff`)를 찍는다.
- 끝에 `검사 <total>종, 실패 <fails>종 (모드: 수정|확인)`을 찍고, 지금처럼 `변경 요약 (기준: <기준>)`과 `git diff --stat <기준>`, 추적하지 않는 파일 목록을 찍는다. 종료 코드는 실패가 있으면 1이다.

### 3. `.gitignore`

- `dist/` 다음 줄에 `dist-package/`를 더한다. 다른 줄은 바꾸지 않는다.

### 4. `tools/deploy/prepare_static.sh` (새, 실행 권한)

- 사용법: `tools/deploy/prepare_static.sh <출력 폴더> [--allow-dirty]`. 인수 순서는 자유다. `-h`·`--help`는 사용법을 찍고 0.
- `#!/usr/bin/env bash`, `set -euo pipefail`.
- 저장소 위치는 **현재 디렉터리의** `git rev-parse --show-toplevel`로 정한다(스크립트 파일 위치가 아니다). git 저장소가 아니면 2.
- 출력 폴더 인수는 `cd` **전에** 호출한 곳 기준으로 `realpath -m` 절대 경로로 바꾼다. 그 뒤 저장소 루트로 `cd`한다.
- 종료 코드: 0 성공, 2 사용법·출력 경로 문제, 3 깨끗하지 않은 트리, 4 빌드·dist 문제.
- 순서:
  1. **출력 경로.** 위에서 만든 절대 경로가 저장소 루트이거나 그 아래면 거절(2): `출력 폴더는 저장소 밖이어야 합니다`. 이미 있고 비어 있지 않으면 거절(2): `출력 폴더가 비어 있지 않습니다. 지우지 않습니다`. 폴더가 아닌 파일이면 거절(2). 폴더는 아직 만들지 않는다(7에서 만든다). 그래서 거절된 실행은 아무것도 남기지 않는다.
  2. **깨끗함.** `git status --porcelain=v1 --untracked-files=normal`(무시 파일은 세지 않음)이 비어 있지 않으면:
     - `--allow-dirty`가 없으면 앞 20줄과 `작업 트리가 깨끗하지 않습니다. 커밋한 뒤 다시 실행하세요`를 찍고 3.
     - 있으면 `tree=dirty`로 두고 `경고: 깨끗하지 않은 트리입니다. 배포용이 아닙니다`를 찍는다.
     - 비어 있으면 `tree=clean`.
  3. `node_modules`가 없으면 `node_modules가 없습니다(원본 node_modules를 cp -r로 복사하세요)`를 찍고 4.
  4. 빌드 전 `git status --porcelain=v1 --untracked-files=all`을 저장한다. `npm run --silent build`를 돌린다. 실패하면 4.
  5. `dist/index.html`이 없으면 4. `dist` 안에 `*.zip`이 하나라도 있으면 그 목록을 찍고 4.
  6. 빌드 뒤 같은 `git status` 출력이 빌드 전과 다르면 `빌드가 작업 트리를 바꿨습니다`를 찍고 4.
  7. 출력 폴더를 만들고(`mkdir -p`) `cp -R dist/. "<출력>/"`.
  8. 아래 네 파일을 LF 줄바꿈으로 쓴다.
     - `netlify.toml`
       ```
       [build]
         publish = "."
         command = ""
       ```
     - `_headers`
       ```
       /*
         X-Robots-Tag: noindex, nofollow
       ```
     - `robots.txt`
       ```
       User-agent: *
       Disallow: /
       ```
     - `version.txt`(키 순서 고정)
       ```
       commit: <git rev-parse HEAD, 40자>
       commit_date: <git show -s --format=%cI HEAD>
       built_at: <date -u +%Y-%m-%dT%H:%M:%SZ>
       tree: clean | dirty
       package_version: <PACKAGE_STATUS.json의 package_version>
       ```
       `package_version`은 `python3 -c`나 `node -e`로 JSON을 읽어 얻는다.
  9. 요약을 찍는다: 출력 폴더, 파일 수, 크기(`du -sh`), commit, tree. 마지막 줄: `배포는 Claude가 한다(WORKFLOW ‘시험 빌드 정적 배포’). 이 스크립트는 올리지 않는다.`
  - 스크립트가 찍는 문구에는 문서 줄 번호를 넣지 않는다. 병합 때 WORKFLOW 줄 번호가 바뀐다.
- Netlify 명령을 부르지 않는다. 저장소 안에는 `dist/`(무시 파일) 말고는 쓰지 않는다.

### 5. `tools/check_fact_mixing.py` (새)

- 표준 라이브러리만 쓴다. `validate_data.py`를 import하지 않는다.
- 위 ‘사실 섞임 규칙’ 절을 그대로 구현한다. 정규식은 모듈 상수로 둔다(`RANK_RE`, `QTY_RE`, `SHARE_RE`, `SHARE_CONTEXT_RE`, `CLAIM_RE`, `SENTENCE_SPLIT_RE`).
- 공개 함수(시험이 쓴다):
  - `load_documents(root: Path) -> dict[str, Any]` — `root/'data'/*.json`을 파일 이름(`'world.json'`) 키로 읽는다.
  - `split_sentences(text: str) -> list[str]`
  - `fact_tokens(sentence: str) -> list[Token]` — `Token(kind, text, scope, number)`. `scope`와 `number`는 RANK만 채운다.
  - `hub_aliases(world: dict) -> dict[str, set[str]]`
  - `collect_units(docs: dict) -> tuple[list[TextUnit], list[Finding]]` — 둘째 값은 `UNKNOWN_CITY_ID`.
  - `check_documents(docs: dict, allowlist: list[dict] | None = None) -> list[Finding]` — 허용 목록(`None`이면 `ALLOWLIST`, `[]`이면 없음)을 적용하고 `ALLOWLIST_UNUSED`까지 붙인 최종 결과. 필수 문서는 `world.json`·`sources.json`뿐이고, 없는 다른 파일은 건너뛴다(합성 자료 시험용).
  - `validate_allowlist(allowlist: list[dict]) -> None` — 문제가 있으면 `AllowlistError`를 던진다. `check_documents`가 먼저 부른다.
  - `main(argv: list[str] | None = None) -> int`
- `Finding`은 `code, file, record, field, token, sentence, message` 필드를 가진 dataclass다. `key()`는 `(code, file, record, field, token)`.
- 결과 순서: `(code, file, str(record), field, token)` 정렬. 같은 입력이면 출력이 바이트까지 같다.
- 메시지(한국어, 한 줄):
  - `FACT_OUTSIDE_HUB_TEXT`: `거점 항목·그 도시 문장·출처 밖에 도시 고유 사실이 있다`
  - `FACT_NAMES_OTHER_HUB`: `다른 거점(<ID>)의 이름과 사실이 한 문장에 있다`
  - `FACT_NOT_IN_OWN_ENTRY`: `이 도시 문장의 사실이 그 도시 world 항목에 없다`
  - `RANK_WITHOUT_BASIS`: `순위가 자기 selection_basis에 없고 전국·국내 범위도 없다`
  - `FACT_SHARED_BETWEEN_HUBS`: `같은 물동량·비율 값이나 같은 선정 근거가 여러 거점에 있다`
  - `SENTENCE_SHARED_BETWEEN_HUBS`: `같은 문장이 여러 거점에 있다`
  - `DESIGN_WITH_OBSERVED_LEVEL`: `DESIGN 표시와 실측 확인 수준이 한 객체에 함께 있다`
  - `DESIGN_SOURCE_LEVEL`: `설계 출처의 종류와 확인 수준이 맞지 않는다`
  - `DESIGN_AS_OBSERVED`: `실측 근거가 설계 출처만 인용한다`
  - `UNKNOWN_CITY_ID`: `city_id가 world 거점이 아니다`
  - `ALLOWLIST_UNUSED`: `허용 목록 항목이 어떤 결과와도 맞지 않는다(지우거나 고친다)`
- 명령줄: `python3 tools/check_fact_mixing.py [--root <저장소>] [--json]`.
  - `--root` 기본값은 이 파일의 상위 폴더(`Path(__file__).resolve().parents[1]`).
  - 통과: `PASS: 사실 섞임 검사 — 자료 <D>개, 문장 <S>개, 사실 표지 <T>개, 허용 목록 <A>건 모두 사용`. 종료 0.
  - 실패: 결과마다 `FAIL <code> <file> <record> <field> 「<token>」 — <message> | <문장 앞 80자>`, 마지막 줄 `<n>건 실패`. 종료 1.
  - 허용 목록 오류·자료 파일 없음: 한국어 한 줄, 종료 2.
  - `--json`: 결과 목록을 JSON 배열로 찍는다(통과면 `[]`). 종료 코드는 같다.

### 6. `tools/test_check_fact_mixing.py` (새)

- `unittest` 형식. `tools/test_validate_data.py`처럼 `import check_fact_mixing as checker`로 불러 스크립트로 돈다(`python3 tools/test_check_fact_mixing.py`).
- 실제 자료 시험은 `copy.deepcopy(checker.load_documents(ROOT))`를 바꿔 `check_documents`에 넣는다. 기준(바꾸기 전) 결과가 `[]`이므로 결과 코드 집합에 기대 코드가 **있는지** 단언한다.
- 거점·출처 선택은 자료에서 읽는다(ID를 쓰지 않는다).
  - `home` = `game_config.json`의 `config.home_city_id`.
  - `other` = `world.json` `items` 순서에서 `home`이 아니고, `selection_basis`에 RANK 숫자가 `home` world 항목 전체(`hub_note_ko` 포함)의 RANK 숫자에 없는 항목이 있는 첫 거점. 그 `selection_basis` 항목을 `other_sb`라 한다. (`4de152a`에서는 ‘세계 컨테이너항 순위 7위’가 고른 값이다. 시험에는 이 글자를 쓰지 않는다.)
  - 설계 출처 = `sources.json`에서 `kind == 'project_design'`인 첫 항목.
- 꼭 넣을 시험(이름은 자유, 한국어 docstring):

| # | 바꾸는 것 | 기대 코드 |
|---|---|---|
| 1 | 없음(저장소 자료 그대로) | 결과 `[]`, 허용 목록 8건이 모두 쓰임 |
| 2 | `ALLOWLIST` 모든 항목의 `reason`이 공백 아닌 문자열 | — |
| 3 | `home` `hub_note_ko` 끝에 `f" {other_sb['indicator_ko']} {other_sb['value_ko']}다."` | `RANK_WITHOUT_BASIS` (계획의 ‘평택 항목에 7위를 넣으면 FAIL’) |
| 4 | `home` `hub_note_ko` 끝에, 다른 거점 `hub_note_ko` 가운데 표지와 자기 별칭이 함께 들고 공백을 뺀 15자 이상인 첫 문장 | `FACT_NAMES_OTHER_HUB`, `SENTENCE_SHARED_BETWEEN_HUBS`. 그 문장에 QTY·SHARE 표지가 있으면 `FACT_SHARED_BETWEEN_HUBS`도(`4de152a`에서는 있다) |
| 5 | `city_id == home`인 첫 문화 활동의 `report_ko.finding_ko` 끝에 `other_sb['value_ko']`가 든 문장 | `FACT_NOT_IN_OWN_ENTRY` |
| 6 | `recruitment.story_clue`가 있는 첫 동료의 그 문장 끝에, `home` world 항목의 첫 표지가 든 문장 | `FACT_OUTSIDE_HUB_TEXT` |
| 7 | `other_sb`를 그대로 `home` `selection_basis`에 더함 | `FACT_SHARED_BETWEEN_HUBS` |
| 8 | `home`이 아닌 거점 둘의 `hub_note_ko` 끝에 같은 문장 `' 이 문장은 두 거점에 똑같이 들어간 시험 문장이다.'` | `SENTENCE_SHARED_BETWEEN_HUBS` |
| 9 | 첫 문화 활동 항목에 `check_level: 'web_search_summary'` | `DESIGN_WITH_OBSERVED_LEVEL` |
| 10 | (a) 설계 출처의 `verification_status`를 `CONTENT_READ`로 (b) 설계가 아닌 첫 출처를 `LOCAL_DESIGN`으로 (`subTest` 둘) | `DESIGN_SOURCE_LEVEL` |
| 11 | `other_sb`의 `source_id`를 설계 출처 ID로 | `DESIGN_AS_OBSERVED` |
| 12 | `schedule_basis`가 있는 첫 노선의 `schedule_basis.source_refs`를 `[설계 출처 ID]`로 | `DESIGN_AS_OBSERVED` |
| 13 | 허용 목록에 아무것과도 안 맞는 항목 `{'code': 'RANK_WITHOUT_BASIS', 'file': 'world.json', 'record': home, 'field': 'hub_note_ko', 'token': '999위', 'reason': '시험'}`을 더함 | `ALLOWLIST_UNUSED` |
| 14 | 허용 목록 오류: `reason` `''`·`'  '`, 키 누락, 같은 키 두 번, 모르는 `code` (`subTest` 다섯) | `AllowlistError` |
| 15 | 첫 장소의 `city_id`를 `'NO_SUCH_CITY'`로 | `UNKNOWN_CITY_ID` |

- 합성 자료 시험(실제 도시 이름·ID 없이, 거점 `HUB_A`·`HUB_B`, 이름 `가람항`·`나루항`, 관문 `GATE_X`처럼 지어낸 값만). `check_documents(docs, allowlist=[])`로 부른다(기본 허용 목록은 실제 자료용이라 `ALLOWLIST_UNUSED`가 난다):
  - 16 `fact_tokens`(수치도 지어낸 값만 쓴다): `'처리량은 전국 6위(약 12.3만 TEU)다'` → RANK `'전국 6위'`, QTY `'12.3만 TEU'`. `'3위치'`·`'위험'`·`'단위'`·`'범위'`·`'20피트'`는 표지 없음. `'약 41%가 환적 화물이다'`는 SHARE, `'시너지 10%까지'`는 표지 없음. `'국내 최대 항만'`은 CLAIM.
  - 17 `split_sentences`: 마침표 뒤 공백·줄바꿈에서 나누고 `'12.3만'`의 점에서는 나누지 않는다.
  - 18 관문: 관문 문장에 표지만 있으면 결과 없음. 관문 문장에 거점 이름과 표지가 함께 있으면 `FACT_NAMES_OTHER_HUB`.
  - 19 범위어: `hub_note_ko`의 `'전국 3위'`는 `selection_basis`가 비어도 통과하고, `'3위'`는 `RANK_WITHOUT_BASIS`.
  - 20 명령줄: 임시 폴더에 `data/`를 복사해 `main(['--root', 임시])`가 0, 시험 3처럼 바꾼 복사본은 1, `--json` 출력이 JSON 배열. 임시 폴더는 지운다.

### 7. 브라우저 측정 (`tools/browser/`, 새)

**7-1. `profiles.json`** — 아래 내용 그대로.

```json
{
  "schema": "scitrade-browser-profiles/1",
  "note_ko": "WORKFLOW ‘화면 배율 측정’: --force-device-scale-factor와 viewport null로 실제 배율을 띄운다. 창 높이는 화면 높이 + chrome_pad_px.",
  "chrome_pad_px": 87,
  "profiles": [
    { "id": "l1366", "label_ko": "1366×657 마우스", "width": 1366, "height": 657, "scale": 1, "touch": false },
    { "id": "cb1366t", "label_ko": "1366×657 터치", "width": 1366, "height": 657, "scale": 1, "touch": true },
    { "id": "ipadAirL", "label_ko": "1180×820 터치", "width": 1180, "height": 820, "scale": 2, "touch": true },
    { "id": "ipadminiL", "label_ko": "1024×768 터치", "width": 1024, "height": 768, "scale": 2, "touch": true },
    { "id": "ipadmini6L", "label_ko": "1133×744 터치", "width": 1133, "height": 744, "scale": 2, "touch": true },
    { "id": "l1920", "label_ko": "1920×969 마우스", "width": 1920, "height": 969, "scale": 1, "touch": false },
    { "id": "t1000", "label_ko": "1000×700 한 열 터치", "width": 1000, "height": 700, "scale": 2, "touch": true }
  ]
}
```

**7-2. 시나리오 JSON 형식**

```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "<파일 이름과 같음>",
  "title_ko": "...",
  "source_ko": "근거 문서와 줄",
  "profiles": "all | touch | mouse | [\"id\", ...]",
  "bar_selector": ".statusbar",
  "ready_selector": "[data-action=\"end-day\"]",
  "end_day_selector": "[data-action=\"end-day\"]",
  "steps": [ ... ],
  "expect": [ { "value": "<measure 이름>", "min": 0, "max": 0, "profiles": "all", "source_ko": "..." } ]
}
```
- `bar_selector`·`ready_selector`·`end_day_selector`·`expect`는 빼도 된다. 기본값은 위와 같고 `expect` 기본값은 `[]`다.
- 단계(`do`):

| do | 필드 | 동작 |
|---|---|---|
| `tap` | `selector`, `index`(기본 0) | 560ms 기다린다(500ms 두 번 누름 막기). `querySelectorAll(selector)[index]`의 점(가로 가운데, 위 끝 + min(높이/2, 20))을 누른다. 그 점의 `elementFromPoint`가 요소나 그 자손이 아니면 `scrollIntoView({block:'center'})` 뒤 100ms 기다려 다시 본다. 그래도 가려지면 단계 실패. 터치 프로필은 `page.touchscreen.tap`, 아니면 `page.mouse.click`. 누른 뒤 80ms 기다린다. Playwright의 자동 스크롤 클릭(`locator.click`)을 쓰지 않는다. |
| `end-day` | `times`(기본 1) | `end_day_selector`를 `tap`으로 `times`번 누른다. |
| `select` | `selector`, `value` | `page.selectOption` 뒤 300ms. 확인 대화상자는 늘 수락한다. |
| `scroll-top` | — | `window.scrollTo(0, 0)` 뒤 100ms. |
| `scroll-to` | `selector`, `offset_from_bar` | 요소 위 끝이 `막대 아래 끝 + offset_from_bar`에 오도록 `window.scrollBy`, 뒤 200ms. |
| `wait` | `ms` | 기다린다. |
| `remember` | `name`, `selector` | 요소의 `id`(비었으면 단계 실패), 위 끝, `scrollY`를 기억한다. 화면은 다시 그리면 요소가 바뀌므로 다음에는 `id`로 찾는다. |
| `measure` | `name`, `what`, `selector` 또는 `ref` | 아래 값을 0.1px로 반올림해 `values[name]`에 넣는다. |

- `measure`의 `what`:
  - `top`: 요소 위 끝(화면 기준). `height`: 요소 높이.
  - `top-from-bar`: 요소 위 끝 − 막대 아래 끝.
  - `moved`: `ref` 요소의 지금 위 끝 − 기억한 위 끝.
  - `scroll-y-change`: 지금 `scrollY` − `ref`를 기억할 때의 `scrollY`.
  - `overflow-x`: `document.scrollingElement.scrollWidth − innerWidth`.
  - `bar-bottom`: 막대 아래 끝.
- 요소가 없으면 단계 실패. 단계 실패는 그 프로필 실행만 멈춘다. 메시지에 단계 번호·`do`·선택자를 넣는다.

**7-3. 시나리오 네 개** — 내용 그대로(공백은 자유).

`scenarios/smoke.json`
```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "smoke",
  "title_ko": "첫 화면과 하루 진행 뒤 가로 넘침",
  "source_ko": "TASK-0012 지시서 584행 브라우저 측정 기준 8(가로 넘침 0)",
  "profiles": "all",
  "steps": [
    { "do": "measure", "name": "overflow_x_day1", "what": "overflow-x" },
    { "do": "measure", "name": "bar_bottom_day1", "what": "bar-bottom" },
    { "do": "end-day", "times": 1 },
    { "do": "measure", "name": "overflow_x_day2", "what": "overflow-x" }
  ],
  "expect": [
    { "value": "overflow_x_day1", "min": 0, "max": 0, "profiles": "all", "source_ko": "기준 8" },
    { "value": "overflow_x_day2", "min": 0, "max": 0, "profiles": "all", "source_ko": "기준 8" }
  ]
}
```

`scenarios/day-anchor.json`
```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "day-anchor",
  "title_ko": "계약 본문을 읽다 하루 진행: 읽던 자리 유지(패널 닫힘)",
  "source_ko": "TASK-0012 결과 보고 149행 B1: 수정 뒤 −0.4~+0.4px(수정 전 −1,668~−1,906px)",
  "profiles": "all",
  "steps": [
    { "do": "tap", "selector": "[data-action=\"accept\"][data-buy]" },
    { "do": "end-day", "times": 2 },
    { "do": "scroll-to", "selector": "[id^=\"contract-h-\"]", "offset_from_bar": -30 },
    { "do": "remember", "name": "contract", "selector": "[id^=\"contract-h-\"]" },
    { "do": "end-day", "times": 1 },
    { "do": "wait", "ms": 350 },
    { "do": "measure", "name": "anchor_moved", "what": "moved", "ref": "contract" },
    { "do": "measure", "name": "scroll_changed", "what": "scroll-y-change", "ref": "contract" }
  ],
  "expect": [
    { "value": "anchor_moved", "min": -2.4, "max": 2.4, "profiles": "all", "source_ko": "149행 −0.4~+0.4px ±2px" }
  ]
}
```

`scenarios/culture-result-flow3.json`
```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "culture-result-flow3",
  "title_ko": "현지 활동을 넣고 닫은 채 이틀 진행 뒤 탭으로 열기: 결과 제목 위치",
  "source_ko": "TASK-0012 결과 보고 167행: 터치 5개 프로필 43.8~44.4px. 지시서 581행 기준 7 흐름 3",
  "profiles": "all",
  "steps": [
    { "do": "tap", "selector": "#local-tab" },
    { "do": "tap", "selector": "[data-action=\"culture-act\"]" },
    { "do": "tap", "selector": "[data-action=\"culture-emp\"]:not([disabled])" },
    { "do": "tap", "selector": "[data-action=\"culture-queue\"]" },
    { "do": "tap", "selector": "[data-action=\"culture-close\"][data-where=\"head\"]" },
    { "do": "end-day", "times": 2 },
    { "do": "tap", "selector": "#local-tab" },
    { "do": "wait", "ms": 200 },
    { "do": "measure", "name": "result_from_bar", "what": "top-from-bar", "selector": "[id^=\"culture-result-h-\"]" }
  ],
  "expect": [
    { "value": "result_from_bar", "min": 41.8, "max": 46.4, "profiles": "touch", "source_ko": "167행 43.8~44.4px ±2px" }
  ]
}
```

`scenarios/local-tab-position.json`
```json
{
  "schema": "scitrade-browser-scenario/1",
  "id": "local-tab-position",
  "title_ko": "첫 화면의 현지 탭 위치",
  "source_ko": "TASK-0012 지시서 552행 기준 2: scrollY 0에서 탭이 막대 아래·화면 안(176~245px)",
  "profiles": "all",
  "steps": [
    { "do": "scroll-top" },
    { "do": "measure", "name": "tab_top", "what": "top", "selector": "#local-tab" },
    { "do": "measure", "name": "tab_height", "what": "height", "selector": "#local-tab" },
    { "do": "measure", "name": "bar_bottom", "what": "bar-bottom" }
  ],
  "expect": [
    { "value": "tab_top", "min": 174, "max": 247, "profiles": "all", "source_ko": "552행 176~245px ±2px" }
  ]
}
```

**7-4. `lib.mjs`** (ESM, Node 내장 모듈만)

- 내보낼 것:
  - `REPO_ROOT` — 저장소 루트. `fileURLToPath(new URL('../../', import.meta.url))`(`tools/browser/`에서 두 단계 위).
  - `loadProfiles(file = <profiles.json>) -> { chromePadPx, profiles }` — 형식이 틀리면 한국어 `Error`.
  - `selectProfiles(profiles, spec) -> Profile[]` — `'all'`·`'touch'`·`'mouse'`·쉼표 목록·배열. 모르는 ID는 `Error`. 목록 순서를 지킨다.
  - `validateScenario(obj) -> string[]` — 오류 메시지 목록(없으면 `[]`). 모르는 `do`·`what`, 필수 필드 누락, 정의되지 않은 `ref`, 같은 `name` 두 번, `expect`의 모르는 `value`, `min > max`, 모르는 프로필 지정을 잡는다.
  - `loadScenario(file) -> object` — 검증 실패면 `Error`.
  - `resolveDistPath(distDir, urlPath) -> string | null` — `'/'`는 `index.html`. URL 디코딩 뒤 `distDir` 밖으로 나가면(`..`) `null`.
  - `contentType(file) -> string` — `.html`(`text/html; charset=utf-8`), `.js`·`.mjs`(`text/javascript`), `.css`, `.png`, `.webp`, `.jpg`, `.svg`, `.json`, `.woff2`, 그 밖은 `application/octet-stream`.
  - `fontCacheKey(url, userAgent) -> string` — `sha1(url + (CSS 요청이면 userAgent))`의 hex. CSS 요청 = 주소에 `fonts.googleapis.com`이 있음.
  - `isInside(child, parent) -> boolean`
  - `checkExpectations(scenario, runs, profiles) -> { ok, results }` — `results[]`는 `{ value, profile, actual, min, max, ok }`. 기대의 `profiles`(`'touch'` 등)는 셋째 인수 `profiles`로 푼다. 이번 `runs`에 있는 프로필에만 판정을 만든다(`--profiles l1366`이면 터치 전용 기대는 판정 0건). 해당 실행에 값이 없으면 `ok: false`.
  - `runProfile({ distDir, scenario, profile, chromePadPx, fontCaches, offlineFonts }) -> Promise<RunResult>`
- Playwright는 `runProfile` 안에서만 불러온다: `createRequire(import.meta.url)(process.env.SCITRADE_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright')`. Chromium 경로는 `process.env.SCITRADE_CHROMIUM || '/opt/pw-browsers/chromium'`. 그래서 시험과 `--dry-run`은 Playwright 없이 돈다.
- `runProfile` 순서:
  1. `chromium.launch({ executablePath, args: ['--force-device-scale-factor=<scale>', '--window-size=<width>,<height + chromePadPx>'] })`. `deviceScaleFactor` 흉내를 쓰지 않는다(WORKFLOW 119~121행).
  2. `browser.newContext({ viewport: null, hasTouch: profile.touch, locale: 'ko-KR' })`.
  3. 요청 처리(`context.route`):
     - `http://scitrade.local/…` → `resolveDistPath`의 파일을 `contentType`과 함께 준다. 없으면 404. **포트를 열지 않는다.**
     - `https://fonts.googleapis.com/…`·`https://fonts.gstatic.com/…` → `fontCaches` 폴더들에서 `fontCacheKey` 파일을 찾는다. 없고 `offlineFonts`가 아니면 `curl -sS --fail --max-time 30 -A <UA> <url>`(`execFileSync`)로 받아 첫 캐시 폴더에 쓴다. 실패하면 요청을 끊는다(`abort`). 응답 형식은 CSS면 `text/css; charset=utf-8`, 아니면 `font/woff2`, `access-control-allow-origin: *`. 캐시·내려받기·실패 수를 센다.
     - 그 밖의 주소 → 끊고 호스트 이름을 `blocked_hosts`에 모은다.
  4. `page.on('pageerror')`를 모은다. 대화상자는 늘 수락한다.
  5. `http://scitrade.local/index.html`을 열고 `ready_selector`를 기다린다(15초). `document.fonts.ready`, 300ms.
  6. `innerWidth`·`innerHeight`·`devicePixelRatio`·`matchMedia('(pointer: coarse)').matches`를 적는다. 안쪽 크기가 프로필과 다르면 `size_ok: false`(실행은 계속).
  7. 단계를 순서대로 돈다. 단계마다 15초 제한.
  8. 브라우저를 닫는다(실패해도 닫는다).
- `RunResult`(키 순서 고정): `profile`(프로필 ID 문자열), `inner { width, height }`, `dpr`, `coarse`, `size_ok`, `fonts { cache, network, failed }`, `fonts_ok`, `blocked_hosts`(정렬), `values`, `page_errors`, `status`(`'ok'`·`'error'`), `error`(없으면 `null`).
  - `fonts_ok`: `failed`가 0이고 글꼴 요청(`cache + network`)이 1건 이상이면 참.

**7-5. `measure.mjs`** (명령줄)

```
node tools/browser/measure.mjs --dist <빌드 폴더> --scenario <시나리오 파일>
  [--profiles all|touch|mouse|id,id] [--out <파일>] [--font-cache <폴더>]... [--offline-fonts] [--dry-run]
```
- `--dist`·`--scenario`는 필수. `--dist`는 `index.html`이 있어야 한다. 읽기만 하므로 저장소 안 `dist`도 된다.
- `--profiles`가 없으면 시나리오의 `profiles`를 쓴다.
- `--font-cache`는 여러 번 줄 수 있다. 첫 폴더에 새 글꼴을 쓴다. 없으면 `${os.tmpdir()}/scitrade-font-cache` 하나.
- `--out`과 첫 `--font-cache`가 저장소 안이면 거절한다(종료 2). 이 검사는 `--dry-run`에서도 먼저 한다.
- `--dry-run`: 브라우저 없이 프로필·시나리오·`dist`를 검증하고 `{ "dry_run": true, "scenario": <id>, "profiles": [<id>...], "steps": <단계 수> }`를 찍는다. 종료 0(문제가 있으면 2).
- 출력 JSON(키 순서 고정, 시간 값 없음): `schema`(`scitrade-browser-measure/1`), `scenario`, `dist`(절대 경로), `dist_index_sha256`, `chromium`(`browser.version()`, 첫 실행에서 얻음), `runs[]`(`RunResult`), `expect`(`checkExpectations`의 `results`), `ok`. `--out`이 없으면 표준 출력에 찍는다. `--out`이 있으면 파일에 쓰고 표준 출력에는 프로필마다 한 줄 요약(값과 기대 판정)을 찍는다.
- 종료 코드: 0 = 모든 실행 `ok`·`fonts_ok`, 쪽 오류 0, 기대 모두 통과. 1 = 그렇지 않음(글꼴 없이 잰 값은 비교에 쓰지 않는다). 2 = 사용법·설정 오류.

**7-6. `lib.test.mjs`** (`node:test`, `node:assert/strict`)

- `profiles.json`: 프로필 7개, ID 집합이 정확히 `l1366·cb1366t·ipadAirL·ipadminiL·ipadmini6L·l1920·t1000`, 크기·배율은 정수, 배율은 1 또는 2, `chrome_pad_px` 87.
- `selectProfiles`: `'all'` 7, `'touch'` 5, `'mouse'` 2, `'l1366,t1000'`은 그 순서로 2, 모르는 ID는 오류.
- 묶음 시나리오 네 개는 `validateScenario` 오류 0. 거절 사례: 모르는 `do`, 선택자 없는 `tap`, 이름 없는 `measure`, 정의 안 된 `ref`, `expect`의 모르는 값, `min > max`, 모르는 `what`.
- `resolveDistPath`: `'/'` → `index.html`, `'/assets/a.js'` → 안쪽 경로, `'/../x'`·`'/%2e%2e/x'` → `null`.
- `contentType` 표, 모르는 확장자.
- `fontCacheKey`: googleapis 주소는 user-agent가 다르면 키가 다르고, gstatic 주소는 같다.
- 시나리오 파일·`README.md`에 자료의 이름·ID가 없다. 금지 목록은 시험 안에서 자료로 만든다(글자로 적지 않는다):
  - `world.json` 거점 `id`와 별칭(`name_ko`를 `·()`로 나눈 2글자 이상 조각).
  - `market_offers`·`characters`·`employees`·`culture_activities`·`venues`·`contacts`의 `items[].id`.
  - `scenarios.json` 안 `event_instance_id` 키의 값.
- `checkExpectations`: 범위 안·밖·값 없음, `'touch'` 기대가 마우스 실행에 판정을 만들지 않음.
- `measure.mjs --dry-run`: 임시 폴더에 `index.html` 하나를 두고 네 시나리오 각각 종료 0, 출력 `profiles` 수 7. 저장소 안 `--out`은 종료 2. 임시 폴더는 지운다(`child_process.spawnSync`로 실행).

**7-7. `README.md`** (짧게, 한국어)

- 목적, 프로필 7개, 명령 예, 시나리오 형식 요약, 출력 JSON 키, 종료 코드.
- Codex 샌드박스에서는 Chromium이 죽는다는 점과 `--dry-run`.
- Claude 재현 예(아래 ‘Claude 검수 때 할 일’의 명령). 도시 이름·ID를 쓰지 않는다.

## 테스트

시작 전에 다음 개수를 적는다: `npx vitest run`(파일·시험 수, Claude 확인값 27·803), 파이썬 시험 세 개(21·21·19), `python3 tools/validate_data.py` 건수(24,673), `npm run build`의 JS 크기(503.59 kB).

1. **사실 섞임**
   ```
   python3 tools/check_fact_mixing.py; echo "종료 $?"          # PASS, 0
   python3 tools/check_fact_mixing.py --json                     # []
   python3 tools/test_check_fact_mixing.py                       # 6절의 시험 모두 통과
   ```
2. **MANIFEST 확인 모드** (먼저 기본 모드 review_checks를 한 번 돌려 MANIFEST를 새 파일에 맞춘 뒤)
   ```
   sha256sum MANIFEST.json > /tmp/t19-manifest.sha
   python3 tools/build_package.py --check; echo "종료 $?"        # MANIFEST 일치, 0
   echo probe > tools/zz_manifest_probe.txt
   python3 tools/build_package.py --check; echo "종료 $?"        # '목록에 없음(추가 필요): tools/zz_manifest_probe.txt', 1
   rm tools/zz_manifest_probe.txt
   sha256sum -c /tmp/t19-manifest.sha                            # OK(확인 모드가 쓰지 않았다)
   python3 tools/build_package.py --check --manifest-only; echo "종료 $?"   # 2(argparse 거절)
   bash tools/ai/review_checks.sh --check 78e28c7; echo "종료 $?"  # 12종 통과, 0
   sha256sum -c /tmp/t19-manifest.sha
   ```
3. **ZIP 폴더**
   ```
   python3 tools/build_package.py                                # dist-package/에 ZIP
   ls dist-package/
   npm run build
   ls dist-package/                                              # ZIP이 남아 있다
   find dist -name '*.zip' | wc -l                               # 0
   git status --short dist-package                               # 출력 없음(무시됨)
   rm -rf dist-package
   ```
4. **정적 배포 준비** (작업 트리는 Codex 변경으로 더럽다)
   ```
   tools/deploy/prepare_static.sh /tmp/t19-static-a; echo "종료 $?"                 # 3
   git status --porcelain=v1 --untracked-files=all > /tmp/t19-before.txt
   tools/deploy/prepare_static.sh /tmp/t19-static-a --allow-dirty; echo "종료 $?"   # 0
   git status --porcelain=v1 --untracked-files=all | diff /tmp/t19-before.txt -     # 차이 없음
   cat /tmp/t19-static-a/version.txt                                               # tree: dirty, commit 40자
   ls -a /tmp/t19-static-a                                                         # index.html, assets, 네 파일
   tools/deploy/prepare_static.sh /tmp/t19-static-a --allow-dirty; echo "종료 $?"   # 2(비어 있지 않음)
   tools/deploy/prepare_static.sh ./t19-inside --allow-dirty; echo "종료 $?"        # 2(저장소 안)
   rm -rf /tmp/t19-static-a /tmp/t19-before.txt
   ```
   - 선택(되면 한다, 안 되면 오류를 적고 넘어간다. Claude가 다시 한다): 깨끗한 사본에서 `tree: clean` 확인.
     ```
     rm -rf /tmp/t19-clean && git clone -q --no-local . /tmp/t19-clean
     cp -r node_modules /tmp/t19-clean/ && cp tools/deploy/prepare_static.sh /tmp/t19-prep.sh
     (cd /tmp/t19-clean && bash /tmp/t19-prep.sh /tmp/t19-static-clean); echo "종료 $?"   # 0
     grep -E '^(commit|tree):' /tmp/t19-static-clean/version.txt   # commit: <git rev-parse HEAD, 40자>, tree: clean
     rm -rf /tmp/t19-clean /tmp/t19-static-clean /tmp/t19-prep.sh
     ```
5. **브라우저 도구**
   ```
   node --test tools/browser/lib.test.mjs
   npm run build
   for s in smoke day-anchor culture-result-flow3 local-tab-position; do
     node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/$s.json --dry-run; echo "종료 $?"
   done
   node tools/browser/measure.mjs --dist dist --scenario tools/browser/scenarios/smoke.json --profiles l1366 --offline-fonts --out /tmp/t19-smoke.json; echo "종료 $?"
   ```
   - 마지막 실제 실행은 샌드박스에서 실패할 수 있다. 실패하면 오류 첫 줄을 결과 보고에 적는다. 되면 출력 JSON을 붙인다. 글꼴 캐시가 없으면 `--offline-fonts`라 `fonts_ok`가 거짓이고 종료 1이 정상이다.
6. **전체 검사**
   ```
   bash tools/ai/review_checks.sh 78e28c7          # 기본 모드 11종
   bash tools/ai/review_checks.sh --check 78e28c7  # 확인 모드 12종
   bash tools/ai/review_checks.sh --bogus; echo "종료 $?"   # 2
   ```
7. **마감 순서** (결과 보고도 `docs/` 아래라 MANIFEST에 든다. 보고를 고치면 MANIFEST가 다시 어긋난다)
   1. 결과 보고를 먼저 다 쓴다(검증 결과 칸은 비워 둔다).
   2. `bash tools/ai/review_checks.sh 78e28c7` → `bash tools/ai/review_checks.sh --check 78e28c7`. 두 출력의 요약 줄과 실패 여부를 보고에 적는다.
   3. 마지막으로 아래 두 줄을 돌린다. 이 두 줄의 결과는 보고에 다시 적지 않는다.
      ```
      python3 tools/build_package.py --manifest-only
      python3 tools/build_package.py --check; echo "종료 $?"   # 0
      ```
   4. 그 뒤에는 어떤 파일도 고치지 않는다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 규칙이 지나치거나 모자라 보인다 | 바꾸지 않는다. Claude의 결정이다. 사례와 함께 ‘질문’에 적는다. |
| 기준 커밋 `78e28c7` 자료에서 허용 목록 8건 밖의 결과가 나온다 | 먼저 구현이 규칙과 같은지 본다. 규칙대로인데도 나오면 그 결과를 허용 목록에 넣되 `reason`을 `확인 필요: `로 시작하게 쓰고 ‘질문’에 적는다. 자료는 고치지 않는다. |
| 8건 가운데 일부가 나오지 않는다 | 구현이 규칙보다 느슨하다. 규칙에 맞춘다. 그래도 안 나오면 `ALLOWLIST_UNUSED`가 뜬다. 그 항목을 지우지 말고 ‘질문’에 적는다. |
| 허용 목록을 자료 파일이나 별도 JSON에 둘까 | 두지 않는다. `check_fact_mixing.py`의 `ALLOWLIST` 상수다(`data/**` 수정 금지, 파일 목록 고정). |
| 허용 목록에 거점 ID를 써도 되나 | `ALLOWLIST`에서만 된다. 시험·시나리오·README에는 쓰지 않는다. |
| `validate_data.py`의 `check_home_city`와 겹친다 | 둘 다 둔다. 그 파일은 고치지 않는다. |
| `sources.json`의 여러 도시 수치도 잡아야 하나 | 잡지 않는다. 출처 설명은 검사에서 뺀다. 출처의 확인 수준만 `DESIGN_SOURCE_LEVEL`로 본다. |
| 해역 관문의 수치(운하 일수 등) | 관문 자기 사실로 본다. 거점 이름과 표지가 한 문장에 있을 때만 잡는다. |
| `check_level` 값 가운데 무엇이 실측인가 | ‘사실 섞임 규칙’의 정의 그대로. `author_knowledge`와 `작성자 지식…`만 실측이 아니다. |
| `--check`를 기본 모드로 바꿀까 | 바꾸지 않는다. Codex 마감 절차가 `--manifest-only`에 기댄다. |
| review_checks 검사 수가 다른 지시서의 ‘8종’과 다르다 | 정상이다. 병합 뒤 11종(확인 모드 12종)이 된다. 결과 보고 ‘검사 기준 변화’에 적는다. |
| ZIP 폴더 이름 | `dist-package/`. `README.md` 137행의 `dist/…zip` 문장은 고치지 않고 ‘범위 밖 발견’에 적는다. |
| `prepare_static.sh`가 다른 커밋을 빌드해야 하나 | 하지 않는다. 지금 HEAD의 깨끗한 트리만 빌드한다. 다른 커밋은 Claude가 별도 사본에서 이 스크립트를 돌린다. |
| 출력 폴더가 이미 있다 | 비어 있을 때만 쓴다. 지우지 않는다. |
| 빌드 시각의 시간대·형식 | UTC, `date -u +%Y-%m-%dT%H:%M:%SZ`. |
| `version.txt`에 사람용 문장도 넣을까 | 넣지 않는다. 키 다섯 줄뿐이다. |
| Chromium이 샌드박스에서 죽는다 | 정상이다(TASK-0012.md 101~102행). `node --test`와 `--dry-run`으로 끝내고 오류 첫 줄을 적는다. `CODEX_SANDBOX`·권한 설정을 바꾸려 하지 않는다. |
| Playwright를 `import 'playwright'`로 불러도 되나 | 안 된다. 저장소에 의존성이 없다. `/opt/node-tools/…` 경로를 `createRequire`로 부른다(환경 변수로 바꿀 수 있게). |
| 측정 출력에 시각을 넣을까 | 넣지 않는다. 빌드끼리 비교할 때 차이가 생긴다. |
| 시나리오가 견적·직원·활동 ID를 써야 할 것 같다 | 쓰지 않는다. `data-action` 속성, `id` 앞부분(`[id^=…]`), 첫 번째 일치로 고른다. |
| TASK-0018이 화면 선택자를 바꿀 수 있다 | 이번 기준은 `78e28c7`의 선택자다. 막대·준비·하루 진행 선택자는 시나리오에서 바꿀 수 있다. 다른 선택자가 바뀌면 Claude가 시나리오를 고친다. |
| 기대 범위 ±2px의 근거 | 계획의 재현 기준(TASK-0012 값 ±2px). 원형 측정값은 ‘Claude가 미리 확인한 사실’ 7. |
| 기존 시험이 실패한다 | 이 작업은 `src`·`data`를 바꾸지 않는다. 기대값을 고치지 않고 원인과 출력을 보고한다. |
| 파이썬·Node 시험을 vitest로 옮길까 | 옮기지 않는다. vitest 범위는 `src`뿐이다. |
| 결과 보고를 고쳤더니 `--check`가 실패한다 | 정상이다. 보고도 MANIFEST에 든다. ‘테스트’ 7의 마감 순서대로 마지막에 `--manifest-only`와 `--check`를 다시 돌린다. |
| `git rev-parse HEAD`가 `78e28c7…`로 시작하지 않는다 | 머리말대로 명령의 기준 커밋을 그 해시로 바꾸고 차이를 보고한다. 허용 목록은 바꾸지 않는다(위 ‘8건 밖의 결과’ 행을 따른다). |
| 확인 모드 전후 비교가 Codex의 더러운 트리에서 실패한다 | 어느 검사가 무엇을 바꿨는지 `diff` 출력으로 찾는다. 검사를 고치거나 빼서 맞추지 않고 보고한다. |

## 완료 조건

1. 구현 지시 1~7이 반영되었다. ‘시간이 모자라면 뺄 수 있음’에서 뺀 것은 이유와 함께 적는다.
2. **검증**
   - ‘테스트’ 7의 마감 순서를 따랐다. `bash tools/ai/review_checks.sh 78e28c7`가 `검사 11종, 실패 0종 (모드: 수정)`이다.
   - 이어서 `bash tools/ai/review_checks.sh --check 78e28c7`가 `검사 12종, 실패 0종 (모드: 확인)`이고, 전후 `MANIFEST.json` sha256이 같다.
   - 마지막 `python3 tools/build_package.py --check`의 종료 코드가 0이다.
   - vitest 27개 파일·803개, 기존 파이썬 시험 21·21(건너뜀 3)·19개, `index-*.js` 503.59 kB가 시작 때와 같다(시작 값이 Claude 확인값과 다르면 시작 값과 비교한다).
   - 자료 검사는 PASS 24,699건이다(24,673 + 새 파일 13개 × 2). 다르면 MANIFEST에 새로 든 파일 목록을 적는다.
3. **사실 섞임:** 기준 커밋 `78e28c7` 자료에서 `PASS`이고 허용 목록 8건을 모두 쓴다. 항목마다 `reason`이 있다. `--json` 출력 `[]`를 붙인다.
4. **사실 섞임 시험:** 6절의 시험 1~20이 있고 모두 통과한다. 자료 변형 시험(3~13·15)은 12개로 계획의 ‘6개 이상’을 넘는다. 시험 수를 적는다.
5. **확인 모드:** ‘테스트’ 2의 출력과 종료 코드를 붙인다. 확인 모드가 MANIFEST를 쓰지 않았다.
6. **ZIP:** ‘테스트’ 3대로 ZIP이 `dist-package/`에 생기고 `npm run build` 뒤에도 남는다. `dist` 안 ZIP 0개.
7. **정적 배포 준비:** ‘테스트’ 4의 종료 코드가 3·0·2·2이고, 실행 전후 `git status`가 같고, `version.txt`가 다섯 키 형식이다. 선택 단계를 했으면 `tree: clean`과 `commit: <git rev-parse HEAD, 40자>`을 적는다.
8. **브라우저 도구:** `node --test` 통과, 네 시나리오 `--dry-run` 종료 0. 실제 실행 시도 결과(성공 출력 또는 오류 첫 줄)를 적는다.
9. **코드 변형 시험.** 아래를 하나씩 넣고, 실패하는 시험이나 명령을 표로 적는다. 확인한 뒤에는 편집기로 되돌린다(git으로 되돌리지 않는다).

   | 변형 | 실패해야 하는 것 |
   |---|---|
   | `RANK_WITHOUT_BASIS` 검사를 끔 | 시험 3 |
   | 문장 나누기를 하지 않음(문자열 전체를 한 문장으로) | 시험 1(저장소 자료에서 새 결과) |
   | 별칭을 ID로만 찾음 | 시험 4 |
   | `SHARE` 문맥 조건을 뺌 | 시험 16 |
   | 관문 문장을 주인 없음으로 다룸 | 시험 18 |
   | DESIGN 표시에서 `_basis`로 끝나는 키를 뺌 | 시험 9 |
   | `ALLOWLIST_UNUSED`를 내지 않음 | 시험 13 |
   | `reason` 공백 검사를 뺌 | 시험 14 |
   | `build_package.py --check`가 MANIFEST를 씀 | ‘테스트’ 2의 `sha256sum -c` |
   | `prepare_static.sh`의 깨끗함 검사를 뺌 | ‘테스트’ 4 첫 줄(종료 3이 아님) |
   | `resolveDistPath`의 `..` 막기를 뺌 | `lib.test.mjs` 경로 시험 |
   | `selectProfiles('touch')`가 전체를 돌려줌 | `lib.test.mjs` 프로필 시험 |

   - 모두 되돌린 뒤 ‘테스트’ 1·5와 `bash tools/ai/review_checks.sh 78e28c7`를 다시 돌려 통과를 확인한다.
10. **바꾼 범위**
    - `git status --short --untracked-files=all`과 `git diff --name-only 78e28c7`를 합친 목록이 ‘고칠 수 있는 파일’ 목록(`MANIFEST.json` 포함)과 같다.
    - `git diff --quiet 78e28c7 -- src data tests schemas scripts public references index.html vite.config.ts package.json package-lock.json tsconfig.json tools/validate_data.py tools/test_validate_data.py tools/art tools/ai/codex_task.sh docs/DESIGN_v0.4.md docs/STATUS.md docs/DECISIONS.md docs/IMPLEMENTATION_PLAN.md docs/ai/WORKFLOW.md docs/ai/tasks/README.md docs/ai/tasks/CODEX_PREAMBLE.md README.md START_HERE.md PACKAGE_STATUS.json`의 종료 코드가 0이다.
    - 새 시험·시나리오·README에 자료의 이름·ID가 없다. 아래 ‘ID 검사 명령’을 저장소 루트에서 돌려 `0건`이 나온다. 금지 목록은 `lib.test.mjs`와 같은 방법으로 자료에서 만든다(모든 거점 ID·별칭, 견적·동료·직원·활동·장소·인물 ID, 사건 인스턴스 ID).
    - 저장소 안에 측정 출력·배포 폴더·글꼴 캐시·`dist-package/`·임시 파일이 남지 않았다.
11. 결과 보고를 아래 형식으로 썼다.

**ID 검사 명령(완료 조건 10).** 저장소 루트에서 그대로 붙여 넣는다.

```
python3 - <<'EOF'
import json, re, pathlib
d = pathlib.Path('data')
w = json.loads((d / 'world.json').read_text(encoding='utf-8'))
words = set()
for h in w['items']:
    words.add(h['id'])
    words |= {p.strip() for p in re.split(r'[·()]', h['name_ko']) if len(p.strip()) >= 2}
for name in ['market_offers', 'characters', 'employees', 'culture_activities', 'venues', 'contacts']:
    words |= {i['id'] for i in json.loads((d / f'{name}.json').read_text(encoding='utf-8'))['items']}
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'event_instance_id' and isinstance(v, str):
                words.add(v)
            walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)
walk(json.loads((d / 'scenarios.json').read_text(encoding='utf-8')))
files = [pathlib.Path('tools/test_check_fact_mixing.py'), *sorted(pathlib.Path('tools/browser').rglob('*'))]
hits = 0
for f in files:
    if not f.is_file():
        continue
    text = f.read_text(encoding='utf-8')
    for word in sorted(words):
        pattern = r'\b' + re.escape(word) + r'\b' if word.isascii() else re.escape(word)
        for _ in re.finditer(pattern, text):
            hits += 1
            print(f, word)
print(f'{hits}건')
EOF
```

**Claude 검수 때 할 일(Codex는 하지 않는다):**
- 스냅숏 커밋 뒤 깨끗한 트리에서 `bash tools/ai/review_checks.sh --check 78e28c7`. MANIFEST가 그대로인지 본다.
- 깨끗한 트리에서 `prepare_static.sh`를 돌려 `tree: clean`과 전체 해시를 확인한다.
- 측정 재현(실제 배율 7개 프로필, 글꼴 캐시 사용). `3b60314` 빌드와 이 브랜치 빌드에서:
  - `day-anchor`: 읽던 자리 −0.4~+0.4px ±2px(TASK-0012.md 149행).
  - `culture-result-flow3`: 터치 결과 제목 43.8~44.4px ±2px(TASK-0012.md 167행).
  - `local-tab-position`: 탭 위 끝 176~245px ±2px(TASK-0012 지시서 552행).
  - TASK-0012 검수 전 Sol 빌드에서 `day-anchor`가 실패하는지(회귀 검출).
- 병합 순서: 이 작업은 TASK-0018보다 먼저 넣는다. 병합 순간부터 review_checks가 11종(확인 모드 12종)이 된다. 평택 병합(G0, `548c53c`)은 이미 개발 브랜치에 있다. 병합한 트리에서 `python3 tools/check_fact_mixing.py`가 PASS인지 본다(원형으로는 `c6f0d2d` 자료에서도 같은 8건이었다). 어긋나면 허용 목록을 다시 맞춘다.
- `CODEX_PREAMBLE.md`·`WORKFLOW.md`·`README.md`의 문안을 반영한다.

## 결과 보고

`docs/ai/tasks/results/TASK-0019.md`에 머리말 형식으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유. 예: 잎 문자열을 세는 방식, 단계 시간 제한, 글꼴 캐시 처리.
- **실행한 검증과 결과:** 시작 때 `git rev-parse HEAD`. 명령별 통과·실패, 시험 개수. 시작·끝의 vitest·파이썬·자료 검사 건수와 JS 크기. review_checks 두 모드의 요약 줄.
- **사실 섞임 검사 결과:** PASS 줄, 허용 목록 표(8건과 사유), 알려진 한계 두 가지.
- **변형 시험 표:** 완료 조건 9.
- **검사 기준 변화:** review_checks의 새 검사 3종과 확인 모드. 병합 순간부터 다른 작업의 검수 기준이 바뀐다는 점.
- **바꿀 문안 제안(Claude가 반영):**
  - `CODEX_PREAMBLE.md` 23~31행의 검증 다섯 줄을 `bash tools/ai/review_checks.sh <기준 커밋>` 한 줄(자동 MANIFEST 갱신 포함)과 마지막 `--check` 확인으로 바꾸는 문안.
  - `WORKFLOW.md` 78행(검사 목록), 120행(창 높이 = 화면 높이 + 87), 129~134행(`prepare_static.sh` 사용)의 문안.
  - `README.md` 137행의 ZIP 경로.
- **사용법:** Claude가 쓸 명령(확인 모드, 배포 준비, 측정 재현).
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **범위 밖 발견:** 고치지 않은 문제. 예: 자료 문장이 이상해 보이는 곳, WORKFLOW 120행.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 허용 목록에 `확인 필요:`로 넣은 항목. 없으면 ‘없음’.
