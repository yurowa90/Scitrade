# 작업 지시서

Claude가 쓰고 Codex가 구현하는 작업 단위다. 흐름과 역할은 [../WORKFLOW.md](../WORKFLOW.md)의 ‘역할 분담: Claude 총괄·검수, Codex 구현’을 따른다.

## 목록

| ID | 내용 | 담당 모델 | 선행 | 상태 |
|---|---|---|---|---|
| [TASK-0001](TASK-0001-recruitment-engine.md) | 동료 발견·의뢰·고용 엔진 (M2a-2) | Astra (`gpt-6-astra`) | — | 완료 (반려 1회 → [R1](TASK-0001-R1-recruitment-engine-fixes.md), 개발 브랜치 반영) |
| [TASK-0002](TASK-0002-recruitment-ui.md) | 영입 화면·운영표 후보 행·한 번에 확정 공개 조건 | Sol (`gpt-6.1-sol`) | TASK-0001 | 완료 (반려 1회 → [R1](TASK-0002-R1-recruitment-ui-fixes.md), 개발 브랜치 반영) |
| [TASK-0003](TASK-0003-world-source-check.md) | 세계 거점 근거 18건 원문 대조 (조사) | Sol (`gpt-6.1-sol`) | — | 완료 (Claude 교차 검증 후 데이터 반영) |
| [TASK-0004](TASK-0004-xp-level-training-engine.md) | 업무 경험치·레벨·일반 훈련 엔진 (M2a-3) + 화면 준비용 읽기 함수 | Astra (`gpt-6-astra`) | TASK-0001·0002 | 완료 (반려 2회 → [R1](TASK-0004-R1-growth-engine-fixes.md)·[R2](TASK-0004-R2-growth-engine-hardening.md), 개발 브랜치 반영) |
| [TASK-0005](TASK-0005-growth-ui-and-cleanup.md) | 경험치·레벨·훈련 화면 + 영입 검수 잔여 정리(옛 TASK-0006 포함) + 취소 안내 금액 | Sol (`gpt-6.1-sol`) | TASK-0004·0008·0007 반영 | 완료 (반려 1회 → [R1](TASK-0005-R1-growth-ui-fixes.md), 사용성 시험 준비 [R2](TASK-0005-R2-growth-ui-test-readiness.md)·[R3](TASK-0005-R3-notice-context.md), 개발 브랜치 반영, 사용성 시험 빌드) |
| ~~TASK-0006~~ | TASK-0005에 합침 | — | — | — |
| [TASK-0007](TASK-0007-pixel-rendering.md) | 픽셀아트 렌더링(정수 배율)·픽셀 지도 생성·팔레트·그림 검사 도구 | Sol (`gpt-6.1-sol`) | 픽셀아트 결정(2026-10-05) | 완료 (반려 3회 → [R1](TASK-0007-R1-pixel-map-fixes.md)·[R2](TASK-0007-R2-pixel-map-polish.md)·[R3](TASK-0007-R3-map-water-and-colour.md), 남은 minor는 Claude가 반영 때 수정, 개발 브랜치 반영) |
| [TASK-0008](TASK-0008-engine-robustness.md) | 엔진 견고성: ROUTE02 취소 정산 오류(기존 결함) + 저장 무결성·테스트 강도 잔여 | Astra (`gpt-6-astra`) | TASK-0004 반영 | 완료 (반려 없음, 개발 브랜치 반영) |
| [TASK-0009](TASK-0009-port-wait-and-freeze-polish.md) | 거짓 ‘하역 중단 대기’ 경고(기존 결함) 수정 + 사용성 시험 빌드 마무리 | Astra (`gpt-6-astra`) | TASK-0005-R3 | 완료 (반려 없음, TASK-0005와 한 병합 커밋으로 개발 브랜치 반영, 사용성 시험 빌드) |
| [TASK-0010](TASK-0010-save-v5-foundation.md) | M2a-4 기반: 저장 판본 5(현지 활동 기록 칸), 숨어 있던 업무 종류 분기를 오류로 드러내기, 자금 판단 함수 통합 — 동작 불변 | Astra (`gpt-6-astra`) | 사용성 시험 빌드 `f260a7c` | 완료 (반려 없음, 개발 브랜치 반영) |
| [TASK-0011](TASK-0011-culture-engine.md) | M2a-4 문화 활동 엔진·자료·검사기 (부산 CA01~03, 직원·활동별 첫 완료 경험치, 4줄 기록) | Astra (`gpt-6-astra`) | TASK-0010 반영, 4줄 기록 문장 사용자 검토 | 완료 (반려 1회 → [R1](TASK-0011-R1-culture-hardening.md), Claude 검수 수정 4건, 개발 브랜치 반영) |
| [TASK-0012](TASK-0012-culture-ui.md) | M2a-4 화면: 부산 현지 탭·패널, 활동·직원 고르기와 미리 보기, 결과 카드(4칸)·부산 기록장, 원화 ‘현지 활동비’ 행 (C+A 혼합안) | Sol (`gpt-6.1-sol`) | TASK-0011·0014 반영, 3판 가로 배치(`a8ffa35`), 시안 비교와 사용자 선택 | 반영 (반려 없음, Claude 수정 4차, 2026-10-09) |
| [TASK-0015](TASK-0015-pyeongtaek-hq.md) | 평택 본사 전환: 거점·노선(평택→하이퐁 5일·평택→상하이 4일, 실제 요일표 근거)·견적·문화 문장·동료 이야기·출처·검사기·저장 판본 0.5.0·시험 | Astra (`gpt-6-astra`) | TASK-0012 반영(`102a23f`), DECISIONS ‘평택 본사 전환’, 사용자 승인 묶음 | 반영 (반려 없음, Claude 수정 2차, 2026-10-09) |
| [TASK-0016](TASK-0016-campaign-read-functions.md) | 결산·보고 읽기 함수(정시 인도율·임박 지급·통화별 결산·업무량 대 처리량)와 P0-TIME-01·P0-ACC-01 실행 연결 (병렬 세션 S2, 화면 없음) | Astra (`gpt-6-astra`) | 평택 반영(`548c53c`), DECISIONS ‘병렬 세션 운영’ | 반영 (반려 없음, Claude 수정 1차, 2026-10-09) |
| [TASK-0017](TASK-0017-headless-sim-runner.md) | 화면 없는 비교 실행기: 고정 시드 20개·명령 정책·지표(통화별 순자산·현금 부족일·기여이익·정시 인도율·직원 대기)·변경 전후 비교 (병렬 세션 S3) | Astra (`gpt-6-astra`) | 평택 반영(`548c53c`), DECISIONS ‘병렬 세션 운영’ | 반영 (반려 없음, Claude 수정 1차: 날짜 지표, 2026-10-09) |
| [TASK-0018](TASK-0018-ui-keyboard-input-safety.md) | 화면 키보드·입력 안전·알림·문구: 두 번 누름·떠나기 전 확인, Tab 순서·Shift+Tab 튐, 알림 영역·선택 상태, 학생용 문구, 면담의 고용 뒤 원화, 빌드 표시 (병렬 세션 S4) | Sol (`gpt-6.1-sol`) | 평택 반영(`548c53c`), DECISIONS ‘병렬 세션 운영’ | 반영 (반려 없음, Claude 수정 1차: Shift+Tab 실제 브라우저 순서, 2026-10-09) |
| [TASK-0019](TASK-0019-verify-deploy-tools.md) | 검증·배포 도구: MANIFEST 확인 모드(`--check`), 사실 섞임 검사, 정적 배포 준비(`prepare_static.sh`), 브라우저 측정 스크립트 (병렬 세션 S5) | Sol (`gpt-6.1-sol`) | 평택 반영(`548c53c`), DECISIONS ‘병렬 세션 운영’ | 반영 (반려 없음, Claude 수정 1차, 2026-10-09) |
| [TASK-0020](TASK-0020-source-conservation-check.md) | 출처·보전 기록 원문 대조(조사, 결과 파일만): 동료 보전 기록·서해안 이야기 6줄, 세계 거점·관문 확인 수준, 평택 좌표 등 (병렬 세션 S6) | Sol (`gpt-6.1-sol`, 웹 검색) | 평택 반영(`548c53c`), DECISIONS ‘병렬 세션 운영’ | 결과 보고 반영(2026-10-09). 불일치 확정 0·확인 불가 50. 자료 반영은 Claude 교차 확인 뒤(W2-0b) |
| [TASK-0021](TASK-0021-curriculum-standards-check.md) | 교육과정 대조(조사, 결과 파일만): 47개 교과 연결의 성취기준 코드·현행 고시·P0 표시 (병렬 세션 S6) | Sol (`gpt-6.1-sol`, 웹 검색) | 평택 반영(`548c53c`), DECISIONS ‘병렬 세션 운영’ | 결과 보고 반영(2026-10-09). Claude 교차 확인(W2-0b): 공식 HWP로 47개 모두 성취기준 대조·자료 반영, P0 연결 7쌍 정리. 현행판 대조는 남음 |
| [TASK-0022](TASK-0022-acceptance-validator-cleanup.md) | 인수 명세 시험 연결(파일·제목)과 자료 검사기 정리: 요약·사람 검토 기록 자리, 부서·팀 이름, 일반화 금지어 정밀도, 쓰이지 않는 출처, 교과 연결 P0 검사 (병렬 세션 2차 W2-0a) | Astra (`gpt-6-astra`) | 병렬 세션 1차 반영(`a13caa4`), DECISIONS ‘병렬 세션 1차 결과’ | 반영 (반려 없음, Claude 수정 1차: 주석 제거 순서·시나리오 존재 검사·시험 보강, 2026-10-09) |
| [TASK-0023](TASK-0023-report-schedule-settlement-ui.md) | 경영 보고·일정·병목·결산 화면과 동료 필터: USD 미지급금, 정시 인도율, 앞으로 낼 돈, 업무 부하, 품목별 화물, 90일 결산, 한 줄 일정, 직무·속성 필터 (병렬 세션 2차 W2-0d) | Sol (`gpt-6.1-sol`) | TASK-0016·0018 반영(`a13caa4`), DECISIONS ‘병렬 세션 1차 결과’ | 반영 (반려 없음, Claude 수정 1차: 끝난 뒤 명령 거절·날짜 미정 지급 원인별·표시 스타일·시험 32개, 2026-10-10) |
| [TASK-0025](TASK-0025-route-map-fit.md) | 이번 항로 지도 폭 맞춤(빈 띠가 16 CSS px 이상일 때만 세로를 늘려 한 단계 큰 정수 배율)과 경로 지도 이름표 하한 11px (3차, 결정 기록 1014행 후속) | Sol (`gpt-6.1-sol`) | 글꼴 내장 반영(`eeb4f03`), DECISIONS ‘사용자 결정 일괄 채택’ | 반영 (반려 없음, Claude 수정 1차: 렌더 리본 배율·k 유지 자리 시험 보강, 2026-10-10) |
| [TASK-0026](TASK-0026-data-chunk-budget.md) | 자료 청크 분리와 빌드 크기 한도 검사(청크마다 500,000 B, 첫 화면 합계, 글꼴 별도 줄) (3차 W2-0e) | Sol (`gpt-6.1-sol`) | 글꼴 내장 반영(`eeb4f03`) | 반영 (반려 없음, Claude 수정 1차: 읽기 오류 종료 2·시험 공백 7곳, 2026-10-10) |
| [TASK-0024](TASK-0024-layout-a-esc.md) | 배치 공통+A, Esc 닫기(D13), 한 열 Tab 순서(O3b), 1024px 머리 줄, 측정 시나리오 5개 (세션 B) | Sol (`gpt-6.1-sol`) | TASK-0025 반영(`c896c8a`), DECISIONS ‘사용자 결정 일괄 채택’ B53·D13 | 반영 (반려 없음, 세션 B 검수·수정 없음, 2026-10-10) |
| [TASK-0027](TASK-0027-m2a5-engine.md), [R1](TASK-0027-R1-m2a5-engine.md) | M2a-5 엔진: 반복 견적·창고·고정비·환전·지급 불이행(규칙 2), 비교 실행기 D03 재측정 (세션 A) | Astra (`gpt-6-astra`) | DECISIONS ‘사용자 결정 일괄 채택’ D01~D04 | 반영 (1차 반려 → R1 통과, 세션 A 검수·수정 없음, 2026-10-10). 읽기 함수는 TASK-0028, 비교 실행기·D03 재측정은 TASK-0029 |
| [TASK-0028](TASK-0028-m2a5-sim-readers.md) | M2a-5 읽기 함수: 견적·환전 미리 보기, 본사·창고 표, 주간 병목 표(Q12 가), 고용 전망, 임차료·선복 요금 지급 행, 인수 18·19 (세션 A) | Astra (`gpt-6-astra`) | TASK-0027 반영(`afdf728`), DECISIONS ‘M2a-5 사용자 결정 Q1·Q10·Q12’ | 반영 (반려 없음, 세션 A 검수·수정 없음, 2026-10-10). 비교 실행기·D03 재측정은 TASK-0029 |
| [TASK-0029](TASK-0029-m2a5-d03.md) | M2a-5 비교 실행기 규칙 2 정책·`d03` 명령·20시드 × 3조건 측정(J1~J7, 감액 변형), 인수 17 (세션 A) | Astra (`gpt-6-astra`) | TASK-0028 반영(`d264af7`) | 반영 (도구 통과, 고용 칸 측정 무효, 세션 A 검수·수정 없음, 2026-10-10). 고용 칸 재측정은 TASK-0030 |
| [TASK-0030](TASK-0030-m2a5-blocked-remeasure.md) | 준비 예측 `projectPrepCompletion`의 차단 정의 고침(진행도 배정도 안 함, 시작 전에 끝날 업무만 배정)·예측 결과에 담당 직원·D03 재측정 (세션 A) | Astra (`gpt-6-astra`) | TASK-0029 반영 | 반영 (반려 없음, 세션 A 검수·수정 없음, 2026-10-10). J6 76.0%·J7 15.24% 미달, 병목 표 정의는 TASK-0031 |
| [TASK-0031](TASK-0031-m2a5-bottleneck-storage.md), [R1](TASK-0031-R1-m2a5-bottleneck-peak.md) | 주간 병목 표 정의 고침: 보관 칸에서 비-HANDLING 화물 28일 평균 점유 빼기, 체류일 실측(수락~출항+1), 다른 일 몫 28일 창·묶음 0 계약 포함, `storageDetail`, d03에 handlingJobs·실현률 열, 3조건×20시드 재측정 (세션 A) | Astra (`gpt-6-astra`) | TASK-0030 반영(`83f1de8`) | 반영 (1차 조건부 → R1 통과, 세션 A 검수·시험 2개 시간 제한만 수정, 2026-10-12). J6 89.3%(cap30 86.8, flat200 87.5), J7은 TASK-0032 |
| [TASK-0032](TASK-0032-m2a5-trade-lots.md), [R1](TASK-0032-R1-m2a5-judge-q14.md) | M2a-5 직접 무역 물량 {1~5}·판매 마진 ×1.3(Q13-2 나), 시험 기대값 손계산, D03 세 조건 재측정, 새 시드 1021~1040 J6 표본 밖 확인(`--seed-base`) (세션 A) | Astra (`gpt-6-astra`) | TASK-0031(+R1) 반영(`a9303af`) | 반영 (1차 조건부 → R1 통과, 세션 A 검수·수정 없음, 2026-10-13). J7 26.08%, 표본 밖 J6 87.1%, J4 여유 2.0% |
| [TASK-0033](TASK-0033-m2a5-trade-screens.md), [R1](TASK-0033-R1-m2a5-trade-screens-fix.md), [R2](TASK-0033-R2-m2a5-topbar-layout.md) | M2a-5 화면 1: 규칙 2 시나리오 열기·시세표·생성 견적 카드(수량 선택·늦은 도착 감액·캠페인 뒤 도착 경고)·환전 칸(100 USD 묶음 select)·위쪽 막대·임차료·선복 요금 일정과 보고 이름표. R1: 환전 select·감액 문장 방식 분기·실제 인도 n 시험·시험 자료 ID 제거. R2: 규칙 2 막대 이름 줄임(1024px 이상 한 줄)·시세표 스크롤 칸 이름·선택지 하나인 칸 글 표시 (세션 A) | Sol (`gpt-6.1-sol`) | TASK-0032(+R1) 반영(`8fdc7ad`), 지시서 `0a30fc6` | 반영 (1차 조건부 → R1 통과 → R2 통과, 세션 A 검수·세션 B Chromium 측정 통과, 2026-10-13). 시험 1,242개, 첫 화면 gzip 124,893 B. 후속 후보: exchangeSelection·tradeUiState 정리(0034), 시세표 42rem·390px 표현, 1001~1023px 규칙 2 막대 두 줄 |
| [TASK-0054](TASK-0054-counterparty-names.md) | 거래처 이름 공백·거래처 ID 중복을 검사기 규칙과 시험 2개로 막기 (세션 C) | Astra (`gpt-6-astra`) | TASK-0033 반영(`5604b17`), 세션 C 코드 읽기(cc8f202) | 반영 (반려 없음, 세션 C 검수·수정 없음, 2026-10-13). 검사기 시험 95 → 97 |
| [TASK-0056](TASK-0056-m2a5-save-references.md) | 저장 가져오기 불변식: 생성 견적·공개 묶음의 거래처·도시·품목·도착지·템플릿 참조를 설정과 대조해 맞지 않으면 SaveError로 거부, 칸별 변조 반례 (세션 A) | Astra (`gpt-6-astra`) | 세션 A 반례 확인(변조 저장 가져오기 통과 → 하루 진행 nameKo 예외), TASK-0054 병합(`e1f36b6`) | 반영 (반려 없음, 세션 A 검수·수정 없음, 2026-10-13). 대조 13칸, 시험 1,257개. 후속 후보: 계약 supplierId·customerId·화물 ownerPartyId 대조(예외 없음 확인, 다음 저장 불변식 작업 때 같은 패턴으로) |
| [TASK-0034](TASK-0034-m2a5-ops-screens.md) | M2a-5 화면 2: 본사·창고 표, 주간 병목 표, 투자 명령(창고 확장·선복 계약), ‘창고’ 막힘, TASK-0033 정리, 세션 B CSS 패치, 허브 화면 검수 F1(일정 수령액)·F2(지급 상태 기준) (세션 A) | Sol (`gpt-6.1-sol`) | TASK-0056 병합(`cf034bb`), PR #23 | 반영 (반려 없음, 세션 A 검수, 2026-10-13). 시험 1,275개, gzip +4.4 KB(여유 약 10.4 KB). 선복 줄 출항편 문구는 0057 지시 6 |
| [TASK-0057](TASK-0057-m2a5-ops-screens-money.md) | M2a-5 화면 3: 고용 면담, 지급 경고·위험 알림, 경영 실패 화면, 결산(고정비·통화 간 이체·환전 기록), 원화 보고 비용 행 (세션 A) | Sol (`gpt-6.1-sol`) | TASK-0034 병합 뒤(같은 main.ts) | 반영 (반려 없음, 세션 A 검수, 2026-10-13). 시험 1,295개, gzip +2.4 KB(여유 약 7.9 KB). 첫날 투자 23일 실패는 규칙 결과로 판단, 안내는 0058 지시 10 |
| [TASK-0058](TASK-0058-m2a5-ui-review-followups.md) | 화면 검수 후속: 환전·수량·시세표 접근성(A11Y-1~5), 캠페인 뒤 도착 경고의 통관 일수(F4·GAP-4), 환전 단위 한 곳(F5·GAP-5), 보고의 예약 설명(GAP-2), 가져오기 불변식 견적 수량(GAP-3), 시험 보강(GAP-6·8) (세션 A) | Sol (`gpt-6.1-sol`) | TASK-0057 병합(같은 환전 칸·막대·보고) | 반영 (반려 없음, 세션 A 검수, 2026-10-13). 시험 1,316개, gzip +1.2 KB(여유 약 6.7 KB). 화면 검수 21건 처리 끝 |
| [TASK-0059](TASK-0059-code-split.md) | 첫 화면 코드 분할: 규칙 2 화면(시세표·창고·지급 경고)과 문화 패널 지연 불러오기, `src/ui/lazy.ts` 도우미(M5 화면도 같은 꼴), 한가할 때 미리 받기·실패 시 상태 유지 (세션 B 지시서) | Sol (`gpt-6.1-sol`) | TASK-0058 병합 기록(같은 main.ts·market.ts) | 반영 (R1 첫 렌더 수정, R2 지연 청크 재시도·새로 고침 안내, R3 새로 고침 확인; 세션 A 검수·세션 B 실측, 2026-10-14, 병합 b8b709d). 시험 1,338개, 첫 화면 gzip 124,801 B(여유 약 15.2 KB) |
| [TASK-0060](TASK-0060-validator-data-driven.md) | 자료 검사기를 자료 기반으로: 시세표 행 집합(품목 × (매입 + 판매지))·지수·판매 거래처·결제일 대조, HS `VERIFIED` 상태(6단위·판본·출처), 특성화고 전문교과 코드 형식(`vocational`/`VOC`), 교과 개수 고정 제거 (제작 계획 단계 1 경로 1) | Astra (`gpt-6-astra`) | TASK-0059 반영 기록(`17c731c`) | 반영 (반려 없음, 허브 검수, 2026-10-14, 병합 f0fe0da). 검사기 시험 110개, 시험 1,338개, 첫 화면 변화 0. 발견: 판매지는 rule set 전체에서 뽑음(품목별 판매지는 엔진 변경 필요) |
| [TASK-0061](TASK-0061-situation-map-v1.md) | 상황실 지도 1판(경로 10b-1): 레이어 토글 5개(내 화물·항로·항만·야간 불빛·국가 카드), 사건 브리핑 확대, 표로 보기, 출처 등록부(license_tier), `data/situation_map.json`(첫 화면 자료 청크 밖), 지연 청크·그림은 열 때 받기 (세션 B 모형·사용자 확인 ‘다듬어서 구현’) | Sol (`gpt-6.1-sol`) | TASK-0060 반영·세션 B 모형 병합 | 반영 (R1 허브 지시서 빈틈 수정·자료 채움, R2·R3 세션 B 실측 결함 수정; 허브 검수·세션 B 실측 결함 없음, 2026-10-16, 병합 c25f7ad). 시험 1,364개, 첫 화면 gzip +232 B(125,033 B) |
| [TASK-0062a](TASK-0062a-rules2-golden.md) | 엔진 골든: rules-2 105회(4정책 × 20시드 + 대표 변형 5개 × 5시드)·규칙 1 400회의 실행 결과·마지막 상태(`meta` 제외) sha256, rules-2 읽기 탐침(취소·원화→달러·읽기 함수 7일마다), 저장 왕복, `--dump` 진단, `review_checks` 16종(엔진 변경 없음, 허브 결정 H4·H9·H14-10, 시제품 실측 반영) | Astra (`gpt-6-astra`) | 개발 브랜치 머리(H14 커밋 8e9213d) | 반영 (반려 없음, 허브 검수, 2026-10-16, 병합 c4d6286). 허브 사본 해시 일치, 변형 8개, review_checks 16종. 범위: rules-2 정책이 취소·원화→달러를 내지 않아 탐침이 지킴 |
| [TASK-0062](TASK-0062-risk-fx-krw-purchase.md) | 직접 무역 위험 ①: rules-3 원화 매입·달러 판매, 참고 환율 경로(seed·주차 순수 함수), 환산 두 함수, `referenceEstimate`, `contractRiskReport`(평가일·미래 누설 없음), 통화별 `contractReport`·실패 기록, `dutyFor` 서명 고정 (경로 3, 판정표 승인 9ce98fe) | Astra (`gpt-6-astra`) | TASK-0062a 병합 c4d6286·판정표 승인 9ce98fe | 반영(병합 `0de9d29`, Codex `7410957`) |
| [TASK-0062-R1](TASK-0062-R1-risk-fx-review-fixes.md) | 직접 무역 위험 ① 검수 고침: 편 놓침 뒤 재예약 전 `residual`, 참고 환율 관찰형 유일성·경로 오라클, 혼합 계약 USD 매출원가 불변식, 참고 추정·자금 검사·검사기 상속·로더 변환 시험, 검사기 고유성 (경로 3) | Astra (`gpt-6-astra`) | TASK-0062 `7410957` | 반영(병합 `0de9d29`, Codex `3b003df`) |
| [TASK-0063](TASK-0063-risk-tariff-surcharge.md) | 직접 무역 위험 ②: 신고일 세율 관세 변경(공지 0~3일), 출항 부대비, 진단 T (경로 3) | Astra (`gpt-6-astra`) | TASK-0062 반영 | 반영(병합 `6fee946`, Codex `270de2c`) |
| [TASK-0064](TASK-0064-risk-claims-collections.md) | 직접 무역 위험 ③: 화물 손상 클레임(`SALES_ALLOWANCE`), 지연·부분 수금(신용등급), `receivableSchedule` (경로 3) | Astra (`gpt-6-astra`) | TASK-0063 반영 | 허브 재확인 반영(개정 3e: 독립 재확인 23건 G1~G23, 세션 A 설계자 검토). 다음은 좁힌 검증 → 승인 커밋(BASE) → Codex Astra |
| [TASK-0063-R1](TASK-0063-R1-risk-cost-review-fixes.md) | 직접 무역 위험 ② 검수 고침: 도착 판정(`shipment.dutyMinor`, H16-5), 실패 종료 상태의 공지 기준일 시험, 부대비·관세 미지급 항등식의 환율 주, 편 놓침 부대비 없음, 순서 대조, 사건 범위 제품 값, 전제 우선, 주선 `quotePreview`, 보고 정정 (경로 3) | Astra (`gpt-6-astra`) | TASK-0063 `270de2c` | 반영(병합 `6fee946`, Codex `4cba6ae`) |
| [TASK-0063-R2](TASK-0063-R2-risk-cost-review-fixes-2.md) | 직접 무역 위험 ② 검수 고침 2: `tariffSchedule` 출력의 회차 번호를 공지 순서 `seq`로, 관세 0 도착의 2단계 관세 줄 날짜 (경로 3) | Astra (`gpt-6-astra`) | TASK-0063-R1 `4cba6ae` | 반영(병합 `6fee946`, Codex `0734800`) |
| [TASK-0048](TASK-0048-fact-mixing-rules.md) | 사실 섞임 검사 규칙 개정: 수량·비율 표기 변형을 같은 값으로 봄, 순위 낱말·이름 경계(‘N위안’·‘부산물’·‘파나마 운하’ 오인 없앰), 허용 목록 열쇠에 문장 조각(`sentence_contains`)·상대 거점(`other`), 시험 20→26 (세션 C) | Astra (`gpt-6-astra`) | TASK-0019 결과 ‘알려진 한계’ 2·3·4, DECISIONS 972·1038행 | 반영 (반려 없음, 세션 C 검수·수정 없음, 2026-10-12) |
| [TASK-0050](TASK-0050-conservation-fields.md) | 보전 기록 대표 학명·분류 단계·CITES 확인 상태·확인일·근거 칸과 `check_conservation` 검사, 시험 9개, 41종 값 (세션 C) | Astra (`gpt-6-astra`) | TASK-0047 반영·EMP53 Ⅱ(`69140b9`), 사용자 결정 ‘대표 학명 + 확인일 둘 다’ | 반영 (반려 없음, 세션 C 검수, EMP53 확인일만 2026-10-12로 후속 수정, 2026-10-12). 변형 8건 중 6건 포착, unresolved 확인일·근거 시험 1개는 후속 후보 |
| [TASK-0053](TASK-0053-conservation-tests.md) | 보전 기록 검사 시험 2개: 판정 보류의 확인일·근거, 등재 부속서 값 (세션 C) | Astra (`gpt-6-astra`) | TASK-0050 반영(`8933708`) | 반영 (반려 없음, 세션 C 검수·수정 없음, 2026-10-12) |
| [TASK-0035](TASK-0035-map-detail.md) | 지도 상세 가′(D14): 지도 위 목록·지도 누르기와 가까운 후보·지도 아래 읽기 전용 상세·닫기·Esc·초점, 운항 근거는 확인 날짜·오차만, coarse 포인터 44px, 시험 23개, 측정 시나리오 `map-detail` (세션 B) | Sol (`gpt-6.1-sol`) | DECISIONS ‘D14 지도 상세 수정: 가 → 가′’, 세션 B 설계 검토·시제품(`docs/ai/design/map-detail-d14/`) | 반영 (반려 없음, 세션 B 검수·수정 없음, 2026-10-12) |
| [TASK-0055](TASK-0055-character-projection.md) | 캐릭터 자료에서 화면·엔진이 읽는 칸만 빌드에 싣기(안 B): 빌드 변환 플러그인, 읽는 칸 목록, 시험·개발 서버의 뺀 칸 읽기 막기 (허브) | Sol (`gpt-6.1-sol`) | TASK-0024 반영(`74e53ac`), DECISIONS ‘자료 청크 분리와 빌드 크기 한도’ | 반영 (반려 없음, 수정 없음, 2026-10-10). TASK-0027 병합의 선행 |
| [TASK-0013](TASK-0013-deferred-display-fixes.md) | 사용성 시험 빌드에서 미룬 표시 수정 8건(수금일 당일 문구, 선복 반영 예약 안내, 확정 미리 보기 문구, 위쪽 막대 기준, 면담 전 계약금 규칙 등) | Sol (`gpt-6.1-sol`) | TASK-0010 반영 | 완료 (반려 없음, Claude 검수 수정 2건, 개발 브랜치 반영) |
| [TASK-0014](TASK-0014-touch-device-readiness.md) | 사용성 시험용 휴대폰·태블릿 대응: 화면 튐(초점)·두 번 누름 막기, 고정 막대 줄이기, 거래 먼저 배치, 진행 보호·터치 대상 등 + 미배정 문구 1건 | Sol (`gpt-6.1-sol`) | TASK-0011 반영(`b45e7e2`) | 완료 (반려 없음, Claude 검수 수정 4건, 개발 브랜치 반영, 사용성 시험 빌드 2판) |

상태 값: `대기`, `Codex 실행 중`, `검수 중`, `반려(n회)`, `완료(커밋 해시)`.

## 지시서 형식

```
# TASK-xxxx 제목
- codex_model: `gpt-6-astra` 또는 `gpt-6.1-sol`
- reasoning_effort: `low` | `medium` | `high` | `xhigh`
- 선행 작업:
- 결정 근거: (DECISIONS·계획 문서의 절)

## 목표
## 먼저 읽을 파일
## 범위 (포함 / 제외)
## 구현 지시
## 테스트
## 완료 조건
```

공통 규칙(커밋 금지, 고치지 않는 파일, 검증 명령, 보고 형식)은 [CODEX_PREAMBLE.md](CODEX_PREAMBLE.md)에 있다. 지시서마다 다시 쓰지 않는다.

작업 번호는 세션별로 나눠 쓴다(A M2a-5 엔진 0027~0034, B 화면·배치·측정 0024·0035~0044, C 조사·근거 0045~0054, 허브가 새로 내는 작업 0055부터, [SESSION_TREE.md](../SESSION_TREE.md)). 이 목록은 허브만 고친다.

기준 커밋을 자리표시 `<BASE>`로 적을 때는 대체 규칙을 함께 적는다. 지시서를 올린 커밋은 자기 해시를 담을 수 없으므로, 자리표시가 남아 있으면 `git log -1 --format=%h -- <지시서 경로>`의 해시를 쓰고 결과 보고에 적게 한다(TASK-0026 검수에서 대체 규칙이 빠진 것을 확인).

결과 보고는 `results/<작업 ID>.md`에 쌓인다. Claude의 검수 기록은 같은 파일 끝의 ‘검수’ 절에 덧붙인다.
