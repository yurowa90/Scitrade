# TASK-0063 Codex 결과 허브 심층 검수 원자료 (2026-10-16)

- 대상: `codex/TASK-0063` 스냅숏 `270de2c`, BASE `ef7374f`.
- 방법: 다섯 관점(사양·골든 밖 불변·시험 판별력·수치·절차)의 독립 검토, blocker·major 결함마다 반박 검증 2회. 실행은 모두 `.git`을 공유하지 않는 사본에서 했다.
- 결과: 엔진 코드 결함 0건, 시험 판별력 중대 2건(세 관점이 같은 두 결함을 각각 찾음), 경미 공백 여러 건. 처리: TASK-0063-R1 지시서. 경로는 `<사본>`·`<밖>`으로 가렸다.

```text
===== spec
rules-3 의미를 지시서 1~4절, 설계 개정 3h(3.3·3.4·4.1·4.2), H16-1~4와 줄 단위로 대조했습니다. 엔진 코드에서는 결함을 찾지 못했습니다. 다만 시험 공백이 확인됐습니다. 그중 둘은 지시서가 요구한 시험이 사실상 비어 있어 변형이 살아남는 경우(major)이고, 나머지는 경미입니다.

**코드 대조(모두 일치)**
- 추첨 식: `uniformInt` = a + ⌊drawAt(seed, 흐름, 0)·(b−a+1)⌋. 흐름 이름은 TARIFF:{CC}:count, TARIFF:{CC}:{r}:lag|notice|step, SURCHARGE:{route}:{w}:zero|value. 나라 순서는 tariff.base 첫 등장 순서이고, 공지일 범위는 U[1, campaignDays−lag_days[1]]입니다.
- knownRate: 공지일 ≤ K·시행일 ≤ T만 고르고, 시행일→공지일→회차 순으로 걸음마다 자릅니다.
- 무의미 판정: 공지 순서로 하고, 이미 남긴 사건만 쓰며, 되살리지 않습니다. 흐름은 모두 뽑습니다.
- tariffSchedule: 진행 중이면 K = s.day, 끝났으면 실패일 또는 campaignDays로 contractRiskReport와 같은 식입니다. 정렬은 공지일→나라 첫 등장→회차입니다. fromBp·toBp는 그 사건을 빼고·넣어 계산합니다. labelKo는 ‘가상 세율’ 표지와 cityName의 자료 순서를 지킵니다.
- openDay 로그: 공지일에만 쓰고, PENDING_OPEN 가드로 중복이 막힙니다.
- dutyFor: cities.countryCode로 나라를 찾고, 표에 없으면 예외를 냅니다. USD 매입도 표 세율이고(H16-4), applyBasisPoints를 씁니다. dutyEstimate 호출은 몸통 안에만 있습니다.
- 부대비: FORWARDING의 else 분기, 그리고 편 놓침 `continue` 뒤에만 있습니다. payOrAccrue(route.currency, SURCHARGE-{booking}, contract.id, 'INVENTORY')로 내고, lot은 단일 통화일 때만 더합니다. 혼합 통화는 contractAmount로 COGS-{c}-USD에 들어갑니다.
- 미리보기: preview와 quotePreview 모두 직접 무역·SURCHARGE 층일 때만 surchargeMaxBp 키를 냅니다.
- contractRiskReport 3단계: DUTY- 분개의 INVENTORY 줄을 읽습니다. 지급·미지급, 단일·혼합 통화 모두 관세액입니다. 날짜는 2단계 그대로이고, dutyFor는 가드 안에서 한 번만 부릅니다.
- 4단계: SURCHARGE- 분개를 paidDay와 평가일 상한으로 넣습니다. 취소·주선은 0이고 residual은 남은 차이로 계산합니다.
- withRiskLevel R2와 R1 경로: R1/R0의 3단계는 늘 0입니다. DUTY 금액이 p.duty와 같기 때문이고, 그래서 late 칸 값도 바뀌지 않습니다.

**실행 확인(별도 복제본)**
- 비용 시험 27/27 통과. 보고서의 정시 사례(시드 4: tariff −176,206), 부대비 사례(4,872센트, −62,995), 순수 함수 표, 정시 노출 1/11이 출력과 같습니다.
- Codex 변형 스크립트(<밖>)의 32+1개 변형을 읽어 보니 모두 지시서 설명에 맞게 쓰였습니다. results.json에서도 모두 의도한 시험이 실패했습니다(변형 4는 마감 불변식). 보고서의 변형 주장은 사실입니다.

**새 변형 7개 직접 실행**
- 잡힘(2개): ‘사건 범위’가 tariffSchedule 품목 행 오류를 잡았고, 미리보기 K=bookingDay−1은 세 시험이 잡았습니다.
- 살아남음(5개): 아래 findings에 정리했습니다.

복제본은 삭제했고, 작업 트리에서는 읽기만 했습니다.

-- spec#1 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-cost.test.ts:681-690 (시험 '결정성·저장·커서 불변과 끝난 상태의 공지 평가일'), 대상 코드 src/engine/risk.ts:86
P: 지시서 시험표 ‘R2 변환·부대비 상한·공지된 관세 읽기’는 ‘끝난 상태에서는 평가일 기준이다’를 요구합니다(설계 3.4: 실패 뒤 s.day = 실패일 + 1은 쓰지 않음). 그런데 이 시험은 비어 있습니다. 끝난 상태를 캠페인 완료로만 만들기 때문입니다. 그때 K = campaignDays와 s.day = campaignDays + 1은 구별되지 않습니다. 공지일이 campaignDays − lag_days[1] 이하라 두 K의 결과가 같습니다. 결국 tariffSchedule이 실패 종료에서 공개된 적 없는 F+1일 공지를 내보내는 미래 누설 변형이 살아남습니다. 코드 자체는 맞습니다.
E: 복제본에서 risk.ts:86을 `const day = s.day;`로 바꾼 뒤 m2a5-risk-cost와 m2a5-risk-fx를 돌리면 2 files·63 tests가 모두 통과합니다. engine.ts:876-877은 `s.day = day + 1; s.phase = ... 'ENDED'`이므로 실패 종료에서 s.day = F+1입니다. 시험 688행은 `k = ended.operations?.failure?.day ?? cfg.campaignDays`로 기대값만 만들고, 실패 종료 상태는 만들지 않습니다.
FIX: 실패로 끝난 상태를 하나 더 넣습니다(‘실패 기록 약정’의 탐색을 재사용하거나 프로필 사본 lag_days=[0,0]으로 공지 범위를 넓힘). 그 나라 사건의 공지일이 F+1인 (시드, 실패)를 찾고 찾았는지 단언합니다. 그 다음 tariffSchedule(ended)에 그 사건이 없고, 다른 사건의 fromBp·toBp가 K = F 오라클 값과 같음을 단언합니다. 시험 이름의 ‘끝난 상태의 공지 평가일’ 주장도 이 단언으로 뒷받침합니다.
V1: 지적이 그대로 성립합니다. 확인은 270de2c를 따로 복제한 사본에서 했고, 복제본은 끝난 뒤 지웠습니다.

(1) 요구사항이 분명합니다. 지시서 시험표 157행 ‘R2 변환·부대비 상한·공지된 관세 읽기’에 ‘끝난 상태에서는 평가일 기준이다’가 있습니다. 1절 67행은 기준일 K를 ‘끝난 상태는 contractRiskReport의 평가일 규칙(실패일 또는 campaignDays)’으로 정합니다. 결과 보고 174행도 ‘실패 뒤의 s.day(실패일 + 1)는 쓰지 않는다’고 적었습니다.

(2) 제품 코드는 맞습니다. risk.ts:86은 `const day = s.phase === 'ENDED' ? s.operations?.failure?.day ?? config.campaignDays : s.day;`입니다.

(3) 시험 681~693이 만드는 끝난 상태는 정상 완료뿐입니다. 탐침 출력: `{"seed":4,"day":91,"phase":"ENDED","outcome":"COMPLETED","failure":null,"campaignDays":90,"maxNotice":53}`. 공지일 범위는 1..campaignDays−lag_days[1](=87)입니다. 그래서 K=90과 K=91(s.day)이 같은 사건 집합과 같은 세율을 냅니다.

(4) 변형 두 개가 모두 살아남습니다.
- risk.ts:86을 `const day = s.day;`로 바꾸면 m2a5-risk-cost와 m2a5-risk-fx가 2 files·63 tests 통과합니다. 전체 묶음도 52 files·1427 passed입니다.
- 실패를 무시하는 변형 `s.phase === "ENDED" ? config.campaignDays : s.day`도 두 파일에서 63 passed입니다.

다른 시험도 이 경로를 보지 않습니다. tariffSchedule을 부르는 시험 파일은 m2a5-risk-cost뿐입니다. ‘실패 기록 약정’(720~750)은 실패 상태를 만들지만 tariffSchedule을 부르지 않습니다.

(5) 누설은 실제로 관찰됩니다. 기본 R2 프로필에서 첫 적용 가능 매입 뒤 자금 없이 끝까지 진행하면, 시드 200개가 모두 실패로 끝납니다. 그 가운데 시드 86(F=63, CN 1회차 공지일 64)과 시드 147(F=63, VN 1회차 공지일 64)에서 tariffSchedule 결과가 K=F와 K=F+1 사이에 다릅니다(사건 수 1→2, 3→4). 공개된 적 없는 F+1일 공지가 끝난 상태 읽기에 새는 변형을 지금 시험이 잡지 못합니다.

결과 보고 124행이 ‘R2 변환·부대비 상한 | 충족’이라 적었지만, 그 행의 ‘끝난 상태 평가일’ 요구는 실질 검증이 없습니다. 요구 시험이 비어 있어 변형이 살아남으므로 등급은 major입니다(코드 결함은 아님).

참고로 제안된 lag_days=[0,0] 프로필 사본은 필요 없습니다. 위 두 시드에서는 F+1 사건이 있어도 다른 사건의 fromBp·toBp가 바뀌지 않았습니다(ratesDiff=false). 따라서 변형을 잡는 것은 ‘F+1 사건 부재’ 단언입니다. 세율 단언은 보조입니다.
VFIX1: m2a5-risk-cost.test.ts 681 시험(또는 새 시험 ‘실패 종료의 공지 평가일’)에 실패로 끝난 상태를 넣습니다.

시드 1..200을 돕니다. fresh(cfg)에서 openTradePairs의 첫 쌍을 수량을 올려 가며 시도하고, 처음 APPLIED가 나오는 수량으로 planState(ACCEPT_TRADE)를 적용합니다. 그 상태를 commitDay와 openDay 반복으로 ENDED까지 자금 없이 진행합니다. failure가 있고 `tariffEvents(cfg, seed).some(e => e.noticeDay === failure.day + 1)`인 상태를 찾습니다. 기본 프로필에서 시드 86과 147이 걸립니다. 그다음 다음을 단언합니다.

```ts
expect(found).toBeDefined(); const { cfg, s, F } = found!;
expect(s.day).toBe(F + 1);
const got = tariffSchedule(s, cfg);
expect(got.some((e) => e.noticeDay === F + 1)).toBe(false);
const want = oracleEvents(cfg, cfg.seed).filter((e) => e.noticeDay <= F);
expect(got.map((e) => [e.countryCode, e.round]).sort()).toEqual(want.map((e) => [e.countryCode, e.round]).sort());
for (const e of want) expect(got.find((v) => v.countryCode === e.countryCode && v.round === e.round)!.rates).toEqual(oracleRates(cfg, cfg.seed, e, F));
```

사본에서 이 시험을 돌린 결과입니다.
- 맞는 코드에서는 통과합니다.
- `const day = s.day;` 변형과 `ENDED ? config.campaignDays : s.day` 변형은 모두 `expected true to be false`로 실패합니다.

lag_days=[0,0] 프로필 사본은 필요 없습니다. 결과 보고의 해당 시험 행에도 ‘실패 종료(F+1 공지 존재 전제) 포함’을 적습니다.
V2: 지적은 그대로 맞습니다. 근거는 다음과 같습니다.

(1) 요구사항이 분명합니다. 지시서 157행 시험표 ‘R2 변환·부대비 상한·공지된 관세 읽기’에 "끝난 상태에서는 평가일 기준이다"가 있습니다. 67행의 K 정의도 "끝난 상태는 평가일 규칙(실패일 또는 campaignDays)"입니다. DESIGN 174행(3.4)은 "실패 뒤의 s.day(실패일 + 1)는 쓰지 않는다"고 적고, 234행(3.3)도 K = 평가일입니다. risk.ts:86 `const day = s.phase === 'ENDED' ? s.operations?.failure?.day ?? config.campaignDays : s.day;`는 이 규칙대로 맞습니다.

(2) 이 시험은 실패 종료를 다루지 않습니다. 시험 안의 `ended` 상태를 파일로 기록해 보았습니다. 결과는 {seed:4, outcome:'COMPLETED', failure:null, day:91, k:90, lagDays:[0,3], 최대 공지일:53}입니다. tariffEvents의 공지일은 [1, campaignDays − lagDays[1]] 범위에서 뽑습니다(risk.ts 66행). 그래서 K=90과 s.day=91 모두 모든 사건을 포함하고, fromBp·toBp도 같습니다. 두 값을 가를 수 없습니다.

(3) 변형이 살아남습니다. 내 복제본(270de2c)에서 risk.ts:86을 `const day = s.day;`로 바꿨습니다. m2a5-risk-cost와 m2a5-risk-fx는 2 files·63 tests가 모두 통과했습니다. 전체 묶음 `npx vitest run`도 52 files·1427 passed(1 todo)로 모두 통과했습니다. tariffSchedule을 부르는 곳은 이 시험 파일과 engine.ts:157 openDay뿐인데, openDay는 ENDED가 아니므로 이 변형의 영향을 받지 않습니다.

(4) 동치 변형이 아닙니다. 원본 코드로 failureCase와 같은 꼴의 탐색을 시작 R2 프로필에서 시드 1~60에 돌렸습니다. 실패 46건 가운데 2건에서 공지일 = F+1인 사건이 나왔습니다. 시드 28은 F=44, s.day=45이고 VN 회차 2(공지 45, 시행 45)이며, 원본 0건 대 변형 1건입니다. 시드 36은 F=24이고 CN 회차 2(공지 25, 시행 27)이며, 원본 1건 대 변형 2건입니다. 엔진은 실패 뒤 openDay(F+1)를 하지 않습니다(engine.ts:876-877 `s.day = day + 1; s.phase = …'ENDED'`, operations.ts:297 `failure.day = s.day`). 따라서 그 공지는 로그에 한 번도 나온 적이 없고, 변형은 실제 미래 누설입니다.

(5) 지적의 세부도 맞습니다. 시험 위치 681행, 688행의 `k` 식, engine.ts 876-877행, '63 tests'가 실제와 같습니다.

결과 보고에 명시적인 거짓 주장은 없습니다. 다만 ‘R2 변환·부대비 상한’ 행이 ‘충족’으로 적혀 있는데, 이 행이 덮는 끝난 상태 요구는 실제로 검증되지 않았습니다. 판정 기준의 "필수 시험이 비어 변형이 살아남음"에 해당하므로 major가 맞습니다. 코드 결함은 아니므로 blocker는 아닙니다. 하나 덧붙이면, 수정안의 lag_days=[0,0] 프로필 사본은 필요 없습니다. 시작 프로필로도 시드 28·36에서 전제가 섭니다.
VFIX2: m2a5-risk-cost.test.ts의 '결정성·저장·커서 불변과 끝난 상태의 공지 평가일' 시험에 실패 종료 단언을 더하거나, 같은 이름 아래 별도 it로 넣습니다.

1. 탐색: 시작 R2 프로필 cfgFor(seed)로 시드 1~200을 돕니다. m2a5-risk-fx의 failureCase와 같은 꼴(매입 당일 KRW 급여 미지급 → 무자금으로 commitDay를 반복해 FAILED)로 ended를 만듭니다. 매번 F = ended.operations.failure.day를 구하고, tariffEvents(cfg, seed)에 noticeDay === F + 1인 사건 e가 있는 첫 경우를 고릅니다. 시작 프로필에서 시드 28(F=44, VN 회차 2)과 36(F=24, CN 회차 2)이 이미 맞습니다.

2. 전제 단언: `expect(hit).toBeDefined(); expect(ended.phase).toBe('ENDED'); expect(ended.day).toBe(F + 1);`

3. 본 단언:
- `expect(tariffSchedule(ended, cfg).some(v => v.countryCode === e.countryCode && v.round === e.round)).toBe(false);`
- 사건 집합과 a·b를 K=F 오라클과 대조합니다: `expect(tariffSchedule(ended, cfg).map(v => [v.countryCode, v.round, v.rates]).sort()).toEqual(oracleEvents(cfg, seed).filter(v => v.noticeDay <= F).map(v => [v.countryCode, v.round, oracleRates(cfg, seed, v, F)]).sort());`

4. 양성 대조(선택): 같은 상태에서 phase만 'PENDING_OPEN'으로 바꾼 사본의 tariffSchedule에는 e가 있음을 단언합니다. 그러면 전제가 실제로 두 K를 가른다는 것이 드러납니다.

5. 결과 보고: 변형 표에 ‘tariffSchedule 끝난 상태 K = s.day’ 변형을 더하고, 이 시험으로 잡힌다고 적습니다.

-- spec#2 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-cost.test.ts:613-618 (항등식: 부대비 미지급 사례), 대상 코드 src/engine/reports.ts:492
P: 지시서 3절 4단계는 부대비 줄 날짜를 ‘분개 날, 미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일’로 정합니다. 항등식 행은 이를 확인하려고 ‘부대비가 미지급인 계약도 하나 넣는다’고 요구합니다. 그런데 그 사례는 출항일 + 1에 평가합니다. 출항일과 평가일의 참고 환율이 같아(시드 4: 9일·10일 모두 1293) paidDay 규칙이 실제로 쓰이지 않습니다. 그래서 4단계 날짜를 분개 날로 고정한 변형이 살아남습니다. 실제 진행에서는 이 변형이 residual ≠ 0을 만듭니다(J7 입력 함수).
E: reports.ts:492 `flow(-amount, paidDay(e.id, e.day), ...)`를 `flow(-amount, e.day, ...)`로 바꾸면 63 tests가 모두 통과합니다. 같은 시드에서 미지급 부대비를 다른 환율 주(15~18일)까지 들고 가는 탐침을 돌리면 원본은 residual 0, surcharge −63,628이고 변형은 residual −633, surcharge −62,995입니다.
FIX: 미지급 부대비 사례를 환율 주가 바뀐 뒤까지 미지급으로 두거나, 다른 주에 갚게 진행합니다. 전제로 `rateAt(평가일 또는 갚은 날) ≠ rateAt(SURCHARGE- 분개 날)`을 먼저 단언한 뒤 identity를 부릅니다. 갚은 경우 하나, 평가일까지 미지급인 경우 하나면 두 갈래가 모두 덮입니다.
V1: 반박하려 했지만 지적은 적힌 그대로 성립합니다. 확인은 270de2c 독립 클론에서 했고, 클론은 확인 뒤 지웠습니다.

(1) 규칙과 시험 구성
- 지시서 3절 4단계(지시서 102행)는 부대비 줄 날짜를 이렇게 정합니다: ‘그 분개 날, 미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일’.
- 구현은 reports.ts:492 `surchargeFlows.push(flow(-amount, paidDay(e.id, e.day), true, e.currency))`이고, 487-490행의 `paidDay`가 `o.paidDay ?? evaluationDay`를 돌려줍니다. 맞는 구현입니다.
- 시험 m2a5-risk-cost.test.ts:614-618의 부대비 미지급 사례는 `advance(preDeparture, cfg, x.sailing.departureDay + 1)`, 곧 10일에서 평가합니다.
- 탐침으로 본 시드 4의 참고 환율은 1~7일 1300, 8~14일 1293, 15~21일 1306입니다. 출항(=SURCHARGE 분개) 9일과 평가일 10일이 같은 1293 주입니다. 그래서 날짜 규칙이 값에 영향을 주지 않습니다.

(2) 변형 생존
- reports.ts:492를 `flow(-amount, e.day, true, e.currency)`로 바꿨습니다.
- 63개 시험 파일만이 아니라 vitest 전체(52 파일, 1427 통과, 1 todo)가 모두 통과했습니다. 이 변형을 잡는 시험은 저장소 어디에도 없습니다.

(3) 실제 진행에서 생기는 잘못. 같은 구성으로 미지급을 15일 넘어까지 두는 탐침을 돌렸습니다.
- 원본: 15~21일 `surcharge` −63,628, `residual` 0, 보고서 `realized` = 독립 `realized`.
- 변형: `surcharge` −62,995, `residual` −633. 지적의 수치와 정확히 같습니다.
- 갚은 갈래도 확인했습니다. 15일에 시험 USD 입금(CASH/OPENING_EQUITY)으로 SETTLE을 일으키면 `paidDay` 15(환율 1306), 분개 9일(환율 1293)입니다.
  - 원본: `residual` 0, `surcharge` −63,628
  - 변형: `residual` −633, `surcharge` −62,995
- 두 갈래 모두 변형이 항등식을 깹니다. 시험은 둘 다 덮지 않습니다.

(4) 심각도
- 지시서 항등식 행은 ‘부대비가 미지급인 계약도 하나 넣는다’를 요구합니다. 그 사례가 환율 주를 넘지 않아 규칙에 대해 비어 있고, 그래서 rules-3 4단계 날짜 의미를 틀리게 바꾼 변형이 살아남습니다.
- 이 값은 J7 입력(`residual`·`surcharge`)에 들어가는 측정 관련 값입니다. 기준표의 major(필수 시험이 비어 변형이 살아남음)에 해당합니다.
- rules-1·rules-2 골든과 저장에는 닿지 않으므로 blocker는 아닙니다.
- 결과 보고 120행의 ‘부대비 미지급 … 단계 합 대조 충족’은 문자 그대로는 사실입니다(identity 호출이 있음). 따라서 거짓 주장으로 별도 격상하지는 않습니다.
- 이 변형은 지시서 변형 표에 번호가 없어서 결과 보고의 변형 목록에도 빠져 있습니다.
VFIX1: 대상은 m2a5-risk-cost.test.ts:614-618 ‘항등식: 열린 운송 중의 평가일 환율·관세 미지급·부대비 미지급’입니다. 부대비 사례를 두 갈래로 나눕니다.

(가) 평가일까지 미지급
- `const unpaidSurcharge = advance(preDeparture, cfg, d)`로 둡니다. d는 출항일 뒤 첫 환율 주가 바뀐 날이며 시험 안에서 rateAt으로 찾습니다(시드 4에서는 15일).
- 아래를 차례로 단언한 뒤 `identity(unpaidSurcharge, cfg, x.c.id)`를 부릅니다.
  - `const se = unpaidSurcharge.ledger.entries.find((e) => e.id === \`SURCHARGE-${booking.id}\`)!`
  - `unpaidSurcharge.obligations.find((o) => o.id === se.id)!.paidDay === null`
  - `rateAt(cfg, cfg.seed, unpaidSurcharge.day) !== rateAt(cfg, cfg.seed, se.day)`

(나) 다른 주에 갚음
- 환율이 바뀐 날(시드 4에서는 15일) 열린 상태에 시험 USD 입금 분개를 넣습니다: `post(s.ledger, { id: '시험 입금', day: s.day, currency: 'USD', reason: '시험 입금', lines: [{ account: 'CASH', amount: 남은 USD 의무 합 + 여유 }, { account: 'OPENING_EQUITY', amount: -(같은 값) }] })`. 그다음 며칠 진행합니다.
- 아래를 단언한 뒤 `identity`를 부릅니다.
  - 그 의무의 `paidDay !== null`
  - `SETTLE-SURCHARGE-…` 분개가 있음
  - `rateAt(paidDay) !== rateAt(se.day)`

두 사례 모두 원본은 `residual` 0이고, 변형(reports.ts:492를 `e.day`로 고정)은 `residual` −633으로 실패하는 것을 확인했습니다.

결과 보고 변형 표에는 이 변형을 번호(예: 16b ‘4단계 부대비 줄 날짜를 분개 날로 고정’)로 추가하고, 잡는 시험으로 위 두 사례를 적습니다.
V2: 반박을 시도했지만 주장한 내용이 모두 재현됐다. 독립 클론(270de2c)에서 확인했고, 확인 뒤 클론은 지웠다.

(1) 규칙 근거. 지시서 102행은 "날짜는 그 분개 날이고, 미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일이다"로 정한다. DESIGN 3.4 표 4행도 "그 분개 날 또는 미지급이면 갚은 날의 환율, 평가일 상한"이다. 지시서 151행 항등식 행은 "부대비가 미지급인 계약(USD 현금을 주입 의무로 비운 상태)도 하나 넣는다"를 요구한다.

(2) 현재 시험. m2a5-risk-cost.test.ts 613-618은 `advance(preDeparture, cfg, x.sailing.departureDay + 1)`에서 평가한다. 탐침 출력은 `{"seed":4,"dep":9,"entryDay":9,"evalDay":10,"rDep":1293,"rEval":1293,"ob":{"id":"SURCHARGE-BK001","amountMinor":4872,"paidDay":null}}`이다. 분개 날과 평가일의 환율이 같다. 따라서 reports.ts:492 `paidDay(e.id, e.day)`가 고르는 날(평가일 10)과 분개 날(9)이 같은 환율 바구니에 들어가 결과가 같다.

(3) 변형. reports.ts:492를 `surchargeFlows.push(flow(-amount, e.day, true, e.currency));`로 바꿨다. m2a5-risk-cost와 m2a5-risk-fx 두 파일은 63 tests 모두 통과했다. 전체 스위트도 52 files, 1427 passed로 통과했다. 변형 목록 31개에는 없지만 4단계 날짜 규칙을 지키는 시험이 하나도 없다.

(4) 실제 진행의 영향. 같은 시드에서 미지급을 그대로 들고 하루씩 진행했다(부대비는 24일까지 미지급으로 남는다).
- 원본: 15~21일 surcharge −63,628, residual 0. 22일 이후 −62,069, residual 0.
- 변형: 15~21일 surcharge −62,995, residual −633. 22일 이후 residual +926. `realized − expected === 단계 합`도 깨진다.

이 함수는 판정표 J7의 입력이다. 그래서 측정값에 영향이 있는 4단계 칸이 실행 중에 틀려도, 지시서가 요구한 미지급 부대비 사례가 이를 가리지 못한다. 결과 보고 TASK-0063.md:120의 "부대비 미지급 … 독립 realized/expected와 단계 합 대조 충족"은 형식상 사실이다. 다만 날짜 규칙을 확인하지 못하는 사례라서 과장이다.

심각도 판단: "필수 시험이 공허해 변형이 살아남음"에 해당하므로 major가 맞다. 구현 코드(paidDay 사용) 자체는 맞으므로 blocker는 아니다.
VFIX2: m2a5-risk-cost.test.ts 613-618의 미지급 부대비 사례를 다음처럼 고친다.

(가) 평가일까지 미지급인 갈래:
```ts
const entry = unpaidSurchargeState.ledger.entries.find((e) => e.id === `SURCHARGE-${x.s.bookings[0]!.id}`)!;
let held = unpaidSurchargeState;
while (held.phase !== 'ENDED' && rateAt(cfg, cfg.seed, held.day) === rateAt(cfg, cfg.seed, entry.day)) held = advance(held, cfg, held.day + 1);
expect(held.obligations.find((o) => o.id === entry.id)!.paidDay).toBeNull();
expect(rateAt(cfg, cfg.seed, held.day)).not.toBe(rateAt(cfg, cfg.seed, entry.day));
const r = identity(held, cfg, x.c.id);
```
시드 4에서는 15일이다(1306 대 1293). 추가로 `r.components.surcharge`를 시험 안 식 `toKrw(-(Cr + S), rateAt(평가일)) − toKrw(-Cr, rateAt(평가일))`과 견주면 4단계 칸 값 자체도 고정된다. 여기서 Cr은 3단계 줄 가운데 환율이 rateAt(평가일)과 같은 USD 비용 줄의 합이다. 이렇게 고치면 위 변형은 residual −633으로 잡힌다.

(나) 다른 주에 갚는 갈래(권장): 분개 날과 다른 환율 주의 날에 시험 의무로 USD 현금을 넣어 SETTLE-SURCHARGE-…가 생기게 한다. 그 뒤 `rateAt(o.paidDay) ≠ rateAt(entry.day)`이고 `o.paidDay ≤ 평가일`임을 먼저 단언하고 identity를 부른다.

결과 보고 120행의 ‘부대비 미지급’ 서술은 고친 사례(평가일·환율 전제)에 맞춰 다시 쓴다.

-- spec#3 minor
@ src/engine/engine.ts:943-950·995-1004 (코드는 맞음). 시험 공백: src/engine/m2a5-risk-cost.test.ts 부대비 시험 전체
P: 지시서 2절 ‘준비가 끝나지 않아 해제되는 예약(편 놓침)에는 매기지 않는다’를 행동으로 확인하는 시험이 없습니다. 원천 검사는 surchargeBp 호출이 processDepartures 안에 한 번 있는지만 봅니다. 그래서 부대비를 분기 앞에서 한 번 계산해 해제 분기에서도 내는 변형을 막지 못합니다.
E: processDepartures에서 `const surcharge = ...surchargeBp(config, s.rng.seed, booking.routeId, surchargeWeek(config, booking.departureDay))`를 release 검사 앞으로 옮기고, 해제 분기에서도 payOrAccrue를 부르게 하면 63 tests가 모두 통과합니다(원천 검사 정규식도 통과). 호출을 하나 더 넣은 단순 변형은 원천 검사에만 잡혔습니다.
FIX: R2에서 그 주 부대비 bp > 0인 편에 직접 무역을 예약하고, 준비가 끝나지 않게 만들어(직원 없음·준비량) 편을 놓치게 합니다. 그 뒤 해제된 예약 ID의 SURCHARGE- 분개가 없고 의무도 없음을 단언합니다.

-- spec#4 minor
@ src/engine/risk.ts:89-90 (코드는 맞음), 시험 src/engine/m2a5-risk-cost.test.ts:365-368
P: tariffSchedule과 공지 로그의 동점 순서(공지일 → tariff.base 첫 등장 나라 → 회차, H16-3)를 오라클과 견주는 시험이 없습니다. 지금 시험은 로그를 tariffSchedule 자신과만 견주므로 순서가 틀려도 같이 틀립니다.
E: 정렬을 `a.noticeDay - b.noticeDay || a.round - b.round || countries.indexOf(b.countryCode) - countries.indexOf(a.countryCode)`로 바꿔도 27 tests가 모두 통과합니다.
FIX: 두 나라 사건이 같은 날 공지되는 시드를 찾습니다(프로필 사본 max_changes를 늘려도 됨). 그날 tariffSchedule과 로그 순서가 시험 안 오라클 순서(나라 첫 등장 → 회차)와 같음을 단언합니다.

-- spec#5 minor
@ src/engine/risk.ts:122-124 (코드는 맞음), 시험 src/engine/m2a5-risk-cost.test.ts:269-289 ‘사건 범위’
P: dutyFor가 품목별 기준 세율 행을 읽는지 확인하는 시험이 없습니다. 일정 오라클의 dutyFor 단언은 시작 프로필과 역전 사본에서만 돕니다. 두 프로필 모두 나라 안 기준 세율이 같습니다. 기준 세율을 다르게 둔 ‘사건 범위’ 사본은 tariffSchedule만 봅니다. 그래서 goodId로 표 누락 예외만 내고 세율은 나라 첫 행으로 고르는 변형이 살아남습니다. 동결 프로필에서는 측정 영향이 없습니다.
E: dutyFor의 세율 행을 `p.base.find((r) => r.countryCode === country)!`로 바꾸면 63 tests가 모두 통과합니다.
FIX: ‘사건 범위’ 사본 설정에서 두 품목 각각의 dutyFor(…, K, T, 1,000,000, 'USD', 1)가 오라클 세율 × 매입액(시험 안 정수식)과 같음을 몇 개 (K, T)로 단언합니다.

-- spec#6 minor
@ src/engine/m2a5-risk-cost.test.ts:675-678 (R2 변환 시험), 대상 코드 src/engine/reports.ts:139-140·readers.ts:47-51
P: 지시서 2절은 주선 결과에 `quotePreview`·`preview` 둘 다 surchargeMaxBp 키가 없어야 한다고 요구합니다. 시험은 주선에서 `if (!forwarding)`로 quotePreview 검사를 건너뛰고 contractPreview(=preview)만 봅니다. 지금 코드는 preview 한 곳에서 키를 가르므로 맞습니다. 다만 quotePreview 쪽에서 키를 덧붙이는 회귀는 잡지 못합니다.
E: 678행 `if (!forwarding) expect(quotePreview(v.s, cfg, v.pair)).not.toHaveProperty('surchargeMaxBp');`. setup이 주선 모드에서도 매매 쌍(pair)을 돌려주므로 주선 견적의 quotePreview를 부르지 않습니다.
FIX: 주선 견적 ID로 `quotePreview(s, cfg, { offerId: fwd.id })`를 R2에서 부르고 surchargeMaxBp 키가 없음을 단언합니다.

-- spec#7 minor
@ src/engine/reports.ts:451·459-461·486-487, src/engine/reports.ts:122-124, src/engine/engine.ts:1039-1041
P: 잠재 문제입니다. TARIFF 층의 min_bp가 0이라(동결 프로필) 세율이 0까지 내려갈 수 있습니다. 관세가 0이면 도착 처리가 DUTY- 분개를 내지 않습니다. 그러면 contractRiskReport가 `!dutyEntry`로 그 계약을 ‘도착 전’으로 보고 dutyFor(T = max(예정 도착일, 평가일), K = 평가일)로 남은 관세를 다시 만듭니다. 도착 뒤 공지된 인상이 있으면 완료 계약에 유령 관세 흐름이 생기고 open = true가 됩니다. 미리보기도 직접 무역 관세 0을 ‘도착 (고객 화물: 관세는 수입자 부담)’으로 적습니다. 시작 프로필에서는 나라당 최대 2회 × −200이라 최저 100bp여서 도달하지 않습니다. 사본 프로필(예: 역전 사본 max_changes 6)에서는 도달합니다.
E: 관세 0이면 engine.ts:1039 `if (duty === 0) { sh.dutyPaid = true; }`로 분개가 없습니다. reports.ts:459 `const pendingDuty = !cancelled && c.kind === 'DIRECT_TRADE' && !dutyEntry ? dutyFor(...)`가 도착 여부를 분개 유무로만 판정합니다. reports.ts:122-124의 일정 줄 라벨은 `duty ? '도착·관세 지급' : '도착 (고객 화물: …)'`입니다.
FIX: 도착 판정을 `shipment?.arrivalDay !== null`(또는 `shipment.dutyMinor !== null`)로 바꿔 도착한 계약은 dutyFor를 부르지 않고 관세 0을 씁니다. 이때 TASK-0062 ‘관세 호출 인수’의 호출 수가 바뀌지 않는지 확인해야 합니다. 미리보기 라벨은 `kind === 'FORWARDING'`으로 고릅니다. 또는 경로 5 전에 프로필 검사기에서 min_bp > 0을 요구합니다.

===== rules2
관점: 골든 밖 불변성·견고성·성능. 결론: rules-1·rules-2·R1 동작은 골든 밖 경로에서도 BASE(ef7374f)와 바이트 단위로 같습니다. R2는 120회 구동에서 예외나 항등식 깨짐이 없었고, 눈에 띄는 성능 저하도 없습니다. blocker·major는 없고 minor 2건만 찾았습니다.

검증은 독립 클론 두 개(BASE ef7374f, 새 커밋 270de2c)에서 했고 끝난 뒤 삭제했습니다. 작업 트리 wt-TASK-0063은 `git status`가 비어 있어 손대지 않았습니다. 일회용 스크립트와 결과는 <사본> 에 남겼습니다(drive.mjs, r2robust.mjs, zeroduty.mjs, bench.mjs, micro.mjs, base-compare.json, new-compare.json).

(1) 불변성 비교 (drive.mjs)
- 대상 설정
  - rules-1 시나리오 4개(M2 MULTI_TRADE·M1 세 개, operations 없음).
  - rules-2: withLateMode base·cap30·flat200와 변환 없는 원본.
  - R1(withRiskLevel R1, 프로필 전부).
  - 시드 7·2003·3141.
- 전략 5종
  - idle.
  - trade: 편 0·1·2를 돌려 가며 수락.
  - late: 늦은 편 수락.
  - missed: plan 없이 수락한 뒤 BOOK_SAILING만 걸어 편 놓침을 반복.
  - spread: 견적 쌍을 바꿔 가며 수락.
  - 모든 전략에 공통으로 주선 수락, 9일마다 취소, 양방향 환전을 넣었습니다.
- 날마다 해시한 것
  - openDay 공지, 명령 결과, 매일 serializeSave 바이트, 11일마다 저장 왕복.
  - 읽기 함수: cashReservations, fundsPosition(USD·KRW), upcomingPayments, campaignSummary, companyReport, marketTable, paymentDefaultStatus, exchangePreview, 모든 계약의 contractReport·contractProgress·contractRiskReport.
  - 미리보기: 열린 쌍마다 tradePreview·quotePreview, 열린 주선 견적마다 forwardingPreview·quotePreview.
  - weeklyBottleneck, warehouseSummary, 마지막 로그.
  - JSON 키 순서까지 해시하므로 rules-2·R1 미리보기에 `surchargeMaxBp` 키가 없음도 함께 확인됩니다.
- 결과: 119회 모두 일치, 차이 0. 예외 0.
- 덮인 범위
  - rules-2: 계약 573개, 취소 325, 편 놓침 해제 180.
  - R1: 계약 135개, 취소 74, 해제 68.
  - rules-1: 계약 43개.
- 비교가 헛돌지 않았는지 따로 봤습니다. R1·rules-2 표본에서 contractRiskReport 820회, quotePreview 114회가 모두 오류 없이 돌았고, R1 components의 fx·late가 0이 아닌 값으로 실제 계산됐습니다.
- 코드 확인
  - `tariffSchedule`은 `config.operations?.risk`가 없거나 `TARIFF` 층이 없으면 곧바로 []를 돌려줍니다.
  - 출항 부대비는 `SURCHARGE` 층을 먼저 검사합니다.
  - `dutyFor`의 TARIFF 없는 분기는 BASE와 같은 식입니다.
  - R1의 3단계는 `DUTY-` 금액 또는 `pendingDuty`가 수락일 미리보기 duty와 같아 tariff = 0이고, late = afterLate − afterFx로 BASE와 같습니다.

(2) R2 견고성 (r2robust.mjs)
- 구성: 시드 1~40 × trade·late·missed, 주선·취소 포함, 120회.
- 결과
  - 예외 0. 매일 모든 계약에서 residual = 0.
  - 취소·주선 계약의 tariff·surcharge = 0.
  - 공지 로그 줄 수 = 마지막으로 연 날까지 공지된 `tariffEvents` 수.
  - 매일 저장 왕복 일치.
  - `SURCHARGE-` 분개 115건이 모두 직접 무역. tariff ≠ 0인 계약 78개.
- 제 구동기에서는 부대비 미지급 경로가 나오지 않았습니다(0건). 이 경로는 새 시험 파일이 다룹니다.

(3) 성능
- 골든 검사기 벽시계 시간
  - 부하 평균 5~8(다른 작업이 함께 돎) 상태에서 rules-2 105회가 BASE 69.5/82.6/71.4초, 새 코드 78.6/89.1/86.8초였습니다.
  - rules-1 400회는 BASE 14.1/15.3/13.5초, 새 코드 21.4/14.1/13.3초였습니다.
  - 부하 잡음이 큽니다.
- 단일 스레드 CPU 비교: rules-2 골든 12행을 번갈아 3회 돌린 user CPU가 BASE 22.5/21.4/22.1초, 새 코드 22.1/22.0/21.9초로 차이가 없습니다.
- 90일 구동(매일 읽기 함수 포함): R1 BASE 1.9~2.9초, R1 새 코드 2.1~3.3초, R2 1.8~2.8초입니다.
- 미시 측정
  - `dutyFor`: R1 0.28µs, R2 6.4µs. R2는 호출마다 `tariffEvents`를 다시 계산합니다.
  - `tariffSchedule`: R2 5.8µs.
  - 절대량이 작아 실질 영향은 없습니다.

(4) 보고서 주장 대조
- 전체 vitest를 제 클론에서 돌린 결과 52개 파일, 1,427개 통과·TODO 1개로 보고서와 같습니다.
- `<밖>`의 r1.ts sha256 c437fe08…와 두 덤프 sha256 2ae8a57d…, `cmp` 일치가 보고서대로입니다.
- 새 비용 시험 수 27개도 맞습니다.

-- rules2#1 minor
@ src/engine/reports.ts:451, 459, 486 (근거 대조: src/engine/engine.ts:1040, src/engine/reservations.ts:34)
P: contractRiskReport가 '도착했는지'를 `DUTY-` 분개가 있는지로만 판정합니다. 그런데 도착 관세가 0이면 engine.ts:1040 `if (duty === 0)` 분기가 분개를 만들지 않습니다(sh.dutyMinor = 0, dutyPaid = true). 그래서 세율 0으로 도착한 계약은 도착 전으로 취급되고, `pendingDuty = dutyFor(…, tariffDay = max(예정 도착일, 평가일), knownThroughDay = 평가일)`이 불립니다. 결과적으로 도착 뒤에 공지·시행된 관세 변경이 이미 도착한 계약의 남은 흐름(`open`), 실현값(`realized`), 3단계 `tariff`에 들어갑니다. TARIFF가 없는 R1·rules-2에서는 세율이 상수라 영향이 없었지만, TARIFF가 이 경로를 실제로 움직이게 만들었습니다. 같은 저장소의 cashReservations(reservations.ts:34)는 `shipment.dutyMinor === null`로 판정해서 이 경우를 바르게 처리하므로, 두 읽기 함수가 서로 어긋납니다. 동결 프로필(기준 500bp, 걸음 [−200, 800], max_changes 2)에서는 세율 하한이 100bp라 세율 0에 닿지 않습니다. 따라서 지금의 R2 측정값에는 영향이 없습니다. 다만 프로필 사본이나 조정(예: max_changes 3 이상)으로 세율이 min_bp = 0까지 내려가면 J7 입력인 이 함수의 결과가 틀립니다.
E: zeroduty.mjs 탐침: 프로필 사본(모든 기준 세율 0, min_bp 0, step_bp [100, 800]), R2, 시드 1. 1일에 VN행 직접 무역을 첫 편으로 수락했습니다. 결과는 다음과 같습니다.
{"seed":1,"country":"VN","day":60,"status":"COMPLETED","arrival":7,"dutyMinor":0,"dutyEntries":0,"events":[{"countryCode":"VN","round":1,"noticeDay":57,"effectiveDay":58,"stepBp":283}],"open":true,"realized":188261,"tariff":-33253,"residual":0,"reservations":[]}
7일에 관세 0으로 도착해 완료된 계약이, 57일에 공지된 변경 때문에 60일 보고에서 open = true가 되고 tariff = −33,253원이 됩니다. 같은 상태의 cashReservations는 이 계약에 대해 빈 배열입니다. residual이 0이어서 항등식 시험으로는 이 오류를 잡지 못합니다.
FIX: reports.ts에서 도착 여부를 shipment로 판정합니다(예: `const arrived = !!shipment && shipment.dutyMinor !== null`). `pendingDuty`의 조건에 `&& !arrived`를 더하고, 3단계 금액은 `dutyEntry`가 있으면 그 INVENTORY 금액, 없으면 `arrived ? 0 : (pendingDuty ?? 0)`으로 바꿉니다. 지시서 3절은 호출 조건을 'DUTY- 분개 없음'으로 고정했으므로, 허브가 그 문구를 '도착 전(shipment.dutyMinor === null)'으로 정정해야 합니다. 시험은 세율이 0에 닿는 프로필 사본에서, 도착한 계약의 tariff = 0·open = false·dutyFor 호출 없음을 단언하는 경우를 하나 더합니다. 변경 뒤에도 TASK-0062 '관세 호출 인수' 시험(도착한 계약은 미리보기 호출만 있음)과 맞습니다.

-- rules2#2 minor
@ src/engine/risk.ts:128-133 (withRiskLevel R2), src/engine/save.ts:95-135 (deserializeSave)
P: R0과 R1은 rulesVersion이 달라(rules-2와 rules-3) 서로 섞어 불러오면 저장 단계에서 거절됩니다. 그런데 이번에 더한 R2는 R1과 같은 'M2a-rules-3'이고, 저장에는 위험 층 정보가 없습니다. 그래서 R1 저장을 R2 설정으로(또는 반대로) 불러와도 아무 경고 없이 받아들여집니다. 불러온 뒤에는 과거 출항에 부대비가 없고, 과거 공지 로그도 없는데, `tariffSchedule`·`dutyFor`·`contractRiskReport`는 R2 일정으로 과거 사건을 보여 줍니다. rules-3은 측정 전용이고 설계 원칙이 '상태 칸 없음'이라 실제 피해는 낮습니다. 다만 '옛 저장' 관점에서 이번 변경이 새로 연 틈입니다.
E: r2robust.mjs 끝부분: 시드 4 R1 설정으로 26일까지 진행한 저장을 R2 설정으로 deserializeSave한 결과, 'R1 save under R2 config: accepted, day 26 schedule 1 tariff logs in save 0'이 출력됐습니다. 오늘 기준 일정에는 사건이 1건 있지만, 저장 로그에는 그 공지 줄이 없습니다.
FIX: 이번 작업 범위에서는 코드를 바꾸지 않고, 결과 보고나 설계 2절에 'R1·R2 저장은 rules-3 판본을 공유하므로, 측정 도구가 설정과 저장의 짝을 지켜야 한다'는 한계를 적는 것으로 충분합니다. 막을 필요가 있으면 뒤 작업(형식 7 묶음 등)에서 저장 메타에 위험 층 지문을 넣고 deserializeSave의 설정 대조(save.ts:132-134)에 포함합니다.

===== tests
렌즈: src/engine/m2a5-risk-cost.test.ts(27개)와 m2a5-risk-fx.test.ts 매개변수화를 지시서 시험표·변형표 전 행과 대조했고, 독립 클론 두 개(270de2c, wtccr node_modules 링크)에서 변형을 직접 적용해 새 시험 파일 전체를 돌렸다. 작업이 끝난 뒤 클론은 지웠고, wt-TASK-0063 작업 트리는 그대로 깨끗하다.

확인되어 문제가 없는 것:
- 시험 머리: 통과형 vi.mock('./rng')·vi.mock('./risk')를 쓰고, 첩자 기록을 읽기 직전마다 mockClear()한다. 오라클은 importActual의 원본 drawUniform과 시험 안 정수식(half·toKrw·bpAmount·rateAt·week)만 쓴다. dutyFor는 전제 단언에만 쓰고, surchargeBp·surchargeWeek·contractRiskReport는 기대값 계산에 쓰지 않는다. D옛과 실패 기록의 기대값에는 preview를 쓰는데, 지시서가 허용한 방식이다. sim은 import하지 않는다.
- 프로필 사본: 공지 순서 역전은 max_changes 6·lag [0,10]·max_bp 700, 도착 공지 기준일은 lag [0,0], 무의미 사건은 기준 = max_bp·step [0,+]로 지시서와 같다.
- 찾기 조건: 역전 ②의 (i)(ii), 부대비 ④의 환율 다름, ⑤의 나머지 ≥ 5000, 실패 기록 ①②, 비공지 미반영, 수락 자금 검사가 모두 찾기 조건으로 들어가 있다.
- 원천 검사: 지시서 문구 그대로 검사한다(processDepartures 안 surchargeBp( 1회, 인수 정규식, surchargeWeek 정의는 risk.ts에만, tariffEvents 호출처).
- fx 시험: it.each 4경우로 바꿨고 기존 단언은 그대로다.
- 결과 보고의 사실 주장: <밖> r1.ts와 덤프의 sha256, cmp가 일치한다. 시드 4 사례, 정시 노출 1/11도 내 실행과 같다.

변형 재적용 결과(새 시험 파일 전체):
- 요구한 1·2·8·13·15·16·22·23·24·25·27·27b·29·30·31은 모두 잡혔다. 추가로 1b·12·27c(주차를 따로 계산), 13(fx ‘관세 호출 인수’)도 잡혔다. 잡힌 시험도 지시서 변형표가 지정한 시험과 맞는다. Codex의 ‘32종 모두 검출’ 주장은 재적용한 범위에서 사실이다.
- 새 변형:
  - 잡힘: N1a(미지급 관세에서 CASH 줄만 읽음), N1c, N2(contractId 없음, 마감 불변식에서 실패), N5, N6(도착 처리 K = s.day−1), N8, N12, N13, N19·N19c(자르기를 끝에 한 번).
  - 등가: N1b(CASH/AP 줄을 부호 반전해 읽음). payOrAccrue가 늘 두 줄을 쓰므로 결함이 아니다.
  - 생존: N3, N4, N9, N14, N14b, N20.

모든 생존 변형에서 제품 코드는 맞다. 결함은 시험 쪽에 있다. R2를 쓰는 시험은 이 파일뿐이라 다른 시험 파일도 생존 변형을 잡지 못한다(N4·N9는 fx 파일로도 돌려 살아남음을 확인했다). blocker는 없다. major 2건, minor 5건이다.

-- tests#1 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-cost.test.ts:681-690 ('결정성·저장·커서 불변과 끝난 상태의 공지 평가일'), 대상 코드 src/engine/risk.ts:86
P: 지시서 1절(‘끝난 상태의 기준일 K는 평가일’)과 시험표의 ‘끝난 상태에서는 평가일 기준이다’ 단언이 공허하다. 시험은 정상 종료 상태만 본다. 이때 엔진은 s.day = 91로 끝나고 공지일은 campaignDays − lag_days[1] ≤ 87이므로, s.day를 쓰든 평가일을 쓰든 결과가 같다. 실패로 끝난 상태는 engine.ts:876-877에서 s.day = F+1이 되므로 F+1일에 공지된 사건이 있으면 둘이 갈린다. 변형 N4(risk.ts:86을 `const day = s.day;`로)가 살아남고, 이는 미래 누설 금지(설계 2절 3)에 해당한다.
E: - 변형 N4: 새 시험 파일 27/27 통과, fx 시험 36/36 통과(SURVIVED).
- 탐침: 무명령 R2를 200시드 돌리면 모두 F=71, s.day=72로 실패 종료한다.
- 그중 시드 45·68·77·124·127·193에 72일 공지 사건이 있다. 예: 시드 68 {VN, 1, notice 72, eff 73, +580}, 시드 127 {CN, 2, notice 72}.
- 맞는 구현의 tariffSchedule은 이 사건을 빼지만(시드 68 출력은 [[CN,2,15],[CN,1,57]]), N4는 넣는다.
- 시험 690행은 끝난 상태의 (나라, 회차) 집합만 정렬해 비교하고 fromBp·toBp는 보지 않는다.
FIX: 실패로 끝난 상태에서 F+1일에 공지된 사건이 있는 시드를 찾는 단언을 더한다. 예: 무명령 R2 구동으로 실패 상태를 만들고 시드 200개 안에서 찾는다. 찾았는지 먼저 단언한다. 그다음 다음 둘을 단언한다.
- tariffSchedule(ended)의 (나라, 회차) 목록 = 공지일 ≤ F인 oracleEvents
- 각 사건의 rates = oracleRates(cfg, seed, e, F)
시험 제목이 이 규칙을 검사한다고 주장하므로 함께 맞춘다.
V1: 지적이 적힌 그대로 맞다. 근거는 독립 클론(270de2c)에서 직접 실행해 얻었다.

1. 시험이 보는 상태(m2a5-risk-cost.test.ts:682-690)
   - 탐침 출력은 `PROBE 4 91 COMPLETED undefined 90 [0,3]`이다. 시드 4(costSeeds().positive)이고, `ended.day = 91`, `outcome = COMPLETED`, `failure = null`, `campaignDays = 90`, `lagDays = [0,3]`이다.
   - 따라서 공지일 상한은 risk.ts:69의 `campaignDays − lagDays[1]` = 87이다.
   - 정상 종료에서 K = 90이든 s.day = 91이든 `noticeDay <= day` 필터와 `knownRate`의 `noticeDay <= knownDay`가 같은 집합을 낸다.
   - 690행은 (나라, 회차)를 정렬해 비교할 뿐이고 rates는 보지 않는다.

2. 실패 종료의 날짜
   - operations.ts:297이 `failure = { day: s.day, ... }`로 그날 마감일을 넣는다.
   - 그 뒤 engine.ts:876-877이 `s.day = day + 1`, `phase = 'ENDED'`로 둔다. 그래서 끝난 상태의 s.day는 F+1이다.
   - 설계 DESIGN.md:174는 ‘실패 뒤의 s.day(실패일 + 1)는 쓰지 않는다 … 아직 공지되지 않은 사건은 쓰지 않는다’고 적는다.
   - 지시서 67행은 끝난 상태의 K를 `contractRiskReport` 평가일 규칙으로 정한다. 시험표 157행도 ‘끝난 상태에서는 평가일 기준이다’라고 요구한다.

3. 무명령 R2 탐침
   - 200시드 모두 `FAILED:F=71:day=72`로 끝났다.
   - 72일 공지 사건이 있는 시드는 45·68·77·124·127·193으로, 지적과 같다.
   - 시드 68은 VN 1회차, 공지 72일, 시행 73일, +580이고, 맞는 구현의 `tariffSchedule` 출력은 `[[CN,2,15],[CN,1,57]]`이다. 시드 127은 CN 2회차, 공지 72일이다.

4. 변형 N4: risk.ts:86을 `const day = s.day;`로 바꿈
   - m2a5-risk-cost 27건과 m2a5-risk-fx 36건, 합 63/63이 통과했다.
   - 전체 스위트도 52파일, 1427건이 모두 통과해 살아남았다.
   - 다른 `tariffSchedule` 시험(282·360·362·364·367행)도 이를 잡지 못한다. 모두 열린 상태이거나 ENDED를 건너뛴다.

5. 고친 시험의 실제 검증
   - 아래 fix의 시험을 클론에 넣어 돌렸다. 맞는 코드에서는 통과했다(찾은 시드 68, F = 71).
   - N4에서는 `[[CN,1],[CN,2],…(1)]` ≠ `[[CN,1],[CN,2]]`로 실패했다.

6. 심각도
   - 구현 자체(risk.ts:86)는 맞다. 지금 ENDED 상태로 `tariffSchedule`을 부르는 제품 경로도 없다. openDay는 PENDING_OPEN이 아니면 바로 돌아간다. 그래서 blocker는 아니다.
   - 다만 지시서가 요구한 단언이 공허해 미래 누설 변형이 살아남는다. 기준표상 major다.
   - 결과 보고서는 이 항목을 따로 ‘충족’이라 주장하지 않는다. ‘R2 변환·부대비 상한’ 행에서 이 항목이 빠져 있을 뿐이라 거짓 주장은 아니다.

클론은 삭제했다.
VFIX1: src/engine/m2a5-risk-cost.test.ts의 ‘TASK-0063 호환성과 진단’에 실패 종료 사례를 더한다. 690행 단언에 붙이거나 따로 it을 둔다. 시간 제한은 60000으로 둔다. 클론에서 맞는 코드는 통과하고 N4는 죽는 것을 확인한 형태다.

```ts
it('실패 종료의 공지 평가일: 실패일 + 1 공지 사건 제외', () => {
  const idle = (cfg: ScenarioConfig) => { let s = createGame(cfg); while (s.phase !== 'ENDED') s = commitDay(openDay(s, cfg).state, cfg, []).state; return s; };
  const first = idle(cfgFor(1)); expect(first.operations!.outcome).toBe('FAILED');
  const F = first.operations!.failure!.day; expect(first.day).toBe(F + 1);
  let seed = 0;
  for (let x = 1; x <= 200 && !seed; x++) { const ev = oracleEvents(cfgFor(x), x); if (ev.some((e) => e.noticeDay === F + 1) && ev.some((e) => e.noticeDay <= F)) seed = x; }
  expect(seed).toBeGreaterThan(0);                       // 전제: F+1 공지 사건과 F 이하 공지 사건이 함께 있는 시드(현재 68)
  const cfg = cfgFor(seed), ended = idle(cfg);
  expect(ended.operations!.failure!.day).toBe(F); expect(ended.day).toBe(F + 1);
  const known = oracleEvents(cfg, seed).filter((e) => e.noticeDay <= F);
  const sched = tariffSchedule(ended, cfg);
  expect(sched.map((e) => [e.countryCode, e.round]).sort()).toEqual(known.map((e) => [e.countryCode, e.round]).sort());
  for (const e of known) expect(sched.find((v) => v.countryCode === e.countryCode && v.round === e.round)!.rates).toEqual(oracleRates(cfg, seed, e, F));
}, 60000);
```

함께 고칠 것:
- 시험 순서 단언도 지시서대로(공지일, 나라 순, 회차) 하려면, 정렬 비교 대신 순서까지 맞춘 오라클 목록과 견준다.
- 690행의 정상 종료 단언은 그대로 두어도 된다. 다만 시험 제목이나 주석에 ‘정상 종료는 K와 s.day가 같은 결과라 실패 종료 사례가 실제 검사’라고 밝힌다.
- 결과 보고서 변형 표에 N4(`tariffSchedule`이 끝난 상태에서 s.day 사용)를 더하고, 위 시험이 잡는다고 적는다.
V2: 지적이 그대로 성립한다. 변형 N4는 내 클론에서 살아남았고 미래 누설도 실제로 일어난다.

1) 시험이 보는 상태는 정상 종료뿐이다. 시험 682–690행과 같은 구성(시드 costSeeds().positive = 4, setup→finish→advance(91))을 탐침했다. 결과는 phase ENDED, day 91, outcome COMPLETED, failure null이었다. 사건은 CN1(공지 53), VN1(공지 19)이다. 공지일 상한은 campaignDays(90) − lag_days[1](3) = 87이다. 그래서 정상 종료에서는 K = 90이든 s.day = 91이든 `events.filter(noticeDay <= day)`와 `knownRate`의 `noticeDay <= knownDay` 거르기 결과가 같다. 690행 단언은 이 규칙에 대해 공허하다. 게다가 690행은 (나라, 회차)를 정렬해 견주기만 하고 rates와 순서는 보지 않는다.

2) 변형 N4: risk.ts:86을 `const day = s.day;`로 바꿨다. 결과는 m2a5-risk-cost.test.ts와 m2a5-risk-fx.test.ts 63/63 통과였다. 전체 `vitest run`도 52 파일, 1427 통과, 실패 0으로 살아남았다. 엔진 안에서 tariffSchedule을 부르는 곳은 openDay(157행)뿐이다. 이 경로는 끝나지 않은 상태라 이 분기를 잡지 못한다. src/ui에도 호출처가 없다.

3) 실패로 끝난 상태에서 두 값이 실제로 갈린다. 무명령, 무환전 R2를 시드 1~200으로 돌리면 200개 모두 F = 71, s.day = 72로 끝난다(engine.ts:876–877). 그중 시드 45·68·77·124·127·193에는 72일에 공지되는 사건이 있다. N4 아래 tariffSchedule을 보면 다음과 같다.
- 시드 68: [CN2@15, CN1@57, VN1@72(500→1080)]. 오라클(K = F = 71)은 [CN2@15, CN1@57]이다.
- 시드 45: [CN1@72]. 오라클은 []이다.
- 시드 127: [CN1@63, CN2@72(1045→1304)]. 오라클은 [CN1@63]이다.
열린 적 없는 날(72일)의 공지가 드러난다. 이는 설계 2절 3의 미래 누설 금지와 지시서 1절 ‘끝난 상태는 평가일’ 위반이다.

4) 지시서 시험표(157행 ‘끝난 상태에서는 평가일 기준이다’)가 요구하는 단언이 공허하고, 이 때문에 변형이 살아남는다. 판정 기준의 major(필수 시험이 공허해 변형이 살아남음)에 해당한다. 지금은 끝난 상태에서 tariffSchedule을 읽는 화면이나 측정 경로가 없다. 그래서 실제 피해는 잠재적이다. rules-1/rules-2나 저장에는 영향이 없으므로 blocker는 아니다. 결과 보고서(docs/ai/tasks/results/TASK-0063.md)에는 이 규칙에 대한 별도 주장이 없어서 보고서 허위는 아니다.
VFIX2: src/engine/m2a5-risk-cost.test.ts 681–690행의 시험에 실패 종료 사례를 더한다(또는 별도 it으로 둔다).
(1) 시드 1~200을 차례로 본다. 각 시드에서 `let s = fresh(cfgFor(seed)); s = advance(s, cfg, cfg.campaignDays + 1, false)`로 무명령, 무환전 R2 실패 상태를 만든다. `F = s.operations!.failure!.day`, `s.day === F + 1`이고, `oracleEvents(cfg, seed).some(e => e.noticeDay === s.day)`인 첫 시드를 찾는다(시제품 첫 적중은 시드 45, 기대값이 [] → N4 값이 [CN1@72]. rates까지 보이려면 시드 68이 낫다). 그리고 `expect(found).toBeDefined()`, `expect(ended.phase).toBe('ENDED')`, `expect(ended.day).toBe(F + 1)`을 먼저 단언한다.
(2) `tariffSchedule(ended, cfg)`를 정렬하지 않고 전체 꼴로 견준다. 기대값은 다음 목록이다.
- 대상: `oracleEvents(cfg, seed).filter(e => e.noticeDay <= F)`
- 순서: 공지일, tariff.base의 나라 첫 등장 순, 회차 순
- 각 원소: `{ countryCode, round, noticeDay, effectiveDay, rates: oracleRates(cfg, seed, e, F) }`
(3) 정상 종료 단언(690행)도 정렬 없이 rates까지 `oracleRates(cfg, seed, e, cfg.campaignDays)`와 견주도록 바꾼다. 이 단언이 K 분기를 가리지 못한다는 점은 주석으로 남긴다.
(4) 변형 표에 ‘tariffSchedule이 끝난 상태에서 s.day를 기준일로 씀’을 더하고, 이 시험으로 잡힘을 결과 보고에 적는다. 제품 코드(risk.ts:86)는 고칠 필요가 없다.

-- tests#2 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-cost.test.ts:614-618 (‘항등식’의 부대비 미지급 계약), 대상 코드 src/engine/reports.ts:492
P: 지시서 3절 4단계의 날짜 규칙(‘미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일’)을 시험표 ‘항등식’이 요구한 부대비 미지급 계약으로 가리지 못한다. 평가일이 출항일 + 1이라 출항일과 같은 환율 주이기 때문이다. 4단계 줄 날짜를 분개 날로 바꾼 변형 N9(`flow(-amount, e.day, …)`)가 살아남는다. 시험은 surcharge ≠ 0과 항등식만 단언하고, 평가일 환율 ≠ 출항일 환율 전제도 4단계 식도 없다.
E: - 변형 N9: 새 시험 27/27 통과, fx 시험 36/36 통과(SURVIVED).
- 탐침(시드 4, 편 X 출항 9일): 부대비 의무 SURCHARGE-BK001 4,872센트가 23일까지 미지급으로 남는다.
- 참고 환율은 9일 1293, 10일 1293(시험의 평가일), 15일 1306, 22일 1274다.
- 평가일을 15일 이후로 두면 N9가 드러난다.
FIX: 부대비 미지급 상태를 출항일과 환율 주가 다른 날까지 진행한다. 예: 의무가 남아 있는 동안 rateAt(평가일) ≠ rateAt(출항일)인 첫 날을 설정에서 찾고, 찾았는지와 환율 다름을 먼저 단언한다. 그 상태에서 identity와 함께 다음을 단언한다.
- components.surcharge === toKrw(−(Cr+S), r_eval) − toKrw(−Cr, r_eval)
가능하면 미지급 뒤 다른 환율 주에 갚은 경우(갚은 날 규칙)도 하나 넣는다.
V1: 지적이 그대로 맞다. 기준은 270de2c를 독립 클론(tests-v10-29670)에서 돌린 결과다. 클론은 삭제했다.

(1) 근거 규칙이 있다.
- 지시서 102행: "날짜는 그 분개 날이고, 미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일이다."
- DESIGN 3.4의 4단계 표(192행)도 "미지급이면 갚은 날의 환율, 평가일 상한"이다.
- 구현 reports.ts:492 `surchargeFlows.push(flow(-amount, paidDay(e.id, e.day), true, e.currency))`는 이 규칙대로 맞다. 결함은 시험 쪽에 있다.

(2) 시험 605~618행이 이 규칙을 가리지 못한다.
- 부대비 미지급 상태를 `advance(preDeparture, cfg, x.sailing.departureDay + 1)`로 만든다. 평가일이 출항일 + 1이다.
- 단언은 `identity(...)`와 `components.surcharge).not.toBe(0)`뿐이다.
- 탐침 결과(시드 4, 출항 9일, 수락 1일, `SURCHARGE-BK001` 4,872센트):
  - 미지급 기간은 10~23일이다.
  - 참고 환율은 9일과 10~14일이 1293, 15~21일이 1306, 22~23일이 1274다.
  - 따라서 평가일 10일은 출항일과 같은 환율 주다.

(3) 변형 N9는 살아남는다.
- N9: 492행을 `flow(-amount, e.day, …)`로 바꾼다.
- m2a5-risk-cost 27개와 m2a5-risk-fx 36개, 합계 63/63이 통과한다.
- 전체 스위트도 52 파일, 1427 통과로 아무것도 실패하지 않았다.

(4) 평가일을 다른 환율 주로 옮기면 잡힌다.
- 같은 미지급 상태를 15일(1306)까지 진행하면, 맞는 구현에서는 `identity`가 통과한다. 지적의 식 `surcharge === toKrw(−(Cr+S), r_e) − toKrw(−Cr, r_e)`도 성립한다. Cr = 남은 관세 예상 5000, 운임은 1일 환율 1300이라 빠진다. 값은 -63628 = -63628이다.
- N9에서는 identity의 단계 합 단언이 실패한다(`expected -512628 to be -511995`). 4단계 줄과 독립 realized의 미지급 줄 날짜가 어긋나기 때문이다. 시험의 전제만 빠져 있었던 것이다.

(5) '갚은 날' 쪽도 같은 공백이 있다.
- 변형: 의무가 있으면 무조건 평가일을 쓴다(`obligations.some(o => o.id === e.id) ? evaluationDay : e.day`).
- 이 변형도 위 두 시험 파일에서 63/63 통과로 살아남는다.
- 15일(1306)에 USD를 정확히 S만큼 넣어 15일 마감에 갚게 했다. 이어 22일(1274)에 평가하면, 맞는 구현은 통과하고(surcharge -63628, 즉 1306 기준) 이 변형은 identity에서 실패한다(`-990528 vs -988969`).

(6) 심각도: 지시서 시험표 '항등식'이 요구한 '부대비 미지급 계약'이 날짜 규칙에 대해 사실상 비어 있다. 그래서 변형이 살아남는다. 기준표의 major에 해당한다.
- 구현 동작과 rules-1/2에는 영향이 없다. blocker는 아니다.
- N9는 지시서 변형 표(1~31)에 없는 검수 쪽 변형이다. 다만 지시서 시험 머리의 '전제가 빠졌으면 시험을 고친다' 규칙에 해당한다. 같은 표의 (가) 전제와도 같은 꼴이다. (가) 전제는 '평가일 환율 ≠ 수락일 환율'을 먼저 단언하게 한다.
- 결과 보고 120행 "부대비 미지급…단계 합 대조"는 문자 그대로는 사실이라 허위 주장은 아니다.
VFIX1: src/engine/m2a5-risk-cost.test.ts 605~618행의 '항등식' 시험에서 부대비 미지급 부분을 다음처럼 바꾼다.

(a) 미지급 상태를 다른 환율 주까지 진행한다.
- `unpaidSurcharge`를 만든 뒤 다음을 돌린다: `while (s.phase !== 'ENDED' && unpaid(s) && rateAt(cfg, cfg.seed, s.day) === rateAt(cfg, cfg.seed, dep)) s = advance(s, cfg, s.day + 1)`.
- `unpaid`는 `SURCHARGE-{예약}` 의무 가운데 `paidDay === null`인 것이다.
- 먼저 둘을 단언한다: `unpaid(s)`가 있다. `rateAt(평가일) !== rateAt(출항일)`이다. 시드 4에서는 15일, 1306 대 1293이다.

(b) 그 상태에서 `identity`와 함께 다음 식을 단언한다.
- 식: `components.surcharge === toKrw(-(Cr + S), r_e) - toKrw(-Cr, r_e)`.
- r_e는 평가일 참고 환율이다.
- S는 그 의무 금액이다.
- Cr은 3단계 줄 가운데 환율이 r_e인 USD 비용 줄의 합이다. 남은 관세 예상은 `oracleDuty(…, max(예정 도착일, 평가일), 평가일, …, acceptedDay)`로 구한다. 여기에 첫 `FREIGHT-PREPAY-` 날 환율이 r_e이면 그 운임을 더한다.

(c) 갚은 날 규칙도 하나 넣는다.
- 위 상태(15일)에서 USD 현금을 S만큼 원장에 넣는다(예: CASH +S / OPENING_EQUITY −S). 그날 마감에 그 의무가 갚아진다.
- 다음을 단언한다: `paidDay === 15`. 그 뒤 rateAt ≠ rateAt(paidDay)인 날까지 진행한 평가일은 22일(1274)이다.
- 그 상태에서 `identity`와 `surcharge === toKrw(-(Cr' + S), rateAt(paidDay)) - toKrw(-Cr', rateAt(paidDay))`를 단언한다.

확인 결과:
- 맞는 구현은 (a)~(c)를 모두 통과한다.
- N9(`e.day`)는 (a)의 identity에서 실패한다.
- '의무 있으면 평가일' 변형은 (c)의 identity에서 실패한다.

이 두 변형을 결과 보고의 변형 표에 추가한다.
V2: 지적은 쓰인 그대로 성립한다. 결함은 시험에만 있고 구현은 맞다.

**구현은 맞다**
- reports.ts:492는 `surchargeFlows.push(flow(-amount, paidDay(e.id, e.day), true, e.currency))`이다.
- `paidDay`는 의무가 있으면 `o.paidDay ?? evaluationDay`, 없으면 분개 날을 돌려준다.
- 이는 지시서 3절 102행(“날짜는 그 분개 날이고, 미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일”)과 설계 3.4 표 4행을 그대로 따른다.

**시험이 이 날짜 규칙을 가리지 못한다**
- ‘항등식’ 시험의 부대비 미지급 사례(m2a5-risk-cost.test.ts:614-618)는 평가일을 출항일 + 1로 둔다.
- 그래서 출항일과 평가일이 같은 환율 주에 든다.

**독립 클론에서 확인한 것** (270de2c, 확인 뒤 삭제)
1. 변형 N9를 넣었다. reports.ts:492의 `paidDay(e.id, e.day)`를 `e.day`로 바꾸는 변형이다.
   - `npx vitest run` 전체 결과: 52개 파일, 1427개 시험이 모두 통과했다(1 todo).
   - 즉 새 시험·fx 시험뿐 아니라 전체 묶음 어디서도 이 변형이 잡히지 않는다.
2. 탐침으로 지적의 수치가 모두 맞음을 확인했다.
   - 시드 4(`costSeeds().positive`), 수락 1일, 편 X 출항 9일이다.
   - `SURCHARGE-BK001` 4,872센트는 24일까지 `paidDay = null`이다.
   - 참고 환율은 9일 1293, 10일 1293, 15일 1306, 22일 1274다.
   - 시험의 평가일은 10일이다.
3. 날짜별로 원래 코드와 N9를 견주었다.

   | 평가일 | 원래 코드 surcharge | N9 surcharge | N9 residual |
   |---|---|---|---|
   | 10~14일 | −62995 | −62995 | 0 (같음) |
   | 15~21일 | −63628 | −62995 | −633 |
   | 22일부터 | −62069 | −62995 | 926 |

4. 의무를 미지급으로 둔 채 환율 주가 다른 첫 날(15일)까지 진행하는 강화 시험을 만들었다.
   - 원래 코드: 통과. surcharge = −63628 = toKrw(−(5000+4872), 1306) − toKrw(−5000, 1306)이다. 여기서 Cr = 미지급 관세 예상 5000이고, 운임 줄은 1일 환율이라 빠진다.
   - N9: 실패. `identity`의 단계 합 단언에서 −512628 ≠ −511995가 나왔다.

**지적이 정확하다고 본 근거**
- 기존 단언은 `components.surcharge ≠ 0`과 `identity`뿐이다. 평가일 환율 ≠ 출항일 환율 전제도, 4단계 식도 없다.
- 지시서 162행은 “결과가 같은 변형이면 먼저 전제가 빠졌는지 확인해 시험을 고친다”고 요구한다.
- 지시서 151행은 변형 14에 대해 “같은 환율 주라 가리지 못한다”는 같은 함정을 이미 명시했다.
- 따라서 지시서가 요구한 ‘부대비 미지급 계약’ 사례가 이 규칙에 대해 무의미하고, 변형이 살아남는다. 등급은 major가 맞다.

**major에 그치는 이유**
- N9는 지시서 변형 표에 없는 검토자 변형이다.
- 결과 보고 120행(“부대비 미지급 … 단계 합 대조”)은 문자 그대로는 거짓이 아니다.
- rules-1/rules-2 경로와 저장에는 영향이 없다(보고서 전용 함수). 그래서 blocker는 아니다.
VFIX2: **고칠 곳:** m2a5-risk-cost.test.ts:614-618의 ‘항등식’ 부대비 미지급 사례.

1. `unpaidSurcharge`를 만든 뒤 날을 하루씩 진행한다. 멈추는 조건은 셋 가운데 하나다.
   - 게임이 끝남: `s.phase === 'ENDED'`
   - `SURCHARGE-` 의무가 갚아짐(`paidDay !== null`)
   - 그날 환율이 출항일 환율과 다름: `rateAt(cfg, cfg.seed, s.day) !== rateAt(cfg, cfg.seed, dep)`

   시드 4에서는 15일에 멈춘다.
2. 멈춘 날에 전제를 먼저 단언한다.
   - 미지급 `SURCHARGE-` 의무가 남아 있다.
   - `s.phase !== 'ENDED'`이다.
   - `rateAt(평가일) ≠ rateAt(출항일)`이다.
3. 그 상태에서 `identity(s, cfg, c.id)`를 부른다. 이것만으로 N9가 잡힌다(단계 합 단언 실패, residual −633).
4. 4단계 식도 직접 단언한다.
   - `components.surcharge === toKrw(−(Cr+S), r_eval) − toKrw(−Cr, r_eval)`
   - S = 미지급 의무 금액, r_eval = 평가일 참고 환율.
   - Cr = 3단계 USD 비용 줄 가운데 환율이 r_eval과 같은 줄의 합이다. 시드 4에서는 미지급 관세 예상 `oracleDuty(…, max(예정 도착일, 평가일), 평가일, …)`이다. 운임 줄은 `rateAt(FREIGHT-PREPAY 날) === r_eval`일 때만 더한다.
   - 이 형태로 원래 코드 통과, N9 실패를 확인했다.

**선택:** ‘갚은 날’ 갈래도 넣을 수 있다.
- 출항 뒤 다른 환율 주에 USD 현금을 넣어 의무가 갚아지게 한다.
- 그다음 `paidDay`의 환율로 4단계 식을 단언한다.
- 이 구성은 실행해 확인하지 않았다.

이 사례로 잡는 변형으로 N9(“4단계 줄 날짜를 분개 날로 둠”)를 결과 보고 변형 표에 추가할 것을 권한다.

-- tests#3 minor
@ src/engine/engine.ts:946-951(편 놓침 해제 분기), 시험 파일 전체
P: 지시서 2절의 ‘준비가 끝나지 않아 해제되는 예약(편 놓침)에는 매기지 않는다’를 지키는 시험이 없다. R2에서 부대비 주가 양수인 편을 놓치는 구성이 시험에 하나도 없다. 원천 검사는 processDepartures 안의 surchargeBp( 호출 수만 센다. 그래서 호출 하나를 준비 검사 위로 올려 해제 분기에서도 부과하는 변형 N3가 원천 검사와 모든 시험을 통과한다. 시험표에 이 행이 없으므로 minor다.
E: - 변형 N3: 호출은 하나로 두고 해제 분기에서도 payOrAccrue('SURCHARGE-…')를 부르게 했다. 새 시험 27/27 통과(SURVIVED).
- 탐침, 맞는 구현: 시드 1 R2에서 직원 없이 첫 편 plan으로 수락하면 예약이 CANCELLED가 되고, SURCHARGE- 분개가 없으며 residual 0이다.
- 탐침, N3 적용: 같은 탐침에서 contractRiskReport가 TypeError(INVENTORY 줄 없음)로 실패한다.
FIX: TASK-0062의 ‘편 놓침’ 구성(m2a5-risk-fx.test.ts:648-655, 직원 없이 plan 수락)을 R2로 옮긴 시험을 더한다.
- 전제: 첫 편 출항 주의 oracleSurcharge > 0인 시드를 찾았음을 단언한다.
- 단언: 출항일 마감 뒤 예약 CANCELLED, SURCHARGE- 분개 없음, identity·residual 0, surcharge 0.

-- tests#4 minor
@ src/engine/m2a5-risk-cost.test.ts:269-286(사건 범위)와 212-236(일정 오라클의 설정 둘), 대상 코드 src/engine/risk.ts:72
P: H16-3의 무의미 판정(‘그 나라 모든 품목에서 a = b이면 뺀다’)에서 ‘모든 품목’ 쪽이 검증되지 않는다.
- 일정 오라클은 시작 프로필과 역전 사본만 돈다. 둘 다 한 나라의 품목 기준 세율이 같아(모두 500) some과 every가 늘 같다.
- 기준 세율이 다른 ‘사건 범위’ 사본은 일정 목록을 오라클과 견주지 않고, 시드 5에서 멈춘다.
그래서 .some → .every 변형 N20이 살아남는다. 지시서가 일정 오라클 설정을 두 가지로 정했으므로 지시서 쪽 공백이기도 하다.
E: - 변형 N20: 27/27 통과(SURVIVED).
- 탐침: 사건 범위 사본(CN 기준 1500·2999, max 3000)에서 N20의 tariffEvents가 200시드 가운데 45시드에서 oracleEvents와 다르다.
- 예: 시드 8에서 오라클은 {CN, 2, notice 87, +374}를 남기는데 N20은 뺀다. 시드 10은 {CN, 1, notice 81}을 뺀다.
FIX: 사건 범위 사본에서 시드 1~200 모두 expect(tariffEvents(cfg, seed)).toEqual(oracleEvents(cfg, seed))를 단언한다. 또는 이 사본을 일정 오라클의 셋째 설정으로 넣는다.

-- tests#5 minor
@ src/engine/m2a5-risk-cost.test.ts:282, 362-369, 690 (tariffSchedule·공지 로그 순서), 대상 코드 src/engine/risk.ts:89-90
P: 지시서 1절의 tariffSchedule 순서(공지일 순, 같은 날은 tariff.base에 처음 나온 나라 순, 그다음 회차, G9)와 ‘로그는 같은 순서’를 아무 시험도 단언하지 않는다. 시험은 find()로 사건 하나를 꺼내거나, 정렬한 집합을 비교하거나, 로그를 제품의 tariffSchedule 순서와 견준다(자기 일치). 공지일 내림차순 변형 N14와 나라 동점 역순 변형 N14b가 살아남는다. 경로 11 화면이 이 순서를 그대로 쓴다.
E: 변형 N14(`b.noticeDay - a.noticeDay`), N14b(countries.indexOf 역순): 둘 다 27/27 통과(SURVIVED).
FIX: 상태 하나 이상에서 tariffSchedule(s, cfg).map(e => [e.countryCode, e.round])가 오라클로 만든 목록과 같음을 단언한다. 오라클 목록은 oracleEvents를 공지일, tariff.base 나라 순, 회차 순으로 정렬해 만든다. 같은 날 두 나라가 공지하는 시드를 찾는 단언도 더한다.

-- tests#6 minor
@ src/engine/m2a5-risk-cost.test.ts:276-283(사건 범위)
P: ‘품목 세율 차이 보존’과 ‘순서(a ≤ b) 보존’ 단언(279·280행)이 오라클 배열 a·b만으로 계산된다. 제품 값이 들어가지 않으므로 어떤 구현에서도 실패할 수 없다. 제품 검증은 282행 `if (state.day === e.noticeDay)` 조건부 tariffSchedule 비교 하나뿐이고, 그 분기가 자르기 사건에서 실제로 돌았다는 단언이 없다.
E: - 279·280행의 b는 `a.map(r => Math.min(maxBp, Math.max(minBp, r + e.stepBp)))`로 시험 안에서 만든다.
- 탐침으로 보면 현재는 시드 3·4의 자르기 사건과 시드 5의 비자르기 사건에서 분기가 돌았다(state.day === noticeDay). 그래서 지금은 변형 7·N19가 잡힌다.
FIX: 282행 조건을 `expect(state.day).toBe(e.noticeDay)`로 바꾼다. 차이 보존과 순서 보존은 제품 tariffSchedule의 rates(fromBp·toBp)로 단언한다. 자르기 사건에서 제품 비교가 돌았음을 세는 플래그를 단언한다.

-- tests#7 minor
@ src/engine/m2a5-risk-cost.test.ts:459-467(도착 공지 기준일), 385-387(공지 반영), 484-485(미래 누설 (a))
P: 가르는 전제가 없거나 주장 뒤에 있다.
- 도착 공지 기준일: dutyFor(T=N, K=N) ≠ dutyFor(T=N, K=N−1)을 단언하지 않는다. 찾기 조건은 수락일 미리보기와만 비교한다.
- 공지 반영: 새 세율 ≠ 옛 세율을 단언하지 않는다.
- 미래 누설 (a): K = 평가일과 K = 도착 예정일의 dutyFor 다름 전제가 주장 루프 뒤(484행)에 있고, before 상태에만 있다. 지시서는 ‘먼저 단언’이다.
지금 데이터에서는 우연히 성립해 변형이 잡힌다. 다만 데이터가 바뀌면 조용히 공허해질 수 있다.
E: - 탐침: 도착 공지 기준일 사례(시드 4, N=55)는 K=N 9869, K=N−1 9172로 다르다. 변형 N6은 잡혔다.
- 탐침: 공지 반영 사례(시드 1, VN 57일 공지)는 새 6207, 옛 5532로 다르다.
- 둘 다 시험 안에 단언이 없다.
FIX: - 도착 공지 기준일: findEventCase 조건과 단언에 oracleDuty(N, N) ≠ oracleDuty(N, N−1)을 넣는다.
- 공지 반영: oracleDuty(T, K=N) ≠ oracleDuty(T, K=N−1)을 먼저 단언한다.
- 미래 누설 (a): 484-485행을 루프 앞으로 옮긴다.

===== numbers
렌즈: 수치 검증. 독립 클론 두 개(270de2c, ef7374f)를 만들어 확인했고, 끝난 뒤 둘 다 지웠습니다. 원래 작업 트리는 읽기만 했고 `git status`는 빈 출력입니다.

결론: 결과 보고서의 핵심 수치는 독립 재현에서 모두 일치했습니다. blocker·major 결함은 찾지 못했고 minor 3건만 보고합니다.

**1) 일정·부대비 오라클**
- 지시서 H16-1~3 문장만 보고 Python 오라클을 새로 썼습니다(`numbers-evidence/oracle.py`). FNV-1a와 splitmix32도 직접 구현해 원본 `drawUniform`까지 쓰지 않았습니다.
- 대상: 시작 프로필과 역전 사본(`max_changes` 6, `lag_days` [0,10], `max_bp` 700)의 `tariffEvents`, 시드 1~200.
- 같은 시드들에 대해 노선 2개 × 1~15주차 `surchargeBp`도 비교했습니다. 불일치 0건입니다.
- 보고표 확인:
  - 시드 1: VN 57→58 +61, ROUTE01 [511,0,0]
  - 시드 2: VN 50→52 +712, ROUTE01 [2356,0,0], ROUTE02 [1987,0,0]
  - 시드 4: CN 53→56 +38, VN 19→20 +706, ROUTE01 [0,2436,0]
  - 모두 정확합니다.

**2) 계약 components 손계산**
원장 줄만 가지고 설계 3.4 순차 대체를 Python으로 다시 계산했습니다. 계약 12개 시점에서 expected·realized·10칸이 모두 보고서와 같았습니다.
- 시드 4 정시 계약(15일 수락, 21일 도착)
  - 과세가격 2,495,800원 → 191,103센트. 옛 관세 9,555, 새 관세 23,047(1206bp).
  - 환율 1306/1274. `tariff` = toKrw(−43,047, 1306) − toKrw(−29,555, 1306) = −176,206.
  - `fx` = toKrw(258,350, 1274) − toKrw(258,350, 1306) = −82,672.
  - 보고 행과 일치합니다. 공지 당일(19일)·20일 운송 중 상태의 `pendingDuty` 23,047과 `tariff` −176,206도 일치합니다.
- 시드 4 둘째 편(부대비)
  - 부대비 20,000 × 2,436 → 4,872센트.
  - `surcharge` = toKrw(−9,872, 1293) − toKrw(−5,000, 1293) = −62,995. `fx` −9,450, `late` −387,900.
  - realized −265,345 = 195,000 − 460,345. 보고 행과 일치합니다.
- 출항 전 취소: `cancel` −1,560,000, 3·4단계 0.
- 미지급 부대비, 미지급 관세(도착 뒤 USD를 비워 만듦), 상환 전후 상태
  - 예: `tariff` −171,888 / −173,507, `surcharge` −62,069.
  - 모두 일치하고 `residual`은 0입니다.

**3) 정시 노출(진단 T)**
- Codex 구동기와 같은 정책(공개일마다 `pnlKrw`가 가장 큰 정시 견적 하나, 첫 편)을 직접 다시 짰습니다.
- 정의: 정시 계약 가운데 도착일 세율 rate(도착일, 도착일)이 수락일 기대 세율 rate(수락일, 첫 편 도착 예정일)과 다른 계약.
- 결과: 시드 1~3은 0건(0/34), 시드 4는 1/11(CT003, 15→21, −176,206)로 보고와 같습니다.
- 60개 시드 전체에서 ‘세율 다름 ⇔ `tariff` ≠ 0’ 불일치는 0건입니다.

**4) R1 덤프와 R0·R1 비변경**
- `<밖>`의 `r1.ts` sha `c437…bd4b`, 덤프 두 개 sha `2ae8…65a7`과 cmp 0을 확인했습니다.
- 같은 스크립트를 BASE 클론에서 다시 돌리면 before 덤프와 바이트가 같고, 스냅숏에서 돌리면 after 덤프와 같습니다.
- 골든 밖 경로도 봤습니다. R0·R1 전체 캠페인 4시드씩(늦은 편 포함 구동기)에서 최종 상태·견적 미리보기·`contractRiskReport` 전부가 BASE와 바이트 동일합니다.

**5) 시험 수와 기타**
- 전체 vitest: 52개 파일, 1,427 통과 + TODO 1(총 1,428). 보고와 같습니다.
- 대상 두 파일: 63개(27 + 36). fx 시험은 BASE 34개에서 2개 늘었습니다.
- `validate_data`: 25 문서, 31,639 검사. MANIFEST: 728개.
- 변형 로그 가운데 수치형(1, 5, 14, 15, 16, 29) 출력을 읽었습니다. 모두 실제 단언 실패이고(예: 29는 3,576 대 3,577), 변형 4는 마감 불변식 실패입니다.

**미검증으로 남긴 것**
- 보고된 변형 32종(27b 포함) 재실행: 로그만 읽었습니다.
- 편 놓침 뒤 재예약 계약의 부대비: 손계산하지 않았습니다.

증거 파일은 `<사본>`에 있습니다(oracle.py, audit-dump.json, audit2.json, audit3.json, exp.txt, r1-*.json).

-- numbers#1 minor
@ src/engine/risk.ts:97 (tariffSchedule 반환의 `round: e.round`), 회차 번호는 risk.ts:65 추첨 순서
P: `tariffSchedule()`이 돌려주는 `round`는 공지 순서가 아니라 추첨 순서 번호입니다. 그래서 회차 2가 회차 1보다 먼저 공지되면, 같은 나라에 아직 공지되지 않은 변경이 하나 더 남아 있다는 사실이 이 칸으로 드러납니다(설계 2절 3 ‘미래 누설 금지’ 취지). 로그 문장에는 회차가 없어 지금은 읽기 함수 출력에만 있습니다. 지시서 1절이 출력 꼴에 `round`를 명시했으므로 Codex 결함이 아니라 설계 수준 문제입니다.
E: 시작 프로필 R2 `tariffEvents`, 시드 9: VN 회차 2 공지 1일(시행 2일), VN 회차 1 공지 62일(시행 63일). 1~61일의 `tariffSchedule`에는 `{countryCode:'VN', round:2,…}`만 보여 회차 1이 뒤에 온다는 것이 드러납니다. 시작 프로필은 세율이 100~2100에 머물러 걸음 0(확률 1/1001)일 때만 사건이 빠지므로 사실상 확정 정보입니다. 시드 1~200에서 이런 나라·시드는 68건(400건 중 17%)입니다. 예: 시드 10 CN(공지 81 대 31), 시드 10 VN(77 대 16), 시드 16 CN.
FIX: 허브 결정 사항입니다. (a) `tariffSchedule` 출력의 `round`를 공지 순서 번호(그 나라에서 공지된 순서 1, 2…)로 바꾸고, 내부 식별(시험의 E1·E2)은 별도 키로 둡니다. 또는 (b) 경로 11 지시서에 ‘`round`는 표시하지 않는다’를 명시하고 읽기 함수 주석에 누설 이유를 적습니다. 흐름 이름(H16-1)은 바꾸지 않아도 됩니다.

-- numbers#2 minor
@ docs/ai/tasks/results/TASK-0063.md:72, :76, :127 (크기 표 ‘작업 뒤 127,938 B, +1,011 B’)
P: 작업 뒤 크기를 변경이 있는(dirty) 작업 트리에서 빌드해 쟀습니다. 그래서 빌드 표시에 ‘+수정’(원본 7 B)이 붙었고, 깨끗한 BASE 측정과 조건이 다릅니다. 실제 코드 증가분은 +1,007 B입니다. 정지선 +2,500 B 판정에는 영향이 없습니다.
E: 깨끗한 클론 측정(`npm run build` 후 `node tools/check_bundle_size.mjs dist`): BASE ef7374f는 431,896 B / gzip 126,927 B로 보고와 같습니다. 270de2c는 435,004 B / gzip 127,934 B입니다. 같은 클론에서 추적 파일 하나에 줄 하나를 더해 dirty로 만들면 435,011 B / gzip 127,938 B로 보고값과 정확히 같습니다. 원인은 `vite.config.ts` buildId의 `+수정` 접미사입니다.
FIX: 보고서 크기 표를 깨끗한 트리 측정값(435,004 B / 127,934 B, +3,108 B / +1,007 B)으로 고치거나, 측정 조건(dirty 빌드 표시 포함)을 적습니다. 앞으로는 BASE와 같은 조건(깨끗한 트리)에서 잽니다.

-- numbers#3 minor
@ docs/ai/tasks/results/TASK-0063.md:106 (‘첫 적중은 시드 4, 1/11 = 9.09%’), 시험 src/engine/m2a5-risk-cost.test.ts:782
P: 보고 비율은 첫 적중 시드 하나의 비율이라 선택 편향이 있는 단일 표본입니다. 값 자체는 맞고 지시서도 ‘찾은 시드와 비율’을 적으라고 했습니다. 다만 앞선 시드 1~3의 0/34가 빠져 있고, 판정표 진단 T(비율)의 대표값처럼 읽힐 수 있습니다.
E: 같은 정책을 독립 구동기로 다시 돌린 결과입니다(공개일마다 `pnlKrw` 최대 정시 견적 하나, 첫 편). 시드 1~3은 0/11, 0/12, 0/11이고 시드 4는 1/11(CT003, −176,206)로 보고와 같습니다. 누적값: 시드 1~4는 1/45 = 2.2%, 1~12는 2/136 = 1.5%, 1~60은 35/682 = 5.1%입니다. 60시드 모두에서 정시 판정이 빠진 계약은 없었고, ‘세율 다름 ⇔ tariff≠0’ 불일치도 0건입니다.
FIX: 보고서에 ‘시드 1~3: 0/34, 1~4 누적 1/45’를 함께 적고, 9.09%는 진단 T의 추정값이 아니라 첫 적중 시드의 값임을 밝힙니다. 진단 T 값은 경로 5 실행기 측정으로 넘긴다는 문장을 유지합니다.

===== integrity
과정 무결성 관점의 검수 결과, 지시서 제약 위반이나 보고서의 거짓 주장은 없었습니다. 다만 지시서가 요구한 시험 1건이 사실상 아무것도 확인하지 못해(공허) 미래 누설 변형이 살아남고(major 1), 전제가 빠져 변형이 살아남는 시험이 1건(minor) 있습니다. 측정 표기의 경미한 오차도 1건(minor) 있습니다.

확인한 것(독립 클론 270de2c와 ef7374f에서 실행했고, 클론은 삭제함):

1) 변경 파일과 보호 경로
- 변경 파일은 7개(risk.ts, engine.ts, reports.ts, 새 m2a5-risk-cost.test.ts, m2a5-risk-fx.test.ts, results/TASK-0063.md, MANIFEST.json)로 모두 허용 목록 안입니다.
- m2a5-risk-fx.test.ts는 '손익 읽기' 한 시험의 it.each 매개변수화(편 0·1 × 주선)와 finished 인수 변경뿐입니다. 지운 단언이나 약해진 단언이 없고, 시험 수는 34개에서 36개가 됐습니다. '관세 호출 인수'는 손대지 않았습니다.
- 다음은 ef7374f 대비 diff가 비어 있고, 작업 트리도 깨끗합니다: data, schemas, src/content, src/ui, src/engine/sim, tests/golden, 골든 검사기 4종, review_checks.sh.

2) MANIFEST와 기본 검증
- build_package.py --manifest-only를 다시 돌려도 diff가 없습니다(728개).
- npm run typecheck 0, validate_data PASS(31,639건).

3) 번들 크기(직접 측정)
- BASE 126,927 B, 270de2c 127,934 B로 +1,007 B입니다. 자료 청크는 28,701 B로 변화 0입니다. 정지선 +2,500 B 이내입니다.

4) 시험 수
- npx vitest run: 52개 파일, 1,427개 통과와 TODO 1개로 보고서와 같습니다.
- 집중 실행 63/63(비용 27개, 환율 36개)도 같습니다.

5) R1 분개 덤프 절차
- <밖> SHA-256 c437fe…가 맞고, 저장소 밖에 있으며 공개 함수만 씁니다. 시드는 2001~2003입니다.
- 경로만 내 클론으로 바꿔 BASE와 270de2c에서 다시 만들었더니 둘 다 2ae8a57…입니다. Codex의 r1-cost-before/after와 바이트 단위로 같습니다.

6) R0/R1 차등 비교(추가 확인)
- 위 덤프보다 넓은 범위를 추가로 비교했습니다: R0/R1 × 시드 2001~2006, 전 캠페인, 늦은 편과 주선 포함.
- 5일마다 낸 contractRiskReport, quotePreview 전부, 원장 건수가 BASE와 270de2c에서 바이트 동일합니다.
- 따라서 골든 밖 경로에서도 rules-2와 R1의 동작 변화는 없습니다.

7) 보고서 표 재현
- 순수 함수 표(시드 1·2·4의 관세 사건과 부대비 bp), components 두 줄, 정시 노출(시드 4, 1/11)이 시험 출력과 정확히 같습니다.

8) 변형 시험
- Codex 스크립트의 33회(32종 + 13-fx)를 내 클론에서 다시 돌렸고 모두 검출됐습니다.
- 변형 4만 엔진 마감 불변식으로 잡힙니다(InvariantError). 보고서가 이 점을 정직하게 적어 두었습니다.
- Codex 스크립트의 변형 문자열은 지시서 정의와 맞습니다.
- 내가 추가한 변형 결과:
  - 아침 공지 로그 누락과 일부 누락, 도착 처리 knownThroughDay = s.day−1은 검출됩니다.
  - 아래 major·minor 둘은 살아남습니다.
  - 단일 통화 장부가 가산(engine.ts:1001)을 지워도 살아남지만, R2에서는 매입이 늘 KRW라 닿을 수 없는 분기여서 결함으로 보지 않습니다.

9) 기타 결론
- 보고서 필수 항목은 모두 들어 있습니다: BASE, 일정과 부대비 표, components, 노출 비율, 크기(코드와 자료 분리), 시험 수, R1 cmp와 sha256, 골든 미발동 사유, 변형 표, 범위 밖 발견, 질문.
- 구현의 H16-3 평가일 규칙(risk.ts:86)은 contractRiskReport(reports.ts:415)와 같은 식이라 코드는 맞습니다. 문제는 시험 쪽입니다.

-- integrity#1 major / confirmed→major/confirmed→major
@ src/engine/m2a5-risk-cost.test.ts:681-690 (시험), src/engine/risk.ts:86 (대상 코드), docs/ai/tasks/results/TASK-0063.md:124 (충족 주장)
P: 시험 'R2 변환·부대비 상한·공지된 관세 읽기' 줄이 요구하는 'tariffSchedule은 끝난 상태에서는 평가일 기준이다'(H16-3)가 사실상 확인되지 않습니다. 시험 이름은 '결정성·저장·커서 불변과 끝난 상태의 공지 평가일'이지만 캠페인 정상 종료 상태만 봅니다. 그 상태에서는 공지일 상한(campaignDays − lag_max) 때문에 모든 사건이 이미 공지돼 있어 K = 실패일, K = campaignDays, K = s.day를 가려내지 못합니다. 실패로 끝난 상태의 tariffSchedule은 어떤 시험도 보지 않습니다. 그래서 실패 뒤 공지를 드러내는 미래 누설 변형이 살아남는데, 보고서 완료 조건 대조는 이 줄을 '충족'으로 적었습니다.
E: 독립 클론 270de2c에서 다음 두 변형으로 비용 시험 파일 전체를 돌렸습니다.
(a) risk.ts:86을 `const day = s.phase === 'ENDED' ? config.campaignDays : s.day;`로 바꿈 → `Tests 27 passed (27)`.
(b) `const day = s.day;`로 바꿈 → `Tests 27 passed (27)`.
변형 (a)가 실제로 다른 출력을 내는지 탐침했습니다(R2, 시작 프로필, 1일 최대 수량 매입 뒤 무명령으로 실패 유도).
- 원본, 시드 8: {failDay:63, sDay:64, schedule:[]}
- 변형 (a), 시드 8: schedule [[CN,1,71],[CN,2,87]]. 실패일 63 뒤에 공지된 사건이 보입니다.
- 시드 9·10도 같은 꼴입니다(76일·77일·81일 공지 사건이 노출됨).
s.day가 failDay+1(64)이므로 변형 (b)도 64일에 공지된 사건이 있으면 하루치를 누설합니다.
FIX: 이미 실패 상태를 만드는 '실패 기록 약정' 시험(또는 새 시험)에서 다음을 순서대로 단언합니다.
1. 전제: tariffEvents 가운데 공지일 > fail.day인 사건이 있음을 먼저 단언합니다. 없으면 그런 시드를 찾는 조건에 넣습니다.
2. tariffSchedule(실패 상태)에 그 사건이 없음을 단언합니다.
3. 남은 각 사건의 rates가 오라클 oracleRates(cfg, seed, e, fail.day)와 같음을 단언합니다.
4. 가능하면 공지일 = fail.day+1(= s.day)인 사건도 빠짐을 단언합니다.
보고서 124행의 '충족' 근거도 함께 고칩니다.
V1: 반박하려 했으나 주장이 그대로 재현됐습니다. 독립 클론 270de2c에서 확인했고, 클론은 삭제했습니다.

1) 구현 자체는 맞습니다. risk.ts:86 `const day = s.phase === 'ENDED' ? s.operations?.failure?.day ?? config.campaignDays : s.day;`는 reports.ts:415 evaluationDay 규칙, 지시서 67행 'K: 끝난 상태는 실패일 또는 campaignDays'와 같습니다. 결함은 시험 쪽입니다.

2) 시험은 사실상 아무것도 가려내지 못합니다. m2a5-risk-cost.test.ts:681-690의 ended 상태를 탐침했습니다. 결과는 {seed:4, failure:null, day:91, k:90, maxNotice:53, lagMax:3}입니다. 정상 종료이고, 공지일 상한 campaignDays−lag_max(87) 때문에 모든 사건이 이미 공지된 상태입니다. 그래서 K가 실패일이든 90이든 91(s.day)이든 같은 목록이 나오고, rates도 견주지 않습니다. tariffSchedule을 실패 상태에서 부르는 시험은 없습니다. grep 결과 호출은 282·360·362·364·367·661·686·690행뿐이고, '실패 기록 약정'(720-750)은 tariffSchedule을 부르지 않습니다.

3) 두 변형 모두 전체 시험을 통과합니다. 비용 파일만이 아니라 vitest 전체(52파일)를 돌렸습니다.
- (a) `s.phase==='ENDED' ? config.campaignDays : s.day`로 바꿈 → 1427 passed | 1 todo.
- (b) `const day = s.day;`로 바꿈 → 1427 passed | 1 todo.

4) 두 변형은 같은 결과를 내는 무해한 변형이 아닙니다. 시작 프로필 R2에서 1일 최대 수량을 매입하고 무명령으로 실패를 유도했습니다. 시드 1~200이 모두 failDay 63, s.day 64로 끝났습니다.
- 원본, 시드 8: schedule [].
- 변형 (a), 시드 8: [[CN,1,71],[CN,2,87]].
- 변형 (a), 시드 9·10: 76·77·81일 공지 사건이 노출됩니다.
- 변형 (a)가 누설하는 시드는 200개 가운데 87개입니다.
- 변형 (b)를 실제 코드에 넣고 돌렸습니다. 시드 86에서 [CN,1,64], 시드 147에서 [VN,1,64]가 나옵니다. 실패일 뒤인 64일 공지 사건을 하루치 누설합니다.
수치는 발견 보고와 정확히 일치합니다.

5) 판정 근거: 지시서 157행 시험 행 'R2 변환·부대비 상한·공지된 관세 읽기'는 '끝난 상태에서는 평가일 기준이다'를 요구합니다. 그런데 이 절이 공허하고 미래 누설 변형이 살아남으므로 루브릭의 major입니다. 기존 rules-1/rules-2에는 영향이 없으므로 blocker는 아닙니다.

6) 보고서 쪽 단서: 결과 보고서 124행은 행 이름을 'R2 변환·부대비 상한'으로 줄였습니다. 끝난 상태 평가일 확인을 근거로 적지 않은 채 '충족'으로 표시했습니다. 명시적 허위라기보다 요구 일부를 말없이 뺀 충족 주장이지만, 발견이 말한 대로 그 행은 '충족'입니다. 지시서 변형표에는 이 변형이 없으므로 '변형 표 전체 충족'(128행)은 거짓이 아닙니다.
VFIX1: 시험을 고치거나 새 시험을 둡니다. 위치는 m2a5-risk-cost.test.ts의 '실패 기록 약정' 옆입니다. 내용은 다음과 같습니다.

1) 탐색과 전제 단언: 시작 프로필 R2, 시드 1~200에서 실패 상태 s를 찾습니다. 예: 1일 매입 뒤 무명령, 또는 failureCase와 같은 탐색. F = s.operations!.failure!.day로 두고 다음을 단언합니다.
- `s.phase==='ENDED'`, `F !== s.day`.
- tariffEvents(cfg, seed) 가운데 공지일 > F인 사건이 있음(재현상 시드 8이 처음입니다).
- 변형 (b)까지 잡으려면 공지일 === s.day인 사건이 있는 상태도 찾고, 찾았는지 단언합니다. 재현상 1일 최대 수량 구동에서 시드 86(CN 1회차)과 147(VN 1회차)이 해당하고, 둘 다 F=63, s.day=64입니다.

2) 목록 단언: `tariffSchedule(s,cfg).map(e=>[e.countryCode,e.round])`가 `oracleEvents(cfg,seed).filter(e=>e.noticeDay<=F)`의 식별자 목록과 같은지 봅니다. 순서는 공지일 → tariff.base 나라 순 → 회차입니다. 여기에 공지일 > F 사건이 하나도 없음을 단언합니다.

3) rates 단언: 각 사건의 rates가 `oracleRates(cfg, seed, e, F)`와 같은지 봅니다.

4) 끝난 상태 시험(681-690)의 이름이나 주석에는 '정상 종료에서는 K를 가려내지 못함'을 적습니다. 실패 상태 단언이 변형 (a)·(b)를 잡는다는 것은 변형표에 새 행으로 남깁니다. 예: '#32 tariffSchedule 끝난 상태 K를 campaignDays/s.day로 바꿈 → 실패 상태 평가일 시험'.

5) 결과 보고서 124행: 행 이름을 'R2 변환·부대비 상한·공지된 관세 읽기'로 되돌리고, 근거에 실패 상태 평가일 시험(전제 시드와 공지일 > F 사건)을 적습니다. 그 전에는 '충족'을 '부분'으로 고칩니다.
V2: 반박하려 했지만 주장은 적힌 그대로 맞습니다. 제 독립 클론(270de2c)에서 다시 확인했습니다.

(1) 지시서 157행의 'R2 변환·부대비 상한·공지된 관세 읽기' 줄은 "끝난 상태에서는 평가일 기준이다"를 요구합니다. 67행과 H16-3도 "끝난 상태에서 K = contractRiskReport의 평가일(실패일 또는 campaignDays)"라고 정합니다. 구현(risk.ts:86 `s.phase === 'ENDED' ? s.operations?.failure?.day ?? config.campaignDays : s.day`)은 reports.ts:415의 evaluationDay 식과 같으므로 코드 자체는 맞습니다. 결함은 시험 쪽에 있습니다.

(2) 이 조건을 보는 시험은 m2a5-risk-cost.test.ts:681-693 하나뿐입니다(690행). 시험에 임시 로그를 넣어 690행이 보는 `ended` 상태를 찍었습니다. 결과는 {seed:4, outcome:'COMPLETED', failure:null, day:91, k:90, 공지일 상한 87, 사건 CN@53, VN@19}였습니다. 정상 종료라 k=90이고, 공지일은 늘 campaignDays−lag_max=87 이하이므로 `filter(noticeDay <= k)`는 아무것도 거르지 않습니다. 게다가 690행은 [국가, 회차]만 비교하고 rates는 보지 않습니다. 다른 tariffSchedule 호출(282·360·362·364·367·661·686행)도 모두 진행 중 상태나 R1 상태를 봅니다. 282행은 `state.day === noticeDay`일 때만 단언하고, 역전 시험은 `s.phase === 'ENDED'`인 후보를 건너뜁니다. engine.ts:157의 openDay 로그는 ENDED 상태에서 돌지 않습니다. 그래서 실패로 끝난 상태의 tariffSchedule을 보는 시험이 없습니다.

(3) 변형 실행 결과입니다. (a) 86행을 `s.phase === 'ENDED' ? config.campaignDays : s.day`로, (b) `s.day`로 바꾸고 m2a5-risk-cost와 m2a5-risk-fx 두 파일을 돌렸습니다. 두 변형 모두 `Test Files 2 passed, Tests 63 passed (63)`로 통과했습니다. 원본 기준선도 27/27입니다. git grep으로 보면 tariffSchedule을 부르는 곳은 engine.ts와 이 시험 파일뿐이라, 다른 시험 파일도 이 변형을 잡지 못합니다.

(4) 변형 (a)가 실제로 누설하는지 탐침했습니다. 조건은 R2·시작 프로필, 1일 최대 수량 매입, 그 뒤 무명령입니다.
- 원본: 시드 8은 {failDay 63, s.day 64, evaluationDay 63, schedule []}입니다.
- 변형 (a): 시드 8의 schedule이 [[CN,1,71],[CN,2,87]]이 됩니다. 시드 9는 CN@76, 시드 10은 VN@77·CN@81, 시드 11은 VN@70, 시드 12는 VN@80·CN@86이 실패일 63 뒤인데도 보입니다. 평가일 뒤 사건이 드러나는 미래 누설입니다(H14-5).
- 변형 (b): s.day = 64입니다. 시드 1~30에는 64일 공지 사건이 없지만 시드 86(CN 1회, 공지 64)과 시드 147(VN 1회, 공지 64)에서 같은 구동기가 63일에 실패하므로 하루치를 누설합니다. 원본은 이 사건을 뺍니다.

(5) 보고서 124행은 지시서 줄 이름에서 '공지된 관세 읽기'를 빼고 "R2 변환·부대비 상한 | 충족"이라고만 적었습니다. 근거에도 tariffSchedule 끝난 상태 이야기가 없습니다. 126행 '결정성·저장·흐름 | 충족'도 마찬가지입니다. 명시적으로 거짓을 쓴 것은 아니지만, 지시서 줄 전체를 충족했다는 주장으로는 근거가 없습니다.

심각도: 코드는 맞고, 이 분기는 측정 경로가 아닌 화면 읽기에만 닿습니다. 그래도 지시서가 명시한 필수 단언이 사실상 비어 있고 미래 누설 변형 둘이 살아남습니다. 기준표의 'required test vacuous so a mutation survives'에 해당하므로 major가 맞습니다.

제안된 수정의 한계: '실패 기록 약정'이 찾는 상태(지시서 기록상 시드 4)에는 실패일 뒤 공지 사건이 없습니다. 그 시험에 끼워 넣으면 ① 전제가 서지 않으므로 별도 시험이 낫습니다.
VFIX2: 1) m2a5-risk-cost.test.ts에 새 시험 '끝난 상태 tariffSchedule = 평가일 기준(실패 종료)'을 더합니다. 기존 '실패 기록 약정'의 구동기와 같은 꼴(R2 시작 프로필, 1일에 openTradePairs 첫 쌍을 최대 수량으로 매입, 이후 무명령 commitDay(openDay))을 시드 1부터 돌립니다. 다음을 모두 만족하는 첫 시드를 찾고, 찾았음을 단언합니다.
  (i) s.phase === 'ENDED'이고 fail = s.operations.failure !== null
  (ii) oracleEvents(cfg, seed) 가운데 noticeDay > fail.day인 사건이 있음 (첫 적중은 시드 8: CN 1회 71일, 2회 87일)
그 상태에서 다음을 단언합니다.
  - contractRiskReport(s, cfg, c.id).evaluationDay === fail.day, 그리고 fail.day !== s.day
  - tariffSchedule(s, cfg)의 (countryCode, round) 목록 === oracleEvents(...).filter(e => e.noticeDay <= fail.day)를 공지일·나라 순·회차 순으로 정렬한 목록 (sort() 없이 순서까지)
  - noticeDay > fail.day인 사건이 schedule에 없음
  - 남은 각 사건의 rates === oracleRates(cfg, seed, e, fail.day)
2) 같은 시험에서 두 번째 탐색으로 noticeDay === fail.day + 1 (= s.day)인 사건이 있는 실패 시드를 찾아(시드 86: CN 1회 공지 64, 실패일 63) 그 사건이 schedule에 없음을 단언합니다. 이 단언이 변형 (b) `day = s.day`를 잡습니다.
3) 690행의 정상 종료 단언은 유지하되 rates도 oracleRates(cfg, seed, e, cfg.campaignDays)와 비교합니다.
4) 결과 보고서 변형 표에 'tariffSchedule ENDED 기준일을 campaignDays로'(a)와 's.day로'(b) 두 행을 더하고 잡는 시험을 적습니다. 124행은 지시서 줄 이름 'R2 변환·부대비 상한·공지된 관세 읽기' 그대로 쓰고, 근거에 '공지일 전날/당일, 같은 날 로그, 실패 종료 상태의 평가일 기준(시드 8·86)'을 적습니다. 그 전까지 '충족'은 '부분 충족(끝난 상태 단언 공허)'으로 고칩니다.

-- integrity#2 minor
@ src/engine/m2a5-risk-cost.test.ts:614-618 (부대비 미지급 항등식), 610-613 (관세 미지급 (나)), src/engine/reports.ts:492
P: 지시서 3절의 4단계 날짜 규칙('미지급이면 갚은 날, 평가일까지 갚지 않았으면 평가일')을 가리는 전제가 없습니다. 부대비 미지급 계약을 출항일+1에 평가하는데, 그날 환율이 출항일과 같은 주라 줄 날짜를 분개일(e.day)로 바꾼 변형이 살아남습니다.
같은 시험의 관세 미지급 (나) 사례도 TASK-0062 '열린 계약' (나) 구성법이 요구하는 전제를 단언하지 않습니다(평가일 환율 ≠ 수락일 환율, ≠ baseKrwPerUsd). 시드 4에서 우연히 성립할 뿐입니다(평가일 8의 1293, 수락일 1의 1300). 이 사례는 tariff = 0이라 3단계를 건드리지도 않습니다.
E: 변형 `flow(-amount, e.day, true, e.currency)`(reports.ts:492)으로 비용 시험 파일 전체를 돌리면 `Tests 27 passed (27)`입니다.
같은 구성(시드 4, 둘째 편, 출항 전날 USD 현금을 주입 의무로 비움)을 미지급인 채로 15일까지 진행해 탐침했습니다: {day:15, dep:9, unpaid:true, rDay:1306, rDep:1293}.
- 원본: identity 통과.
- 변형: `AssertionError: expected -512628 to be -511995`로 실패.
즉 도달 가능한 상태에서 실제로 다른 결과를 내는 변형입니다.
(나) 탐침 값: {accepted:1, arrival:7, evalDay:8, rAcc:1300, rEval:1293, tariff:0}.
FIX: 부대비 미지급 사례는 미지급을 유지한 채 출항일과 환율 주가 다른 날까지 진행합니다. `rateAt(평가일) !== rateAt(출항일)`과 의무 미지급을 먼저 단언한 뒤 identity를 부릅니다.
관세 미지급 (나) 사례에는 TASK-0062 (나)의 전제 단언 세 가지를 넣습니다.

-- integrity#3 minor
@ docs/ai/tasks/results/TASK-0063.md:72-76, 127
P: 보고서의 '작업 뒤' 크기(127,938 B, +1,011 B, 원본 435,011 B)는 커밋되지 않은 작업 트리에서 잰 값입니다. vite.config.ts의 __BUILD_ID__에 '+수정' 접미사(원본 7 B)가 붙은 상태입니다. 커밋 270de2c를 깨끗한 트리에서 빌드하면 127,934 B(+1,007 B), 원본 435,004 B입니다. 판정(정지선 +2,500 B 이내)에는 영향이 없습니다.
E: 내 클론 270de2c에서 npm run build 후 check_bundle_size를 돌렸습니다. 깨끗한 트리라 build id는 '270de2c'입니다.
- '첫 화면 JS·CSS 3개: 435,004 B …, gzip 127,934 B'
- ef7374f: '431,896 B …, gzip 126,927 B'. 보고서 BASE 값과 일치합니다.
Codex의 <밖> 435,011 B, 127,938 B입니다. 원본 차이 7 B는 '+수정'의 UTF-8 길이(1+3+3)와 같습니다.
FIX: 크기 표에 '작업 트리(+수정 빌드 표시 포함) 측정'임을 적거나, 커밋 뒤 깨끗한 트리 값 +1,007 B로 바꿉니다. 이후 지시서의 측정 절차에 '깨끗한 트리 또는 build id 길이 차이 무시'를 명시하면 됩니다.

```
