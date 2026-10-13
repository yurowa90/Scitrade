# D03 엔진 재측정 (base)

시드 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1034, 1035, 1036, 1037, 1038, 1039, 1040 · 실행 2340회. 금액은 USD 정수 표시, 원화는 별도다.
같은 시드의 USD 순자산 차이 중앙값 (이득 시드 수)이다. 두 정책 중앙값끼리 뺀 값은 아니다. 이득은 순자산 증가·실패 없음·끝 원화 미지급 0이다.
①은 보통·고용·투자 없음 대비, ②는 같은 수락의 투자 없음 대비, ③·④는 같은 수락·투자의 고용 없음 대비다. 조사 선행은 같은 고용·투자의 조사 선행 없는 실행 대비다.
S=1일 선복, E=7일 확장, SE=둘 다, SE22=22일 둘 다. ↑는 중앙 ≥ +300 USD·이득 ≥ 0.75N·실패 ≤ floor(0.05N), ↓는 중앙 ≤ −300 USD·이득 ≤ 0.25N이다. N<10이면 화살표를 쓰지 않는다.

## SCENARIO_M2_OPERATIONS

## ① 기준 표

| 정책 | 기준 대비 USD | USD 순자산 중앙 | 실패 | 끝 KRW 현금 중앙 | 끝 KRW 미지급 중앙 |
|---|---:|---:|---:|---:|---:|
| IDLE | -17,941 (0) ↓ | 3,000 | 20/20 | 60,000 | 2,770,000 |
| NO_FX | -59 (0) | 20,686 | 20/20 | 60,000 | 2,770,000 |
| MAX_CONTRIBUTION | +0 (0) | 20,941 | 0/20 | 41,500 | 0 |
| LATE_OK | -2,841 (1) ↓ | 18,062 | 0/20 | 41,500 | 0 |
| MAX_CONTRIBUTION~fx:react | +0 (4) | 20,759 | 0/20 | 41,500 | 0 |

## ② 투자만

| 정책 | 투자 없음 대비 USD |
|---|---:|
| LATE_OK~inv:E | -3,804 (0) ↓ |
| LATE_OK~inv:S | -552 (8) |
| LATE_OK~inv:SE | -4,536 (1) ↓ |
| LATE_OK~inv:SE22 | -2,164 (2) ↓ |
| MAX_CONTRIBUTION~inv:E | -1,139 (2) ↓ |
| MAX_CONTRIBUTION~inv:S | -1,644 (2) ↓ |
| MAX_CONTRIBUTION~inv:SE | -2,116 (1) ↓ |
| MAX_CONTRIBUTION~inv:SE22 | -1,720 (1) ↓ |

## ③ 고용 표(보통)

| 고용 | none | S | E | SE | SE22 |
|---|---:|---:|---:|---:|---:|
| 2pt 8일 | -4,240 (2) ↓ | -3,101 (3) ↓ | -486 (6) | +1,926 (14) | +984 (12) |
| 2pt 29일 | -1,943 (2) ↓ | -901 (4) ↓ | +165 (11) | +1,232 (14) | +1,296 (17) ↑ |
| 2pt 30일 | -2,120 (2) ↓ | -611 (6) | -558 (8) | +2,063 (15) ↑ | +1,815 (19) ↑ |
| 2pt 31일 | -1,667 (3) ↓ | -91 (8) | -381 (10) | +1,595 (15) ↑ | +1,215 (16) ↑ |
| 2pt 50일 | -1,573 (2) ↓ | -772 (6) | -1,206 (6) | +316 (12) | +815 (13) |
| 3pt 8일 | -5,862 (0) ↓ | -7,981 (0) ↓ | -4,603 (3) ↓ | +1,293 (14) | -3,613 (3) ↓ |
| 3pt 29일 | -3,489 (0) ↓ | -2,469 (2) ↓ | -2,688 (3) ↓ | +176 (11) | +1,237 (14) |
| 3pt 30일 | -3,044 (1) ↓ | -1,390 (1) ↓ | -3,052 (4) ↓ | -108 (10) | +523 (11) |
| 3pt 31일 | -3,031 (0) ↓ | -2,305 (4) ↓ | -2,226 (5) ↓ | +1,684 (14) | +1,510 (13) |
| 3pt 50일 | -2,472 (1) ↓ | -1,870 (0) ↓ | -1,194 (5) ↓ | +806 (15) ↑ | +600 (13) |

## ④ 고용 표(적극)

| 고용 | none | S | E | SE | SE22 |
|---|---:|---:|---:|---:|---:|
| 2pt 8일 | -4,359 (0) ↓ | -4,207 (2) ↓ | -1,101 (6) | +4,163 (18) ↑ | +1,465 (15) ↑ |
| 2pt 29일 | -2,496 (1) ↓ | -2,289 (3) ↓ | -1,943 (1) ↓ | +348 (11) | +479 (12) |
| 2pt 30일 | -1,901 (3) ↓ | -1,099 (7) | -795 (8) | +1,077 (14) | +1,620 (19) ↑ |
| 2pt 31일 | -2,810 (2) ↓ | -1,315 (5) ↓ | -1,359 (5) ↓ | +1,187 (13) | +1,588 (15) ↑ |
| 2pt 50일 | -1,925 (3) ↓ | -1,939 (2) ↓ | -1,947 (2) ↓ | -924 (7) | -586 (6) |
| 3pt 8일 | -6,067 (0) ↓ | -6,126 (0) ↓ | -1,931 (5) ↓ | +4,881 (19) ↑ | +1,416 (12) |
| 3pt 29일 | -4,379 (0) ↓ | -3,702 (0) ↓ | -2,340 (2) ↓ | -235 (8) | +1,877 (14) |
| 3pt 30일 | -3,217 (0) ↓ | -2,044 (1) ↓ | -708 (9) | +2,346 (15) ↑ | +1,710 (14) |
| 3pt 31일 | -3,496 (1) ↓ | -2,359 (5) ↓ | -1,524 (7) | +2,096 (16) ↑ | +1,898 (15) ↑ |
| 3pt 50일 | -2,130 (1) ↓ | -2,366 (2) ↓ | -1,840 (4) ↓ | -355 (8) | -367 (9) |

## ⑤ J1~J7 판정과 근거 수

J4는 개연성 점검이다(묶음 견적 수·준비 pt·환전 없이 실패·기준 순자산 범위).

| 판정 | 결과 | 근거 |
|---|---|---|
| J1 | 통과 | 기준 20시드, 실패 0, 끝 원화 미지급 0 |
| J2 | 통과 | MAX_CONTRIBUTION: 24칸 ↑2 ↓13; LATE_OK: 24칸 ↑3 ↓14 |
| J2b | 실패 | 8/9칸, 인접 29·31일 부호·반대 판정 확인 |
| J3 | 통과 | 후보 113정책, 가장 강한 MAX_CONTRIBUTION~inv:SE~hire:2pt@8: 5/20시드 (1위와 300 USD 안) |
| J4 | 통과 | 기준 20시드, 최대 묶음 10견적, 준비 2~12pt; NO_FX 실패 20/20; USD 중앙 20,941; 상한 21,200까지 여유 1.2% |
| J5 | 통과 | 두 명 고용 이득 0/20시드 |
| J6 | 통과 | 54/62칸 (87.1%), 1240시드 관측; MAX_CONTRIBUTION 27/29칸; LATE_OK 27/33칸 |
| J7 | 통과 | 20시드, 직접 무역 27.63%, 작업 포함 70.06%, 일반 2.46% (각 시드 비중의 중앙) |

### J6 칸별 병목 예측

| 정책 | 추가 업무/주 중앙 | 예측 | 실측 | 일치 | 예측 시드 수 | 처리 증가 실측 | 실현률 | 불일치: 이용률 높은 시드 | 불일치: 창고 대기 업무-일 중앙 |
|---|---:|---|---|---|---:|---:|---|---:|---:|
| LATE_OK~hire:2pt@29 | 0 | ↓ | ↓ | 일치 | 20 | -1 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:2pt@30 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:2pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:2pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:2pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:3pt@29 | 0 | ↓ | ↓ | 일치 | 20 | -1 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:3pt@30 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:3pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:3pt@50 | 0 | ↓ | ↓ | 일치 | 20 | -0.5 | — (미고용 제외 0) | — | — |
| LATE_OK~hire:3pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:E~hire:2pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:E~hire:2pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 2 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:E~hire:2pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:E~hire:3pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:E~hire:3pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:E~hire:3pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 2.5 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:SE22~hire:2pt@30 | 1 | ↑ | ↑ | 일치 | 20 | 4 | 0.459 (미고용 제외 0) | — | — |
| LATE_OK~inv:SE22~hire:2pt@31 | 1 | ↑ | ↑ | 일치 | 20 | 3.5 | 0.408 (미고용 제외 0) | — | — |
| LATE_OK~inv:SE22~hire:2pt@8 | 0 | ↓ | ↑ | 불일치 | 20 | 4 | — (미고용 제외 0) | 0 | 0 |
| LATE_OK~inv:SE22~hire:3pt@31 | 2 | ↑ | ↑ | 일치 | 20 | 2.5 | 0.146 (미고용 제외 0) | — | — |
| LATE_OK~inv:SE~hire:2pt@8 | 1 | ↑ | ↑ | 일치 | 20 | 5 | 0.422 (미고용 제외 0) | — | — |
| LATE_OK~inv:SE~hire:3pt@30 | 2 | ↑ | ↑ | 일치 | 20 | 3 | 0.172 (미고용 제외 0) | — | — |
| LATE_OK~inv:SE~hire:3pt@31 | 1 | ↑ | ↑ | 일치 | 20 | 4.5 | 0.525 (미고용 제외 0) | — | — |
| LATE_OK~inv:SE~hire:3pt@8 | 2 | ↑ | ↑ | 일치 | 20 | 5.5 | 0.232 (미고용 제외 0) | — | — |
| LATE_OK~inv:S~hire:2pt@29 | 1 | ↑ | ↓ | 불일치 | 20 | 0 | 0.000 (미고용 제외 0) | 10 | 0 |
| LATE_OK~inv:S~hire:2pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 1.5 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:S~hire:2pt@50 | 0 | ↓ | ↓ | 일치 | 20 | -1 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:S~hire:2pt@8 | 1 | ↑ | ↓ | 불일치 | 20 | -0.5 | -0.042 (미고용 제외 0) | 4 | 0 |
| LATE_OK~inv:S~hire:3pt@29 | 1 | ↑ | ↓ | 불일치 | 20 | 0 | 0.000 (미고용 제외 0) | 9 | 20.5 |
| LATE_OK~inv:S~hire:3pt@30 | 1 | ↑ | ↓ | 불일치 | 20 | 0 | 0.000 (미고용 제외 0) | 3 | 18 |
| LATE_OK~inv:S~hire:3pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:S~hire:3pt@50 | 0 | ↓ | ↓ | 일치 | 20 | -0.5 | — (미고용 제외 0) | — | — |
| LATE_OK~inv:S~hire:3pt@8 | 1 | ↑ | ↓ | 불일치 | 20 | -1 | -0.084 (미고용 제외 0) | 1 | 21 |
| MAX_CONTRIBUTION~hire:2pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:2pt@30 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:2pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 2 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:2pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:2pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 2 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:3pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:3pt@30 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:3pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 2 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:3pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~hire:3pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 1.5 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:E~hire:3pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:E~hire:3pt@30 | 0 | ↓ | ↓ | 일치 | 20 | 0.5 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:E~hire:3pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 2.5 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:E~hire:3pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:E~hire:3pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 2.5 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@29 | 1 | ↑ | ↑ | 일치 | 20 | 5 | 0.565 (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@30 | 1 | ↑ | ↑ | 일치 | 20 | 6 | 0.689 (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@31 | 1 | ↑ | ↑ | 일치 | 20 | 5 | 0.583 (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@8 | 0 | ↓ | ↓ | 일치 | 20 | 4 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@30 | 1 | ↑ | ↑ | 일치 | 20 | 5 | 0.574 (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@31 | 1 | ↑ | ↑ | 일치 | 20 | 5.5 | 0.642 (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@50 | 1 | ↑ | ↑ | 일치 | 20 | 4 | 0.683 (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:S~hire:2pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 2.5 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:S~hire:2pt@8 | 1 | ↑ | ↓ | 불일치 | 20 | 2 | 0.169 (미고용 제외 0) | 3 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:3pt@29 | 0 | ↓ | ↓ | 일치 | 20 | 1 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:S~hire:3pt@30 | 0 | ↓ | ↓ | 일치 | 20 | 3 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:S~hire:3pt@31 | 0 | ↓ | ↓ | 일치 | 20 | 3 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:S~hire:3pt@50 | 0 | ↓ | ↓ | 일치 | 20 | 0 | — (미고용 제외 0) | — | — |
| MAX_CONTRIBUTION~inv:S~hire:3pt@8 | 1 | ↑ | ↓ | 불일치 | 20 | -1 | -0.084 (미고용 제외 0) | 0 | 21 |

처리 증가 실측은 같은 시드·수락·투자의 고용 없는 실행 대비 수락 HANDLING 건수 차이 중앙값이다(취소 제외). 실현률은 각 시드의 차이를 이 칸의 예측 추가 업무/주 × (캠페인 일수 − 실제 고용일 + 1) / 7로 나눈 뒤 중앙값을 낸다. 미고용 시드는 실현률에서 제외하며 예측 0은 —다.

보관 예측은 정상 상태의 리틀의 법칙 추정이다. 도착 집중·높은 이용률의 대기는 놓칠 수 있다. 이용률 높은 시드는 실제 고용일 이후 마감의 절반 이상에서 보관 또는 처리 이용률이 90% 이상인 경우다.

## ⑥ 시드별 1위 정책 분포와 가장 강한 정책

| 1위 정책 (동점은 정책 이름 순) | 시드 수 |
|---|---:|
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@29 | 1 |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@30 | 2 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@29 | 1 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@30 | 1 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@31 | 4 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@8 | 4 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@29 | 1 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@30 | 1 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@31 | 3 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@8 | 2 |

가장 강한 정책: MAX_CONTRIBUTION~inv:SE~hire:2pt@8 (5/20시드에서 1위와 300 USD 안). 실패 실행도 순자산 그대로 포함한다.

## ⑦ 사업별 기여이익 비중

| 사업 | USD 기여이익 중앙 | 시드별 비중 중앙 |
|---|---:|---:|
| 직접 무역 | 6,207 | 27.63% |
| 작업 포함 주선 | 15,960 | 70.06% |
| 일반 주선 | 560 | 2.46% |

## ⑧ 계획 고용일과 실제 고용일이 다른 실행 수

| 정책 | 고용일이 다른 실행 / 전체 실행 | 실제 고용일 (null=미고용) | 예측 불일치 계약 합계 |
|---|---:|---|---:|
| IDLE | 0/20 | — | 0 |
| LATE_OK | 0/20 | — | 0 |
| LATE_OK~hire:2pt@29 | 0/20 | 29 | 0 |
| LATE_OK~hire:2pt@30 | 0/20 | 30 | 0 |
| LATE_OK~hire:2pt@31 | 0/20 | 31 | 0 |
| LATE_OK~hire:2pt@50 | 0/20 | 50 | 0 |
| LATE_OK~hire:2pt@8 | 0/20 | 8 | 0 |
| LATE_OK~hire:3pt@29 | 0/20 | 29 | 0 |
| LATE_OK~hire:3pt@30 | 0/20 | 30 | 0 |
| LATE_OK~hire:3pt@31 | 0/20 | 31 | 0 |
| LATE_OK~hire:3pt@50 | 0/20 | 50 | 0 |
| LATE_OK~hire:3pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:E | 0/20 | — | 0 |
| LATE_OK~inv:E~hire:2pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:E~hire:2pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:E~hire:2pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:E~hire:2pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:E~hire:2pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:E~hire:3pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:E~hire:3pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:E~hire:3pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:E~hire:3pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:E~hire:3pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:S | 0/20 | — | 0 |
| LATE_OK~inv:SE | 0/20 | — | 0 |
| LATE_OK~inv:SE22 | 0/20 | — | 0 |
| LATE_OK~inv:SE22~hire:2pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:SE22~hire:2pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:SE22~hire:2pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:SE22~hire:2pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:SE22~hire:2pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:SE22~hire:3pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:SE22~hire:3pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:SE22~hire:3pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:SE22~hire:3pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:SE22~hire:3pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:SE~hire:2pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:SE~hire:2pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:SE~hire:2pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:SE~hire:2pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:SE~hire:2pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:SE~hire:3pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:SE~hire:3pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:SE~hire:3pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:SE~hire:3pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:SE~hire:3pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:S~hire:2pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:S~hire:2pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:S~hire:2pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:S~hire:2pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:S~hire:2pt@8 | 0/20 | 8 | 0 |
| LATE_OK~inv:S~hire:3pt@29 | 0/20 | 29 | 0 |
| LATE_OK~inv:S~hire:3pt@30 | 0/20 | 30 | 0 |
| LATE_OK~inv:S~hire:3pt@31 | 0/20 | 31 | 0 |
| LATE_OK~inv:S~hire:3pt@50 | 0/20 | 50 | 0 |
| LATE_OK~inv:S~hire:3pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION | 0/20 | — | 0 |
| MAX_CONTRIBUTION~fx:react | 0/20 | — | 0 |
| MAX_CONTRIBUTION~hire:2pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~hire:2pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~hire:2pt@30~scout:early | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~hire:2pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~hire:2pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~hire:2pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~hire:3pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~hire:3pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~hire:3pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~hire:3pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~hire:3pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:E | 0/20 | — | 0 |
| MAX_CONTRIBUTION~inv:E~hire:2pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:2pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:2pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:2pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:2pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:3pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:3pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:3pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:3pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:E~hire:3pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:S | 0/20 | — | 0 |
| MAX_CONTRIBUTION~inv:SE | 0/20 | — | 0 |
| MAX_CONTRIBUTION~inv:SE22 | 0/20 | — | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:2pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:SE22~hire:3pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@22+3pt@36 | 0/20 | 22+36 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@30~scout:early | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@30~scout:early | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:2pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:2pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:2pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:2pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:2pt@8 | 0/20 | 8 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:3pt@29 | 0/20 | 29 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:3pt@30 | 0/20 | 30 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:3pt@31 | 0/20 | 31 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:3pt@50 | 0/20 | 50 | 0 |
| MAX_CONTRIBUTION~inv:S~hire:3pt@8 | 0/20 | 8 | 0 |
| NO_FX | 0/20 | — | 0 |

### 진단·조사 선행 비교

| 정책 | 대응 기준 대비 USD |
|---|---:|
| MAX_CONTRIBUTION~hire:2pt@30~scout:early | +0 (0) |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@22+3pt@36 | -11,743 (0) ↓ |
| MAX_CONTRIBUTION~inv:SE~hire:2pt@30~scout:early | +0 (0) |
| MAX_CONTRIBUTION~inv:SE~hire:3pt@30~scout:early | +0 (0) |
