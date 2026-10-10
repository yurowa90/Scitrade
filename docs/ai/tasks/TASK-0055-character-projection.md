# TASK-0055 캐릭터 자료에서 화면·엔진이 읽는 칸만 빌드에 싣기(안 B)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `<BASE>` 위에 만든 `codex/TASK-0055`에서 작업한다. `<BASE>`는 이 지시서를 올린 개발 브랜치 커밋이다. Claude가 실행 전에 해시로 바꾼다.
  - **대체 규칙:** 이 파일에 자리표시 `<BASE>`가 그대로 남아 있으면 `git log -1 --format=%h -- docs/ai/tasks/TASK-0055-character-projection.md`의 해시를 `<BASE>`로 쓴다. 결과 보고에 그 해시와 ‘대체 규칙을 썼다’를 적는다(`docs/ai/tasks/README.md` ‘지시서 형식’).
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - `<BASE>` 커밋이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 diff에 나와도 이 작업의 변경으로 치지 않는다. 그 밖의 파일이 다르면 결과 보고에 적는다.
  - 모든 diff·검사 명령의 기준 커밋은 `<BASE>`다.
  - 아래 줄 번호와 숫자는 개발 브랜치 `74e53ac`(TASK-0024 병합 뒤) 기준이다(Claude 확인). 지시서가 가리키는 코드 파일의 줄 번호는 `c974b67`과 같다. `<BASE>`에서 그 파일이 바뀌었으면 코드가 사실이다. 차이는 결과 보고에 적는다.
- 병렬 작업(고치는 파일은 이 작업과 겹치지 않는다):
  - TASK-0027(Astra, 세션 A, `codex/TASK-0027`, 검수 전): 처음 스냅숏 `da76e96`, 지금 R1 스냅숏 `19fe0ca`(‘크기 한도만 남음’). 고치는 파일은 `src/engine/**`, `src/content/scenario.ts`, 시장·창고 자료다. 개발 브랜치(`74e53ac`)와 합치면 첫 화면이 605,214 B / gzip 142,357 B라 두 한도(600,000 B, 140,000 B)를 넘는다. 이 작업이 들어가면 403,484 B / 118,409 B가 된다(기초 조사 5).
  - TASK-0024(Sol, 세션 B): 개발 브랜치에 병합됐다(`74e53ac`, 2026-10-10). `src/ui/**`, `tools/browser/**`, 측정 시나리오는 여전히 세션 B가 쓴다(다음 화면 작업).
  - 이 작업은 `src/content/scenario.ts`·`src/ui/**`·`src/engine/**`를 고치지 않는다. TASK-0027(`da76e96`, `19fe0ca`)과 겹치는 파일은 `MANIFEST.json`뿐이고 병합 때 다시 만든다(Claude가 git 병합으로 확인). `tsconfig.json`·`vite.config.ts`는 TASK-0027·TASK-0024 모두 고치지 않았다(Claude 확인).
- 결정 근거:
  - `docs/DECISIONS.md` 1113~1118행 ‘자료 청크 분리와 빌드 크기 한도 (2026-10-10, TASK-0026)’.
    - 1116행: 한도. JS 청크 하나 500,000 B, 첫 화면 JS·CSS 합계 600,000 B·gzip 140,000 B.
    - 1117행: ‘첫 화면 원본 합계의 여유가 약 44 KB라 … 그때 … 안 B … 를 검토한다. 안 B는 읽는 칸 목록·설계 전용 칸의 위치·자료 검사기와의 관계를 먼저 정해야 한다.’
  - `docs/ai/tasks/TASK-0026-data-chunk-budget.md` 75행(범위 제외: 안 B), 517행(후속: 안 B).
  - `docs/ai/SESSION_TREE.md` 47~67행 ‘파일 소유와 잠금’. `vite.config.ts`는 허브만 쓴다(65행). 이 지시서는 허브가 내므로 고칠 수 있다. `src/ui/*`는 세션 B(52행), `src/engine/*`는 세션 A(51행)다.
  - 1117행의 세 질문에 이 지시서가 정한 답:
    - **읽는 칸 목록:** 새 파일 `src/content/character-fields.ts`의 `CHARACTER_FIELDS`. 칸마다 읽는 곳을 주석으로 적는다.
    - **설계 전용 칸의 위치:** 자료 파일 `data/characters.json`에 그대로 둔다. 빌드에 실을 때만 뺀다.
    - **자료 검사기와의 관계:** `tools/validate_data.py`·스키마·파이썬 시험은 파일을 직접 읽는다. 전체 자료를 그대로 검사하며 바뀌는 것이 없다.
  - Claude 기초 조사(2026-10-10). `c974b67`, `da76e96`, `da76e96`+`619c920` 병합을 `git archive`로 푼 사본에서 했다. TASK-0024 병합 뒤 `74e53ac`, `74e53ac`+`da76e96`, `74e53ac`+`19fe0ca`에서 부록 코드를 그대로 넣어 다시 확인했다(아래 숫자). 빌드 표시는 `dev`다. 조사 폴더는 저장소에 없다. 찾지 않아도 된다.
    1. **읽는 곳.** `data/characters.json`(314,738 B, 60명)을 import하는 실행 코드는 두 파일뿐이다.
       - `src/content/scenario.ts` 10행 import, 192~219행 `toEmployee()`(195~216행에서 칸을 읽는다).
       - `src/ui/recruitment.ts` 2행 import, 20행 `species()`, 129행 영입 패널 단서.
       - 시험에서 import하는 것은 `src/ui/recruitment.test.ts` 2행 하나다. 153~154행에서 읽고, 266~273행에서 남기는 두 칸(`species_ko`, `recruitment.story_clue`)에 값을 써 본다.
       - `tools/browser/lib.test.mjs` 89행, `tools/test_check_fact_mixing.py` 70행, `tools/validate_data.py`는 파일을 직접 읽는다. 이 작업과 상관없다.
       - 비교 실행기(`npm run sim`, `src/engine/sim/run.mjs` 8행)는 `runnerImport(…, { configFile: false })`라 플러그인 없이 전체 자료를 읽는다.
       - `da76e96`·`19fe0ca`·`619c920`(지금 개발 브랜치에 병합됨)에도 새로 읽는 칸이 없다. 새로 import하는 파일도 없다. `19fe0ca`의 `toEmployee`는 줄 번호만 다르고 읽는 칸이 같다.
    2. **남기는 칸 10개**(60명 합, 최소화 JSON 기준 크기):

       | 칸 | 읽는 곳 → 쓰는 곳 | 크기 |
       |---|---|---|
       | `items[].id` | scenario·recruitment에서 항목 찾기 | 780 B |
       | `items[].creature_kind` | scenario → `character.creatureKind`. 그 뒤 읽는 곳 없음 | 1,633 B |
       | `items[].visual_motif` | scenario → `character.visualMotif` → 카드 문구 | 8,298 B |
       | `items[].art_direction.asset_status` | scenario → `character.assetStatus`. 그 뒤 읽는 곳 없음 | 2,580 B |
       | `items[].stats`(6개 통째) | scenario → `growth.baseStats` → 엔진·화면 성장 | 5,880 B |
       | `items[].attribute` | scenario → `character.attribute` → 카드 배경·속성 칩·걸러보기 | 1,190 B |
       | `items[].species_ko` | recruitment `species()` → 후보 카드·영입 패널 | 1,755 B |
       | `items[].recruitment.story_clue` | recruitment 영입 패널 단서 | 8,070 B |
       | `items[].xp_total` | scenario → `growth.startXp` → engine·save·invariants | 780 B |
       | `items[].growth_focus.primary_stat`·`secondary_stat` | scenario → `growth.primaryStat`·`secondaryStat` | 3,520 B |

       - `creature_kind`·`asset_status`는 scenario.ts가 읽어 설정에 넣지만 그 뒤 읽는 곳이 없다. 빼면 설정 값이 `null`·`'UNKNOWN'`으로 바뀐다. scenario.ts를 고칠 수 없으므로 남긴다(합 약 4.2 KB).
    3. **빼는 칸 36개 경로.** 맨 위 8개(`schema_version`, `data_basis`, `source_refs`, `status`, `purpose`, `numeric_values_status`, `rules`, `$schema`)와 항목 안 28개(`name_ko`, `signature_trait`, `regional_background`, `compatibility`, `conservation`, `encounter`, `myth_reference`, `myth_interpretation_note`, `assignment_policy`, `rarity`·`rarity_meaning`·`rarity_power_multiplier`, `art_direction`의 나머지 칸, `recruitment`의 나머지 5칸 등). 화면 이름은 `data/employees.json`의 `name_ko`를 쓴다.
       - 최소화 JSON(UTF-8 바이트) 기준: 파일 전체 250,899 B, 남긴 칸만 38,277 B.
    4. **시제품.** 이 지시서의 부록 코드가 그것이다. 아래 5~9는 부록 코드 그대로 잰 값이다.
    5. **크기**(`npm run --silent build && node tools/check_bundle_size.mjs dist`, 빌드 표시 `dev`, 원본 / gzip):

       | 빌드 | data 청크 | 코드 청크 | 첫 화면 합계 | 판정 |
       |---|---|---|---|---|
       | 개발 `74e53ac` | 317,893 / 50,160 | 217,073 / 72,701 | 561,520 / 129,653 | 통과 |
       | `74e53ac` + 이 작업 | **116,163 / 26,192** | 217,073 / 72,702 | **359,790 / 105,686** | 통과 |
       | `74e53ac` + TASK-0027 `da76e96` | 327,716 / 52,222 | 250,175 / 83,139 | 604,445 / 142,153 | 실패(원본·gzip) |
       | 위 + 이 작업 | 125,986 / 28,273 | 250,175 / 83,140 | 402,715 / 118,205 | 통과 |
       | `74e53ac` + TASK-0027-R1 `19fe0ca` | 327,716 / 52,222 | 250,944 / 83,343 | 605,214 / 142,357 | 실패(원본·gzip) |
       | 위 + 이 작업 | 125,986 / 28,273 | 250,944 / 83,344 | 403,484 / 118,409 | 통과 |

       - 첫 화면이 원본 201,730 B, gzip 약 23,950 B 준다. 코드 청크는 그대로다(자료 청크 파일 이름만 바뀌어 gzip ±1 B).
       - `74e53ac`+`da76e96` 값은 앞 조사의 `da76e96`+`619c920` 병합본과 같다(개발 브랜치의 TASK-0024 화면 코드가 `619c920`과 같다).
       - TASK-0027-R1을 합친 뒤 남는 여유는 원본 196,516 B, gzip 21,591 B다(`da76e96` 기준 197,285 B, 21,795 B). 이제 gzip 한도가 먼저 걸린다. 병합본 코드 청크의 원본/gzip 비율이 약 3.0이라, 남은 gzip 여유는 코드 원본 약 65 KB 분량이다.
       - git 작업 폴더에서 빌드하면 표시가 `해시+수정`이라 코드 청크가 몇 바이트 크다. Claude가 `74e53ac` + 이 작업을 git 사본에서 빌드하니 코드 217,084 B / 72,713 B, 첫 화면 359,801 B / 105,697 B였다(커밋한 뒤 표시 `해시`로는 359,794 B / 105,691 B). data 청크 116,163 B / 26,192 B는 같다.
       - `DECISIONS.md` 1117행의 ‘코드 212,001 B, 첫 화면 555,863 B’는 TASK-0026 때 값이다. 지금 `74e53ac`의 코드 청크는 217,073 B다. 그 뒤 TASK-0025(`src/ui/map.ts`, +220 B)와 TASK-0024(화면 배치, +4,852 B)가 코드를 늘렸다.
       - 예전 추정 ‘단일 청크 529,657 → 329,040 B’는 청크를 나누기 전 값이다. 지금 구조에서는 data 청크 317,893 → 116,163 B다.
    6. **시험**(`npx vitest run`):
       - `74e53ac`: 34개 파일, 1,040개 통과(할 일 1) → 35개 파일, 1,047개 통과(할 일 1). 새 시험 7개다. 새로 실패하는 기존 시험은 없다(TASK-0024의 `layout.test.ts` 포함). 뺀 칸을 읽는 시험이 없다는 뜻이다. 앞 조사의 `c974b67`도 33개 파일 1,000개 → 34개 파일 1,007개로 같았다.
       - `74e53ac`+`da76e96`: 실패 3개가 있다. 이 작업이 없을 때와 같은 3개다(`src/engine/m2a5-save.test.ts` ‘M2a-5 규칙 1 불변’, 검수 전 스냅숏에 원래 있던 실패). 통과는 1,105 → 1,112개다.
       - `74e53ac`+`19fe0ca`: 실패 0. 38개 파일 1,118개 → 39개 파일 1,125개 통과(할 일 1). TASK-0027-R1의 시험도 뺀 칸을 읽지 않는다.
    7. **새 읽기 실험.** `src/ui/recruitment.ts`의 `candidateCard`에 `rarity` 표시를 넣어 보았다(Claude 사본에서만, 이 작업에서는 하지 않는다).
       - 시험·개발 서버의 읽기 막기가 있으면: `c974b67`에서는 3개 파일(crew-card, main, recruitment)에서 시험 17개, `74e53ac`에서는 4개 파일(crew-card, layout, main, recruitment)에서 시험 19개가 실패한다. 오류 문장이 `src/content/character-fields.ts`를 가리킨다.
       - 잘라 내기만 하면(막기 없음): 새 읽기를 잡지 못한다. 빌드 화면에 빈 값이 나올 상황이다.
       - 빌드에만 적용하면: 시험은 전체 자료로 돌아 새 읽기를 잡지 못한다.
       - 그래서 플러그인을 빌드와 시험 모두에 적용하고, 시험·개발 서버에서는 뺀 칸 읽기를 막는다.
    8. **설정 파일 경고.** `vite.config.ts`가 `./src/content/character-fields`를 확장자 없이 부르면 빌드와 시험마다 ``Your Vite config uses features that are unsupported by `configLoader: 'native'` …`` 경고가 나온다. `.ts`를 붙이면 `tsc`가 TS5097을 낸다. 그래서 `tsconfig.json`에 `allowImportingTsExtensions` 한 줄을 더한다(`noEmit: true`라 쓸 수 있다).
    9. **화면 확인**(Chromium, Claude):
       - 영입·동료 흐름 13단계에서 `document.body.innerHTML`을 단계마다 비교했다. 첫날, 카드 선택(성장 능력 표), 상세 열기, 현장 조사 예약, 하루 진행, 후보 보기, 후보 카드, 영입 의뢰, 하루 진행 ×2, 면담 열기, 고용, 속성 걸러보기다. `c974b67`과 `c974b67` + 이 작업, `74e53ac`와 `74e53ac` + 이 작업이 13단계 모두 같았다. 쪽 오류는 0이다. 시각으로 만드는 명령 id만 맞춰 비교했다.
       - `74e53ac`와 `74e53ac` + 이 작업(부록 코드 그대로)을 `tools/browser/measure.mjs --offline-fonts`로 잰 값이 모두 같고 둘 다 기대 통과다. `smoke` 21개, `crew-facet` 21개, `interview-hire` 42개, `card-detail` 70개다.
       - 개발 서버(`npm run dev`)에서 `/data/characters.json?import`가 남긴 칸과 읽기 막기 코드를 돌려줬다(`74e53ac` + 이 작업에서 다시 확인).

## 목표

1. `data/characters.json`을 빌드에 실을 때 화면·엔진이 읽는 칸만 남긴다. 파일은 바꾸지 않는다. data 청크가 317,893 B에서 116,163 B로, 첫 화면 합계가 561,520 B / gzip 129,653 B에서 359,790 B / 105,686 B로 준다(`74e53ac` 기준, 기초 조사 5). 목적은 한도를 올리지 않고 첫 화면 크기의 여유를 되찾는 것이다. TASK-0024가 들어간 개발 브랜치에 TASK-0027(R1)을 합친 뒤에도 한도 안에 든다.
2. 남길 칸 목록을 한 파일(`src/content/character-fields.ts`)에 둔다. 새 칸을 읽는 세션은 같은 커밋에서 이 파일만 고치면 된다.
3. 목록에 없는 칸을 실행 코드가 새로 읽으면 시험이 실패하게 한다. 시험(vitest)과 개발 서버에서는 뺀 칸을 읽거나 쓰는 순간 오류가 나고, 오류 문장이 고칠 파일을 알려 준다.
4. 시험 7개를 둔다(`src/content/character-fields.test.ts`).

**바꾸지 않는 것:** 자료 파일(`data/**`), 스키마(`schemas/**`), 자료 검사기와 파이썬 시험, 화면·엔진 코드(`src/ui/**`, `src/engine/**`, `src/content/scenario.ts`), `index.html`, `public/**`, `package.json`, `package-lock.json`, CI 파일, 측정 도구, 크기 한도 값. 플레이어가 보는 화면은 바뀌지 않는다(기초 조사 9).

## 먼저 읽을 파일

- `vite.config.ts` 전체(1행 import, 3~16행 `buildId`, 18~35행 설정: 21~31행 `build.rolldownOptions.output.codeSplitting`, 32~34행 `test`).
- `tsconfig.json` 전체(7행 `resolveJsonModule`, 13행 `noEmit`, 15행 `include`에 `vite.config.ts`가 든다).
- `package.json` 9행 `build`(= `tsc --noEmit && vite build`), 11행 `typecheck`, 13행 `sim`. **읽기만 한다.**
- `data/characters.json` 맨 위 칸과 `items[0]`. **읽기만 한다.**
- `src/content/scenario.ts` 10행, 90~92행 `asItems`, 192~219행 `toEmployee`. **읽기만 한다.**
- `src/ui/recruitment.ts` 2행, 20행, 129행, 140~143행 `candidateCard`. **읽기만 한다.**
- `src/ui/recruitment.test.ts` 2행, 147~160행, 262~285행(남기는 두 칸에 값을 써 보는 이스케이프 시험). **읽기만 한다.**
- `src/engine/sim/run.mjs` 4~8행(`configFile: false`). **읽기만 한다.**
- `tools/bundle-size.mjs`, `tools/check_bundle_size.mjs` 머리 주석과 출력 형식. **읽기만 한다.**
- `tools/ai/review_checks.sh` 전체(35~56행 검사 목록, 57~67행 확인 모드 작업 트리 비교, 68행 요약). **읽기만 한다.**
- `tools/build_package.py` 15행 `SOURCE_DIRS`: `src`가 없다. 그래서 새 `src/content/*.ts` 두 파일은 MANIFEST에 들지 않는다. MANIFEST에 새로 드는 것은 결과 보고 하나다.
- `docs/ai/tasks/TASK-0026-data-chunk-budget.md` 120~135행(첫 화면 정의와 한도), 415~470행(완료 조건 형식).
- `docs/ai/tasks/results/TASK-0012.md` 97~102행: Sol 샌드박스에서 Chromium이 죽는다. 브라우저 측정은 하지 않는다.
- 이 지시서의 부록 A·B·C.

## 범위

**포함 (이 순서로 한다)**
1. `tsconfig.json` 한 줄(구현 지시 1).
2. 새 파일 `src/content/character-fields.ts`(구현 지시 2, 부록 A).
3. `vite.config.ts`의 플러그인(구현 지시 3, 부록 B).
4. 새 시험 파일 `src/content/character-fields.test.ts`(구현 지시 4, 부록 C).
5. `MANIFEST.json` 다시 만들기, 결과 보고.
6. 변형 시험(완료 조건 8).

**제외**
- `src/content/scenario.ts`·`src/ui/recruitment.ts`를 잘라 낸 모양의 타입으로 읽게 바꾸는 일. 두 파일은 다른 세션이 쓰고 있다(후속).
- `creature_kind`·`art_direction.asset_status` 빼기. scenario.ts를 고쳐야 한다(후속).
- 다른 자료 파일(`contacts.json`, `culture_activities.json` 등) 줄이기.
- 동적 import·지연 로딩, 크기 한도 변경, 다른 빌드 옵션.
- 문서. `docs/ai/SESSION_TREE.md`의 소유 규칙, `DECISIONS.md`·`STATUS.md` 기록은 Claude가 병합 때 쓴다.
- 브라우저 측정. Claude가 잰다(아래 ‘측정’).

**시간이 모자라면 뺄 수 있음:** 없다. 코드는 부록에 있다. 모두 한다.

## 고칠 수 있는 파일

- `tsconfig.json`: 구현 지시 1의 한 줄만 더한다.
- `vite.config.ts`: 구현 지시 3의 바뀜만 넣는다. 1행을 바꾸고, import 한 줄·플러그인 블록·`plugins` 한 줄을 더한다. 다른 줄은 그대로다.
- 새 파일 `src/content/character-fields.ts`, `src/content/character-fields.test.ts`.
- `docs/ai/tasks/results/TASK-0055.md`(결과 보고).
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/content/scenario.ts`, `src/ui/**`, `src/engine/**`(세션 A·B가 쓰고 있다). 변형 시험을 위해서라도 고치지 않는다.
  - `data/**`, `schemas/**`, `tests/**`.
  - `tools/**` 전체(`tools/validate_data.py`, `tools/test_validate_data.py`, `tools/check_fact_mixing.py`, `tools/ai/**`, `tools/browser/**`, `tools/bundle-size.mjs`, `tools/check_bundle_size.mjs`, `tools/build_package.py` 포함), `scripts/**`.
  - `index.html`, `public/**`, `package.json`, `package-lock.json`, `.github/**`.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/CONTEXT_MAP.md`, `docs/ai/SESSION_TREE.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `docs/ai/design/**`, 이 지시서를 포함한 `docs/ai/tasks/*.md`
  - `README.md`, `START_HERE.md`, `AGENTS.md`, `CLAUDE.md`, `PACKAGE_STATUS.json`, `references/**`

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다. 변형 시험은 편집기로 되돌린다.
- 새 npm 패키지를 설치하지 않는다. `@types/node`도 없다. 시험에서 `node:fs`는 `vi.importActual`로 부른다(부록 C).
- 크기 한도를 올리지 않는다. 한도를 넘으면 결과 보고 ‘질문’에 적는다.
- 효과를 부풀리지 않는다. 주석·오류 문장·결과 보고에 ‘빨라진다’, ‘캐시가 좋아진다’를 쓰지 않는다. 이 작업의 효과는 ‘싣는 양이 준다’까지만 말한다.
- 주석과 오류 문장은 쉬운 한국어로, 짧은 문장으로 쓴다. 숫자는 `1,234 B` 형식이다.
- 시험은 같은 입력에 늘 같은 결과를 낸다. 시각·난수·네트워크를 쓰지 않는다. 파일은 읽기만 하고 저장소에 쓰지 않는다.
- 새 시험 제목에 인수 명세 사례 ID(`P0-…` 등)를 넣지 않는다.
- `@ts-ignore`·`@ts-expect-error`·`as any`·`allowJs`를 쓰지 않는다.
- 네트워크 조사는 하지 않는다.

## 구현 지시

### 0. 공통 정의

- **남긴 칸:** `CHARACTER_FIELDS`에 적힌 경로. `true`는 그 값을 통째로 남긴다. 객체는 안쪽 칸만 남긴다. 배열은 `[모양]` 하나로 모든 항목에 같은 모양을 쓴다.
- **뺀 칸:** 자료 파일에는 있으나 `CHARACTER_FIELDS`에 없는 경로. `items[].rarity`, `items[].recruitment.mode`, `rules`처럼 쓴다.
- **빌드:** Vite의 `command === 'build'`(`npm run build`). 남긴 칸만 JSON 글로 넘긴다. 읽기 막기 코드는 넣지 않는다.
- **시험·개발 서버:** `command === 'serve'`(vitest, `npm run dev`). 남긴 칸만 넘기고, 뺀 칸마다 열거되지 않는 접근자를 붙인다. 그 칸을 읽거나 쓰면 아래 오류가 난다.
  ```
  data/characters.json의 ${경로} 칸은 빌드에 싣지 않는 칸입니다. 화면·엔진에서 쓰려면 src/content/character-fields.ts의 CHARACTER_FIELDS에 더하세요.
  ```
- **칸 순서:** 남긴 칸은 자료 파일의 순서를 따른다(목록 순서가 아니다). `stats`는 통째로 남겨 6개 능력의 순서가 파일과 같다. `Object.entries(baseStats)`가 이 순서를 쓴다.

### 1. `tsconfig.json`

7행 `"resolveJsonModule": true,` 바로 뒤에 한 줄을 더한다.
```json
    "allowImportingTsExtensions": true,
```
- 이유: `vite.config.ts`가 `./src/content/character-fields.ts`를 확장자째 불러야 Vite 설정 경고가 나오지 않는다. 확장자를 붙이면 이 설정이 없을 때 `tsc`가 TS5097을 낸다(기초 조사 8). `noEmit: true`(13행)라 쓸 수 있다.
- 다른 줄은 바꾸지 않는다.

### 2. `src/content/character-fields.ts` (새 파일)

부록 A를 그대로 쓴다. 담는 것:
- `FieldShape` 타입, `CHARACTER_FIELDS`(남긴 칸 10개, 칸마다 읽는 곳 주석), `CHARACTER_IMPORTERS`(characters.json을 import하는 실행 코드 파일 2개), `Json` 타입.
- `projectFields(value, shape)`: 남긴 칸만 가진 새 객체. 자료 파일 순서. 모양과 자료가 맞지 않으면(배열 모양인데 배열이 아님 등) 오류.
- `droppedPaths(value, shape)`: 뺀 칸의 경로. 처음 나온 순서, 중복 없이.
- 이 파일은 실행 코드가 import하지 않는다. `vite.config.ts`와 시험만 부른다. 그래서 빌드 결과에 들지 않는다.
- 맨 위 주석 다섯 줄이 규칙을 적는다. 새 칸을 읽는 작업은 같은 커밋에서 `CHARACTER_FIELDS`에, 새 파일에서 import하면 `CHARACTER_IMPORTERS`에 더한다. 설계 전용 칸을 시험에서만 읽어야 하면 목록에 더하지 않고 파일을 직접 읽는다(다섯째 줄). 목록에 더하면 그 칸이 빌드에도 실린다.

### 3. `vite.config.ts`

부록 B대로 바꾼다.
- 1행 `import { defineConfig } from 'vitest/config';`를 `import { defineConfig, type Plugin } from 'vitest/config';`로 바꾸고, 그 아래에 `./src/content/character-fields.ts` import 한 줄을 더한다.
- 16행 `}`(`buildId` 끝)와 18행 `export default` 사이에 `CHARACTERS_ID`와 `characterFieldsPlugin()` 블록을 넣는다. 둘 다 `export`한다(시험 5가 부른다).
- 설정 객체 첫 줄에 `plugins: [characterFieldsPlugin()],`를 더한다. `base`·`define`·`build`·`test`는 그대로다.
- 플러그인 규칙:
  - `name: 'scitrade:character-fields'`, `enforce: 'pre'`. `apply`를 두지 않는다(빌드와 시험 모두 적용).
  - `transform`은 `filter: { id: CHARACTERS_ID }`가 있는 객체 훅이다. `CHARACTERS_ID = /[\\/]data[\\/]characters\.json$/`. 다른 자료 파일과 `?raw` 같은 질의가 붙은 id는 잡지 않는다.
  - 빌드: `{ code: JSON.stringify(남긴 자료), map: null }`. `moduleType`을 주지 않는다. 모듈은 JSON 그대로이고 id가 같아서, `codeSplitting.groups`의 data 묶음(28행)에 그대로 든다. 그 정규식은 고치지 않는다.
  - 시험·개발 서버: `{ moduleType: 'js', map: null, code }`. `code`는 남긴 자료를 만들고 뺀 칸에 접근자를 붙인 뒤 `export default data`로 내보낸다. 접근자는 `enumerable: false`, `configurable: true`, `get`·`set` 모두 오류다. 그래서 `Object.keys`·펼침·`JSON.stringify`는 빌드와 같다.
- `enforce: 'pre'`가 없으면 Vite가 JSON을 먼저 JS로 바꿔 `JSON.parse`가 실패한다(변형 V16).

### 4. `src/content/character-fields.test.ts` (새 파일)

부록 C를 그대로 쓴다. 시험 7개는 아래 ‘테스트’ 절에 있다.
- vitest 설정(`vite.config.ts`)을 그대로 쓰므로 이 파일의 `characters` import도 플러그인을 지난 자료다. 전체 자료는 `vi.importActual('node:fs')`로 파일을 직접 읽는다.
- `vi.importActual('../../data/characters.json')`도 플러그인을 지나 잘린 자료가 온다. 쓰지 않는다.

### 5. `MANIFEST.json`

`python3 tools/build_package.py --manifest-only`. 새로 드는 파일은 `docs/ai/tasks/results/TASK-0055.md` 하나다. `src`는 MANIFEST 대상이 아니다(`tools/build_package.py` 15행). 자료 검사는 시작 값에서 2건 는다(MANIFEST 항목 하나에 2건). Claude 확인: `74e53ac` 26,059건, 이 지시서를 MANIFEST에 더한 `<BASE>` 흉내 26,061건, 끝 26,063건. `data/characters.json`의 MANIFEST 크기·해시(314,738 B)는 바뀌지 않는다.

### 6. 새 출력 글과 반례 상태

플레이어가 읽는 글은 없다. 새 글은 시험·개발 서버의 오류 문장 하나다.

| 출력 | 나오는 상태 | 나오지 않는 상태(반례) | 시험 |
|---|---|---|---|
| `data/characters.json의 … 칸은 빌드에 싣지 않는 칸입니다. 화면·엔진에서 쓰려면 src/content/character-fields.ts의 CHARACTER_FIELDS에 더하세요.` | 시험·개발 서버에서 뺀 칸을 읽거나 씀(맨 위 `rules`, 항목 `rarity`, 안쪽 `recruitment.mode`·`art_direction.proportions`) | 남긴 칸(`recruitment.story_clue`)을 읽고 씀 / 빌드 결과(막기 코드 없음) | 4 / 4·5 |

## 바꿔도 되는 기존 단언

없다. 기존 시험 파일을 고치지 않는다.

## 테스트

새 시험 파일은 `src/content/character-fields.test.ts` 하나다(vitest, `describe('캐릭터 자료 빌드 칸')`). 코드는 부록 C다. 제목을 그대로 쓴다.

1. **`칸 고르기는 목록의 칸만 파일 순서대로 남기고 뺀 칸의 경로를 돌려준다`**
   - 작은 손 자료로 `projectFields`·`droppedPaths`를 글자까지 단언한다. 목록 순서와 파일 순서를 일부러 다르게 둔다. 두 가지 모양 오류 문장도 본다.
   - 잡는 것: 늘 통째로 돌려주기, 뺀 칸 경로 빠뜨리기, 목록 순서로 쓰기.
2. **`목록의 칸은 모두 자료 파일에 있다`**
   - 목록의 경로 가운데 어느 항목에도 없는 것이 `[]`다.
   - 잡는 것: 칸 이름이 바뀌어 목록에 낡은 이름이 남음. 일부 항목에만 있는 칸(`conservation` 41명 등)은 통과한다.
3. **`시험에서 불러온 자료는 파일을 목록대로 자른 것과 글자까지 같다`**
   - `JSON.stringify(characters)`가 파일을 `projectFields`로 자른 글과 같다. 맨 위 칸은 `items`뿐이다. 항목 수가 같다. 항목들이 가진 칸 이름의 합집합이 목록의 칸과 같다.
   - 잡는 것: 시험에서 플러그인이 돌지 않음, 빌드에만 적용, id 정규식 오타, 접근자가 열거됨.
4. **`뺀 칸을 읽거나 쓰면 고칠 파일을 알려 주는 오류가 나고 남긴 칸은 그대로 읽고 쓴다`**
   - `items[0].rarity` 읽기가 위 오류 문장 전체로 실패한다. 쓰기도 실패한다. 안쪽 칸 두 개와 맨 위 `rules`도 실패한다. `Object.keys`에 `rarity`가 없다.
   - 반례: 남긴 칸 `story_clue`는 쓰고 읽을 수 있다(끝나면 되돌린다).
5. **`플러그인은 characters.json만 잡고 빌드에서는 남긴 칸만 JSON 글로 넘긴다`**
   - 플러그인의 `name`·`enforce`·`apply`, 정규식이 잡는 id 2개와 잡지 않는 id 4개.
   - `command: 'build'`일 때 결과가 정확히 `{ code: JSON.stringify(projectFields(전체, CHARACTER_FIELDS)), map: null }`이고, 그 글의 항목 칸 합집합이 목록과 같다.
   - `command: 'serve'`일 때 `moduleType: 'js'`이고 코드에 오류 문장이 든다.
   - 잡는 것: 빌드가 원래 글을 넘김, 빌드에도 막기 코드를 넣음, `apply: 'build'`, 정규식 오타·넓힘.
6. **`남긴 칸으로 만든 시나리오 설정은 전체 자료로 만든 설정과 같다`**
   - `SCENARIO_IDS` 전부에 대해, 지금(잘린 자료) `loadScenario` 결과가 `vi.doMock`으로 전체 자료를 넣은 `loadScenario` 결과와 같다.
   - 잡는 것: 막기가 꺼진 상태에서 로더가 읽는 칸이 빠짐(변형 V13). 비교 실행기가 전체 자료로 돌아도 결과가 같다는 근거다.
7. **`characters.json을 import하는 실행 코드 파일은 CHARACTER_IMPORTERS와 같다`**
   - `src` 아래 `.ts`·`.mts`·`.js`·`.mjs` 가운데 `.test.ts`가 아닌 파일에서 `characters.json`을 부르는 import(정적·동적·`?raw` 질의 포함)를 찾는다. 결과가 `['src/content/scenario.ts', 'src/ui/recruitment.ts']`다.
   - 잡는 것: 시험이 지나가지 않는 새 파일에서 자료를 읽음, `?raw`로 전체 파일을 불러 플러그인을 피함.

- 끝난 뒤 vitest는 35개 파일, 1,047개 통과(할 일 1)다(`74e53ac` 기준). 시작 값보다 파일 1개, 시험 7개가 는다.

## 측정 (Claude가 잰다. Sol은 하지 않는다)

새 측정 시나리오는 없다. 화면이 바뀌지 않으므로 ‘같음’을 확인한다.

- **빌드 두 개:** `git archive <BASE>`와 `git archive <작업 스냅숏 커밋>`을 각각 푼 폴더에서 빌드한다. 표시가 둘 다 `dev`다. `node_modules`는 원본을 링크한다.
  - 기대값(기초 조사 5, `<BASE>`가 `74e53ac`와 실행 코드가 같을 때): data 청크 317,893 → 116,163 B, 첫 화면 561,520 B / 129,653 B → 359,790 B / 105,686 B. 코드 청크 217,073 B는 같다. `<BASE>`의 실행 코드가 더 바뀌었으면 첫 화면은 `<BASE>` 빌드 값에서 원본 201,730 B, gzip 약 23,950 B 준 값이다.
  - 청크 구성 명령(완료 조건 4)이 두 빌드에서 같은 두 줄을 낸다.
- **화면 비교:**
  1. `node tools/browser/measure.mjs --dist <빌드>/dist --scenario tools/browser/scenarios/<이름>.json --offline-fonts --out <파일>`로 `smoke`·`crew-facet`·`interview-hire`·`card-detail`·`day-anchor`·`campaign-end`를 잰다. 두 빌드의 값이 모두 같고 기대 통과다(`interview-hire`·`card-detail`은 TASK-0024 병합으로 개발 브랜치에 들어왔다).
  2. 영입·동료 흐름 13단계 화면 HTML 비교(기초 조사 9의 스크립트, 저장소 밖). 13단계 모두 같고 쪽 오류 0이다.
- **합친 트리:** `<BASE>`+`da76e96`과 `<BASE>`+`19fe0ca`(TASK-0027-R1)에 이 작업의 diff를 얹는다.
  - 크기 판정이 둘 다 통과다(`74e53ac` 기준 첫 화면 402,715 B / 118,205 B, 403,484 B / 118,409 B).
  - vitest 실패는 `da76e96` 쪽의 원래 있던 3개뿐이다. `19fe0ca` 쪽은 실패 0이다.
- **새 읽기 실험(기초 조사 7):** 사본에서 `candidateCard`에 `rarity` 표시를 넣으면 4개 파일, 시험 19개가 오류 문장과 함께 실패한다(`74e53ac` 기준).
- **개발 서버:** `npm run dev`에서 `/data/characters.json?import`가 오류 문장을 담은 모듈을 돌려준다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 부록 코드와 다르게 써도 되나 | 그대로 쓴다. 고쳐야 통과하면 고치고, 고친 곳과 이유를 ‘설계 판단’에 적고 변형 표를 다시 돌린다 |
| 플러그인을 빌드에만 적용할까 | 아니다. 빌드와 시험 모두다. 빌드에만 적용하면 새로 읽은 칸을 시험이 잡지 못한다(기초 조사 7) |
| 시험에서도 자료가 잘리면 깨지는 시험은 | 지금은 없다(기초 조사 6). 설계 전용 칸이 필요한 시험은 import 대신 파일을 직접 읽는다(부록 C의 `readFull`). 이 작업에서 기존 시험을 고치지 않는다 |
| 칸 목록을 JSON 파일로 둘까 | 아니다. TS 파일에 두고 칸마다 읽는 곳을 주석으로 적는다. `satisfies`로 모양을 검사한다 |
| 목록 파일을 `.mjs`로 두면 `tsconfig.json`을 안 고쳐도 되나 | 아니다. 타입 선언이 없어 `strict`에서 오류가 난다. `allowJs`도 쓰지 않는다. `.ts` 확장자 + `allowImportingTsExtensions` 한 줄로 한다 |
| 확장자 없이 부르면 | 빌드·시험마다 Vite 설정 경고가 나온다(기초 조사 8). 완료 조건 3이 잡는다 |
| `creature_kind`·`asset_status`는 읽는 곳이 없는데 뺄까 | 빼지 않는다. scenario.ts가 읽는다. 빼면 설정 값이 바뀐다. 후속이다 |
| 다른 자료 파일도 줄일까 | 하지 않는다 |
| `?raw`·`?url`로 부르면 | 플러그인이 잡지 않아 전체 파일이 실린다. 그래서 시험 7이 새 import 파일을 잡는다. 정규식을 넓히지 않는다 |
| `import { items } from '…characters.json'`(이름 붙은 import) | 시험·개발 서버의 모듈은 기본 내보내기만 있다. 지금 코드는 기본 import만 쓴다. 이름 붙은 import를 쓰면 시험에서 바로 실패한다. 바꾸지 않는다 |
| 시험에서 `'rarity' in item`이 true다 | 알려진 차이다. 빌드에서는 false다. `Object.keys`·펼침·`JSON.stringify`는 같다. 결과 보고 ‘범위 밖 발견’에 적지 않아도 된다 |
| `tsc`가 뺀 칸 읽기를 잡나 | 못 잡는다. JSON import의 타입이 파일 전체다. 잘라 낸 모양의 타입으로 읽게 바꾸는 일은 scenario.ts·recruitment.ts 잠금이 풀린 뒤 후속이다 |
| 개발 서버의 모듈이 크다(약 235,000 B) | 원본 대응표가 붙어서다. 빌드와 상관없다 |
| 비교 실행기(`npm run sim`)는 | 플러그인 없이 전체 자료를 읽는다(`configFile: false`). 시험 6이 로더 결과가 같음을 확인한다. 고치지 않는다 |
| 내 빌드의 숫자가 지시서와 몇 바이트 다르다 | 빌드 표시(`해시+수정`) 때문이다. 코드 청크만 다르다. data 청크 116,163 B는 같아야 한다. 다르면 보고한다 |
| 시작 값(시험 수·자료 검사 건수·첫 화면 크기)이 지시서의 Claude 확인값과 다르다 | `<BASE>`가 `74e53ac`보다 뒤라 다른 작업이 들어온 경우다. 시작 값을 그대로 적고, 끝 값은 시작 값에서 계산한다(시험 파일 +1·시험 +7, 자료 검사 +2, 첫 화면 원본 −201,730 B·gzip 약 −23,950 B). data 청크 116,163 B / 26,192 B는 그대로여야 한다 |
| `vite.config.ts`의 기존 주석(24~27행)을 고칠까 | 고치지 않는다 |
| 한도를 바꿀까 | 바꾸지 않는다 |
| SESSION_TREE에 소유 규칙을 적을까 | 적지 않는다. Claude가 병합 때 적는다 |
| 시험이 저장소 안에 파일을 만들어도 되나 | 안 된다. 읽기만 한다. 변형 V20의 임시 파일은 확인 뒤 지운다 |

## 완료 조건

1. 구현 지시 1~5가 반영되었다. 새 두 파일과 `vite.config.ts`의 추가분이 부록과 같다. 다르면 다른 곳과 이유를 ‘설계 판단’에 적었다.
2. **시작 값:** 시작 전에 한 번 돌려 적는다.
   - `npx vitest run`: Claude 확인값(`74e53ac` 사본) 34개 파일, 1,040개 통과(할 일 1).
   - `python3 tools/validate_data.py`: Claude 확인값 `74e53ac` 26,059건. `<BASE>`는 이 지시서가 MANIFEST에 더해져 26,061건일 것이다. 실제 값을 적는다.
   - `node --test tools/browser/lib.test.mjs` 11개, `node --test tools/check_bundle_size.test.mjs` 11개.
   - 파이썬 시험: 그림 도구 21개, 지도 21개(3개 건너뜀), 자료 검사기 74개, 사실 섞임 20개.
   - `npm run --silent build && node tools/check_bundle_size.mjs dist`: 검사기 출력 전체를 적는다. Claude 확인값(`74e53ac`에 지시서만 더한 커밋, 깨끗한 git 사본, 표시 `해시`): data 317,893 B / 50,160 B, 코드 217,077 B / 72,706 B, 첫 화면 561,524 B / 129,658 B, 판정 통과.
3. **빌드와 크기 검사**
   ```
   npm run build 2>&1 | grep -c -E 'configLoader|larger than 500 kB'   # 0
   node tools/check_bundle_size.mjs dist; echo "종료 $?"                  # 종료 0
   ```
   - 첫 줄은 `0`을 찍고 종료 코드 1로 끝난다(`grep -c`는 0건이면 1). 정상이다. 숫자 `0`을 본다.
   - 검사기 출력 전체를 결과 보고에 붙인다. 다음을 모두 만족한다.
     - JS 청크 2개. data 청크가 **116,163 B, gzip 26,192 B**다(빌드 표시와 상관없이 같다).
     - 첫 화면 합계가 원본 400,000 B 이하, gzip 110,000 B 이하다. 한도까지의 여유가 원본 200,000 B 이상, gzip 30,000 B 이상이다. Claude 확인값(`74e53ac` git 사본, 표시 `해시+수정`): 359,801 B / 105,697 B.
     - 완료 조건 2의 시작 값에서 첫 화면 원본이 201,730 B 안팎(빌드 표시 차이 몇 바이트), gzip이 약 23,950 B 준다. 코드 청크는 빌드 표시 차이 말고는 그대로다. Claude 확인: 561,524 B / 129,658 B → 359,801 B / 105,697 B(원본 −201,723 B, gzip −23,961 B).
     - `판정: 통과`.
4. **청크 구성** (파일을 쓰지 않는다. TASK-0026 완료 조건 4와 같은 명령)
   ```
   node --input-type=module -e "import { build } from 'vite'; const r = await build({ logLevel: 'silent', build: { write: false } }); for (const c of [r].flat().flatMap((x) => x.output)) if (c.type === 'chunk') console.log(c.fileName, Object.keys(c.modules).filter((m) => m.endsWith('.json')).map((m) => m.slice(process.cwd().length + 1)).sort().join(' '));"
   ```
   - 출력이 정확히 두 줄이다(청크 이름의 해시는 다를 수 있다). `data/characters.json`이 data 청크에 그대로 있다.
     ```
     assets/index-….js PACKAGE_STATUS.json src/assets/manifest.json
     assets/data-….js data/character_rules.json data/characters.json data/contacts.json data/culture_activities.json data/employees.json data/game_config.json data/goods.json data/market_offers.json data/routes.json data/scenarios.json data/venues.json data/world.json
     ```
5. **타입 검사와 시험**
   - `npm run typecheck` 종료 0.
   - `npx vitest run src/content/character-fields.test.ts`: 7개 통과.
   - `npx vitest run`: 35개 파일, 1,047개 통과(할 일 1)(Claude 확인값, `74e53ac` 기준. 시작 값 + 파일 1개·시험 7개). 출력에 `configLoader`가 없다.
6. **마감 검증** (결과 보고 파일을 먼저 만든 뒤, 이 순서로)
   ```
   bash tools/ai/review_checks.sh <BASE>
   bash tools/ai/review_checks.sh --check <BASE>
   ```
   - `검사 13종, 실패 0종 (모드: 수정)`, 이어서 `검사 14종, 실패 0종 (모드: 확인)`. 확인 모드의 `작업 트리 변화 없음` 통과(Claude 확인: git 사본에서 둘 다 통과).
   - 자료 검사는 시작 값 + 2건(결과 보고 하나. Claude 확인: 26,061 → 26,063건). 다르면 MANIFEST에 새로 든 파일 목록을 보고에 적는다.
   - `git diff <BASE> -- MANIFEST.json`에서 바뀐 항목은 `docs/ai/tasks/results/TASK-0055.md` 하나다. `data/characters.json` 항목(크기·해시)은 그대로다.
   - `lib.test.mjs`·`check_bundle_size.test.mjs`·파이썬 시험 수는 시작 값과 같다.
   - 크기 검사 줄 아래 검사기 출력에 `판정: 통과`가 있다.
7. **바꾼 범위 확인** (출력을 결과 보고에 붙인다)
   - `git status --short --untracked-files=all`의 줄이 정확히 아래와 같다. `node_modules` 링크 줄(`?? node_modules`)이 있으면 그 줄만 빼고 본다.
     ```
      M MANIFEST.json
      M tsconfig.json
      M vite.config.ts
     ?? docs/ai/tasks/results/TASK-0055.md
     ?? src/content/character-fields.test.ts
     ?? src/content/character-fields.ts
     ```
   - 다음 출력이 비어 있다:
     ```
     git diff <BASE> -- src data schemas tests tools scripts docs index.html public package.json package-lock.json .github AGENTS.md CLAUDE.md README.md START_HERE.md PACKAGE_STATUS.json references
     ```
   - 다음 출력이 정확히 한 줄 `-import { defineConfig } from 'vitest/config';`이다(두 파일에서 지운 줄은 1행 하나뿐이다):
     ```
     git diff <BASE> -- vite.config.ts tsconfig.json | grep '^-[^-]'
     ```
   - 다음 출력이 비어 있다(효과 과장 낱말, 타입 우회):
     ```
     git diff <BASE> -- vite.config.ts tsconfig.json | grep '^+' | grep -nE '빨라|빠르게|속도|캐시'
     grep -nE '빨라|빠르게|속도|캐시' src/content/character-fields.ts src/content/character-fields.test.ts
     grep -nE '@ts-ignore|@ts-expect-error|as any|allowJs' vite.config.ts tsconfig.json src/content/character-fields.ts src/content/character-fields.test.ts
     ```
     - 기존 `vite.config.ts` 26행의 ‘캐시 이득은 약속하지 않는다’는 바꾸지 않은 줄이라 첫 명령에 나오지 않는다.
8. **변형 시험.** 아래를 하나씩 넣고 `npx vitest run`(V21·V22는 적힌 명령)을 돌린다. 실패한 시험 번호·이름, 실패 파일 수를 표로 적는다. 확인한 뒤 편집기로 되돌린다. git으로 되돌리거나 stash하지 않는다. 다 돌린 뒤 `git status --short --untracked-files=all`이 완료 조건 7과 같은지 본다.
   - ‘파일 N/35 실패’는 불러오기 실패를 포함한 실패 파일 수다. vitest 요약 줄 `Test Files  N failed`로 본다.
   - Claude가 `74e53ac` 사본에 부록 코드를 그대로 넣고 모두 돌려 아래 결과를 확인했다. `<BASE>`에 시험 파일이 더 있으면 V1~V4·V15·V16의 파일 수가 다를 수 있다. 실패 수가 다르면 그대로 적는다. 지정한 새 시험이 실패하지 않으면 시험을 고친다.

   | 번호 | 변형 (파일: 바꿀 글) | 실패해야 하는 것(Claude 확인값) |
   |---|---|---|
   | V1 | character-fields.ts: `species_ko: true, …` 줄 지움. recruitment.ts가 목록에 없는 칸을 읽는 상황과 같다 | 시험 28개, 파일 4/35(crew-card, layout, main, recruitment). 새 시험 파일은 통과 |
   | V2 | character-fields.ts: `recruitment: { story_clue: true }, …` 줄 지움 | 시험 25개, 파일 4/35(새 시험 4, layout, main, recruitment) |
   | V3 | character-fields.ts: `xp_total: true, …` 줄 지움 | 파일 31/35(대부분 불러오기 실패), 새 시험 6 |
   | V4 | character-fields.ts: `visual_motif: true, …` 줄 지움 | 파일 33/35, 새 시험 6 |
   | V5 | character-fields.ts: `xp_total` 줄 뒤에 없는 칸 `nickname_ko: true,` 더함 | 새 시험 2·3·5 |
   | V6 (반례) | character-fields.ts: `xp_total` 줄 뒤에 일부 항목에만 있는 칸 `conservation: true,` 더함 | 실패 0(거짓 실패 없음) |
   | V7 | character-fields.ts: `projectFields` 맨 앞에 `if (shape !== undefined) return value;`(늘 통째로 돌려줌) | 새 시험 1·3·5 |
   | V8 | character-fields.ts: `droppedPaths` 맨 앞에 `if (path !== undefined) return [];` | 새 시험 1·4 |
   | V9 | vite.config.ts: `if (build) return { code: JSON.stringify(kept), map: null };` → `if (build) return { code, map: null };`(빌드가 원래 글을 넘김) | 새 시험 5. 이어서 `npm run build && node tools/check_bundle_size.mjs dist`에서 data 청크 317,893 B |
   | V10 | vite.config.ts: `enforce: 'pre',` 뒤에 `apply: 'build',` 더함(빌드에만 적용) | 새 시험 3·4·5 |
   | V11 | vite.config.ts: `config.command === 'build'` → `config.command === 'never'`(빌드에도 막기 코드) | 새 시험 5 |
   | V12 | vite.config.ts: `if (build) return` → `if (true) return`(시험·개발 서버에서 막기 끔) | 새 시험 4·5 |
   | V13 | V12와 함께 character-fields.ts의 `art_direction: { asset_status: true }, …` 줄 지움 | 새 시험 4·5·6. 막기가 꺼져도 시험 6이 로더 결과 차이(`'UNKNOWN'`)를 잡는다 |
   | V14 | vite.config.ts: `CHARACTERS_ID`의 `characters\.json` → `character\.json`(오타) | 새 시험 3·4·5 |
   | V15 | vite.config.ts: `CHARACTERS_ID`를 `/[\\/]data[\\/][^\\/]+\.json$/`로 넓힘 | 파일 34/35, 새 시험 5·6 |
   | V16 | vite.config.ts: `enforce: 'pre',` 줄 지움 | 파일 33/35 불러오기 실패(새 시험 파일 포함, `JSON.parse` 오류 `"export con"... is not valid JSON`) |
   | V17 | vite.config.ts: 접근자의 `enumerable: false` → `enumerable: true` | 새 시험 3·4 |
   | V18 | vite.config.ts: 막기 코드 마지막 `for (const [key, inner] of Object.entries(shape)) …` 줄 앞에 `if (path === '') ` 붙임(안쪽 칸 막기 끔) | 새 시험 4 |
   | V19 | vite.config.ts: `plugins: [characterFieldsPlugin()],` 줄 지움 | 새 시험 3·4. 이어서 빌드하면 data 청크 317,893 B |
   | V20 | 새 임시 파일 `src/content/zz-probe.ts`: `import characters from '../../data/characters.json';` + `export const probeCount = characters.items.length;`. 확인 뒤 지운다 | 새 시험 7. 내용을 `const raw = await import('../../data/characters.json?raw'); export const probeSize = String(raw.default).length;`로 바꿔도 새 시험 7 |
   | V21 | tsconfig.json: `allowImportingTsExtensions` 줄 지움. `npm run typecheck` | 종료 1, `vite.config.ts(2,74): error TS5097` |
   | V22 | vite.config.ts 2행: `'./src/content/character-fields.ts'` → `'./src/content/character-fields'`. `npm run build 2>&1 \| grep -c configLoader` | `1`(완료 조건 3의 첫 명령이 1을 찍는다) |

   - Claude도 검수 때 이 표를 다시 돌린다.
9. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0055.md`에 머리말 형식(`CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 부록과 다르게 쓴 곳, 지시서에 없던 결정과 이유. 없으면 ‘없음’.
- **실행한 검증과 결과:**
  - 시작 HEAD 해시, `git diff --name-only <BASE> HEAD` 출력, `<BASE>` 대체 규칙을 썼는지.
  - 시작 값(완료 조건 2)과 끝 값.
  - 명령별 통과·실패와 개수. 크기 검사기 출력 전체. 청크 구성 명령 출력. 검사 묶음 두 모드의 요약 줄.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **바꾼 기존 단언:** 없어야 한다. 완료 조건 7의 출력을 붙인다.
- **변형 시험 표:** V1~V22.
- **출력 글 목록:** 새 오류 문장을 그대로 적는다.
- **범위 밖 발견:** 고치지 않은 문제. 없으면 ‘없음’.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 측정은 하지 않는다. 했다면 실제 배율 방식(WORKFLOW 119~121행)인지 적는다.

## 후속 (Claude 기록용, 이 작업에서 하지 않음)

- **병합 때 Claude가 고칠 문서:**
  - `docs/ai/SESSION_TREE.md` ‘파일 소유와 잠금’ 표에 한 줄을 더한다. `src/content/character-fields.ts`의 `CHARACTER_FIELDS`·`CHARACTER_IMPORTERS`는 characters.json의 새 칸을 읽거나 새 파일에서 import하는 작업(세션 A·B)이 같은 커밋에서 고친다. 플러그인(`vite.config.ts`)과 시험 파일은 허브가 쓴다. 실행 요청의 `고치는 파일:`에 이 파일을 적는다. 시험에서만 설계 전용 칸을 읽을 때는 목록에 더하지 않고 파일을 직접 읽는다는 것도 적는다.
  - `docs/DECISIONS.md` 1113행 절에 안 B 반영과 새 값(data 116,163 B, 첫 화면 359,790 B / 105,686 B(`74e53ac` 기준), TASK-0027 병합 뒤 여유)을 적는다. 1117행의 옛 값(코드 212,001 B)이 지금 217,073 B인 사정(TASK-0025 +220 B, TASK-0024 +4,852 B)도 적는다.
  - `docs/STATUS.md` 검사 값, `docs/ai/tasks/README.md` 목록 행, `docs/ai/CONTEXT_MAP.md`의 자료 위치(빌드에 싣는 칸 목록).
- **세션 A에 알릴 것:** 이 작업이 개발 브랜치에 들어간 뒤 `claude/m2a5-engine`이 개발 브랜치를 합치면 TASK-0027-R1(`19fe0ca`)의 첫 화면이 403,484 B / gzip 118,409 B가 되어 한도 안에 든다(`74e53ac` 기준 Claude 확인). 합칠 때 겹치는 파일은 `MANIFEST.json`뿐이다.
- **나중:**
  - scenario.ts·recruitment.ts 잠금이 풀리면 두 파일이 잘라 낸 모양의 타입을 가진 접근 함수로 읽게 바꾼다. 그러면 `tsc`가 뺀 칸 읽기를 잡는다.
  - 그때 읽는 곳이 없는 `creature_kind`·`asset_status`(약 4.2 KB)를 정리한다.
  - 남은 gzip 여유는 TASK-0027-R1을 합친 뒤 21,591 B다. M2a-5 화면처럼 큰 화면 기능을 더할 때 다시 잰다.

## 부록 A. `src/content/character-fields.ts` 전체

```ts
// data/characters.json에서 화면·엔진이 읽는 칸 목록. 빌드는 이 칸만 싣는다(vite.config.ts의 characterFieldsPlugin).
// 자료 파일과 tools/validate_data.py는 전체 자료를 그대로 쓴다. 여기 없는 칸은 설계·근거 기록용이다.
// 새 칸을 읽는 작업은 같은 커밋에서 이 목록에 더한다. 빠뜨리면 시험(vitest)과 개발 서버에서 그 칸을 읽는 순간 오류가 난다.
// 새 실행 코드 파일에서 characters.json을 import하면 CHARACTER_IMPORTERS에도 더한다.
// 시험에서만 설계 전용 칸을 읽어야 하면 여기 더하지 말고 파일을 직접 읽는다(character-fields.test.ts의 readFull). 여기 더하면 빌드에도 실린다.

/** true는 그 값을 통째로 남긴다. 객체는 안쪽 칸만 남긴다. 배열 안 항목은 [모양] 하나로 적는다. */
export type FieldShape = true | { readonly [key: string]: FieldShape } | readonly [FieldShape];

export const CHARACTER_FIELDS = {
  items: [{
    id: true, // scenario.ts toEmployee, recruitment.ts species·단서 찾기
    creature_kind: true, // scenario.ts: character.creatureKind (지금 화면에서는 쓰지 않음)
    visual_motif: true, // scenario.ts: character.visualMotif → 카드 문구
    art_direction: { asset_status: true }, // scenario.ts: character.assetStatus (지금 화면에서는 쓰지 않음)
    stats: true, // scenario.ts: growth.baseStats로 통째로 복사한다(능력 6개, 파일 순서 그대로)
    attribute: true, // scenario.ts: character.attribute → 카드 배경·속성 칩·동료 걸러보기
    species_ko: true, // recruitment.ts: 후보 카드·영입 패널의 종 이름
    recruitment: { story_clue: true }, // recruitment.ts: 영입 패널의 단서
    xp_total: true, // scenario.ts: growth.startXp
    growth_focus: { primary_stat: true, secondary_stat: true }, // scenario.ts: growth.primaryStat·secondaryStat
  }],
} as const satisfies { readonly [key: string]: FieldShape };

/** characters.json을 import하는 실행 코드 파일(시험 파일 제외, 저장소 뿌리 기준). */
export const CHARACTER_IMPORTERS = ['src/content/scenario.ts', 'src/ui/recruitment.ts'] as const;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 모양에 적힌 칸만 남긴 사본을 만든다. 칸 순서는 자료 파일의 순서를 따른다. 모양에 있는데 자료에 없는 칸은 건너뛴다. */
export function projectFields(value: Json, shape: FieldShape): Json {
  if (shape === true) return value;
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) throw new Error('배열 모양인데 자료가 배열이 아닙니다.');
    return value.map((item) => projectFields(item, shape[0]));
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('객체 모양인데 자료가 객체가 아닙니다.');
  const kept = shape as { readonly [key: string]: FieldShape };
  const out: { [key: string]: Json } = {};
  for (const [key, inner] of Object.entries(value)) {
    if (Object.hasOwn(kept, key)) out[key] = projectFields(inner, kept[key]!);
  }
  return out;
}

/** 자료에는 있으나 모양에서 뺀 칸의 경로. 'items[].rarity'처럼 쓴다. 처음 나온 순서, 중복 없이. */
export function droppedPaths(value: Json, shape: FieldShape, path = ''): string[] {
  if (shape === true || value === null || typeof value !== 'object') return [];
  if (Array.isArray(shape)) {
    const seen = new Set<string>();
    for (const item of Array.isArray(value) ? value : []) for (const p of droppedPaths(item, shape[0], `${path}[]`)) seen.add(p);
    return [...seen];
  }
  if (Array.isArray(value)) return [];
  const kept = shape as { readonly [key: string]: FieldShape };
  const seen = new Set<string>();
  for (const [key, inner] of Object.entries(value)) {
    const child = path ? `${path}.${key}` : key;
    if (!Object.hasOwn(kept, key)) seen.add(child);
    else for (const p of droppedPaths(inner, kept[key]!, child)) seen.add(p);
  }
  return [...seen];
}
```

## 부록 B. `vite.config.ts` 바뀜

1~2행(1행을 바꾸고 2행을 더한다):
```ts
import { defineConfig, type Plugin } from 'vitest/config';
import { CHARACTER_FIELDS, droppedPaths, projectFields, type Json } from './src/content/character-fields.ts';
```

`buildId` 함수 끝 `}`와 `export default defineConfig(` 사이에 넣는 블록(앞뒤 빈 줄 하나씩):
```ts
/** data/characters.json 모듈의 id. 다른 자료 파일과 `?raw` 같은 질의가 붙은 id는 잡지 않는다. */
export const CHARACTERS_ID = /[\\/]data[\\/]characters\.json$/;

/**
 * data/characters.json을 화면·엔진이 읽는 칸(src/content/character-fields.ts)만 남겨 싣는다. 파일은 바꾸지 않는다.
 * 빌드: 남긴 칸만 JSON 글로 넘긴다. 모듈 id가 그대로라 아래 data 청크 묶음에 그대로 든다.
 * 시험(vitest)·개발 서버: 같은 칸을 남기고, 뺀 칸을 읽거나 쓰면 오류를 내는 접근자를 붙인다. 목록에 없는 칸을 새로 읽으면 시험이 실패한다.
 */
export function characterFieldsPlugin(): Plugin {
  let build = false;
  return {
    name: 'scitrade:character-fields',
    enforce: 'pre',
    configResolved(config) { build = config.command === 'build'; },
    transform: {
      filter: { id: CHARACTERS_ID },
      handler(code) {
        const full = JSON.parse(code) as Json;
        const kept = projectFields(full, CHARACTER_FIELDS);
        if (build) return { code: JSON.stringify(kept), map: null };
        const dropped: Record<string, string[]> = {};
        for (const path of droppedPaths(full, CHARACTER_FIELDS)) {
          const cut = path.lastIndexOf('.');
          (dropped[cut < 0 ? '' : path.slice(0, cut)] ??= []).push(cut < 0 ? path : path.slice(cut + 1));
        }
        return {
          moduleType: 'js',
          map: null,
          code: `const data = JSON.parse(${JSON.stringify(JSON.stringify(kept))});
const shape = ${JSON.stringify(CHARACTER_FIELDS)};
const dropped = ${JSON.stringify(dropped)};
function guard(value, shape, path) {
  if (shape === true || value === null || typeof value !== 'object') return;
  if (Array.isArray(shape)) { for (const item of value) guard(item, shape[0], path + '[]'); return; }
  for (const key of dropped[path] ?? []) {
    const fail = () => { throw new Error('data/characters.json의 ' + (path ? path + '.' : '') + key + ' 칸은 빌드에 싣지 않는 칸입니다. 화면·엔진에서 쓰려면 src/content/character-fields.ts의 CHARACTER_FIELDS에 더하세요.'); };
    Object.defineProperty(value, key, { enumerable: false, configurable: true, get: fail, set: fail });
  }
  for (const [key, inner] of Object.entries(shape)) if (value[key] !== undefined) guard(value[key], inner, path ? path + '.' + key : key);
}
guard(data, shape, '');
export default data;
`,
        };
      },
    },
  };
}
```

설정 객체의 첫 줄(`base: './',` 바로 위):
```ts
  plugins: [characterFieldsPlugin()],
```

## 부록 C. `src/content/character-fields.test.ts` 전체

```ts
// 빌드에 싣는 캐릭터 칸 목록(character-fields.ts)과 vite.config.ts의 characterFieldsPlugin을 확인한다.
// 시험에서도 플러그인이 돌아, 아래 characters import는 남긴 칸만 가진 자료다. 전체 자료는 파일을 직접 읽는다.
import characters from '../../data/characters.json';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { characterFieldsPlugin, CHARACTERS_ID } from '../../vite.config';
import { CHARACTER_FIELDS, CHARACTER_IMPORTERS, droppedPaths, projectFields, type FieldShape, type Json } from './character-fields';
import { loadScenario, SCENARIO_IDS } from './scenario';

type Fs = {
  readFileSync: (path: URL, encoding: 'utf8') => string;
  readdirSync: (path: URL, options: { recursive: true }) => string[];
};
const fs = () => vi.importActual<Fs>('node:fs');
const fileText = async () => (await fs()).readFileSync(new URL('../../data/characters.json', import.meta.url), 'utf8');
const readFull = async () => JSON.parse(await fileText()) as Json;

type Hooks = {
  name: string;
  enforce?: string;
  apply?: unknown;
  configResolved: (config: { command: string }) => void;
  transform: { filter: { id: RegExp }; handler: (code: string, id: string) => { code: string; map: null; moduleType?: string } };
};

/** 항목들이 가진 칸 이름의 합집합(정렬). 일부 항목에만 있는 칸도 목록에 넣을 수 있으므로 항목마다 비교하지 않는다. */
const keyUnion = (items: object[]) => [...new Set(items.flatMap((item) => Object.keys(item)))].sort();

/** 모양에 적힌 경로 가운데 자료 어디에도 없는 것. 칸 이름이 바뀌어 목록에 낡은 이름이 남는 것을 잡는다. */
function missingPaths(value: Json, shape: FieldShape, path = ''): string[] {
  if (shape === true) return [];
  if (Array.isArray(shape)) {
    const items = Array.isArray(value) ? value : [];
    const missing = items.map((item) => new Set(missingPaths(item, shape[0], `${path}[]`)));
    return [...(missing[0] ?? [])].filter((p) => missing.every((set) => set.has(p)));
  }
  const record = (value ?? {}) as { [key: string]: Json };
  return Object.entries(shape as { readonly [key: string]: FieldShape }).flatMap(([key, inner]) => {
    const child = path ? `${path}.${key}` : key;
    return Object.hasOwn(record, key) ? missingPaths(record[key]!, inner, child) : [child];
  });
}

describe('캐릭터 자료 빌드 칸', () => {
  afterEach(() => { vi.doUnmock('../../data/characters.json'); vi.resetModules(); });

  it('칸 고르기는 목록의 칸만 파일 순서대로 남기고 뺀 칸의 경로를 돌려준다', () => {
    const sample: Json = {
      rules: ['r'],
      items: [
        { extra: 1, id: 'A', nest: { drop: 2, keep: 1 }, all: { x: [1] } },
        { id: 'B', nest: { keep: 3 }, more: true },
      ],
    };
    const shape: FieldShape = { items: [{ all: true, nest: { keep: true }, id: true }] };
    expect(JSON.stringify(projectFields(sample, shape))).toBe('{"items":[{"id":"A","nest":{"keep":1},"all":{"x":[1]}},{"id":"B","nest":{"keep":3}}]}');
    expect(droppedPaths(sample, shape)).toEqual(['rules', 'items[].extra', 'items[].nest.drop', 'items[].more']);
    expect(() => projectFields({ items: 1 }, shape)).toThrow('배열 모양인데 자료가 배열이 아닙니다.');
    expect(() => projectFields({ items: [1] }, shape)).toThrow('객체 모양인데 자료가 객체가 아닙니다.');
  });

  it('목록의 칸은 모두 자료 파일에 있다', async () => {
    expect(missingPaths(await readFull(), CHARACTER_FIELDS)).toEqual([]);
  });

  it('시험에서 불러온 자료는 파일을 목록대로 자른 것과 글자까지 같다', async () => {
    const full = await readFull();
    expect(JSON.stringify(characters)).toBe(JSON.stringify(projectFields(full, CHARACTER_FIELDS)));
    expect(Object.keys(characters)).toEqual(['items']);
    expect(characters.items).toHaveLength((full as { items: Json[] }).items.length);
    expect(keyUnion(characters.items)).toEqual(Object.keys(CHARACTER_FIELDS.items[0]).sort());
  });

  it('뺀 칸을 읽거나 쓰면 고칠 파일을 알려 주는 오류가 나고 남긴 칸은 그대로 읽고 쓴다', async () => {
    const item = characters.items[0]! as Record<string, unknown>;
    expect(droppedPaths(await readFull(), CHARACTER_FIELDS)).toContain('items[].rarity');
    expect(() => item.rarity).toThrow('data/characters.json의 items[].rarity 칸은 빌드에 싣지 않는 칸입니다. 화면·엔진에서 쓰려면 src/content/character-fields.ts의 CHARACTER_FIELDS에 더하세요.');
    expect(() => { item.rarity = 'R'; }).toThrow('items[].rarity');
    expect(() => (item.recruitment as Record<string, unknown>).mode).toThrow('items[].recruitment.mode');
    expect(() => (item.art_direction as Record<string, unknown>).proportions).toThrow('items[].art_direction.proportions');
    expect(() => (characters as Record<string, unknown>).rules).toThrow('data/characters.json의 rules 칸');
    expect(Object.keys(item)).not.toContain('rarity');
    const clue = characters.items[0]!.recruitment.story_clue;
    try {
      characters.items[0]!.recruitment.story_clue = '바꾼 단서';
      expect(characters.items[0]!.recruitment.story_clue).toBe('바꾼 단서');
    } finally {
      characters.items[0]!.recruitment.story_clue = clue;
    }
  });

  it('플러그인은 characters.json만 잡고 빌드에서는 남긴 칸만 JSON 글로 넘긴다', async () => {
    const plugin = characterFieldsPlugin() as unknown as Hooks;
    expect([plugin.name, plugin.enforce, plugin.apply]).toEqual(['scitrade:character-fields', 'pre', undefined]);
    expect(plugin.transform.filter.id).toBe(CHARACTERS_ID);
    expect(['/r/data/characters.json', 'C:\\r\\data\\characters.json'].map((id) => CHARACTERS_ID.test(id))).toEqual([true, true]);
    expect(['/r/data/character_rules.json', '/r/data/employees.json', '/r/src/characters.json', '/r/data/characters.json?raw'].map((id) => CHARACTERS_ID.test(id))).toEqual([false, false, false, false]);
    const text = await fileText();
    const full = JSON.parse(text) as Json;
    plugin.configResolved({ command: 'build' });
    const built = plugin.transform.handler(text, '/r/data/characters.json');
    expect(built).toEqual({ code: JSON.stringify(projectFields(full, CHARACTER_FIELDS)), map: null });
    const parsed = JSON.parse(built.code) as { items: Record<string, unknown>[] };
    expect(Object.keys(parsed)).toEqual(['items']);
    expect(keyUnion(parsed.items)).toEqual(Object.keys(CHARACTER_FIELDS.items[0]).sort());
    plugin.configResolved({ command: 'serve' });
    const served = plugin.transform.handler(text, '/r/data/characters.json');
    expect(served.moduleType).toBe('js');
    expect(served.code).toContain('src/content/character-fields.ts의 CHARACTER_FIELDS에 더하세요');
  });

  it('남긴 칸으로 만든 시나리오 설정은 전체 자료로 만든 설정과 같다', async () => {
    const projected = SCENARIO_IDS.map((id) => loadScenario(id));
    const full = await readFull();
    vi.resetModules();
    vi.doMock('../../data/characters.json', () => ({ default: full }));
    const { loadScenario: loadWithFull } = await import('./scenario');
    expect(SCENARIO_IDS.map((id) => loadWithFull(id))).toEqual(projected);
  });

  it('characters.json을 import하는 실행 코드 파일은 CHARACTER_IMPORTERS와 같다', async () => {
    const { readdirSync, readFileSync } = await fs();
    const src = new URL('../', import.meta.url);
    const importPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"`][^'"`]*characters\.json[^'"`]*['"`]/;
    const found = readdirSync(src, { recursive: true })
      .map((file) => file.split('\\').join('/'))
      .filter((file) => /\.(?:ts|mts|js|mjs)$/.test(file) && !file.endsWith('.test.ts'))
      .filter((file) => importPattern.test(readFileSync(new URL(file, src), 'utf8')))
      .map((file) => `src/${file}`)
      .sort();
    expect(found).toEqual([...CHARACTER_IMPORTERS].sort());
  });
});
```
