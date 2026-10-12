# 사용성 시험의 개인정보 흐름 (TASK-0051)

- 작성: 세션 C, 2026-10-12. 열람·측정일은 모두 2026-10-12.
- 목적: IRB 신청서·보호자 동의서·본인 동의서에 적을 ‘참가자 기기에서 어떤 정보가 어디로 가는가’를 원문과 실측으로 정리한다.
  - D17-3 가(발표 가능성을 열어 둠, IRB 확인과 동의서 필요)에 따른 준비물이다.
  - 날짜(D17-1)·IRB 경로와는 무관하게 쓸 수 있는 부분만 다룬다.
- 대상 빌드:
  - **1차 시험 빌드: 3판 `a8ffa35`.** https://scitrade-usability-test.netlify.app, `/version.txt` “frozen 2026-10-06, v3”.
  - 비교용 평택판 `5d59ff3`(https://scitrade-pyeongtaek-test.netlify.app).
- 근거 문서: `docs/USABILITY_TEST_M2A.md` 7·8절, `docs/DECISIONS.md` D16·D17.

## 요약

| 흐름 | 3판(1차 시험) | 평택판 | 받는 쪽이 받는 것 |
|---|---|---|---|
| 페이지·파일 요청 | Netlify | Netlify | IP 주소, 요청 주소, 브라우저 정보(사용자 에이전트) 등 HTTP 요청에 실리는 값 |
| 글꼴 요청 | **Google Fonts**(fonts.googleapis.com·fonts.gstatic.com) | 없음(글꼴을 빌드에 넣음, D16) | IP 주소, 요청 주소, HTTP 머리말(사용자 에이전트 포함) |
| Netlify 배지 스크립트 | `/.netlify/scripts/hud`(같은 사이트에서 받음) | 같음 | 스크립트가 따로 보내는 요청은 없음(아래 3절) |
| 게임 저장 | 기기 브라우저 `localStorage`만 | 같음 | 밖으로 보내지 않음 |
| 쿠키 | 없음(첫 화면 응답에 `Set-Cookie` 없음) | 없음 | — |
| 게임이 묻는 개인정보 | 없음(이름·글 입력 칸 없음) | 없음 | — |

**한 문장 요약(동의서 초안용):**

> 이 게임은 이름 등 개인정보를 묻거나 저장하지 않으며, 진행 상황은 사용한 기기의 브라우저에만 저장됩니다. 다만 게임을 여는 과정에서 기기의 IP 주소와 브라우저 정보가 게임을 제공하는 서버(Netlify)와 글꼴을 제공하는 서버(Google Fonts)에 전달됩니다. 게임을 올린 서버의 관리 화면에서 연구자는 최근 24시간의 접속 기록(IP 주소·브라우저 정보 포함)을 볼 수 있으나, 이 기록을 내려받거나 연구 자료로 쓰지 않습니다.

- **2026-10-12 정정:** 처음 초안의 ‘연구자가 받거나 보관하지 않습니다’는 쓰면 안 된다.
  - Netlify 문서에 따르면 Free 요금제의 사이트 소유자도 Observability에서 지난 24시간의 요청을 IP 주소·사용자 에이전트로 찾아볼 수 있다(4절 1).
  - 위 문장은 연구자가 그 화면을 쓰지 않겠다는 약속을 담는다. 약속을 지킬지는 사용자가 정한다.
  - 평택판으로 시험하면 ‘글꼴을 제공하는 서버(Google Fonts)’ 구절을 뺀다.

## 1. 게임 코드가 하는 일 (저장소 확인)

- **저장:**
  - `src/ui/main.ts`(3판 848·857행, 지금 1255·1265행)는 `localStorage`의 `scitrade-save`(옛 이름 `scitrade-m1-save`)에만 쓰고 읽는다.
  - 서버로 보내는 코드(`fetch`·`XMLHttpRequest`·`sendBeacon`)와 분석 도구(`gtag` 등)는 `src/`에 없다(`grep`, 시험 파일 제외).
- **입력:** 화면에 글을 쓰는 칸(`type="text"`·`textarea`·`prompt`)이 없다. 참가자가 이름을 적을 곳이 없다.
- **외부 주소:** 3판 `index.html` 9~11행이 Google Fonts를 부른다. 평택판(`5d59ff3`)은 `/fonts/fonts.css`로 바꿨다.
  - 실제 배포된 두 사이트의 첫 화면 HTML에서 외부 주소를 뽑았다(2026-10-12).
    - 3판: `fonts.googleapis.com`·`fonts.gstatic.com`·`netlify.new`.
    - 평택판: `netlify.new`.
  - `netlify.new`는 Netlify 배지 안의 링크다. 누를 때만 열린다.

## 2. Google Fonts가 받는 정보 (3판만)

Google Fonts FAQ([fonts.google.com/faq](https://fonts.google.com/faq), 스크립트로 그려져 Chromium으로 읽음)의 원문 문장이다.

- “The use of the Google Fonts Web API is unauthenticated and the Google Fonts API does not set or log cookies.”
- 글꼴 요청에 실리는 정보: “(1) the IP address used by the respective user to access the Internet, (2) the requested URL on the Google server, and (3) HTTP headers including the user agent describing the website visitors’ Internet browser and operating sys[tem]”
- IP 주소의 쓰임: “Google receives the website visitor’s IP address, which it processes to respond to the visitor's request and for security purposes.”

보관 기간은 이번에 읽은 문장에 없다. 동의서에는 ‘Google의 정책에 따른다’로만 적고 기간을 지어내지 않는다.

## 3. Netlify가 받는 정보 (두 빌드 모두)

- **역할:** Netlify 개인정보처리방침([netlify.com/privacy](https://www.netlify.com/privacy/), 본문 날짜 2026-04-10)의 원문 문장이다.
  - “this Privacy Statement does not apply to data we process as a service provider or data processor”
  - 고객 서비스에 들어온 개인정보는 “we process such Personal Data as a processor on behalf of our customer”
  - 곧 시험 사이트 방문자의 접속 정보에 대해 Netlify는 처리자, 사이트 소유자(사용자 계정)는 관리자다.
  - 방문자 접속 기록의 보관 기간은 이 방침에 적혀 있지 않다. 세부는 Netlify 데이터 처리 계약(DPA, PDF)에 있다고 안내하나 이번에 읽지 않았다.
- **배지 스크립트(`/.netlify/scripts/hud?variant=public`, 34,481 B, 2026-10-12 받음):**
  - 스크립트 안에 `fetch`·`XMLHttpRequest`·`sendBeacon`·이미지 비콘이 없다.
  - `localStorage`의 `nl-hud:public:v1`에 ‘배지 숨김’ 상태만 저장한다. 시험 전 ‘Hide this badge’가 여기에 기억된다(8절 2단계).
  - 외부 링크(`app.netlify.com`·`docs.netlify.com`)는 누를 때만 열린다.
  - 판단 근거는 스크립트 글자 검색이다. 실행 중 네트워크 기록은 이번에 재지 않았다.
- **쿠키:** 두 사이트 모두 첫 화면 응답 머리말에 `Set-Cookie`가 없다(`curl -I`, 2026-10-12).

## 4. 아직 확인하지 않은 것 (허브·사용자)

1. **Netlify에서 사이트 소유자가 볼 수 있는 방문 기록 — 확인함(2026-10-12):**
   - 허브 확인: 팀은 Free, 구성원 1명(소유자). 두 사이트 모두 Forms가 꺼져 있고 비밀번호·SSO 제한이 없다.
   - Netlify 문서 원문(docs.netlify.com, robots.txt 전체 허용):
     - [Log Drains](https://docs.netlify.com/manage/monitoring/log-drains/): “This feature is available on Enterprise plans.” → Free 팀에서는 쓸 수 없다.
       - 쓰더라도 “`Exclude personally identifiable information (PII)`” 선택지가 `client_ip`·`user_agent`를 뺀다.
     - [Observability](https://docs.netlify.com/manage/monitoring/observability/overview/):
       - “This feature is available on Credit-based plans, including Free, Personal, and Pro … and Enterprise plans.”
       - Free의 시간 범위는 “Past 24 hours”다.
       - 검색 항목에 “The user-agent string”, “Client IP address”가 있다.
       - “Netlify Observability shows raw server-side HTTP request data.”
     - 문서 SHA-256(받은 `.md`): Observability `178741384d5621513cad5afc14bc35cadf3cbda283b76ef2512d1d7969bf9767`, Log Drains `5123c54c15d408dc07c205489a95a3a210b09840518c9bc04a2e3dcf07d3e441`.
   - **판단:** 사이트 소유자(연구자)는 관리 화면에서 지난 24시간의 요청을 IP·사용자 에이전트와 함께 볼 수 있다. 별도로 켜는 설정이 있다는 문장은 문서에 없다. 따라서 ‘연구자가 받지 않는다’고 쓸 수 없다.
   - **남는 불확실성:** 팀이 ‘Credit-based’ Free인지 ‘Legacy’ 요금제인지. Legacy면 문서상 요약 위젯만 보인다. 사용자가 Netlify 관리 화면의 Analytics & metrics > Observability에서 요청 목록이 보이는지 한 번 확인하면 닫힌다.
   - Netlify 내부의 접속 기록 보관 기간은 여전히 문서로 확인하지 못했다(DPA 미열람). 동의서에는 기간을 적지 않는다.
2. **실행 중 네트워크 기록 — 확인함(허브 실측, 2026-10-12, Chromium 1366×768, 배포 사이트):**
   - 측정 경로: 첫 화면 → 처음부터 → 하루 진행 2번 → 저장 → 새로 고침.
   - 3판은 95건 모두 GET이다. 받는 곳은 사이트·fonts.googleapis.com·fonts.gstatic.com이다.
   - 평택판은 105건 모두 GET이다. 받는 곳은 사이트 하나다(글꼴 `/fonts/`).
   - 처음부터·하루 진행·저장 때 요청은 0건, 쿠키도 0이다. `localStorage`는 `scitrade-save`만 있다. 배지 스크립트 뒤 다른 곳 요청은 없다.
   - 한계: 한 경로·한 기기다. 문화·영입 화면 경로는 재지 않았다.
3. **Netlify DPA의 접속 기록 보관 기간:** 동의서에 기간을 적고 싶으면 사용자가 DPA PDF를 읽거나 Netlify에 묻는다.

## 5. 시험 운영에 덧붙일 점 (`USABILITY_TEST_M2A.md` 8절 보완 후보)

- **공용 기기 저장 지우기:** 기기마다 남는 것은 게임 저장(`scitrade-save`)과 배지 숨김(`nl-hud:public:v1`)이다.
  - 8절 3단계(‘처음부터 → 확인 → 저장’)는 앞 참가자의 진행을 덮어쓴다. 시험이 모두 끝난 뒤에는 브라우저의 사이트 데이터 지우기로 둘 다 지우는 것을 권한다.
  - 둘 다 이름·IP를 담지 않으므로 개인정보는 아니다.
- **화면 녹화·관찰지:** 관찰지(5절)는 번호로 적는다. 녹화를 하면 얼굴·목소리가 개인정보가 된다. 녹화 여부와 보관·삭제 시점을 동의서에 적는다. 7절의 ‘녹화물은 시험이 끝나면 지운다’를 연구 발표 경로에서도 지킬지(분석 끝난 뒤 삭제 등)는 IRB 신청 때 정한다.

## 6. 결정이 필요한 것 ([질문]으로 올림)

**1차 시험 빌드를 3판으로 둘지, 평택판으로 바꿀지.** 지금 문서는 3판으로 정해져 있다(`USABILITY_TEST_M2A.md` 8절 4번, D17 ③의 ‘3판의 Google Fonts’).

| 항목 | 3판 그대로 | 평택판으로 |
|---|---|---|
| 외부 전송 | Google Fonts + Netlify | Netlify만 |
| 진행자 점검 | 8절 기기 점검 9단계가 3판에서 확인됨 | 다시 확인해야 함(배치·글꼴 바뀜, 실기기 확인 D18-1이 아직 남음) |
| 과제 T1~T5 | 3판 화면 기준으로 씀 | 본사 평택·문화 화면이 더해져 과제 문장·관찰 항목을 다시 맞춰야 함 |
| 결과 해석 | 고정 빌드라 이후 개발과 분리됨 | 지금 개발과 가까워 바로 고칠 거리를 찾기 좋음 |
| 실제 시설명 | 영입 화면(`src/ui/recruitment.ts:114`)이 `story_clue` ‘부산 무역회관의 신규 거래처 설명회에서…’를 보여 준다. 실제 한국무역협회 건물명이다(`VENUE-NAME-CHECK.md`, 허브 발견) | ‘평택 무역회관’, 겹치는 실제 시설 못 찾음 |

권고는 하지 않는다. 시험의 목적(고정 빌드로 기본 흐름을 볼지, 지금 판으로 볼지)에 달린 일이라 사용자 결정이다. 평택판으로 바꾸기로 하면 이 문서 2절은 빠지고, `USABILITY_TEST_M2A.md` 4·8절을 다시 쓰는 작업(TASK-0052 후보)을 낸다.
