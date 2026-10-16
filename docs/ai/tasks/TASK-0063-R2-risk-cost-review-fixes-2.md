# TASK-0063-R2 직접 무역 위험 ② 검수 고침 2 (읽기 함수의 회차 번호·관세 0 도착의 날짜)

- **지위: 승인(허브, 2026-10-16). 실행할 수 있다.**
- codex_model: `gpt-6-astra`
- reasoning_effort: `high`
- 선행: TASK-0063-R1 결과 스냅숏 `4cba6ae`(브랜치 `codex/TASK-0063`). 이 지시서는 그 브랜치에 커밋되어 있고, 작업 트리도 그 브랜치다.
- **`BASE`는 작업 트리를 만든 커밋(이 지시서를 담은 커밋)이다.** 작업 시작 때 `git rev-parse HEAD`를 결과 보고에 적고 그 값을 BASE로 쓴다.
- 먼저 읽는다: TASK-0063(개정 3f)·TASK-0063-R1 지시서와 결과 보고(`results/TASK-0063.md`), 설계 DESIGN.md 3.4·4.1(개정 3i), 허브 결정 H16-3 보충·H16-5.
- 근거: 세션 A 설계자 검수(R1-1 동의, 두 가지 보완)와 허브 결정. 둘 다 작다. R1 결과 보고가 적은 ‘호출 수 문구 충돌’은 허브의 R1-1 문구 오류다(`contractRiskReport` 안의 0단계 `preview`가 `dutyFor`를 한 번 부르므로, ‘0회·1회’는 그 미리보기 호출을 뺀 수였다). Codex가 0062 계약(도착 뒤 전체 1회, 운송 중 2회)대로 단언한 것이 맞고 바꾸지 않는다. TASK-0063·R1의 원칙·지켜야 할 것·손대지 않을 파일이 그대로 적용된다. 기존 단언은 지우거나 약하게 하지 않는다.

## R2-1. `tariffSchedule` 출력의 회차 번호를 공지 순서 번호로

- **문제.** 출력의 `round`는 추첨 순서 번호다. 회차 2가 먼저 공지되거나 무의미로 빠진 회차가 있으면 번호의 틈으로 아직 공지되지 않은 사건의 존재가 드러난다. 읽기 함수는 화면만이 아니라 경로 5 정책·실행기의 입력이므로 설계 2절 3(평가일까지 알려진 것만)의 원칙이 읽기 함수에 걸린다.
- **고침(`risk.ts`).** `tariffSchedule`의 각 사건에서 `round`를 빼고 `seq`를 낸다. `seq`는 같은 나라 안에서 기준일 K까지 공지된(남은) 사건을 출력 순서(공지일, 동점은 회차)로 센 번호다(1부터). 꼴: `{ countryCode, seq, noticeDay, effectiveDay, rates, labelKo }`. 내부 정렬·`fromBp`·`toBp`·`labelKo`·로그는 그대로다. `tariffEvents`의 `round`와 흐름 이름은 그대로다.
- **시험.** `tariffSchedule`을 쓰는 시험에서 사건 식별을 (`countryCode`, `noticeDay`, `effectiveDay`)나 `tariffEvents`의 (`countryCode`, `round`) → 그 사건의 공지일·시행일로 바꾼다. 출력에 `round` 키가 없고 `seq`가 1부터 공지 순서대로임을 단언한다(순서 대조 시험 R1-5에 더한다). 무의미로 빠진 회차가 있는 시드(‘무의미 사건 없음’의 대조 사본 등)에서 `seq`에 틈이 없음을 단언한다.

## R2-2. 관세 0으로 도착한 계약의 2단계 관세 줄 날짜

- **문제.** R1-1 뒤에도 `fxFlows[2].day`는 `paidDay(dutyEntry?.id, dutyEntry?.day ?? evaluationDay)`라, 관세 0으로 도착해 분개가 없으면 평가일이 된다. 2단계에서는 그 줄 금액이 아직 기대 관세(`p.duty > 0`)이므로, 수락일 환율과 평가일 환율의 차이가 3단계가 아니라 `fx`에 들어간다. `residual`은 0이라 항등식으로는 잡히지 않는다.
- **고침(`reports.ts`).** 2단계 관세 줄 날짜: 분개가 있으면 그 지급일(지금 `paidDay`), 없고 도착했으면(`shipment.dutyMinor !== null`) `shipment.arrivalDay`, 도착 전이면 평가일(지금 그대로). 취소 계약은 지금 그대로(수락일).
- **시험(‘관세 0 도착’ 확장).** R1-1의 사례에서 **전제를 먼저 단언한다**: 도착일 참고 환율 ≠ 평가일 참고 환율(평가일을 다음 환율 주로 둔다. 찾았는지 단언). 단언: `components.fx`가 시험 안 환산 꼴로 계산한 값(관세 줄을 도착일 환율로 둔 값)과 같고, `components.tariff === toKrw(−Fr_a, r_a) − toKrw(−(Fr_a + D옛), r_a)`(r_a = 도착일 참고 환율, Fr_a = 첫 `FREIGHT-PREPAY-` 날 환율이 r_a와 같으면 그 운임, 아니면 0), `residual === 0`. 양성 대조: 날짜를 평가일로 두는 변형에서는 `fx`·`tariff`가 달라진다.

## 변형 시험

| # | 변형 | 잡아야 할 시험 |
|---|---|---|
| S1 | `tariffSchedule`이 `seq` 대신 추첨 `round`를 냄 | 순서 대조(`seq` 1..n 연속, 틈 없음) |
| S2 | `seq`를 추첨 순서로 매김 | 순서 대조(공지 순서와 다른 시드) |
| S3 | 관세 0 도착의 2단계 관세 줄 날짜를 평가일로 | 관세 0 도착(`fx`·`tariff` 식) |

## 고칠 수 있는 파일

- `src/engine/risk.ts`(R2-1만), `src/engine/reports.ts`(R2-2만), `src/engine/m2a5-risk-cost.test.ts`, `docs/ai/tasks/results/TASK-0063.md`, `MANIFEST.json`.
- `src/engine/m2a5-risk-fx.test.ts`·`engine.ts`·`types.ts`는 고치지 않는다(`tariffSchedule` 반환 꼴은 `risk.ts` 안의 추론 타입이다. `types.ts`에 선언이 있으면 멈추고 보고한다).

## 지켜야 할 것·완료 조건·결과 보고

- TASK-0063·R1과 같다(골든 0, R1 분개 덤프 `cmp` 0, `review_checks.sh --check BASE` 16종 실패 0, 첫 화면 코드 증가 깨끗한 트리 측정). 변형 S1~S3가 모두 잡힌다. `results/TASK-0063.md`를 갱신한다(별도 보고서 없음).
