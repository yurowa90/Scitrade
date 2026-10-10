# TASK-0024 인계 자료 (허브 작업, 2026-10-10)

세션 B(화면·배치·측정)에 넘기는 TASK-0024 지시서 초안의 근거 자료다. **지시서는 확정본이 아니다.** 줄 번호는 TASK-0025 병합 전 `c284e79` 기준이다. 세션 B가 TASK-0025가 병합된 개발 브랜치(`c896c8a`) 기준으로 맞춘 뒤 실행을 요청한다(SESSION_TREE ‘파일 소유와 잠금’).

| 파일 | 내용 |
|---|---|
| `../../../tasks/TASK-0024-layout-a-esc.md` | Sol 지시서 초안. 범위: 공통+A 배치, Esc 닫기(D13), 한 열 Tab 순서(O3b), 1024px 머리 줄, 측정 시나리오 5개 |
| `proto-c284e79.patch` | 지시서 설계 전체를 넣은 시제품 패치. `c284e79`에 그대로 들어간다. TASK-0025 뒤에는 `tools/browser/lib.test.mjs` 8행만 손으로 맞춘다 |
| `o3b2.patch`, `O3-NOTES.txt` | 한 열 순서 시안 비교(O1·O2·O3a·O3b). 권고 O3b2 |
| `harness/kb/` | 저장소 밖 키보드·읽던 자리 측정기(거꾸로 Tab, ‘하루 진행’→‘오늘 할 일’ Tab 수, Shift+Tab 튐, 32사례). `kbcore.js`의 판정은 현지 패널 이름표 때문에 알림 상태를 1건 더 세는 문제가 있다(O3-NOTES 참고) |
| `harness/ec/` | UX-23(하루 진행 뒤 읽던 자리) 측정기 |
| `results/` | 시제품·기준 빌드 측정 원자료, 변형 시험 기록 |

스크립트 안의 절대 경로(`/tmp/claude-0/...`)는 허브 작업 공간 기준이다. 새 컨테이너에서는 경로를 바꿔 쓴다. Playwright는 `/opt/node-tools/node_modules/playwright`, Chromium은 `/opt/pw-browsers/chromium`이다.

**초안이 정한 것(세션 B가 확인):**
- 창 폭 전환 완료 조건을 ‘1000px로 바꾼 직후 초점·위치가 기준과 같다’로 좁혔다. 1180px로 되돌린 뒤의 위치는 기준과 다르며 대가로 기록한다.
- `window.matchMedia` 존재 확인 한 줄을 ‘시험 때문에 존재 확인을 넣지 않는다’ 규칙의 예외로 허용했다(지도 연결 시험 틀에 흉내가 없음).
- `card-detail`·`interview-hire` 측정 상한의 여유가 0.8~1.3px뿐이다. `card-detail-low`는 기준 빌드도 통과해 회귀 방지용이다.
