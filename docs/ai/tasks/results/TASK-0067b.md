# TASK-0067b 결과
- 모델: gpt-6-astra (high)
- BASE: 5fa53b08fc07dec892975a7055f934b316845446

## 바꾼 파일

| 파일·줄 | 변경 |
|---|---|
| `src/engine/risk.ts:158,171,223` | 독립 대손 추첨, 마감 잔액으로 계산하는 단일 이자 함수, R4 변환 |
| `src/engine/engine.ts:1201,1236,1248,1271,1297` | 수금보다 먼저 대손 판정, 회수→이자→대손→상태, 실제 수금 뒤 누적 이자 차액 분개, 종결 청구서 차단 |
| `src/engine/types.ts:203`, `src/engine/save-shape.ts:32` | WRITTEN_OFF 열거 추가. 형식 6 유지 |
| `src/engine/ledger.ts:20,49,214` | 두 비용 계정과 profit 차감. BookSummary 키 유지 |
| `src/engine/reports.ts:35,400,411,471,533` | 계약 기여 차감, 종결 채권 제외, 판본 4의 default·carry 흐름 분해 |
| `src/engine/operations.ts:254,265` | 다음 수금일·그날 금액에서 대손 종결 제외 |
| `src/engine/progress.ts:48,63` | 대손 종결 문구와 미수 안내 제외 |
| `src/engine/invariants.ts:115,126` | 미수 합계 제외, 새 값의 판본 제한, 대손 분개·확정일·후속 분개·이자 합계 검사 |
| `src/engine/m2a5-risk-default-v2.test.ts` | 새 시험 26개. 기존 시험 파일 수정 없음 |
| `tools/validate_data.py:934` | 외상 칸이 있으면 collections.grades의 A·B·C 각 한 행 요구 |
| `tools/test_validate_data.py:1154` | B 거래처를 A로 바꾸고 B 등급 행만 제거하는 거부 사례 추가 |
| `MANIFEST.json` | 생성기로 갱신 |
| `docs/ai/tasks/results/TASK-0067b.md` | 이 보고 |

## 설계 판단 (지시서에 없던 결정과 이유)

- 확정은 `s.day === inv.dueDay + lateMaxDays`에서 실행한다. 캠페인 마지막 날 이후에는 엔진 루프가 실행되지 않는다. 변형 6은 이 조건에 `s.day < campaignDays`를 덧붙여 90일 확정을 막는 동등한 결함으로 실행했다. 91일 확정 금지는 별도 불변식·손 위반 상태로 검증했다.
- 이자 계산에는 새 상태 칸을 두지 않았다. CARRY 층 검사는 `carryAccrued` 한 곳뿐이다. PAID도 과거 수금 원장을 읽으므로 마지막 수금일 이자는 빠지지 않고 이후 잔액은 0이다.
- 이전 규칙 저장에 새 상태·계정을 섞으면 불변식에서 거절한다. 기존 PAID 전용 금액 검사는 그대로다.
- 손 고정물은 실제 ACCEPT_TRADE로 만든 계약에 인도·원가 분개를 붙였다. 지연·부분 수금은 날짜를 확실히 6일로 고정했고, 대손 확정 간격은 15일이다. R0P~R3 회귀는 BASE의 시드 2001 전체 캠페인 최종 상태 SHA-256 리터럴 4개와 비교한다(원장 포함).
- BASE gzip은 병합 기록의 131,180 B와 달리 131,206 B였다. 이번 BASE에서 직접 빌드한 값을 비교 기준으로 썼다. 빌드에는 커밋 표시가 포함된다.
- 5절의 ‘고치지 않는 자리’ 중 types.ts:203·save-shape.ts:32는 PAID 판정 변경 대상이 아니라 열거 선언이다. 명시된 4·5절 요구대로 WRITTEN_OFF만 추가했고 기존 PAID 값은 유지했다.

### WRITTEN_OFF 자리별 전후

| BASE 자리 → 현재 자리 | 전 → 후 |
|---|---|
| engine.ts:1203 → 1203 | `PAID || dueDay > day` → `PAID || WRITTEN_OFF || dueDay > day` |
| engine.ts:1229 → 1273 | 부분 수금: 없음/PAID/중복 거절 → WRITTEN_OFF도 거절 |
| engine.ts:1255 → 1299 | 전액 수금: 없음/PAID/중복 거절 → WRITTEN_OFF도 거절 |
| operations.ts:254 → 254 | USD·PAID 아님 → USD·PAID·WRITTEN_OFF 아님 |
| operations.ts:265 → 265 | 같은 결제일의 PAID 아닌 USD 합 → WRITTEN_OFF도 제외 |
| reports.ts:400 → 400 | openInvoices에서 PAID 제외 → WRITTEN_OFF도 제외 |
| reports.ts:411 → 411 | receivableSchedule에서 PAID 제외 → WRITTEN_OFF도 제외 |
| progress.ts:48 → 48–53 | COMPLETED이면 전액 감액/수금 종결 → 대손 청구서는 `{completedDay}일 대금 회수 불능 · 대손 종결` |
| progress.ts:60 → 63 | 미수 안내 PAID 제외 → WRITTEN_OFF도 제외 |
| invariants.ts:115 → 115 | 매출채권 대조에 PAID 제외 → WRITTEN_OFF도 제외 |

검색에서 발견한 추가 생산 코드 판정 자리는 없다. `operations-invariants.ts:17`의 PAID 전용 수금 금액 검사, 기존 `engine.ts:1238·1269`(현재 1282·1313)의 PAID 대입은 변경하지 않았다. UI는 수정하지 않았다.

### 위험 분해 구현

- `reports.ts:471–489`: rules-4에서 WRITTEN_OFF outstanding=0. 미기재 이자는 `min(evaluationDay,lastClosedDay)+1`까지의 누적액에서 기재액을 뺀 평가일 비용 흐름이다.
- `reports.ts:533–550`: collection은 정상 수금(-R 제외)과 미회수액 U의 확정일 수입 흐름이다. 미확정 채권은 평가일 흐름을 유지한다.
- `reports.ts:552–558`: default는 U 흐름을 지우고 확정일 R 수입 흐름으로 교체한다. carry는 그 뒤 실제 분개일 이자 현금 흐름과 평가일 미기재 이자 비용을 더한다.
- `reports.ts:559–564`: rules-4 키 순서 `schedule, fx, tariff, surcharge, late, claim, cancel, collection, default, carry, open_valuation, residual`. rules-3 키는 BASE 리터럴과 같다.

## 실행한 검증과 결과

### 작업 전

| 명령 | 결과 |
|---|---|
| `node tools/check_rules2_golden.mjs` | 종료 0, rules-2 105회·rules-1 400회 일치 |
| `node tools/check_rules3_golden.mjs` | 종료 0, rules-3 108회 일치, 로더 지문 경고 없음 |
| `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-run-before.json` | 종료 0, 비위험 400회 |
| `npm run --silent build && node tools/check_bundle_size.mjs dist` | 종료 0, 첫 화면 gzip **131,206 B / 140,000 B** |

BASE(수정 전) `deserializeSave` 일회 실행: WRITTEN_OFF만, BAD_DEBT만, RECEIVABLE_CARRY만, 셋을 함께 넣은 rules-4 저장 모두 ‘저장 필드 모양’ 오류로 거절했다. 실제 오류 경로는 각각 `state.invoices[0].status`, `state.ledger.entries[2].lines[0].account`다. 스크립트는 `/tmp/TASK-0067b-baseline.mjs`에만 뒀다.

### 손 계산과 새 시험

| 경우 | 반올림 전 합 A (센트×bp) | 실제 CARRY (센트) | 실제 수금·손실 |
|---|---:|---:|---|
| 10일 결제, 16일 지연 전액 | 185,175 | 19 | 16일 12,345 수금 뒤 이자 |
| 10일·16일 부분 수금 | 92,580 | 9 | 6,173 + 6,172 |
| 25일 대손 확정 | 518,490 | 52 | 3,704 회수 → 52 이자 → 8,641 대손 |
| 정시 수금 | 0 | 0 | 이자 분개 없음 |

시드 **7737**, 확정일 25일 환율 **1,206원**, 평가일 36일 환율 **1,247원** 고정물에서 `default = round(3704×1206/100) − round(12345×1206/100) = 44,670 − 148,881 = −104,211원`. `−round(8641×1206/100) = −104,210원`과 다르다. 같은 환율의 추가 원가 7센트를 넣으면 `carry = round(−59×1206/100) − round(−7×1206/100) = −712 − (−84) = −628원`으로, 이자만 환산한 −627원과 다르다. 두 값과 residual=0을 함께 단언했다.

새 시험 최종 출력(변형 전, 모두 복원 후 전체 검사에서도 재검증):

```text
Test Files  1 passed (1)
Tests       26 passed (26)
```

개발 중 새 고정물의 로그 필드명(textKo), 통화 타입, 두 번째 고정물 ID 접두 충돌을 고쳤다. 기존 시험·기대값은 고치지 않았다.

### 변형 시험

저장소 밖 `/tmp/TASK-0067b-mutations.py`로 하나씩 적용·실행하고 `finally`에서 원본 내용을 복원했다. 15개 모두 종료 1로 탐지됐다. 각 출력은 `/tmp/TASK-0067b-mutation-N.txt`에 있다.

| 번호 | 변형 | 실제 실패 근거 |
|---|---|---|
| 1 | 대손 → 회수 순서 | 시험 3, 첫 분개 BADDEBT가 기대 RECEIPT와 다름 |
| 2 | 날마다 반올림 | 시험 5, 20≠19 / 10≠9 / 56≠52 |
| 3 | 분개일 당일 포함 | 시험 5 DEFAULT, 최종 이자와 누적 이자 불변식 불일치 |
| 4 | PAID이면 마지막 이자 생략 | 시험 5, 0≠19 / 0≠9 |
| 5 | 다음 수금의 상태 조건 전체 삭제 | 시험 6, day 10≠30 |
| 6 | 캠페인 끝 전날까지만 확정 | BASE·D15 경계 시험, OVERDUE≠WRITTEN_OFF |
| 7 | 캠페인 밖 확정 금지 불변식 삭제 | 시험 11, 요구 위반 문장 누락 |
| 8 | DEFAULT 층 검사 삭제 | 시험 2 false 기대 실패, R0P~R3 BASE 상태 해시도 실패 |
| 9 | CARRY 층 검사 삭제 | 시험 5, 185175≠0 |
| 10 | R 회수 흐름을 평가일로 | 시험 8 residual −1519≠0 |
| 11 | 실현값에 대손 outstanding 유지 | 시험 8 residual 107753≠0 |
| 12 | 대손 종결 문구 삭제 | 시험 6, 수금 완료 문구와 다름 |
| 13 | A·B·C 필수 검사 삭제 | 새 Python 거부 사례 1개 실패, 고유 메시지 누락 |
| 14 | 결제일 대손 추첨 로그 추가 | 시험 12 로그 동치 실패 |
| 15 | 같은 날 수금액에서 대손 제외 삭제 | 시험 6 amountMinor 13122≠777 |

마지막 스크립트 출력: `변형 원본 복원 일치`. 모든 대상 파일 내용이 변형 전 백업과 같음을 단언했다.

### J1 일회 점검

`/tmp/TASK-0067b-j1.mjs`에서 저장소 package.json 기준 createRequire로 vite를 찾아 runnerImport했다. 승인된 withLateMode(base) → withRiskLevelV2(R4, V2 두 프로필), MAX_CONTRIBUTION, 시드 2001~2010으로 `simulate`에 인수 3개만 전달했다. 대손 금액·CARRY 합 단위는 USD 센트다.

| 시드 | 대손 건수 | BAD_DEBT 합 | CARRY 합 | 미확정 대손 | outcome | 끝 KRW 미지급 |
|---|---:|---:|---:|---:|---|---:|
| 2001 | 1 | 175000 | 1610 | 0 | COMPLETED | 0 |
| 2002 | 1 | 171500 | 4814 | 0 | COMPLETED | 0 |
| 2003 | 0 | 0 | 1836 | 0 | COMPLETED | 0 |
| 2004 | 1 | 547050 | 4416 | 0 | COMPLETED | 0 |
| 2005 | 1 | 365252 | 3767 | 0 | COMPLETED | 0 |
| 2006 | 1 | 399832 | 6607 | 0 | COMPLETED | 0 |
| 2007 | 0 | 0 | 3141 | 0 | COMPLETED | 0 |
| 2008 | 1 | 197645 | 2727 | 1 | COMPLETED | 0 |
| 2009 | 0 | 0 | 3872 | 0 | COMPLETED | 0 |
| 2010 | 2 | 549360 | 4567 | 0 | COMPLETED | 0 |

예외 0건, FAILED 0건, 끝 KRW 미지급 0원: 10시드 모두 통과. 실패를 우회하거나 경제 값을 조정하지 않았다.

### 작업 후 통합 검증

| 명령 | 결과 |
|---|---|
| `python3 tools/build_package.py --manifest-only` | 통과, 796파일. 최종 보고 갱신 후 다시 생성 |
| `python3 tools/validate_data.py` | 통과, 자료 25개·검사 34,034개 |
| `npm run typecheck` / 검수의 `npm run --silent typecheck` | 통과 |
| `npx vitest run` | **1,564 통과, 기존 TODO 1, 시험 파일 57 통과**. 새 파일 26개 포함 |
| `npm run --silent build` | 통과 |
| `node tools/check_bundle_size.mjs dist` | 통과, 첫 화면 gzip **132,588 B**, BASE 대비 **+1,382 B**, 한도 여유 **7,412 B** |
| `node tools/check_rules2_golden.mjs` | 종료 0, rules-2 105회·rules-1 400회 일치 |
| `node tools/check_rules3_golden.mjs` | 종료 0, rules-3 108회 일치, 로더 지문 경고 없음 |
| `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-run-after.json` | 종료 0, 비위험 400회 |
| `cmp /tmp/TASK-0067b-run-before.json /tmp/TASK-0067b-run-after.json` | 종료 0, 바이트 일치 |
| `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check 5fa53b08fc07dec892975a7055f934b316845446` | 최종 출력 아래 기록 |
| `python3 tools/art/test_pixel_tools.py` | 21개 통과 |
| `python3 -m unittest discover -s scripts -p 'test_*.py'` | 21개 통과 |
| `python3 tools/test_validate_data.py` | 141개 통과, 새 거부 사례 포함 |
| `python3 tools/check_fact_mixing.py` | 통과 |
| `python3 tools/test_check_fact_mixing.py` | 26개 통과 |
| `node --test tools/check_rules2_golden.test.mjs` | 파일 시험 1개 통과 |
| `node --test tools/check_rules3_golden.test.mjs` | 파일 시험 1개 통과 |
| `node --test tools/browser/lib.test.mjs` | 파일 시험 1개 통과 |
| `node --test tools/check_bundle_size.test.mjs` | 파일 시험 1개 통과 |
| `python3 tools/build_package.py --check` (최종 보고 갱신 후) | 796파일 일치 |
| `git diff --check` | 통과 |

전체 검수 출력은 `/tmp/TASK-0067b-review.txt`에 있다. 최종 요약:

```text
검사 18종, 실패 0종 (모드: 확인)
```

`git diff --name-status <BASE> -- 'src/**/*.test.ts' 'tools/*.test.mjs' tests/golden`은 빈 출력. `git diff --numstat <BASE> -- tools/test_validate_data.py`는 `9  0`이다. 최종 `git status --porcelain --untracked-files=all`의 새 파일은 새 시험과 이 보고뿐이다. 커밋·푸시·브랜치 전환은 하지 않았다.

## 완료 조건 대조

| 11절 조건 | 판정·근거 |
|---|---|
| 1. 세 회귀 검사 전후 동일 | 충족. rules-1/2/3 골든·로더 지문 일치, 비위험 400회 cmp 0 |
| 2. 기존 시험 변경 없음 | 충족. 지정 diff 빈 출력, Python 시험 삭제 0, 새 파일 2개뿐 |
| 3. 새 시험·변형 15개·J1 | 충족. 26개 통과, 변형 15개 모두 탐지·복원, J1 10시드 모두 통과 |
| 4. 첫 화면 gzip | 충족. 131,206 → 132,588 B, 둘 다 140,000 B 이하 |
| 5. MANIFEST·자료 검사 | 충족. 생성기 사용, 자료 검사 통과 |
| 6. review_checks | 충족. 검사 18종, 실패 0종 (모드: 확인) |
| 7. 결과 보고 | 충족. 이 파일 |

7절 시험 항목도 모두 대조했다: 1 변환·BASE 전체 상태 해시 4개·0 성분, 2 대손 결정론·반올림 경계·층, 3 확정 순서·금액·90/91일, 4 노출액 제외, 5 이자 3사례·정시·층 없음, 6 수금·예정일·금액·보고·문구·매출채권 불변식, 7 R3/R4 실제 수금 동치, 8 확정/미확정/지연 이자 residual·진행 중/끝 미기재 이자·기존 키, 9 profit·contribution·키, 10 저장 왕복, 11 손 위반 상태와 회수 0 경계, 12 확정 전날 청구서·계약·로그·읽기 동치.

## 0068 인계

- 대손 건수: `state.invoices.filter(i => i.status === 'WRITTEN_OFF').length`.
- 대손 금액: 원장에서 `BADDEBT-{invoiceId}`의 BAD_DEBT 차변 합(통화별). 회수액은 `RECEIPT-RCPT-{invoiceId}-R`의 CASH 합이다. `operations.defaultEvents`는 회사의 지급불능 경고이므로 거래처 대손 건수로 세지 않는다.
- 기재 CARRY: `CARRY-{invoiceId}-{n}`의 RECEIVABLE_CARRY 차변 합(통화별). 미기재 비용은 `divHalfAway(carryAccrued(state,cfg,id,min(evaluationDay,lastClosedDay)+1),10000) - 기재합`이다.
- 미확정 대손 수(종료 후 진단 전용): 직접 무역 청구서 중 OUTSTANDING/OVERDUE이고 `defaultFor(cfg,state.rng.seed,c.sellOfferId,c.customerId,c.creditTermId ?? 'BASE')`가 참인 수. 확정일은 inv.dueDay+lateMaxDays. 이 함수·확률을 플레이어 미리보기나 조건 선택지에 노출하지 않는다.
- 한도로 막힌 수: 계약의 수락 시점 `creditEligible.limitBlocked`가 막힌 D15/D30 목록이다. ‘막힌 조건 개수’는 배열 길이 합, ‘한 번 이상 막힌 수락 계약 수’는 비어 있지 않은 계약 수로 구분한다. 수락되지 않은 시도의 횟수는 이 저장 값만으로 복원되지 않으므로 0068 정책 실행기가 계측한다.
- `RiskContract`에 `contractRiskReport(...).components.default`·`.carry`를 추가한다(원화 정수). rules-3에서는 키가 없고 rules-4 R0P~R3에서는 0이다. default는 확정일의 R·U를 각각 환산한 차, carry는 같은 환율 비용 묶음의 가치 차다. 단순히 대손액/이자액을 별도 환산하면 1원 차이가 생긴다.

## 범위 밖 발견

- UI의 생산 코드 4자리(`main.ts:402,698,905`, `schedule.ts:73`)는 WRITTEN_OFF를 여전히 미수처럼 표시할 수 있다. 지시대로 수정하지 않았으며 경로 11로 넘긴다.
- UI 시험의 PAID 필터(`main.test.ts:1926`, `schedule.test.ts:202`)도 검색됐지만 기존 시험은 변경하지 않았다.
- `data/**`, `schemas/**`, `src/ui/**`, `src/engine/sim/**`, `src/content/**`, 기존 시험·골든, 허브 문서는 변경하지 않았다.

### PAID 전체 검색 결과

`rg -n "'PAID'" src/engine src/ui` (지시서 grep과 같은 검색, 시험 포함):

```text
src/ui/main.ts:402:  const nextReceipt = [...state.invoices].filter((i) => i.status !== 'PAID').sort((a, b) => a.dueDay - b.dueDay)[0];
src/ui/main.ts:698:    [forwarding ? '서비스 대금' : '판매대금', c.status === 'CANCELLED' ? '청구 없음 (계약 취소)' : c.invoiceId ? (() => { const inv = view.invoices.find((i) => i.id === c.invoiceId)!; return `${usd(inv.amountMinor)} · ${inv.dueDay}일 결제 · ${inv.status === 'PAID' ? '수금 완료' : '미수'}`; })() : `${usd(c.saleAmountMinor)} (인도 후 청구)`],
src/ui/main.ts:905:    const open = state.invoices.filter((i) => i.status !== 'PAID').sort((a, b) => a.dueDay - b.dueDay);
src/engine/types.ts:203:export type InvoiceStatus = 'OUTSTANDING' | 'OVERDUE' | 'PAID' | 'WRITTEN_OFF';
src/engine/invariants.ts:115:      .filter((i) => i.currency === c && i.status !== 'PAID' && i.status !== 'WRITTEN_OFF')
src/engine/progress.ts:63:    if (inv && inv.status !== 'PAID' && inv.status !== 'WRITTEN_OFF') {
src/engine/engine.ts:1203:    if (inv.status === 'PAID' || inv.status === 'WRITTEN_OFF' || inv.dueDay > s.day) continue;
src/engine/engine.ts:1273:  if (!inv || inv.status === 'PAID' || inv.status === 'WRITTEN_OFF' || inv.receiptIds.includes(receiptId)) return false;
src/engine/engine.ts:1282:    inv.status = 'PAID';
src/engine/engine.ts:1299:  if (!inv || inv.status === 'PAID' || inv.status === 'WRITTEN_OFF' || inv.receiptIds.includes(receiptId)) return false;
src/engine/engine.ts:1313:  inv.status = 'PAID';
src/engine/reports.ts:400:    openInvoices: s.invoices.filter((i) => i.status !== 'PAID' && i.status !== 'WRITTEN_OFF').map((i) => ({
src/engine/reports.ts:411:  return s.invoices.filter((i) => i.status !== 'PAID' && i.status !== 'WRITTEN_OFF').map((i) => ({
src/ui/main.test.ts:1926:    const open = waiting.invoices.filter((i) => i.status !== 'PAID').sort((a, b) => a.dueDay - b.dueDay);
src/ui/schedule.test.ts:202:    const invoices = s.invoices.filter((i) => i.status !== 'PAID'); expect(invoices.length).toBeGreaterThan(0);
src/engine/m2a5-risk-credit.test.ts:262:      const open = state.invoices.filter((i) => i.status !== 'PAID' && state.contracts.find((c) => c.id === i.contractId)!.kind === 'DIRECT_TRADE');
src/engine/m2a5-risk-credit.test.ts:471:  expect(invoice(r, done)).toMatchObject({ status: 'PAID', receiptIds: mode === 'PARTIAL' ? [`RCPT-${inv.id}-1`, `RCPT-${inv.id}-2`] : [`RCPT-${inv.id}`] });
src/engine/m2a5-risk-credit.test.ts:489:    expect(invoice(r, at(r, inv.dueDay + 1))).toMatchObject({ status: 'PAID', receiptIds: [`RCPT-${inv.id}`] });
src/engine/m2a5-risk-credit.test.ts:745:    const transit = r.states.find((s) => s.shipments.length && contract(r, s).deliveredDay === null), delivered = r.states.find((s) => s.invoices.some((i) => i.status !== 'PAID'));
src/engine/m2a5-risk-credit.test.ts:763:      const sum = s.invoices.filter((i) => i.currency === 'USD' && i.status !== 'PAID').reduce((n, i) => n + i.amountMinor - received(s, i), 0);
src/engine/m2a5-risk-credit.test.ts:846:    const open = s.invoices.filter((i) => i.status !== 'PAID'); expect(open.length).toBeGreaterThanOrEqual(2);
src/engine/m2a5-risk-default-v2.test.ts:89:      expect(inv(s, f).status).toBe('PAID');
src/engine/m2a5-risk-default-v2.test.ts:164:      if (mode !== 'DEFAULT') expect(inv(s, f).status).toBe('PAID');
src/ui/schedule.ts:73:    for (const invoice of s.invoices) if (invoice.status !== 'PAID') add(`RCV:${invoice.contractId}`, 'RECEIPT',
src/engine/campaign-end.test.ts:22:  expect(report.openInvoices).toEqual(s.invoices.filter((i) => i.status !== 'PAID')
src/engine/operations.ts:254:  const nextReceipt = s.invoices.filter((i) => i.currency === 'USD' && i.status !== 'PAID' && i.status !== 'WRITTEN_OFF').sort((a, b) => a.dueDay - b.dueDay)[0];
src/engine/operations.ts:265:      nextReceipt: usdOldest && nextReceipt ? { day: nextReceipt.dueDay, amountMinor: s.invoices.filter((i) => i.currency === 'USD' && i.status !== 'PAID' && i.status !== 'WRITTEN_OFF' && i.dueDay === nextReceipt.dueDay).reduce((sum, i) => sum + i.amountMinor, 0) } : null,
src/engine/operations-invariants.ts:17:    if (inv.status === 'PAID' && received !== inv.amountMinor) problems.push(`${inv.id}: 수금 완료인데 받은 금액(${received})이 청구액(${inv.amountMinor})과 다릅니다`);
src/engine/m2a5-risk-credit-v2.test.ts:174:    for (const status of ['PAID', 'OUTSTANDING', 'OVERDUE'] as const) f.s.invoices.push({ id: `I-${status}`, contractId: '고정물', currency: 'USD', amountMinor: 1, dueDay: 1, issuedDay: 1, status, receiptIds: [] });
```

## 질문

없음.

## R1 — 대손·이자 시험 판별력 보강과 회수·이자 검사

- 모델: gpt-6-astra
- 시작 HEAD: `e92d18809a876054fd546655097bb22e896251e6` (`git rev-parse HEAD`).
- 지시: TASK-0067b-R1. 기존 보고 본문은 보존하고 이 절만 덧붙였다.

### 바꾼 파일

- `src/engine/m2a5-risk-default-v2.test.ts`: 조건 전달·확률 등호·R4 주선·R4 전체 실행·두 번의 이자 분개·확정일·불변식·미기재 원가 환산·매일 미래 누설 검사. 26개에서 32개로 증가.
- `tools/validate_data.py`: `recovery_bp >= carry_bp_per_day * late_max_days` 검사 추가. 고정 메시지는 `recovery_bp: 확정일까지의 최대 누적 이자 이상이어야 함`이다.
- `tools/test_validate_data.py`: 현재 자료·등호 허용·회수율 0 거절과 `main()`의 정확한 FAIL 출력 시험 2개 추가.
- `docs/ai/tasks/results/TASK-0067b.md`: R1 보고 추가.
- `MANIFEST.json`: 생성기로만 갱신.

### 설계 판단

- 조건 대조 시드는 **2003**, 실제 계약의 추첨값은 **953**이다. BASE의 500bp(계수 100%)에서는 정상, D30의 1000bp(계수 200%)에서는 대손이다. 다른 계약 값의 영향을 없애려고 시험 설정에서 기간·가산을 두 조건 모두 0으로 맞췄다. 같은 설정·상태를 복제하고 계약의 `creditTermId`만 바꿔 `through(..., 55)`로 PAID/WRITTEN_OFF를 대조한다. 생산 자료는 바꾸지 않았다.
- 두 번의 이자 분개는 12일 마감까지 전액 미수인 상태에서 부분 회수 설정으로 이어 간다. 13일 6,173센트, 16일 6,172센트를 회수한다. `12345×3×2 = 74070 → 7`, 추가 `6172×3×3 = 55548`, 누적 `129618 → 13`이므로 CARRY-1은 7, CARRY-2는 6이다.
- 미기재 이자는 시드 7737·평가일 25일·환율 1206에서 52센트다. 같은 평가일 원가 7센트를 추가하면 합산 환산 차이는 `−712 − (−84) = −628원`, 별도 환산은 `−627원`이다. carry와 residual을 함께 단언한다.
- 확률 등호 시험은 시드 2001의 실제 추첨값에 BASE 확률 고정물을 맞춘다. 추첨 함수 주입·모킹은 하지 않는다.
- 검증기 회귀는 메모리 자료 사본을 사용한다. 변형으로 해시 오류가 함께 생기더라도 정확한 신용 검사 FAIL 문장 자체를 요구한다.

### 변형 R1-1~R1-11

`.git` 없는 별도 사본 `/tmp/TASK-0067b-R1-copy`에 소스를 복사하고 기존 node_modules 연결을 사용했다. 각 변형은 대상 문자열 1개 일치를 확인한 뒤 적용하고, 지정 시험 하나를 실행한 뒤 원본 내용으로 복원·동일성을 확인했다. 11개 모두 종료 1로 탐지했으며 마지막에 사본을 삭제했다. 원래 작업 트리의 엔진에는 변형을 적용하지 않았다.

| 변형 | 결과 | 지정 시험의 실패 근거 |
|---|---|---|
| R1-1 조건 대신 BASE | 탐지 | D30 결과 PAID ≠ WRITTEN_OFF |
| R1-2 회수·이자 검사 삭제 | 탐지 | 정확한 신용 검사 FAIL 문장 누락. hash mismatch만으로 통과하지 않음 |
| R1-3 확정 오프셋을 lateMinDays로 | 탐지 | 15일 조기 대손의 확정일 불변식 위반 |
| R1-4 직접 무역 한정 삭제 | 탐지 | 주선 결제일 OVERDUE ≠ PAID |
| R1-5 rules-4 전용 검사 삭제 | 탐지 | 규칙 4 전용 위반 문장 누락 |
| R1-6 대손 분개 날짜 검사 삭제 | 탐지 | 대손 분개일 위반 문장 누락 |
| R1-7 종결 계약 검사 삭제 | 탐지 | 잘못된 completedDay를 거절하지 않음 |
| R1-8 이미 기재한 이자 차감 삭제 | 탐지 | 16일 누적 이자 합계 불변식 위반 |
| R1-9 미기재 carry 흐름 cost=false | 탐지 | −627 ≠ −628 |
| R1-10 추첨 `<`를 `<=`로 | 탐지 | 등호에서 true ≠ false |
| R1-11 대손 결제일 OVERDUE 대입 삭제 | 탐지 | 결제일부터 OUTSTANDING ≠ OVERDUE |

실행 스크립트: `/tmp/r1-mutations.py`. 개별 출력: `/tmp/r1-mutation-1.log`~`/tmp/r1-mutation-11.log`. 요약: `/tmp/r1-mutations.log`.

### 실행한 검증과 결과

검증 결과는 아래 최종 실행 기록을 따른다. 개발 중 새 고정물의 조건 기간·가산 정합성, 원가 분개 계정, 타입 오류를 고쳤다. MANIFEST 갱신 전 Python 전체 시험에서 해시 불일치 4건이 있었고, 생성 후 최종 검수로 재확인했다. 기존 시험의 기대값은 바꾸지 않았다.

| 명령 | 결과 |
|---|---|
| `python3 tools/build_package.py --manifest-only` | 통과, 797파일. 보고 갱신 뒤에도 재생성 |
| `python3 tools/validate_data.py` | 통과, 자료 25개·검사 34,037개 |
| `npm run typecheck` | 통과 |
| `npx vitest run src/engine/m2a5-risk-default-v2.test.ts` | 32개 통과 |
| `npx vitest run` | 57파일·1,570개 통과, 기존 TODO 1개 |
| `npm run build` (review_checks의 `npm run --silent build`) | 통과 |
| `node tools/check_bundle_size.mjs dist` | 통과, 첫 화면 gzip 132,588 B |
| 작업 전 `node tools/check_rules2_golden.mjs` | 종료 0, rules-2 105회·rules-1 400회 일치 |
| 작업 전 `node tools/check_rules3_golden.mjs` | 종료 0, rules-3 108회 일치 |
| 작업 전 `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-R1-run-before.json` | 종료 0, 비위험 400회 |
| 작업 후 `node src/engine/sim/run.mjs run --out /tmp/TASK-0067b-R1-run-after.json` | 종료 0, 비위험 400회 |
| `cmp /tmp/TASK-0067b-R1-run-before.json /tmp/TASK-0067b-R1-run-after.json` | 종료 0, 바이트 일치 |
| 작업 후 `node tools/check_rules2_golden.mjs` | 종료 0, rules-2 105회·rules-1 400회 일치 |
| 작업 후 `node tools/check_rules3_golden.mjs` | 종료 0, rules-3 108회 일치 |
| `PYTHONDONTWRITEBYTECODE=1 python3 tools/test_validate_data.py` | 143개 통과 |

첫 review_checks는 18종 중 1종 실패였다. 새 FAIL 출력 시험에서 `validator.read`의 문자열 인수만 바꿔 실제 Path 읽기를 놓친 시험 고정물 문제였다(`result: 0 != 1`). 기존 시험과 같은 `Path.read_text` 경로 주입으로 수정한 뒤 Python 전체 143개를 통과했고, R1-1~R1-11 변형을 최종 코드에서 다시 실행했다. 엔진 결함은 발견하지 않았다. 시드 설명 주석의 확률도 실제 자료인 BASE 500bp·D30 1000bp로 정정했다.

### 완료 조건 대조

| 지시 항목 | 판정·근거 |
|---|---|
| 1 외상 조건 전달 | 충족. 시드 2003·추첨 953, 같은 계약의 조건만 바꿔 through 결과 비교, R1-1 탐지 |
| 2 회수·이자 검사 | 충족. 기존 자료와 등호 통과, 0 회수 사본의 정확한 FAIL 확인, R1-2 탐지 |
| 3 확정일·주선·실제 R4 실행 | 충족. 5/15일 비대칭 범위, 25일 확정. 주선 정시 지급 및 비용 없음. (다)·MAX_CONTRIBUTION·2001 전체 COMPLETED, timeout 60000ms. R1-3·4 탐지 |
| 4 불변식 세 경우 | 충족. BADDEBT 날짜·completedDay·rules-3 종결 청구서의 고유 문장, R1-5~7 탐지 |
| 5 두 이자 분개 | 충족. CARRY-1=7, CARRY-2=6, 누적 13, R1-8 탐지 |
| 6 미기재 이자 cost | 충족. 합산 −628원·별도 −627원 차이 및 residual 0, R1-9 탐지 |
| 7 경계·미래 누설 | 충족. 추첨=확률은 false. 결제일 10일부터 확정 전날 24일까지 매일 청구서·계약·로그·진행·지급 상태 동치, R1-10·11 탐지 |
| 8 결과 보고 | 충족. 기존 본문 보존, R1 절·시드·변형·회귀·검수 결과 기록 |
| 허용 파일·생산 코드 보존 | 충족. `git diff --name-status e92d188`에 허용된 5파일만 존재. 엔진·기존 다른 시험·data·schemas·sim·골든 변경 없음 |

### 범위 밖 발견

- 지시서가 참조한 `docs/ai/tasks/results/REVIEW-0067b-HUB-2026-10-24.md`는 이 작업 트리에 없다. 승인 R1 지시서와 실제 코드로 요구를 대조했다.
- 시작부터 미추적 상태인 `docs/ai/tasks/TASK-0067b-R1-tests.md`는 변경하지 않았다. 생성기는 이 파일까지 포함하여 MANIFEST를 797파일로 갱신했다.
- 커밋·푸시·브랜치 전환·패키지 설치·측정은 하지 않았다.

### 질문

없음.

### 최종 검수

`PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check e92d188` 재실행은 **종료 0, 검사 18종·실패 0종**이다. 전체 출력은 `/tmp/r1-review-final.log`에 있다. Vitest 57파일·1,570개 통과(TODO 1), Python 자료 검사 회귀 143개 통과, 타입·빌드·크기·rules-1/2/3 골든·도구 회귀·작업 트리 변화 없음 검사가 모두 통과했다. 완료 조건 1~4를 모두 충족한다.

검수 뒤에는 이 결과 문단과 MANIFEST만 갱신했다. `python3 tools/build_package.py --manifest-only`, `python3 tools/build_package.py --check`, `python3 tools/validate_data.py`, `git diff --check`, 허용 파일 목록 및 기존 보고 본문 보존 확인을 마쳤다. 작업 전·후 실행 파일의 `cmp`도 다시 종료 0을 확인했다.
