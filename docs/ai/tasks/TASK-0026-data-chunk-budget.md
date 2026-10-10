# TASK-0026 자료 청크 분리와 빌드 크기 한도 검사

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 개발 브랜치 `<BASE>` 위에 만든 `codex/TASK-0026`에서 작업한다. `<BASE>`는 이 지시서를 올린 개발 브랜치 커밋이다. Claude가 실행 전에 해시로 바꾼다.
  - 시작할 때 `git rev-parse --short HEAD`와 `git diff --name-only <BASE> HEAD`를 실행해 결과 보고에 적는다.
  - `<BASE>` 커밋이 더한 `docs/ai/tasks/` 지시서·`docs/ai/tasks/README.md`·`MANIFEST.json` 변경은 diff에 나와도 이 작업의 변경으로 치지 않는다. 그 밖의 파일이 다르면 결과 보고에 적는다.
  - 모든 diff·검사 명령의 기준 커밋은 `<BASE>`다.
  - **글꼴 세션은 이미 반영됐다(`eeb4f03`).** `<BASE>`의 `index.html`은 Google Fonts 대신 `/fonts/fonts.css`를 쓴다. 아래 ‘글꼴 세션’ 항목은 그 반영 내용을 가리키며, 그 파일들은 읽기만 한다. 글꼴 줄 수치는 7번 실험(`7c4dd59` + 이 설정)과 같아야 한다.
  - 아래 줄 번호와 숫자는 `e4f7dfa` 기준이다(Claude 확인). `<BASE>`에서 그 파일이 바뀌었으면 코드가 사실이다. 차이는 결과 보고에 적는다.
- 병렬 작업(같은 때에 돈다):
  - TASK-0024(Sol): `src/ui/main.ts`·`src/ui/style.css`·`src/ui/growth.ts`·`src/ui/main-testkit.ts`·`src/ui/main.test.ts`와 새 배치 시나리오.
  - 글꼴 세션(Claude, D16): `index.html`·`public/fonts/**`와 글꼴 도구(`tools/fonts/**`, `tools/browser/lib.mjs`·`tools/browser/README.md`의 글꼴 판정). Google Fonts 링크 세 줄(preconnect 둘 포함)을 `<link rel="stylesheet" href="/fonts/fonts.css" />` 한 줄로 바꾼다.
  - TASK-0025(Sol, 지도 폭 맞춤)가 같은 때 돌면: `src/ui/map.ts`·`src/ui/map-fit.test.ts`·`src/ui/map-integration.test.ts`·`tools/browser/lib.mjs`·`tools/browser/lib.test.mjs`·`tools/browser/scenarios/route-map-fit.json`.
  - `vite.config.ts`는 이 작업만 고친다. 이 작업은 `src/**`·`tools/browser/**`를 고치지 않으므로 위 세 작업과 파일이 겹치지 않는다(`MANIFEST.json`은 병합 때 다시 만든다).
- 결정 근거:
  - `docs/DECISIONS.md`
    - 1098행: 3차 실행 순서에 ‘청크 분할(TASK-0026)’.
    - 1063행: 새 문장마다 반례 상태 하나. 측정 시나리오는 지시서를 쓸 때 dry-run과 단계 시간을 확인한다.
    - 1065행: 비교 빌드는 빌드 표시 글의 폭이 같아야 한다.
    - 1089행 D16(글꼴 내장), 1094행 D21(CI는 검사 묶음 확인 모드).
  - `docs/STATUS.md` 463행: 남은 일 ‘청크 분할(W2-0e)’.
  - `docs/ai/tasks/TASK-0023-report-schedule-settlement-ui.md` 762행: ‘500kB 경고는 실패가 아니다(W2-0e)’. 이 작업 뒤로는 검사가 실패로 센다.
  - `.github/workflows/checks.yml` 35~36행: CI는 `bash tools/ai/review_checks.sh --check HEAD`만 부른다.
  - 2026-10-09 남은 일 점검 계획의 W2-0e와 3차 기초 조사. Claude의 작업 기록이며 저장소에 없다. 찾지 않아도 된다.
  - 설치된 Vite 8.3.2·rolldown 1.2.12(`package-lock.json` 그대로):
    - `node_modules/vite/dist/node/index.d.ts` 2911행 `rolldownOptions?: RolldownOptions`, 3001행 `chunkSizeWarningLimit?: number`(기본 500 kB). `rollupOptions`는 deprecated다.
    - `node_modules/rolldown/dist/shared/define-config-kIZKjX8Q.d.mts` 870행 `codeSplitting?: boolean | CodeSplittingOptions`, 1313행 `type CodeSplittingOptions`, 1341행 `groups?: CodeSplittingGroup[]`, 1120행 묶음의 `test?: StringOrRegExp | CodeSplittingTestFunction`. `manualChunks`·`advancedChunks`는 deprecated다. 파일 이름의 해시가 다르면 `grep -rn 'codeSplitting?:' node_modules/rolldown/dist`로 찾는다.
  - Claude 기초 조사(2026-10-10, `e4f7dfa`를 `git archive`로 푼 사본, 빌드 표시 `dev`). 조사 폴더는 저장소에 없다. 찾지 않아도 된다.
    1. 지금 빌드: JS 1개 529,657 B(Vite 500 kB 경고), CSS 25,969 B.
    2. 이 지시서의 설정(아래 1절): `assets/index-*.js` 212,001 B + `assets/data-*.js` 317,893 B. 경고 없음. `index.html`에 `<link rel="modulepreload" crossorigin href="./assets/data-….js">` 한 줄이 생긴다.
    3. 첫 화면 JS·CSS 합계(원본/gzip 9단계): 555,626 B/127,974 B → 555,863 B/127,974 B. 받는 양은 거의 같다(원본 +237 B, gzip 같음).
    4. 청크 구성: data 청크 = `data/*.json` 12개. 코드 청크에 `PACKAGE_STATUS.json`·`src/assets/manifest.json`이 남는다.
    5. Vite 경고 경계: 출력 500,000 B는 경고 없음, 500,001 B는 경고. 한글로 채운 500,002 B도 경고(글자 수가 아니라 UTF-8 바이트).
    6. 캐시: 화면 문자열 하나만 바꾼 빌드는 data 청크 이름이 같았다. `main.ts`에서 자료와 무관한 import 두 줄(`./pixel`·`./html`)의 순서를 바꾼 빌드도 같았다. `./culture` import(안에서 `venues.json`을 읽는다)를 `../content/scenario` import 뒤로 옮긴 빌드는 data 청크 이름이 바뀌었다(크기는 같음). 자료 모듈의 순서가 바뀌면 이름이 바뀐다(검토 재확인).
    7. 첫 화면 준비 시간(찬 캐시, 10Mbps/40ms, 9회 중앙값): CPU 1배 462 → 476 ms, CPU 4배 1,035 → 1,051 ms. 범위가 겹친다. 빨라졌다고 말할 근거가 없다.
    8. 원형 검사기는 ``import.meta.url === `file://${process.argv[1]}` ``로 실행 여부를 판별했다. 한글·공백이 든 경로와 링크 폴더에서 아무것도 출력하지 않고 종료 0이었다.
    9. 글꼴 세션 커밋(`7c4dd59`)에 이 설정을 더한 빌드: `index.html`에 `<link rel="stylesheet" href="./fonts/fonts.css" />`. `fonts.css` 173,953 B, 그 안 `url()`이 가리키는 `.woff2` 378개 3,995,288 B. `fonts.css`를 첫 화면 합계에 넣으면 729,816 B라 한도를 넘는다. 그래서 글꼴은 따로 센다.
    10. 이 지시서대로 만든 시제품(`bundle-size.mjs`·CLI·시험 11개·검사 묶음 수정): 수정 모드 13종·확인 모드 14종 통과. 자료 검사 25,799 → 25,807건(새 파일 4개 × 2). vitest 32개 파일·973개 통과(할 일 1) 그대로. 아래 변형 표의 변형이 모두 지정 시험에서 실패했다. 검토 때 시험 2(뿌리 기준 `url(/…)`)·시험 6(500,000 B 청크 줄)을 보강했고, 보강한 시험으로 그 두 변형과 변형 4개(실행 판별, `rel` 순서, `isFontSheet`, 나중 JS 합산)를 다시 돌려 모두 지정 시험에서 실패했다.

## 목표

1. `data/*.json`을 코드와 다른 청크(`data`)로 나눈다(안 A). Vite의 500 kB 경고가 사라진다. 첫 화면에 받는 양은 거의 같다(원본 +237 B, gzip 같음). 목적은 청크마다 크기 한도를 관리하는 것이다.
2. 빌드 크기 한도 검사를 만든다. 순수 함수 모듈 `tools/bundle-size.mjs`, 명령줄 `tools/check_bundle_size.mjs`, 시험 `tools/check_bundle_size.test.mjs`.
3. 검사 묶음(`tools/ai/review_checks.sh`)에 넣는다. 크기 검사는 방금 빌드가 성공했을 때만 돈다. CI는 이 스크립트를 부르므로 따로 고치지 않는다.

**바꾸지 않는 것:** 화면·엔진·자료·저장 형식(`src/**`, `data/**`), `index.html`, `public/**`, `package.json`, `package-lock.json`, CI 파일, 측정 도구(`tools/browser/**`), 배포 준비(`tools/deploy/**`). 플레이어가 읽는 글은 하나도 바뀌지 않는다.

## 먼저 읽을 파일

- `vite.config.ts` 전체(3~16행 `buildId`, 18~24행 설정: 19행 `base`, 20행 `define`, 21~23행 `test`).
- `tsconfig.json` 15행: `vite.config.ts`도 타입 검사를 받는다. 옵션 이름이 틀리면 `npm run typecheck`가 TS2769로 잡는다(Claude 확인).
- `package.json` 9행 `build`(= `tsc --noEmit && vite build`), 11행 `typecheck`. **읽기만 한다.**
- `index.html` 9~11행(지금 Google Fonts 링크), 15행(진입 스크립트). **읽기만 한다.** 글꼴 세션이 9~11행을 바꾼다.
- 자료 import(**읽기만 한다**): `src/content/scenario.ts` 4~16행(16행 `PACKAGE_STATUS.json`), `src/ui/assets.ts` 3행(`../assets/manifest.json`), `src/ui/recruitment.ts` 2~3행, `src/ui/culture.ts` 2행, `src/engine/growth.ts` 2행, `src/content/map.ts` 4~5행.
- `src/ui/main.ts` 32~33행: 빌드 표시(`__BUILD_ID__`). `vite.config.ts` 10~12행이 만든다. git 해시 7자(추적 파일이 바뀌었으면 뒤에 `+수정`)이거나, git이 없으면 `dev`다. 그래서 코드 청크 크기가 빌드마다 몇 바이트 다르다. **읽기만 한다.**
- `tools/ai/review_checks.sh` 전체: 23~27행 `run`, 33~34행 `total`·`fails` 시작, 35~36행 모드별 첫 검사, 40행 빌드, 47행 `node --test tools/browser/lib.test.mjs`, 48~58행 확인 모드 작업 트리 비교, 59행 `검사 N종, 실패 M종` 요약.
- `.github/workflows/checks.yml` 35~36행. **읽기만 한다.**
- `tools/deploy/prepare_static.sh` 36~42행(빌드한 `dist`를 그대로 복사). **읽기만 한다.**
- `tools/browser/lib.test.mjs` 99~124행: 임시 폴더, 자식 출력은 임시 파일로 받기(103~112행, 샌드박스의 자식 파이프 제한), 링크 폴더 시험(121행). 새 시험이 이 방식을 따른다. **읽기만 한다.**
- `tools/build_package.py` 15행 `SOURCE_DIRS`, 18~24행: `tools/` 아래 새 파일은 MANIFEST에 든다(자료 검사가 파일마다 2건 는다).
- `docs/ai/tasks/results/TASK-0012.md` 97~102행: Sol 샌드박스에서 Chromium이 죽는다.
- 위 ‘결정 근거’의 문서 줄과 형식 파일 줄.

## 범위

**포함 (이 순서로 한다)**
1. `vite.config.ts`의 청크 묶음(구현 지시 1).
2. `tools/bundle-size.mjs`(구현 지시 2).
3. `tools/check_bundle_size.mjs`(구현 지시 3).
4. `tools/check_bundle_size.test.mjs`(구현 지시 4).
5. `tools/ai/review_checks.sh`(구현 지시 5).

**제외**
- 캐릭터 자료 줄이기(안 B). `data/characters.json`의 설계 전용 칸을 빌드에서 빼는 일이다. Claude 조사로는 단일 청크가 529,657 → 329,040 B가 된다. 화면·엔진이 읽는 칸 목록을 먼저 정해야 한다. 후속 작업이다. 이 작업에서는 하지 않는다.
- 동적 import·지연 로딩. 엔진이 시작 때 자료를 모두 정적 import한다(`scenario.ts` 4~16행).
- `chunkSizeWarningLimit` 변경. `json.stringify`·`minify` 같은 다른 빌드 옵션.
- 글꼴 파일·`index.html`·`public/**`(글꼴 세션).
- `package.json` 스크립트 추가, 새 npm 의존성.
- CI 파일(`.github/**`).
- 문서. 검사 수(수정 11 → 13종, 확인 12 → 14종)가 적힌 문서(`docs/ai/WORKFLOW.md` 78행, `docs/STATUS.md` 등)는 Claude가 병합 때 고친다.
- 브라우저 측정. Sol 샌드박스에서는 Chromium이 죽는다. Claude가 잰다(아래 ‘측정’).

**시간이 모자라면 뺄 수 있음:** 없다. 범위가 작다. 모두 한다.

## 고칠 수 있는 파일

- `vite.config.ts`: 구현 지시 1의 `build` 블록 하나만 더한다. 다른 줄은 그대로다.
- 새 파일 `tools/bundle-size.mjs`, `tools/check_bundle_size.mjs`, `tools/check_bundle_size.test.mjs`.
- `tools/ai/review_checks.sh`: 구현 지시 5의 줄만 더한다. 기존 줄은 지우거나 바꾸지 않는다.
- `docs/ai/tasks/results/TASK-0026.md` (결과 보고).
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`로만 다시 만든다.

## 손대지 않을 파일

- 위 목록에 없는 모든 파일. 특히:
  - `src/**` 전체(TASK-0024와 겹친다). 시험을 위해서라도 고치지 않는다.
  - `index.html`, `public/**`(글꼴 세션).
  - `package.json`, `package-lock.json`, `tsconfig.json`.
  - `.github/**`, `tools/browser/**`, `tools/deploy/**`, `tools/build_package.py`, `tools/validate_data.py`, `tools/test_validate_data.py`, `tools/check_fact_mixing.py`, `tools/art/**`, `scripts/**`.
  - `data/**`, `tests/**`, `schemas/**`.
- 공통 금지 파일:
  - `docs/DESIGN_v0.4.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/CONTEXT_MAP.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `docs/ai/design/**`
  - `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `references/**`

## 지켜야 할 것

- 커밋·푸시·브랜치 전환을 하지 않는다. git으로 파일을 되돌리거나 stash하지 않는다. 변형 시험은 편집기로 되돌린다.
- 새 npm 패키지를 설치하지 않는다. 도구는 Node 내장 모듈(`node:fs`·`node:path`·`node:zlib`·`node:child_process`·`node:os`·`node:url`·`node:test`·`node:assert/strict`)만 쓴다. CI의 Node는 22다(`checks.yml` 26행).
- 명령줄 파일에서 `import.meta.url`과 `process.argv[1]`을 비교하는 실행 판별을 쓰지 않는다. 명령줄 파일은 위에서 바로 실행한다. 시험 파일이 자기 폴더를 찾으려고 `import.meta.url`을 쓰는 것은 된다.
- 한도 값은 아래 숫자로 고정한다. 빌드가 한도를 넘으면 한도를 올리지 않는다. 결과 보고 ‘질문’에 적는다.
- 효과를 부풀리지 않는다. 주석·출력·결과 보고에 ‘빨라진다’, ‘캐시가 좋아진다’를 쓰지 않는다(기초 조사 6·7).
- 주석과 출력 글은 한국어로, 짧은 문장으로 쓴다. 숫자는 `1,234 B` 형식이다.
- 네트워크 조사는 하지 않는다.
- 시험은 임시 폴더(`os.tmpdir()`)에만 쓴다. 끝나면 지운다. 저장소 안에 파일을 남기지 않는다(확인 모드의 작업 트리 비교가 잡는다).
- 새 시험 제목에 인수 명세 사례 ID(`P0-…` 등)를 넣지 않는다.

## 구현 지시

### 0. 공통 정의

- **첫 화면 파일:** `dist/index.html`이 직접 부르는 로컬 파일 가운데 `<script src>`, `<link rel="modulepreload">`, `<link rel="stylesheet">`. 단 `fonts/`로 시작하는 스타일시트는 뺀다. `index.html` 자체는 넣지 않는다. 그림(지도 PNG)은 넣지 않는다.
- **글꼴 스타일시트:** 로컬 `<link rel="stylesheet">` 가운데 경로가 `fonts/`로 시작하는 것. 글꼴 파일은 그 안의 `url()`이 가리키는 파일이다.
- **나중에 받는 JS:** `dist` 아래 `.js` 파일 가운데 첫 화면 파일이 아닌 것. 지금 설정에서는 0개다.
- **한도(이 숫자로 고정):**

  | 이름 | 값 | 대상 | 오늘 값(`e4f7dfa`+안 A) |
  |---|---|---|---|
  | `chunkRaw` | 500,000 B | JS 파일 하나(원본). Vite 경고와 같은 기준 | 가장 큰 것 317,893 B |
  | `firstScreenRaw` | 600,000 B | 첫 화면 파일 원본 합계 | 555,863 B |
  | `firstScreenGzip` | 140,000 B | 첫 화면 파일 gzip(9단계) 합계 | 127,974 B |
  | `fontsRaw` | 5,000,000 B | 글꼴 스타일시트 + 글꼴 파일 원본 합계 | 4,169,241 B(글꼴 세션 커밋 `7c4dd59`) |

  - 판정은 모두 ‘한도보다 크면 실패’다. 같으면 통과다.
  - gzip은 파일마다 `zlib.gzipSync(buf, { level: 9 }).length`로 재서 더한다. Vite가 찍는 gzip 값과 다르다. 비교하지 않는다.

### 1. `vite.config.ts`

20행 `define` 바로 뒤, 21행 `test` 앞에 아래 블록을 그대로 넣는다. 주석 글도 그대로 쓴다.

```ts
  build: {
    rolldownOptions: {
      output: {
        // data/*.json을 코드와 다른 청크(data)로 나눈다. 목적은 청크마다 크기 한도(500,000 B)를 관리하는 것이다.
        // 두 청크 모두 첫 화면에서 받는다(코드는 script, data는 modulepreload). 첫 화면에 받는 양은 나누기 전과 거의 같다.
        // 코드만 바꿔도 import 순서가 바뀌어 자료 모듈의 순서가 달라지면 data 청크 이름이 바뀐다. 캐시 이득은 약속하지 않는다.
        // PACKAGE_STATUS.json·src/assets/manifest.json은 data 폴더 밖이라 코드 청크에 남는다.
        codeSplitting: { groups: [{ name: 'data', test: /[\\/]data[\\/][^\\/]+\.json$/ }] },
      },
    },
  },
```

- 옵션 이름은 `build.rolldownOptions.output.codeSplitting`이다. `rollupOptions`·`manualChunks`·`advancedChunks`를 쓰지 않는다(deprecated).
- 정규식은 ‘이름이 `data`인 폴더 바로 안의 `.json`’만 잡는다. 저장소 뿌리 폴더 이름이 `data`이면 뿌리 JSON도 잡힌다. 완료 조건 4의 청크 구성 명령이 그런 경우를 잡는다.

### 2. `tools/bundle-size.mjs` (순수 함수 + 파일 읽기)

맨 위 주석: `// 빌드 크기 한도 검사의 함수 모음. 명령줄은 tools/check_bundle_size.mjs다.` 이 파일은 실행 코드를 두지 않는다. export만 한다.

```js
export const LIMITS = Object.freeze({ chunkRaw: 500_000, firstScreenRaw: 600_000, firstScreenGzip: 140_000, fontsRaw: 5_000_000 });
export function formatBytes(n)            // 1234567 → '1,234,567 B'. 쉼표는 직접 넣는다(로캘 함수 금지, 완료 조건 7).
export function pageRefs(html)            // → { kind: 'script'|'modulepreload'|'stylesheet', href: string, external: boolean }[]
export function cssUrls(css, cssHref)     // → string[] (dist 뿌리 기준 경로)
export function isFontSheet(ref)          // → boolean
export function evaluateBudget({ chunks, firstScreen, fonts }, limits = LIMITS)
export function sizeOf(dist, file)        // → { file, raw, gzip }
export function collectDist(dist)
export function formatReport(c, v, limits = LIMITS)   // → string[]
```

**2-1. `pageRefs(html)`**
- 먼저 `<!-- … -->` 주석을 지운다.
- `<script …>`·`<link …>` 시작 태그만 본다. 속성 순서·따옴표(`"`·`'`·없음)·대소문자·`/>`와 상관없이 속성을 읽는다.
  - 예: 지금 `index.html` 11행은 `href`가 `rel`보다 앞이다. 글꼴 세션의 줄은 `rel`이 앞이고 ` />`로 끝난다.
- `script`: `src`가 있으면 `kind: 'script'`. 없으면(본문 스크립트) 뺀다.
- `link`: `rel`을 공백으로 나눈 낱말(소문자)에 `modulepreload`가 있으면 `'modulepreload'`, 아니고 `stylesheet`가 있으면 `'stylesheet'`. 그 밖(`icon`·`preconnect`·`preload`)은 뺀다.
- 주소가 `data:`이면 뺀다.
- 외부 주소(`http://`·`https://`·`//`로 시작, 대소문자 무시): `external: true`, `href`는 그대로.
- 로컬 주소: `?`·`#` 뒤를 지우고 앞의 `./`·`/`를 지운다. 예: `./assets/index-C.css?v=1` → `assets/index-C.css`.
- 문서 순서로 돌려준다.

**2-2. `cssUrls(css, cssHref)`**
- `/* … */` 주석을 지운다.
- `url(…)` 안의 주소(따옴표 있음·없음)를 꺼낸다. 빈 값·`data:`·외부 주소는 뺀다. `?`·`#` 뒤를 지운다.
- `/`로 시작하면 앞의 `/`를 지운 값(dist 뿌리 기준). 아니면 `path.posix.normalize(path.posix.join(path.posix.dirname(cssHref), 주소))`.
- 처음 나온 순서, 중복 없이.

**2-3. `isFontSheet(ref)`**: `ref.kind === 'stylesheet' && !ref.external && ref.href.startsWith('fonts/')`.

**2-4. `evaluateBudget({ chunks, firstScreen, fonts }, limits)`** — 파일을 읽지 않는 순수 함수.
- 입력: `chunks`·`firstScreen`은 `{ file, raw, gzip }` 배열. `fonts`는 `{ stylesheets: { file, raw }[], files: { file, raw }[] }`.
- 반환은 정확히 이 키들이다(시험이 객체 전체를 비교한다):
  ```js
  { ok, reasons, overChunks, firstScreen: { files, raw, gzip }, fonts: { stylesheets, files, raw } }
  ```
  - `overChunks`: `raw > limits.chunkRaw`인 `chunks`의 `file`, 입력 순서.
  - `firstScreen`: `files` = 개수, `raw`·`gzip` = 합.
  - `fonts`: `stylesheets`·`files` = 개수, `raw` = 스타일시트와 파일의 `raw` 합.
  - `reasons`: 아래 순서로 해당하는 것만.
    1. `JS 청크 ${overChunks.length}개 한도 초과`
    2. `첫 화면 원본 합계 한도 초과`
    3. `첫 화면 gzip 합계 한도 초과`
    4. `글꼴 합계 한도 초과`
  - `ok` = `reasons.length === 0`.

**2-5. `sizeOf(dist, file)`**: `{ file, raw: 바이트 수, gzip: zlib.gzipSync(buf, { level: 9 }).length }`.

**2-6. `collectDist(dist)`** — 반환: `{ missing, chunks, firstScreen, lazy, fonts: { stylesheets, files }, external }`.
- `dist/index.html`이 없으면 `missing: ['index.html']`, 나머지는 빈 배열(`fonts`는 `{ stylesheets: [], files: [] }`).
- `refs = pageRefs(index.html 글)`.
- `missing`: 로컬 참조 가운데 파일이 없는 것(폴더는 없는 것으로 친다), 참조 순서. 이어서 있는 글꼴 스타일시트마다 `cssUrls`가 가리키는데 없는 파일. 중복 없이. `missing`이 있으면 나머지를 빈 값으로 돌려준다.
- `chunks`: `dist` 아래(하위 폴더 포함) 모든 `.js` 파일. 경로는 `/`로 잇는 상대 경로. 기본 `sort()` 순서. 값은 `sizeOf`.
- `firstScreen`: 로컬 참조 가운데 글꼴 스타일시트가 아닌 것. 문서 순서, 중복 없이. 값은 `sizeOf`.
- `lazy`: `chunks` 가운데 `firstScreen`에 없는 파일 경로.
- `fonts.stylesheets`: 글꼴 스타일시트의 `sizeOf`. `fonts.files`: 그 스타일시트들의 `cssUrls`를 처음 나온 순서로 합친 파일의 `sizeOf`.
- `external`: 외부 참조의 `href`, 문서 순서.

**2-7. `formatReport(c, v, limits)`** — 줄 배열. 글자를 그대로 쓴다.
1. `JS 청크 ${c.chunks.length}개 (하나에 ${formatBytes(limits.chunkRaw)} 이하):`
2. 청크마다: `  ${file} ${formatBytes(raw)}, gzip ${formatBytes(gzip)} — ${나중에 받으면 '나중에 받음', 아니면 '첫 화면'}${raw > limits.chunkRaw ? ' — 한도 초과' : ''}` (앞 공백 2칸)
3. `첫 화면 JS·CSS ${v.firstScreen.files}개: ${formatBytes(원본 합)} (한도 ${formatBytes(limits.firstScreenRaw)}), gzip ${formatBytes(gzip 합)} (한도 ${formatBytes(limits.firstScreenGzip)})`
4. 글꼴 스타일시트가 없으면: `글꼴: index.html이 fonts/ 스타일시트를 부르지 않는다`
   있으면: `글꼴: 스타일시트 ${n}개 ${formatBytes(스타일시트 합)} + 글꼴 파일 ${m}개 ${formatBytes(파일 합)} = ${formatBytes(전체)} (한도 ${formatBytes(limits.fontsRaw)}). 첫 화면 합계에 넣지 않는다`
5. 외부 참조가 있을 때만: `외부 참조 ${n}개(크기를 재지 않는다): ${href들을 공백 하나로 이음}`
6. `판정: 통과` 또는 `판정: 실패 — ${v.reasons.join(', ')}`

**Claude 확인 출력**(`e4f7dfa` + 안 A, 표시 `dev`):
```
JS 청크 2개 (하나에 500,000 B 이하):
  assets/data-COeDyC_l.js 317,893 B, gzip 50,160 B — 첫 화면
  assets/index-D_yowWxh.js 212,001 B, gzip 71,117 B — 첫 화면
첫 화면 JS·CSS 3개: 555,863 B (한도 600,000 B), gzip 127,974 B (한도 140,000 B)
글꼴: index.html이 fonts/ 스타일시트를 부르지 않는다
외부 참조 1개(크기를 재지 않는다): https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=IBM+Plex+Sans+KR:wght@400;600;700&display=swap
판정: 통과
```
- git 작업 폴더에서 빌드하면 표시가 `해시+수정`이라 코드 청크가 몇 바이트 크다(Claude: 212,012 B). data 청크 317,893 B는 같아야 한다.
- 글꼴 세션 커밋 위에서는 외부 참조 줄이 없고 글꼴 줄이 `글꼴: 스타일시트 1개 173,953 B + 글꼴 파일 378개 3,995,288 B = 4,169,241 B (한도 5,000,000 B). 첫 화면 합계에 넣지 않는다`다(Claude 확인).
- 나누기 전 빌드에서는 `  assets/index-Bz5NcihB.js 529,657 B, gzip 121,277 B — 첫 화면 — 한도 초과`와 `판정: 실패 — JS 청크 1개 한도 초과`, 종료 1이다(Claude 확인).

### 3. `tools/check_bundle_size.mjs` (명령줄)

- 첫 줄 `#!/usr/bin/env node`. 이어서 주석 두 줄:
  - `// 빌드 크기 한도 검사. 사용: node tools/check_bundle_size.mjs [dist 폴더]`
  - `// 종료 코드: 0 통과, 1 한도 초과, 2 사용법 오류 또는 읽을 파일 없음(index.html·참조 파일).`
- `./bundle-size.mjs`에서 `collectDist`·`evaluateBudget`·`formatReport`를 import한다. 아무것도 export하지 않는다. 실행 판별 없이 위에서 바로 실행한다.
- 종료 코드는 `process.exitCode`로 정한다. `process.exit()`를 부르지 않는다(출력이 잘리지 않게).
- 인수:
  - 0개면 `dist`(현재 폴더 기준). 1개면 그 경로.
  - 2개 이상이거나 `-`로 시작하는 인수가 있으면 stderr에 `사용법: node tools/check_bundle_size.mjs [dist 폴더]` 한 줄. 종료 2.
- `missing`이 있으면: stderr에 항목마다 `없음: ${파일}`, 이어서 `${dist 인수}에서 읽을 파일이 없습니다. 먼저 빌드하세요`. stdout은 비운다. 종료 2.
- 그 밖: `formatReport` 줄을 stdout에 쓴다. stderr는 비운다. 통과면 종료 0, 아니면 1.

### 4. `tools/check_bundle_size.test.mjs` (`node --test`)

아래 ‘테스트’ 절의 11개를 이 이름 그대로 쓴다.

- 임시 폴더는 파일 맨 위에서 `fs.mkdtempSync(path.join(os.tmpdir(), 'scitrade-bundle-'))`로 하나 만들고 `test.after`에서 `fs.rmSync(…, { recursive: true, force: true })`로 지운다.
- 가짜 `dist`는 그 안에 만든다. 정해진 크기 파일은 `Buffer.alloc(n, 0x61)`로 쓴다.
- 명령줄 시험은 `tools/bundle-size.mjs`·`tools/check_bundle_size.mjs`를 `<임시>/경로 시험/tools/`에 복사한다(한글과 공백). `<임시>/링크`는 `<임시>/경로 시험`을 가리키는 폴더 링크다(`fs.symlinkSync(…, 'dir')`). 두 경로의 `check_bundle_size.mjs`를 모두 실행한다.
- 자식 실행은 `spawnSync(process.execPath, [cli, ...args], { stdio: ['ignore', outFd, errFd] })`. 출력은 임시 파일로 받는다(`tools/browser/lib.test.mjs` 103~112행과 같은 방식, 샌드박스의 자식 파이프 제한). `assert.ifError(result.error)`.
- 금액·크기는 고정 숫자로 단언해도 된다(가짜 파일 크기를 시험이 정한다). gzip 값은 `sizeOf`·`zlib`로 계산해 비교한다.

### 5. `tools/ai/review_checks.sh`

- 40행 `run npm run --silent build`를 아래로 감싼다. 40행 자체는 그대로 둔다.
  ```bash
  build_fails=$fails
  run npm run --silent build
  # 크기 한도 검사는 방금 빌드가 성공했을 때만 한다. 실패했으면 남아 있을 수 있는 옛 dist를 재지 않고 실패로 센다.
  if ((fails == build_fails)); then run node tools/check_bundle_size.mjs dist
  else
    total=$((total+1)); fails=$((fails+1))
    echo '▶ node tools/check_bundle_size.mjs dist'
    echo '  실패 (빌드가 실패해 재지 않았다)'
  fi
  ```
- 47행 `run node --test tools/browser/lib.test.mjs` 바로 뒤에 `run node --test tools/check_bundle_size.test.mjs` 한 줄.
- 검사 수: 수정 모드 11 → 13종, 확인 모드 12 → 14종. 빌드가 실패해도 크기 검사 한 종을 세므로 검사 수는 늘 같다. 재지 않은 검사는 통과가 아니므로 실패로 센다.
- 이유: `npm run build`는 `tsc`가 실패하면 `vite build`를 돌리지 않는다. 그러면 전에 만든 `dist`가 남는다. 그 `dist`를 재면 크기 검사가 거짓으로 통과한다(Claude 확인: 조건을 지우면 `검사 13종, 실패 2종`, 조건이 있으면 `실패 3종`).
- 다른 줄(머리 주석, 모드, 요약, 변경 요약)은 바꾸지 않는다. CI 파일도 고치지 않는다.

### 6. 새 출력 글과 반례 상태

플레이어가 읽는 글은 없다. 도구 출력 줄마다 나오는 상태와 나오지 않는 상태를 시험한다.

| 출력 | 나오는 상태 | 나오지 않는 상태(반례) | 시험 |
|---|---|---|---|
| `— 첫 화면` | index.html이 부르는 JS | 나중에 받는 JS | 6 |
| `— 나중에 받음` | index.html이 부르지 않는 JS | 첫 화면 JS | 6 |
| `— 한도 초과`(청크 줄) | 500,001 B 청크 | 같은 출력의 500,000 B 청크 줄(경계) | 6 |
| `글꼴: 스타일시트 …` | `fonts/` 스타일시트가 있음 | 없음 | 7 |
| `글꼴: index.html이 fonts/ 스타일시트를 부르지 않는다` | 없음 | 있음 | 6·7 |
| `외부 참조 …` | Google Fonts 링크가 있음(글꼴 내장 전) | 글꼴 내장 뒤 | 7 |
| `판정: 통과` | 한도 안 | 한도 초과 | 9·10 |
| `판정: 실패 — …` | 한도 초과 | 한도 안 | 6·10 |
| stderr `없음: …`·`먼저 빌드하세요` | index.html 없음 | 정상 dist(stderr 빈 글) | 11·9·10 |
| stderr `사용법: …` | 인수 2개 | 인수 1개 | 11 |
| 검사 묶음 `  실패 (빌드가 실패해 재지 않았다)` | 빌드 실패 | 빌드 성공 | 완료 조건 5 |

## 바꿔도 되는 기존 단언

없다. 기존 시험 파일을 고치지 않는다(`src/**`, `tools/browser/lib.test.mjs`, 파이썬 시험).

## 테스트

새 시험 파일은 `tools/check_bundle_size.test.mjs` 하나다. vitest 대상(`src/**/*.test.ts`)이 아니다. `node --test`로 돈다. vitest 파일·시험 수는 시작 값 그대로다.

1. **`index.html에서 script·modulepreload·stylesheet 참조를 문서 순서로 고른다`**
   - 입력 HTML에 차례로: `<link rel="icon" href="data:," />`, `<link rel="preconnect" href="https://fonts.googleapis.com" />`, `<link href="https://fonts.googleapis.com/css2?family=X&display=swap" rel="stylesheet" />`, `<link rel="stylesheet" href="./fonts/fonts.css" />`, 주석 속 `<!-- <script type="module" src="./assets/old.js"></script> -->`, 본문 스크립트 `<script>window.x = 1</script>`, `<script type="module" crossorigin src="./assets/index-A.js"></script>`, `<link rel="modulepreload" crossorigin href="./assets/data-B.js">`, `<link rel='preload' href='./assets/map.png' as='image'>`, `<link rel="stylesheet" crossorigin href="./assets/index-C.css?v=1">`.
   - `deepEqual` 전체:
     ```js
     [
       { kind: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=X&display=swap', external: true },
       { kind: 'stylesheet', href: 'fonts/fonts.css', external: false },
       { kind: 'script', href: 'assets/index-A.js', external: false },
       { kind: 'modulepreload', href: 'assets/data-B.js', external: false },
       { kind: 'stylesheet', href: 'assets/index-C.css', external: false },
     ]
     ```
2. **`스타일시트의 url()을 스타일시트 위치 기준으로 풀고 data:·외부·중복을 뺀다`**
   - CSS: `/* url(skip.woff2) */ @font-face{src:url(a/x.woff2) format('woff2')} @font-face{src:url("a/x.woff2")} @font-face{src:url('../b/y.woff2?v=2')} @font-face{src:url(/fonts/c/z.woff2)} .i{background:url(data:image/png;base64,AA)} @import url(https://e.com/z.css);`
   - `cssUrls(css, 'fonts/fonts.css')`는 `['fonts/a/x.woff2', 'b/y.woff2', 'fonts/c/z.woff2']`. 마지막 값은 `/`로 시작하는 주소(dist 뿌리 기준)다.
3. **`JS 청크 한도: 500,000 B는 통과하고 500,001 B는 실패한다`**
   - 청크 하나(`assets/a.js`, gzip 100)를 `chunks`와 `firstScreen`에 넣고 글꼴은 비운다.
   - 500,000: `{ ok: true, reasons: [], overChunks: [], firstScreen: { files: 1, raw: 500000, gzip: 100 }, fonts: { stylesheets: 0, files: 0, raw: 0 } }`.
   - 500,001: `{ ok: false, reasons: ['JS 청크 1개 한도 초과'], overChunks: ['assets/a.js'], firstScreen: { files: 1, raw: 500001, gzip: 100 }, fonts: { stylesheets: 0, files: 0, raw: 0 } }`.
4. **`청크가 모두 한도 안이어도 첫 화면 합계가 넘으면 실패한다`**
   - 400,000 B(gzip 60,000) 청크 두 개: 객체 전체가 `{ ok: false, reasons: ['첫 화면 원본 합계 한도 초과'], overChunks: [], firstScreen: { files: 2, raw: 800000, gzip: 120000 }, fonts: { stylesheets: 0, files: 0, raw: 0 } }`.
   - gzip만 넘음(원본 100,000 두 개, gzip 70,001 + 70,000): `reasons`가 `['첫 화면 gzip 합계 한도 초과']`.
   - 경계(원본 300,000 두 개 = 600,000, gzip 70,000 두 개 = 140,000): `reasons`가 `[]`.
5. **`글꼴 한도: 5,000,000 B는 통과하고 5,000,001 B는 실패한다`**
   - 스타일시트 1 B + 글꼴 파일 (합계 − 1) B. 5,000,000이면 `reasons` `[]`, 5,000,001이면 `['글꼴 합계 한도 초과']`.
6. **`나중에 받는 JS는 첫 화면 합계에서 빠지고 청크 한도는 받는다`**
   - 가짜 dist: `index.html`이 `./assets/index.js`(script, 1,000 B)·`./assets/data.js`(modulepreload, 500,000 B, 청크 한도 경계)·`./assets/index.css`(stylesheet, 300 B)를 부른다. `assets/later.js`(500,001 B)는 부르지 않는다.
   - `firstScreen`의 `[file, raw]`가 `[['assets/index.js', 1000], ['assets/data.js', 500000], ['assets/index.css', 300]]`. `lazy`가 `['assets/later.js']`.
   - `[v.ok, v.reasons, v.overChunks, v.firstScreen.raw]`가 `[false, ['JS 청크 1개 한도 초과'], ['assets/later.js'], 501300]`.
   - `formatReport` 줄 전체(gzip 값은 `collectDist`의 값으로 만든다). 500,000 B 줄에는 `한도 초과`가 없다:
     ```
     JS 청크 3개 (하나에 500,000 B 이하):
       assets/data.js 500,000 B, gzip … — 첫 화면
       assets/index.js 1,000 B, gzip … — 첫 화면
       assets/later.js 500,001 B, gzip … — 나중에 받음 — 한도 초과
     첫 화면 JS·CSS 3개: 501,300 B (한도 600,000 B), gzip … (한도 140,000 B)
     글꼴: index.html이 fonts/ 스타일시트를 부르지 않는다
     판정: 실패 — JS 청크 1개 한도 초과
     ```
7. **`fonts/ 스타일시트는 글꼴 줄로 따로 세고 첫 화면 합계에 넣지 않는다`**
   - 글꼴 있음: `index.html`이 `<link rel="stylesheet" href="./fonts/fonts.css" />`와 `./assets/index.js`(500 B)를 부른다. `fonts/fonts.css`는 `@font-face{src:url(a/x.woff2)}@font-face{src:url(b/y.woff2)}`. 글꼴 파일 1,000 B·2,000 B. 부르지 않는 `fonts/OFL.txt`(99 B)도 둔다.
     - `v.firstScreen`이 `{ files: 1, raw: 500, gzip: (그 파일 gzip) }`.
     - `v.fonts`가 `{ stylesheets: 1, files: 2, raw: css 길이 + 3000 }`(OFL.txt는 세지 않는다).
     - 줄에 `` `글꼴: 스타일시트 1개 ${formatBytes(css 길이)} + 글꼴 파일 2개 3,000 B = ${formatBytes(css 길이 + 3000)} (한도 5,000,000 B). 첫 화면 합계에 넣지 않는다` ``가 있다. `외부 참조`로 시작하는 줄은 없다.
   - 반례(글꼴 내장 전): `index.html`이 `<link href="https://fonts.googleapis.com/css2?family=X" rel="stylesheet" />`와 `./assets/index.js`를 부른다.
     - 줄에 `글꼴: index.html이 fonts/ 스타일시트를 부르지 않는다`와 `외부 참조 1개(크기를 재지 않는다): https://fonts.googleapis.com/css2?family=X`가 있다. `글꼴: 스타일시트`로 시작하는 줄은 없다.
8. **`참조한 파일이 없으면 missing에 적는다`**
   - `index.html`이 `./fonts/fonts.css`(있음, `@font-face{src:url(x.woff2)}`)와 `./assets/gone.js`(없음)를 부르고 `fonts/x.woff2`도 없다: `missing`이 `['assets/gone.js', 'fonts/x.woff2']`.
   - 없는 폴더: `missing`이 `['index.html']`.
9. **`CLI: 한도 안이면 종료 0이고 판정 줄을 쓴다(한글·공백 경로, 링크 폴더)`**
   - 1,000 B 청크 하나. 두 경로 모두: 종료 0, stdout 마지막 줄 `판정: 통과`, stderr `''`.
   - 원형 결함(기초 조사 8)은 출력 없이 종료 0이었다. 마지막 줄 단언이 그것을 잡는다.
10. **`CLI: 한도를 넘으면 종료 1이다(한글·공백 경로, 링크 폴더)`**
    - 500,001 B 청크 하나. 두 경로 모두: 종료 1, stdout 마지막 줄 `판정: 실패 — JS 청크 1개 한도 초과`, stderr `''`.
11. **`CLI: dist/index.html이 없으면 종료 2다(한글·공백 경로, 링크 폴더)`**
    - `<임시>/빈 폴더`(만들어 두되 비움). 두 경로 모두: 종료 2, stdout `''`, stderr 전체가 `` `없음: index.html\n${dist}에서 읽을 파일이 없습니다. 먼저 빌드하세요\n` ``.
    - 같은 경로로 인수 두 개(`[dist, dist]`): 종료 2, stderr 전체가 `사용법: node tools/check_bundle_size.mjs [dist 폴더]\n`.

## 측정 (Claude가 잰다. Sol은 하지 않는다)

새 측정 시나리오는 없다. 화면이 바뀌지 않으므로 기존 시나리오로 ‘같음’을 확인한다.

- **빌드 두 개:** `git archive <BASE>`와 `git archive <작업 스냅숏 커밋>`을 각각 푼 폴더에서 빌드한다. git이 없어 표시가 둘 다 `dev`다(DECISIONS 1065행). `node_modules`는 원본을 링크하거나 복사한다.
- **dry-run(Claude가 이 지시서를 쓸 때 실행, 모두 종료 0):**
  ```
  node tools/browser/measure.mjs --dist <빌드>/dist --scenario tools/browser/scenarios/smoke.json --profiles all --dry-run
  node tools/browser/measure.mjs --dist <빌드>/dist --scenario tools/browser/scenarios/day-anchor.json --profiles all --dry-run
  node tools/browser/measure.mjs --dist <빌드>/dist --scenario tools/browser/scenarios/campaign-end.json --dry-run
  ```
  - 단계 시간: 가장 긴 단계는 `campaign-end`의 `end-day` 10회(한 번 약 0.65초, 약 6.5초)다. 15초 제한 안이다. `smoke`·`day-anchor`는 2초 안이다.
- **잴 것:**
  1. `smoke`·`day-anchor`: 7개 프로필, `--font-cache /tmp/scitrade-font-cache`. 두 빌드 모두 기대 통과, 모든 값이 같다. Claude 확인(`e4f7dfa`+안 A): `smoke` 21개 값·`day-anchor` 14개 값이 모두 같았다.
  2. `campaign-end`: 3개 프로필. 값이 같다. Claude 확인: 6개 값이 같았다.
  3. 첫 로딩 뒤 오프라인: 1366×657에서 열고 네트워크가 멈춘 뒤 오프라인으로 바꾼다. 수락 → 하루 진행 → 일정 펼침 → 직무 선택 → 현지 탭 → 90일까지 진행. 오프라인 뒤 새 JS·CSS 요청 0, 쪽 오류 0, `#settlement-h` 있음, 세 시점의 `#app` HTML 해시가 두 빌드에서 같다. Claude 확인: 모두 맞았다. 지도 PNG 다시 요청은 두 빌드 모두 94회로 같았다(이 작업과 무관).
  4. `prepare_static.sh` 출력: `.js` 2개, 출력 `index.html`에 `rel="modulepreload"` 한 줄. Claude 확인: 맞았다(파일 10개).
  5. 글꼴 세션이 먼저 들어오면 합친 트리에서 검사기 글꼴 줄과 판정을 본다. TASK-0024와 합친 트리에서 첫 화면 합계가 한도 안인지 본다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 결과 보고 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 첫 화면이 줄지 않는데 왜 나누나 | 청크마다 한도를 관리하려고 나눈다. 효과를 주장하지 않는다(기초 조사 3·6·7) |
| data 청크를 나중에 받게(동적 import) 할까 | 하지 않는다. 엔진이 시작 때 자료를 모두 읽는다 |
| Vite 경고 한도(`chunkSizeWarningLimit`)를 올릴까 | 올리지 않는다 |
| 캐릭터 자료 줄이기(안 B)도 할까 | 하지 않는다. 후속이다 |
| `rollupOptions`·`manualChunks`를 쓸까 | 쓰지 않는다. Vite 8에서 deprecated다 |
| 오늘 값에 딱 맞춘 한도를 둘까 | 아니다. 표의 고정값을 쓴다. 넘으면 한도를 올리지 말고 보고한다 |
| gzip 단계 | 9단계. Vite가 찍는 gzip 값과 다르다. 비교하지 않는다 |
| `index.html`·지도 PNG도 첫 화면 합계에 넣나 | 넣지 않는다. JS·CSS만 센다 |
| `assets/` 밖의 로컬 스크립트·스타일시트 | `fonts/` 스타일시트만 뺀다. 나머지는 첫 화면 합계에 넣는다 |
| 글꼴은 왜 따로 세나 | 글꼴은 `unicode-range` 조각이라 화면 글자에 따라 받는 조각이 다르다. 파일로는 정할 수 없다. 그래서 전체 크기 한도만 둔다 |
| 외부 참조(Google Fonts) 크기 | 재지 않는다. 줄로만 적는다. 글꼴 세션이 들어오면 사라진다 |
| 참조 파일이 없을 때 종료 코드 | 2. 잴 수 없는 상태다 |
| 빌드가 실패했을 때 크기 검사 | 재지 않고 실패로 센다. 검사 수는 그대로다 |
| `node --test`를 기존 줄에 합칠까 | 합치지 않는다. 한 줄 더한다 |
| `package.json`에 `size` 스크립트를 둘까 | 두지 않는다(손대지 않을 파일) |
| 문서의 ‘11종·12종’을 고칠까 | 고치지 않는다. Claude가 병합 때 고친다 |
| CI 기대값 | CI는 검사 묶음을 부를 뿐이다. 고칠 곳이 없다 |
| 내 빌드의 숫자가 지시서와 몇 바이트 다르다 | 빌드 표시(git 해시·`+수정`) 때문이다. 코드 청크만 다르고 data 청크 317,893 B는 같아야 한다. 다르면 보고한다 |
| 시험이 저장소 안에 파일을 만들어도 되나 | 안 된다. 임시 폴더만 쓴다 |

## 완료 조건

1. 구현 지시 1~5가 반영되었다.
2. **시작 값:** 시작 전에 `npx vitest run`, `python3 tools/validate_data.py`, `node --test tools/browser/lib.test.mjs`를 한 번 돌려 값을 적는다.
   - Claude 확인값(`e4f7dfa` 사본): vitest 32개 파일·973개 통과(할 일 1), 자료 검사 25,799건, `lib.test.mjs` 10개.
3. **빌드와 크기 검사**
   ```
   npm run build 2>&1 | grep -c 'larger than 500 kB'      # 0
   node tools/check_bundle_size.mjs dist; echo "종료 $?"     # 종료 0
   node --test tools/check_bundle_size.test.mjs              # 11개 통과
   ```
   - 첫 줄은 `0`을 찍고 종료 코드 1로 끝난다(`grep -c`는 0건이면 1). 정상이다. 숫자 `0`을 본다.
   - 검사기 출력 전체를 결과 보고에 붙인다. JS 청크가 2개이고, data 청크가 317,893 B다.
4. **청크 구성** (파일을 쓰지 않는다)
   ```
   node --input-type=module -e "import { build } from 'vite'; const r = await build({ logLevel: 'silent', build: { write: false } }); for (const c of [r].flat().flatMap((x) => x.output)) if (c.type === 'chunk') console.log(c.fileName, Object.keys(c.modules).filter((m) => m.endsWith('.json')).map((m) => m.slice(process.cwd().length + 1)).sort().join(' '));"
   ```
   - 출력이 정확히 두 줄이다(청크 이름의 해시는 다를 수 있다):
     ```
     assets/index-….js PACKAGE_STATUS.json src/assets/manifest.json
     assets/data-….js data/character_rules.json data/characters.json data/contacts.json data/culture_activities.json data/employees.json data/game_config.json data/goods.json data/market_offers.json data/routes.json data/scenarios.json data/venues.json data/world.json
     ```
5. **빌드 실패 때 크기 검사를 건너뛰는지** (한 번만, 결과 보고 파일을 만든 뒤)
   - `vite.config.ts` 맨 끝에 `export const brokenForTest: number = 'a';`를 편집기로 넣는다. `dist`는 지우지 않는다(옛 dist가 남은 상태를 만든다).
   - `bash tools/ai/review_checks.sh <BASE>`의 출력에 아래가 있다:
     - `▶ node tools/check_bundle_size.mjs dist` 다음 줄 `  실패 (빌드가 실패해 재지 않았다)`.
     - `검사 13종, 실패 3종 (모드: 수정)`(타입 검사·빌드·크기 검사).
   - 그 줄을 편집기로 지운다. `git diff <BASE> -- vite.config.ts`가 구현 지시 1의 블록만 보이는지 확인한다.
6. **마감 검증** (결과 보고 파일을 먼저 만든 뒤, 이 순서로)
   ```
   bash tools/ai/review_checks.sh <BASE>
   bash tools/ai/review_checks.sh --check <BASE>
   ```
   - `검사 13종, 실패 0종 (모드: 수정)`, 이어서 `검사 14종, 실패 0종 (모드: 확인)`. 확인 모드의 `작업 트리 변화 없음` 통과.
   - vitest·`lib.test.mjs` 값은 시작 값과 같다. `check_bundle_size.test.mjs` 11개 통과.
   - 자료 검사는 시작 값 + 8건이다(새 파일 4개: 도구 3개 + 결과 보고). 다르면 MANIFEST에 새로 든 파일 목록을 보고에 적는다.
   - 파이썬 시험은 그림 도구 21개, 지도 21개(3개 건너뜀), 자료 검사기 74개, 사실 섞임 20개 그대로다(Claude 확인값, `e4f7dfa`).
   - 크기 검사 줄 아래의 검사기 출력에 `판정: 통과`가 있다.
7. **바꾼 범위 확인** (출력을 결과 보고에 붙인다)
   - `git diff --name-only <BASE>`와 `git status --short --untracked-files=all`의 파일이 모두 ‘고칠 수 있는 파일’ 안에 있다.
   - 다음 출력이 비어 있다:
     ```
     git diff <BASE> -- src index.html public package.json package-lock.json tsconfig.json .github tools/browser tools/deploy tools/build_package.py tools/validate_data.py tools/test_validate_data.py tools/check_fact_mixing.py tools/art scripts data tests schemas
     git diff <BASE> -- tools/ai/review_checks.sh vite.config.ts | grep '^-[^-]'
     ```
     - 둘째 명령이 비어 있어야 한다: 두 파일에서 지운 줄이 없다(더하기만).
   - 새 도구 파일에 실행 판별과 로캘 함수가 없다(결과 0건):
     ```
     grep -nE "import\.meta\.url|process\.argv\[1\]|toLocaleString|process\.exit\(" tools/bundle-size.mjs tools/check_bundle_size.mjs
     ```
     - 주석도 센다. 두 파일의 주석에 이 낱말을 쓰지 않는다(‘쓰지 않는다’는 설명도 안 된다).
   - 주석·출력에 효과 과장이 없다(결과 0건). 새 파일은 아직 추적되지 않아 `git diff`에 나오지 않으므로 파일을 직접 본다:
     ```
     grep -nE "빨라|빠르게|속도|캐시 이득을 얻|캐시가 좋" vite.config.ts tools/bundle-size.mjs tools/check_bundle_size.mjs tools/check_bundle_size.test.mjs tools/ai/review_checks.sh
     ```
8. **변형 시험.** 아래를 하나씩 넣고 실패하는 시험 번호·이름을 표로 적는다. 확인한 뒤 편집기로 되돌린다. git으로 되돌리거나 stash하지 않는다.

   | 변형 | 실패해야 하는 것 |
   |---|---|
   | CLI를 ``if (import.meta.url === `file://${process.argv[1]}`) { … }``로 감쌈 | 시험 9·10·11 |
   | 청크 판정을 `raw >= limits.chunkRaw`로 | 시험 3 |
   | 청크 줄의 `— 한도 초과` 표시 조건을 `raw >= limits.chunkRaw`로(`evaluateBudget`은 그대로) | 시험 6 |
   | `cssUrls`가 `/`로 시작하는 주소도 스타일시트 위치 기준으로 이음(또는 앞 `/`를 남김) | 시험 2 |
   | 첫 화면 원본 합계에 나중에 받는 JS도 더함 | 시험 6 |
   | `isFontSheet`가 늘 `false` | 시험 7·8 |
   | `modulepreload`를 무시 | 시험 1·6 |
   | `link`에서 `rel`이 `href`보다 앞일 때만 읽음 | 시험 1·7 |
   | HTML 주석을 지우지 않음 | 시험 1 |
   | `cssUrls`가 스타일시트 위치를 무시(뿌리 기준) | 시험 2·7·8 |
   | gzip 합계 판정을 지움 | 시험 4 |
   | 글꼴 한도 판정을 지움 | 시험 5 |
   | 참조 파일 없음 검사를 지움 | 시험 8 |
   | `index.html` 없음을 `missing: []`로 | 시험 8·11 |
   | 읽을 파일 없음의 종료 코드를 1로 | 시험 11 |
   | 사용법 오류의 종료 코드를 1로 | 시험 11 |
   | 나중에 받는 청크에도 `첫 화면`이라 씀 | 시험 6 |
   | 검사 묶음의 빌드 성공 조건을 `if true`로 | 완료 조건 5 절차에서 `검사 13종, 실패 2종`(옛 dist를 재어 통과) |
   | `vite.config.ts`의 `codeSplitting` 블록을 지움 | 완료 조건 3: 검사기 종료 1(`… — 한도 초과`), 빌드 경고 1 |
   | 옵션 이름을 `codeSpliting`으로 | `npm run typecheck` TS2769 |
   | 묶음 `test`를 `/\.json$/`로 | 완료 조건 4: `PACKAGE_STATUS.json`·`src/assets/manifest.json`이 data 청크 줄로 옮겨 감(자동 시험 없음) |

   - Claude도 검수 때 이 표를 다시 돌린다.
9. 결과 보고를 아래 형식으로 썼다.

## 결과 보고

`docs/ai/tasks/results/TASK-0026.md`에 머리말 형식(`CODEX_PREAMBLE.md`)으로 쓴다. 다음 절을 꼭 넣는다.

- **바꾼 파일**
- **설계 판단:** 지시서에 없던 결정과 이유.
- **실행한 검증과 결과:** 시작 HEAD 해시와 `git diff --name-only <BASE> HEAD` 출력. 시작 값(vitest 파일·시험, 자료 검사 건수, `lib.test.mjs` 수). 명령별 통과·실패와 개수. 크기 검사기 출력 전체. 청크 구성 명령 출력. 완료 조건 5의 출력 줄.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **바꾼 기존 단언:** 없어야 한다. 완료 조건 7의 출력을 붙인다.
- **변형 시험 표**
- **출력 글 목록:** 검사기와 검사 묶음이 새로 쓰는 줄을 그대로 적는다.
- **범위 밖 발견:** 고치지 않은 문제. 없으면 ‘없음’.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. 없으면 ‘없음’.

브라우저 측정은 하지 않는다. 했다면 실제 배율 방식(WORKFLOW 119~121행)인지 적는다.

## 후속 (Claude 기록용, 이 작업에서 하지 않음)

- 안 B: 캐릭터 자료를 화면·엔진이 읽는 칸만 남겨 빌드한다. 단일 청크 기준 529,657 → 329,040 B(Claude 조사). 읽는 칸 목록, 설계 전용 칸의 위치(자료 파일에만 둠), 자료 검사기와의 관계를 먼저 정한다.
- 병합 때 Claude가 고칠 문서: `docs/ai/WORKFLOW.md` 78행 검사 목록, `docs/STATUS.md` 검사 수, `docs/ai/tasks/README.md` 상태, `docs/DECISIONS.md` 3차 반영 기록.
