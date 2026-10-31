# TASK-0021 교육과정 대조: 47개 교과 연결의 성취기준 코드·현행 고시·P0 표시 (조사, 결과 파일만)

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- web_search: `on`
- 선행 작업: 없음. 내용은 다른 작업에 기대지 않는다.
  - 기준: 개발 브랜치 `ccr-21863e28-zmusty`의 HEAD(이 지시서를 커밋한 커밋 이후). 평택 본사 전환 병합 `548c53c`가 들어 있다. 작업 브랜치 `codex/TASK-0021`은 이 HEAD에서 새 작업 폴더로 만든다.
  - 아래 사실과 줄 번호는 `ed2ff03`에서 확인했다. 검토 때 HEAD는 `8262fed`이다. `ed2ff03`에서 `8262fed`까지 바뀐 파일은 `docs/ai/design/` 새 문서 2개, `docs/ai/tasks/README.md`, TASK-0016~0020 지시서, `MANIFEST.json`뿐이다. 그래서 줄 번호는 그대로 맞다. 시작할 때 ‘구현 지시’ 0의 `git diff --stat` 명령으로 다시 확인한다(TASK-0020 병합 때 Claude가 DECISIONS·STATUS를 고치면 줄 번호가 밀릴 수 있다).
  - 계획(1차 세션 S6)에는 기준이 `3b60314`로 적혀 있다. 그 뒤 평택 병합으로 교과 연결 자료가 바뀌었다(CA02 연결, `curriculum_links.json`의 `activity_ids` 3건). 조사는 반영될 자료와 같은 판을 봐야 한다. 그래서 병합 뒤 HEAD를 기준으로 한다.
  - 실행: TASK-0020과 별도 작업 폴더에서 동시에 돈다. TASK-0020의 작업 폴더·결과 파일과 섞지 않는다.
  - 이 지시서의 S6·B52·CUR-01~05·W2-0a·W2-0b는 Claude의 남은 일 목록 이름표다. 저장소에는 없다.
- 결정 근거:
  - `docs/DESIGN_v0.4.md` 588행: 후속 개정 고시와의 대조는 아직 하지 않았다. ‘성취기준 코드를 추정해 붙이지 않는다.’
  - 같은 문서 590~594행(선별 범위와 ‘내용 요소·성취기준·게임 규칙’ 구분), 606행(P0·P1·P2와 ‘P0 보고’의 뜻), 437행(교과 분류·원문 출처와 설계 해석의 분리), 752행(CurriculumRef는 ‘성취기준 코드와 분리’).
  - `docs/DECISIONS.md`
    - 771~774행: ‘M2a-4 도시 방문·문화 활동 — 2026-10-06’ 절의 ‘교사용 메모(교과 연계의 과대 표시 방지)’.
    - 1003행: ‘평택 노선 재설계 승인 (2026-10-09)’ 절 5항. 평택판 CA02′의 교과 연결은 SOC04·SOC07·SCI01이다.
    - 1029행: ‘병렬 세션 운영 (2026-10-09, 사용자 지시)’ 절. S6은 결과 파일만 쓰고, 반영은 Claude 교차 확인 뒤에 한다.
    - 줄 번호가 밀렸으면 절 이름과 문장으로 찾는다.
  - `docs/IMPLEMENTATION_PLAN.md` 83행, `docs/STATUS.md` 36행: 후속 개정 대조와 성취기준 코드 매핑은 미완료.
  - `docs/ai/WORKFLOW.md` 64행(Sol은 조사 결과로 자료를 고치지 않는다), 88행(교차 확인한 항목만 반영), 111행(조사 결과의 지위).
  - 2026-10-09 남은 일 점검 계획의 S6·B52: CUR-01·02·04·05.

## 목표

`data/curriculum_links.json`의 교과 연결 47개는 교육부 고시 제2022-33호 최초 확정본의 **내용 요소(지식·이해)**만 담고 있다. 성취기준 코드가 없다(15행 `achievement_standard_codes_included: false`). 현행판 대조도 하지 않았다(5·55·69·82행 `not_completed`, 47개 모두 `current_edition_not_verified`).

이 작업은 원문을 열어 아래 네 가지를 조사하고, 결과 파일 하나에 적는다.

1. **현행 판본(CUR-02):** 2022-33 뒤의 개정 고시 연혁. 별책6(도덕)·7(사회)·9(과학)의 고등학교 과목이 바뀌었는지.
2. **성취기준 코드(CUR-01):** 47개 연결마다 원문의 성취기준 코드와 문장. **추정 코드는 0건이어야 한다.**
3. **P0 표시(CUR-04):** P0 단계 자료가 P0 표지 없는 연결을 가리키는 7쌍. 쌍마다 근거와 대안.
4. **연결 없는 요소(CUR-05):** 어느 자료도 가리키지 않는 연결 20개. 성취기준과 자료 후보.

**조사만 한다.** 자료·스키마·검사기·문서를 고치지 않는다. Claude가 교차 확인한 항목만 나중에 반영한다(검사기 규칙은 W2-0a, 자료는 W2-0b).

## Claude가 미리 확인한 사실 (`ed2ff03`, 2026-10-09)

1. **자료 구조.**
   - 연결 47개: 사회 18·윤리 6·과학 23. 공통 13·일반 14·진로 20(`curriculum_links.json` 30~42행).
   - 연결의 칸: `id`, `group`, `selection`, `subject`, `knowledge_elements`, `source_id`, `source_url`, `printed_page`, `pdf_page`, `edition`, `edition_comparison_status`, `application_notes`, `priority`, 그리고 3건에만 `activity_ids`.
   - 검사기 `tools/validate_data.py` 490~508행은 다음을 본다: 47개, 그룹별 개수, `pdf_page == printed_page + 6`, `source_id`가 `sources.json`에 있음, `DESIGN_v0.4.md` 해시. 반영 제안은 이 조건을 깨지 않게 쓴다.
   - 같은 파일 514~517행의 `plural_refs`는 `activity_ids`를 `culture_activities`의 ID로만 검사한다. 연락처·장소·사건 ID는 `activity_ids`에 넣을 수 없다.
   - `schemas/curriculum_links.schema.json`의 연결 항목은 `additionalProperties`가 `true`다. 새 칸(예: `achievement_standards`)을 더해도 지금 검사는 깨지지 않는다. 스키마에 칸을 적는 일은 W2-0a·W2-0b 몫이다.
2. **JSON과 설계 문서는 같다.** 47행 모두 내용 요소·인쇄쪽·적용 문장이 DESIGN 17·17.1·18절 표(614~631, 641~646, 656~678행)와 글자까지 같다. 그래서 원문과는 JSON만 대조하면 된다.
3. **원문 출처.**
   - [C1] 공식 고시 게시물과 원문 ZIP(별책5~14, HWP): DESIGN 803~806행. `curriculum_links.json` 43~84행의 `sources` 3건도 같은 게시물·파일을 가리킨다. 다만 주소 문자열의 뒷부분이 조금 다르다(아래, ‘구현 지시’ 8).
   - [C2] 사회과 PDF 재게시본(316쪽): DESIGN 808행. [C3] 과학과 PDF 재게시본(292쪽): 810행. [C6] 도덕과 PDF 재게시본: 816행.
   - `data/sources.json` 15~47행에 `C1-SOC`·`C1-SCI`·`C1-ETH`가 있다(`CONTENT_READ`, 2026-10-04). 이 URL 끝에는 `&m=040401&opType=N`이 붙고, `curriculum_links.json`의 `official_notice_url`은 `&lev=0`로 끝난다.
   - C2·C3·C6은 `sources.json`에 없다.
4. **C3는 확정 고시문이 아닐 수 있다.**
   - Claude가 C3를 내려받아 보았다. 292쪽이고 표지는 ‘교육부 고시 제2022-33호 [별책 9]’다.
   - 인쇄 76쪽이 PDF 82쪽, 인쇄 82쪽이 PDF 88쪽이다. 거기에 SCI01~04·SCI23의 요소가 보인다.
   - 그런데 PDF 문서 정보의 제목은 ‘[별책9] 과학과 선택과목 교육과정 시안_교육과정심의회 자료(수정).hwp’이고, 만든 날은 2022-12-19다. 고시일(2022-12-22)보다 앞선다.
   - 그래서 C3는 쪽을 찾는 데만 쓴다. 판정은 공식 원문으로 한다.
   - C2·C6은 2026-10-09 Claude가 내려받아 문서 정보를 보았다. 시안 표시가 없다. 그래서 ‘재게시본’으로 판정에 쓸 수 있다.
     - C2: 316쪽, 표지 ‘교육부 고시 제2022-33호 [별책 7]’. 만든 날 2022-12-22(고시일), 작성자 `moe`, 한글 프로그램에서 바꾼 PDF.
     - C6: 92쪽, 표지 ‘교육부 고시 제2022-33호 [별책 6]’. 문서 제목 ‘[별책6] 도덕과 교육과정.hwp’, 만든 날 2023-02-02.
   - Codex의 웹 도구는 PDF 문서 정보(만든 날·파일 이름)를 보여 주지 않을 수 있다. C2·C3·C6은 위 값을 쓴다. 다른 재게시본은 ‘구현 지시’ 2를 따른다.
5. **코드 꼴.** C3 본문에 `[10통과1-01-01]` 같은 코드가 있다. 이것은 꼴을 보여 줄 뿐이다. 코드는 연결마다 원문에서 옮긴다.
6. **연결을 쓰는 곳.**
   - 다른 자료가 연결을 가리키는 칸은 `curriculum_refs`뿐이다. `culture_activities.json` 6개, `contacts.json` 2개, `venues.json` 5개, `events.json` 6개 항목에 있다.
   - 항목의 `stage`는 설계 단계 표시다. 구현 여부가 아니다(사건 EV01~06은 아직 엔진에 없다).
7. **P0 쌍 7개.** 단계가 P0인 항목이, `priority`에 ‘P0’로 시작하는 표지가 없는 연결을 가리킨다.

   | 자료 | 항목 | 가리키는 연결 | 연결 priority |
   |---|---|---|---|
   | culture_activities | CA01 시장과 포장 요구 탐방 | SOC10 한국지리 탐구 | P1 |
   | contacts | NPC_MARKET 시장 상인 윤서 | SOC10 | P1 |
   | contacts | NPC_GUIDE 지역 기록 안내자 하람 | SOC08 세계사 | P1 |
   | contacts | NPC_GUIDE | SOC12 동아시아 역사 기행 | P1 |
   | contacts | NPC_GUIDE | SCI05 과학탐구실험1 | P1 |
   | venues | VEN_CULTURE 문화생활·현지 탐방 | SOC12 | P1 |
   | events | EV06 고객의 운송 배출자료 요청 | SCI09 화학 | P1 |

   - `3b60314`(평택 전)에는 9쌍이었다. CA02→SOC08·SOC12가 평택 전환으로 빠졌다.
   - 그래서 DECISIONS 772행의 ‘CA02가 가리키는 SOC08·SOC12’ 문장은 평택 전 상태다. 지금 CA02는 SOC04·SOC07·SCI01(모두 P0)을 가리킨다. NPC_GUIDE·VEN_CULTURE는 평택 전부터 SOC08·SOC12를 가리켰고, 772행 메모에는 빠져 있다.
   - 기준이 바뀌면 ‘테스트’의 검사 스크립트가 자료에서 다시 센 값이 맞다.
8. **역방향 표시가 한쪽에만 있다.** `curriculum_links.json`의 `activity_ids`는 SOC04·SOC07·SCI01의 `["CA02"]` 3건뿐이다(169행 부근 등). CA01·CA03·CA04~06이 가리키는 연결에는 없다.
9. **연결 없는 요소 20개:** SOC01·02·11·13·18, ETH03·04·05·06, SCI07·12·14·15·16·17·18·19·20·22·23. 이 가운데 ETH04·05는 ‘P0 보고’ 표지가 있다. `3b60314`에는 21개였다(SCI01이 평택판 CA02로 연결됐다).
10. **Claude 환경의 접근 한계.**
    - 2026-10-09 Claude의 웹 열기 도구(페이지 읽기)는 `moe.go.kr`, `ne.go.kr`, `ncic.re.kr`, `law.go.kr`, `cku.ac.kr`에서 막혔다. C3가 있는 padlet 저장소는 열렸다.
    - Claude 셸에서는 C2(cku)·C3·C6 PDF 파일을 받아 문서 정보를 볼 수 있었다(‘미리 확인한 사실’ 4). `moe.go.kr`·`ne.go.kr`의 robots.txt 요청은 셸에서도 연결이 끊겼다.
    - 그래서 Claude가 교차 확인하려면 세 가지가 필요하다. 성취기준 문장 원문 그대로, 인쇄쪽, 그리고 가능하면 다른 도메인의 두 번째 URL.
    - **robots.txt (2026-10-09 Claude 확인).**
      - `ncic.re.kr`·`www.ncic.re.kr`: 검색 엔진 4개(Googlebot·Yeti·Daumoa·bingbot)만 허용하고 `User-agent: *`는 `Disallow: /`다. 그래서 **NCIC 페이지와 파일은 열지 않는다.** 검색 결과 요약에 NCIC가 나오면 길잡이로만 쓰고, 같은 문서를 다른 공식 경로에서 찾는다.
      - `www.law.go.kr`(국가법령정보센터): `Allow: /`. 열 수 있다.
      - `tour.cku.ac.kr`(C2): `Allow: /`.
      - `moe.go.kr`·`ne.go.kr`: Claude 환경에서 robots.txt를 받지 못했다. Codex가 처음 열 때 직접 확인한다(‘지켜야 할 것’ 웹 접근).
11. **검색 요약으로만 본 단서.** 원문은 열지 못했다. 이 번호를 그대로 결과에 옮기지 않는다. 원문을 열어 확인한 것만 적는다.
    - 국가교육위원회 공고 제2024-22호(2024-07-17): 「초·중등학교 교육과정」(교육부 고시 제2022-33호)과 「특수교육 교육과정」의 일부 개정 행정예고.
    - 국가교육위원회고시 제2024-3호(2024-08-16): 2022 개정 교육과정 일부개정. 2차 자료에도 같은 번호가 있다.
    - 2025-12-18 국가교육위원회 회의: 고교학점제 관련 국가교육과정 변경 행정예고안 보고(공통과목 이수 기준). 확정 고시 여부는 모른다.
    - 2024년부터는 개정 고시를 국가교육위원회가 낸 것으로 보인다. 교육부와 국가교육위원회의 연혁을 모두 본다.
12. **시작 수치.** `python3 tools/validate_data.py`는 `ed2ff03`에서 PASS 24,715건이었다(지시서 파일을 넣기 전). 지시서와 결과 파일이 MANIFEST에 들어가면 파일마다 2건씩 는다. 시작 때 직접 세어 적는다.

## 먼저 읽을 파일

- `docs/DESIGN_v0.4.md` 16~18절(582~681행), 752행(CurriculumRef 최소 필드), 22절의 참고 문헌 C1~C6(799~816행). 읽기만 한다.
- `data/curriculum_links.json` 전체. 특히 1~42행(판본·범위·주의 문장·개수), 43~84행(`sources`).
- `schemas/curriculum_links.schema.json`.
- `data/sources.json` 15~47행(`C1-SOC`·`C1-SCI`·`C1-ETH`). 다른 항목의 `verification_status` 값 목록.
- `data/culture_activities.json`, `data/contacts.json`, `data/venues.json`, `data/events.json`: 항목의 `title_ko`, `stage`, `curriculum_refs`와 설명 문장 칸(`observations_ko`, `information_scope_ko`, `individual_request_ko`, `resolution_rules_ko` 등).
- `tools/validate_data.py` 490~523행(교과 연결 검사). 읽기만 한다.
- `docs/DECISIONS.md` 762~774행(M2a-4b 설계안과 교사용 메모), 995~1006행(평택 노선 재설계 승인).
- 형식 참고: `docs/ai/tasks/TASK-0003-world-source-check.md`와 `docs/ai/tasks/results/TASK-0003.md`.

## 범위

**포함**
1. 고시 연혁(표 E).
2. 47개 연결의 원문 대조: 내용 요소·인쇄쪽·현행판(표 A).
3. 성취기준 코드와 문장(표 B).
4. P0 쌍 7개의 판정과 대안(표 C).
5. 연결 없는 요소 20개(표 D).
6. 출처 기록 제안(표 F)과 등록 URL 접속 기록(표 G).
7. 자료 반영 제안. 결과 파일 안에 문장과 JSON 조각으로만 쓴다.

**작업 순서와 시간이 모자랄 때**
- 이 순서로 한다: 표 E → 표 A → 표 B → 표 C → 표 G → 표 D → 표 F → 6절.
- 표 E·A·B·C·G는 빼지 않는다. 표 A·B는 과목 순서대로 채운다.
- 시간이 모자라면 뺄 수 있음(뒤에서부터 뺀다):
  1. 6절의 47개 JSON 조각. Claude가 표 B에서 만든다. 다른 다섯 항목은 짧게라도 쓴다.
  2. 표 F. 현행판 고시 행만 쓰고, C2·C3·C6·기존 C1 정리 행은 뺀다.
  3. 표 D의 ‘자료 후보’ 칸. 20행은 모두 두고 칸에 `-`(시간 부족)를 쓴다.
- 뺀 것은 ‘질문’에 적는다. 검사 스크립트가 보는 표 머리줄과 행(표 D 20행, 표 F 1행 이상)은 남긴다.

**제외**
- 자료·스키마·검사기·문서 수정. 반영은 Claude가 교차 확인한 뒤 W2-0a·W2-0b에서 한다.
- 화면의 교과 연결 표시(CUR-03).
- 47개 밖의 새 연결. 과정·기능, 가치·태도 범주. 융합 선택 과목, 별책20 과학계열 과목, 중학교 과목(DESIGN 590~593행).
- 2015 개정 교육과정 문서.
- 해설서·교과서·민간 정리 자료(나무위키·블로그·학원 자료 등)를 판정 근거로 쓰는 것. 원문을 찾는 길잡이로만 쓴다.
- 시험 파일 만들기.

## 고칠 수 있는 파일

- 새 파일 `docs/ai/tasks/results/TASK-0021.md`.
- `MANIFEST.json`: 손으로 고치지 않는다. `python3 tools/build_package.py --manifest-only`(review_checks의 첫 단계)로만 다시 만든다. 결과 파일이 `docs/` 아래에 있어서 MANIFEST가 바뀌는 것은 정상이다.

이 둘 밖의 파일을 만들거나 고치지 않는다. 내려받은 원문(HWP·HWPX·PDF·ZIP)과 작업 메모를 저장소 안에 두지 않는다.

## 손대지 않을 파일

- 위 둘 밖의 모든 파일. 특히:
  - `data/**`(읽기만), `schemas/**`, `tools/validate_data.py`, `tools/test_validate_data.py`, `tests/**`(`tests/acceptance_cases.json` 포함), `src/**`, `package.json`, `package-lock.json`.
  - `docs/ai/tasks/results/TASK-0020.md`. 같은 S6 자리의 다른 작업이다. 작업 폴더에 있어도 고치지 않는다.
- 공통 금지 파일: `docs/DESIGN_v0.4.md`(검사기가 해시를 본다), `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ai/tasks/README.md`, `docs/ai/WORKFLOW.md`, `docs/ai/tasks/CODEX_PREAMBLE.md`, `README.md`, `START_HERE.md`, `PACKAGE_STATUS.json`, `references/**`.
- 새 npm 의존성을 넣지 않는다. `npm install`·`pip install`을 하지 않는다.

## 지켜야 할 것

- **추정 코드 0건.** 원문에서 직접 본 코드만 적는다. 꼴을 보고 코드를 만들지 않는다. 앞뒤 번호로 짐작하지 않는다. 못 찾으면 ‘없음’과 사유를 적는다.
- **원문의 순위.**
  1. 확정 고시문의 공식 게시: 교육부·국가교육위원회 고시 게시물의 첨부, 국가법령정보센터 행정규칙의 별책. 국가교육과정정보센터(NCIC)도 공식이지만 robots.txt가 막아 열지 않는다(‘미리 확인한 사실’ 10).
  2. 같은 고시 번호의 재게시본(시·도교육청, 대학 등). 판정에 쓸 수 있지만 ‘재게시본’이라고 적는다. 문서 정보(만든 날·파일 이름)가 고시일 전 ‘시안’이면 판정에 쓰지 않는다.
  3. 해설서·교과서·민간 자료. 판정 근거로 쓰지 않는다.
- **검색 요약만으로 판정하지 않는다**(TASK-0003 규칙). 본문을 열어 읽은 것만 ‘일치’·‘같음’이다.
- **웹 접근.**
  - Codex의 웹 검색·열기 도구로만 연다. 셸에서 `curl`·`wget`·파이썬 요청으로 내려받지 않는다.
  - robots.txt가 막는 경로는 열지 않는다. 다른 공식 경로를 찾고, 막힌 사실을 표 G(등록 URL이면)나 ‘설계 판단’(그 밖이면)에 적는다.
  - 사이트를 처음 열 때 그 사이트의 `/robots.txt`를 먼저 연다(사이트마다 한 번). 읽히면 그 규칙을 따른다(`User-agent: *`와 웹 도구 이름에 맞는 줄). 읽히지 않으면(없음·오류·도구 실패) 그 사실을 ‘설계 판단’의 원문 목록에 적고 진행한다. 이미 확인한 사이트는 ‘미리 확인한 사실’ 10을 따른다.
  - 한 사이트에 짧은 시간에 많은 요청을 보내지 않는다.
  - `chainportal.co.kr`에는 접속하지 않는다. 결과 파일에 이 도메인 이름을 적지 않는다(검사 스크립트가 잡는다). 지킨 사실은 ‘금지 도메인 접속 없음’으로 적는다.
- **인용.**
  - 성취기준 문장은 고시 본문이다(저작권법 제7조가 정한 보호받지 못하는 저작물인 고시). 대조를 위해 문장 전체를 원문 그대로 옮긴다. 띄어쓰기·문장부호·괄호도 고치지 않는다.
  - 성취기준 해설과 적용 시 고려 사항은 근거가 되는 부분만 25단어 이내로 옮긴다.
  - 그 밖의 자료는 25단어 이내로만 인용한다.
- **열람일**은 작업 환경의 날짜(`YYYY-MM-DD`)다.
- **자료 ID.** 결과 파일은 시험이 아니므로 CA01·NPC_GUIDE·SOC10 같은 자료 ID를 그대로 쓴다. 새 시험은 만들지 않는다. 학생에게 보일 문장을 제안할 때는 실제 회사 이름을 넣지 않는다.
- **Git.** 커밋·푸시·브랜치 전환을 하지 않는다. `checkout`·`switch`·`stash`·`reset`·`worktree`를 쓰지 않는다. 읽기용 `rev-parse`·`status`·`diff`·`show`만 쓴다.
- **중간 저장.** 표를 과목 순서대로 채우며 결과 파일에 자주 저장한다. 끝까지 못 가면 남은 연결을 ‘확인 불가’(사유: 시간 부족)로 적고 ‘질문’에 그 사실을 적는다.

## 구현 지시

### 0. 시작 기록

- `git rev-parse HEAD`(이것이 기준 커밋이다), `git status --short`(비어 있어야 한다), 날짜.
- `git diff --stat ed2ff03 HEAD -- data schemas tools/validate_data.py docs/DESIGN_v0.4.md docs/DECISIONS.md docs/IMPLEMENTATION_PLAN.md docs/STATUS.md docs/ai/WORKFLOW.md`
  - 출력이 비어 있으면 이 지시서의 줄 번호가 그대로 맞다.
  - 비어 있지 않으면 바뀐 파일의 줄 번호를 절 이름과 문장으로 다시 찾아 쓴다. 바뀐 파일과 새 줄 번호를 ‘설계 판단’에 적는다.
  - `data`가 바뀌었으면 P0 쌍·연결 없는 요소는 ‘테스트’ 1의 스크립트가 자료에서 센 값을 따른다.
- `python3 tools/validate_data.py`의 첫 줄(건수).
- `npx vitest run`의 파일·시험 수. 파이썬 시험 세 개의 시험 수(`python3 tools/art/test_pixel_tools.py`, `python3 -m unittest discover -s scripts -p 'test_*.py'`, `python3 tools/test_validate_data.py`).
- 이 값들을 결과 파일 ‘실행한 검증과 결과’에 적는다.

### 1. 고시 연혁 (표 E)

1. 표 E의 첫 행은 2022-33(2022-12-22) 자체다. 그 뒤에 「초·중등학교 교육과정」을 바꾼 **확정 고시**를 모두 찾는다. 교육부와 국가교육위원회를 모두 본다. 국가법령정보센터 행정규칙의 연혁도 본다.
2. 고시마다 다음을 적는다.
   - 고시 번호, 발령 기관, 고시일, 시행일.
   - 바뀐 문서: 총론(별책1)인지, 어느 별책인지.
   - 별책6·7·9의 고등학교 과목에 영향이 있는지. ‘없음’, ‘있음(과목·내용)’, ‘확인 불가’ 가운데 하나.
3. 행정예고·공고안도 찾으면 적는다. 판정은 ‘예고만’이다. 현행판으로 치지 않는다.
4. **현행판 정의(기본값):** 열람일에 확정·고시된 가장 최근 판이다. 시행일이 열람일 뒤면 그 사실을 적는다.
5. 표 E 판정: `확인(원문)`(고시문·개정문을 열어 읽음), `예고만`, `검색 요약만`, `확인 불가`.

### 2. 2022-33 원문 확보

- 별책6·7·9 원문을 연다. 공식 HWP를 웹 도구로 못 읽으면, 같은 고시의 공식 PDF·웹 본문(국가법령정보센터 행정규칙의 별책 등)을 찾는다. NCIC는 열지 않는다. 그래도 없으면 재게시본을 쓰고 그렇게 적는다.
- 쓴 원문마다 URL·형식·전체 쪽수·인쇄쪽과 PDF 쪽의 차이를 ‘설계 판단’에 적는다.
- 재게시본은 표지의 고시 번호와 문서 정보(만든 날·파일 이름)를 확인한다. ‘미리 확인한 사실’ 4를 본다.

### 3. 내용 요소·쪽 대조 (표 A 앞쪽 칸)

- 연결마다 `knowledge_elements`를 해당 과목의 내용 체계 표 ‘지식·이해’ 칸과 대조한다.
- 원문 요소 판정:
  - `일치`: 모든 요소가 원문과 글자까지 같다.
  - `부분`: 우리 요소가 원문의 긴 요소 가운데 일부다(`curriculum_links.json` 24행 주의 문장). ‘원문 요소’ 칸에 원문 전체를 적는다.
  - `불일치`: 글자가 다르거나 그 과목에 없다. 원문 값과 수정안을 적는다.
  - `확인 불가`: 이유를 적는다.
- 인쇄쪽은 본문 아래 찍힌 쪽 번호다. PDF 쪽 번호와 섞지 않는다. 우리 `printed_page`와 원문 인쇄쪽이 다르면 둘 다 적는다.

### 4. 성취기준 코드 (표 B)

- 각 연결의 과목에서, 그 요소가 있는 영역의 성취기준을 읽는다.
- 근거 종류는 셋이다.
  - `직접`: 성취기준 문장에 요소의 핵심어가 들어 있다. ‘근거 핵심어’ 칸에 그 말을 적는다.
  - `해설`: 문장에는 없고, 같은 성취기준의 ‘성취기준 해설’이나 ‘적용 시 고려 사항’에 있다. 근거 핵심어와 짧은 인용을 적는다.
  - `영역`: 같은 영역의 성취기준이지만 문장·해설에 핵심어가 없다. 후보일 뿐이다.
- 행 규칙:
  - 연결에 `직접`·`해설` 행이 하나라도 있으면 `영역` 행은 쓰지 않는다.
  - 둘 다 없을 때만, 그 영역의 성취기준을 모두 `영역` 행으로 쓴다.
  - 성취기준을 하나도 찾지 못하면 코드 칸에 `없음`, 문장 칸에 사유를 적은 행 하나만 둔다.
- 요소가 둘 이상인 연결은 요소마다 찾는다. ‘근거 핵심어’ 칸에 어느 요소의 말인지 함께 적는다.
- 같은 코드가 여러 연결에 걸리면 연결마다 행을 쓴다. 같은 코드·같은 판본의 문장은 모든 행에서 같아야 한다.
- 코드 칸에는 대괄호를 포함한 코드만 쓴다. 백틱으로 감싸지 않는다.
- ‘성취기준 인쇄쪽’은 문장이 실린 쪽의 인쇄쪽 숫자다. 쪽 번호가 없는 웹 본문에서만 문장을 보았으면 `확인 불가`로 적고 ‘질문’에 그 행을 적는다. 쪽을 짐작하지 않는다.
- ‘판본’ 칸은 문장을 옮긴 고시 번호다. 현행판과 2022-33의 문장이 같으면 현행판 번호를 쓴다. 다르면 두 판을 각각 한 행씩 쓴다.
- 가능하면 같은 문장을 다른 도메인(시·도교육청 재게시본 등)에서도 찾아, ‘확인한 URL’ 칸에 두 번째 링크로 넣는다. Claude 교차 확인에 쓴다(‘미리 확인한 사실’ 10).

### 5. 현행판 대조 (표 A 뒤쪽 칸)

- 현행판 판정:
  - `같음`: 아래 (가)나 (나)로 확인했다.
    - (가) 현행 별책 본문을 열어, 그 요소와 표 B의 성취기준 문장이 2022-33과 같음을 보았다.
    - (나) 2022-33 뒤의 모든 확정 개정 고시에서 개정 내용(개정문·신구 대비표)을 열어, 그 별책의 그 과목이 바뀌지 않았음을 보았다.
    - ‘현행판 변경 내용’ 칸에 `(가)` 또는 `(나) 고시 번호들`을 적는다.
    - 표 E에 `검색 요약만`·`확인 불가`인 확정 고시가 하나라도 있으면 (나)는 쓸 수 없다. (가)로만 `같음`이 된다.
  - `바뀜`: 요소·과목 이름·성취기준 문장·코드 가운데 하나라도 바뀌었다. 무엇이 어떻게 바뀌었는지 적는다.
  - `확인 불가`: 이유를 적는다.
- 제안 `edition_comparison_status`는 판정에 따라 정해진다. `같음`→`current_edition_same`, `바뀜`→`current_edition_changed`, `확인 불가`→`current_edition_not_verified`. 이 이름은 Claude가 정한 제안 어휘다.

### 6. P0 쌍 (표 C)

- ‘미리 확인한 사실’ 7의 7쌍(검사 스크립트가 자료에서 센 쌍)을 모두 적는다.
- 항목의 문장 칸(제목·관찰·정보 범위·요청 문장 등)과, 그 연결의 성취기준 문장(표 B)을 나란히 읽고 판정한다.
  - `P0 내용으로 다룸`: 항목 문장이 그 성취기준의 핵심어를 P0 내용으로 다룬다. 근거에 항목 문장 위치(파일:줄)와 성취기준 코드를 적는다. 이때 문제는 연결의 priority 표지 쪽이다.
  - `P1 확장 연결`: 항목 문장은 그 성취기준의 일부와만 닿는다. 깊은 내용은 P1 이야기다.
  - `근거 없음`: 항목 문장에 그 성취기준과 이어지는 말이 없다.
- ‘대안 연결 후보’: 47개 가운데 P0 표지가 있는 연결 중에서, 항목 문장과 성취기준 문장이 맞는 것. 연결 ID와 코드를 적는다. 없으면 `없음`.
- 표 아래에 DECISIONS 772행 교사용 메모가 평택 전 상태라는 점과, 지금 상태로 고친 문장 제안을 적는다. DECISIONS는 고치지 않는다.

### 7. 연결 없는 요소 (표 D)

- ‘미리 확인한 사실’ 9의 20개(검사 스크립트가 자료에서 센 것)를 모두 적는다.
- 칸: priority, 성취기준 코드(표 B에서, 여럿이면 쉼표), 자료 후보, 의견.
- 자료 후보: `data/*.json`에서 그 성취기준과 이어질 만한 항목. 파일:줄과 항목 ID를 적는다. 연결마다 3개까지. 없으면 `없음`.
- 의견 예: ‘P2라 지금 연결이 없어도 된다’, ‘P0 보고(ETH04·05)인데 연결이 없다’, ‘M3 사건 뒤에 연결할 후보’.

### 8. 출처 (표 F·표 G)

- **표 G 등록 URL 접속 기록:** 아래 주소를 모두 열어 본 결과를 적는다. 서로 다른 주소는 7개다. 같은 주소는 한 행에 등록 위치를 함께 적는다.
  - `curriculum_links.json`의 `official_notice_url`, `official_archive_url`(43~84행). 연결 47개의 `source_url`은 `official_notice_url`과 같은 주소다.
  - `sources.json`의 `C1-SOC`·`C1-SCI`·`C1-ETH` URL(15~47행). DESIGN 804행과 같은 주소다.
  - DESIGN의 C1 원문 ZIP(805행), C2·C3·C6 재게시본(808·810·816행).
- **표 F 출처 기록 제안:** `sources.json`에 더하거나 고칠 항목을 제안한다.
  - 현행판 고시(2022-33 뒤의 확정 고시마다 하나).
  - C2·C3·C6(쪽 참고용 재게시본). 시안 의심이 있으면 그렇게 적는다.
  - 기존 C1 3건의 확인 수준과 URL 정리.
  - `verification_status`는 `sources.json`에 이미 있는 값만 쓴다(예: `CONTENT_READ`, `SELECTED_SECTIONS_READ`, `SUMMARY_READ`, `WEB_SEARCH_SUMMARY_ONLY`). `kind`는 `official_curriculum`을 쓴다.

### 9. 반영 제안 (결과 파일 6절)

아래는 Claude가 W2-0a·W2-0b에서 정할 일의 재료다. 제안으로만 쓴다.

1. 연결마다 넣을 성취기준 칸의 제안 꼴. `직접`·`해설` 행만 넣는다. `영역` 행은 넣지 않는다.
   ```json
   "achievement_standards": [
     {"code": "<원문 코드>", "basis": "direct", "printed_page": 0, "edition": "<고시 번호>"}
   ]
   ```
   `basis`는 `direct`(직접) 또는 `commentary`(해설)다. 인쇄쪽이 `확인 불가`면 `null`로 쓴다. 연결 47개 모두의 JSON 조각을 한 코드 블록에 적는다.
   - DESIGN 752행은 CurriculumRef를 ‘성취기준 코드와 분리’한다. 이 제안은 연결 ID·내용 요소를 그대로 두고 코드를 별도 칸에 둔다. 최상위 `achievement_standards` 목록(코드마다 한 번, 연결 ID를 가리킴)이 더 맞다고 보면 그 대안과 이유도 적는다. 어느 쪽인지는 Claude가 정한다.
2. 머리 칸 제안: `current_edition_comparison_status`(47개가 모두 `같음`·`바뀜`이면 `completed`, 아니면 `partial`), 현행판 고시 번호와 확인일을 담을 칸, `scope.achievement_standard_codes_included`(47개 모두 `직접`·`해설` 코드가 있거나 `없음` 사유가 있을 때만 `true`).
3. `edition_comparison_status` 47개의 제안 값(표 A와 같음).
4. P0 쌍 7개의 처리안(표 C 판정에 따라 ‘연결 빼기’·‘대안으로 바꾸기’·‘유지하고 P1 표시’). 검사기 규칙 문장 제안: ‘P0 항목의 `curriculum_refs`는 `priority`에 P0로 시작하는 표지가 있는 연결만 가리킨다’와 그 예외 목록.
5. 역방향 `activity_ids`(‘미리 확인한 사실’ 8)를 모든 항목에 채울지, 없앨지에 대한 의견과 이유.
6. `printed_page`·요소 문구의 수정안(표 A의 `불일치`만). `pdf_page = printed_page + 6` 검사와 어떻게 맞출지도 적는다. JSON 값을 바꾸면 DESIGN 17·18절 표와 달라진다(‘미리 확인한 사실’ 2). DESIGN은 검사기가 해시를 보는 파일이라 Claude 결정 없이 고칠 수 없다. 수정안마다 DESIGN 표도 고쳐야 하는지 적는다.

## 결과 파일 형식

`docs/ai/tasks/results/TASK-0021.md`. 공통 머리말의 형식을 따르고, 아래 절과 표 머리줄을 **그대로** 쓴다. 표 제목(`### 표 A` 등) 아래에는 표 하나만 둔다. 칸 안에 `|`를 쓰지 않는다(필요하면 `/`를 쓴다). ‘테스트’의 검사 스크립트가 이 형식을 읽는다.

````
# TASK-0021 결과
- 모델: gpt-6.1-sol
- 기준 커밋: <git rev-parse HEAD 전체>
- 열람 기간: <YYYY-MM-DD ~ YYYY-MM-DD>

## 바꾼 파일
## 설계 판단
## 실행한 검증과 결과

## 1. 현행 판본
### 표 E 고시 연혁
| 고시 번호 | 발령 기관 | 고시일 | 시행일 | 바뀐 문서 | 별책6·7·9 고등 과목 영향 | 확인한 URL | 열람일 | 판정 |
|---|---|---|---|---|---|---|---|---|

## 2. 47개 연결 대조
### 표 A 내용 요소·쪽·현행판
| ID | 과목 | 우리 내용 요소 | 원문 요소 판정 | 원문 요소(부분·불일치일 때) | 우리 인쇄쪽 | 원문 인쇄쪽 | 현행판 판정 | 현행판 변경 내용 | 제안 edition_comparison_status | 확인한 URL | 열람일 |
|---|---|---|---|---|---|---|---|---|---|---|---|

### 표 B 성취기준 코드
| 연결 ID | 성취기준 코드 | 성취기준 문장(원문 그대로) | 근거 종류 | 근거 핵심어 | 성취기준 인쇄쪽 | 판본 | 확인한 URL | 열람일 |
|---|---|---|---|---|---|---|---|---|

## 3. P0 항목의 P1 연결
### 표 C P0 쌍
| 자료 | 항목 ID | 단계 | 연결 ID | 연결 priority | 판정 | 대안 연결 후보 | 근거 |
|---|---|---|---|---|---|---|---|

## 4. 연결 없는 요소
### 표 D 연결 없는 요소
| 연결 ID | priority | 성취기준 코드 | 자료 후보(파일:줄) | 의견 |
|---|---|---|---|---|

## 5. 출처
### 표 F 출처 기록 제안
| 제안 id | 대상 | title | url | kind | verification_status | checked_on | 근거 |
|---|---|---|---|---|---|---|---|

### 표 G 등록 URL 접속 기록
| 등록 위치(파일:줄) | URL | 접속 결과 | 대체 URL | 열람일 |
|---|---|---|---|---|

## 6. 반영 제안
## 판정 집계
## 완료 조건 대조
## 범위 밖 발견
## 질문
````

- 표 A는 47행, 연결 ID 순서는 `curriculum_links.json`의 순서다.
- 빈 칸은 `-`로 적는다. 다만 판정·코드·URL·열람일 칸은 위 규칙대로 채운다.
- ‘판정 집계’에는 표 A의 원문 요소 판정별·현행판 판정별 개수, 표 B의 근거 종류별 행 수와 `없음` 연결 수, 표 C의 판정별 개수를 적는다.

## 테스트

새 시험 파일은 만들지 않는다. 아래를 실행하고 출력을 결과 파일에 붙인다.

**1. 결과 파일 형식 검사.** 저장소 맨 위 폴더에서 그대로 실행한다. 파일로 저장하지 않는다. 마지막 줄이 `OK`여야 한다. 스크립트가 맞지 않는다고 보이면 스크립트를 바꾸지 말고 ‘질문’에 적는다.

```
python3 - <<'EOF'
import json, re, sys
from pathlib import Path
root = Path('.')
text = (root / 'docs/ai/tasks/results/TASK-0021.md').read_text(encoding='utf-8')
links = {l['id']: l for l in json.loads((root / 'data/curriculum_links.json').read_text(encoding='utf-8'))['links']}
ids = set(links)
def rows(title):
    m = re.search(r'^### ' + re.escape(title) + r'\b.*?$(.*?)(?=^#{2,3} |\Z)', text, re.M | re.S)
    if not m:
        return None
    out = [[c.strip() for c in line.strip().strip('|').split('|')]
           for line in m.group(1).splitlines()
           if line.startswith('|') and not re.match(r'^\|\s*:?-', line)]
    return out[1:]  # 머리줄 제외
errors = []
date = re.compile(r'^\d{4}-\d{2}-\d{2}$')
A = rows('표 A')
if A is None:
    errors.append('표 A 없음')
else:
    seen = [r[0] for r in A]
    if sorted(seen) != sorted(ids):
        errors.append(f'표 A 연결 ID: 빠짐 {sorted(ids - set(seen))}, 중복·낯선 것 {sorted({x for x in seen if seen.count(x) > 1 or x not in ids})}')
    pair = {'같음': 'current_edition_same', '바뀜': 'current_edition_changed', '확인 불가': 'current_edition_not_verified'}
    for r in A:
        if len(r) != 12: errors.append(f'표 A {r[0]}: 칸 수 {len(r)}'); continue
        if r[3] not in {'일치', '부분', '불일치', '확인 불가'}: errors.append(f'표 A {r[0]}: 원문 요소 판정 {r[3]}')
        if r[7] not in pair: errors.append(f'표 A {r[0]}: 현행판 판정 {r[7]}')
        elif r[9] != pair[r[7]]: errors.append(f'표 A {r[0]}: 제안 상태 {r[9]}가 판정 {r[7]}와 맞지 않음')
        if (r[3], r[7]) != ('확인 불가', '확인 불가'):
            if 'http' not in r[10]: errors.append(f'표 A {r[0]}: URL 없음')
            if not date.match(r[11]): errors.append(f'표 A {r[0]}: 열람일 {r[11]}')
B = rows('표 B')
if B is None:
    errors.append('표 B 없음')
else:
    covered, kinds, sentence = set(), {}, {}
    for r in B:
        if len(r) != 9: errors.append(f'표 B {r[0]}: 칸 수 {len(r)}'); continue
        if r[0] not in ids: errors.append(f'표 B 낯선 연결 ID {r[0]}'); continue
        covered.add(r[0])
        if r[1] == '없음':
            if not r[2] or r[2] == '-': errors.append(f'표 B {r[0]}: 없음의 사유 없음')
            kinds.setdefault(r[0], set()).add('없음')
            continue
        if not re.match(r'^\[[^\[\]\s`]+\]$', r[1]): errors.append(f'표 B {r[0]}: 코드 형식 {r[1]}')
        if r[3] not in {'직접', '해설', '영역'}: errors.append(f'표 B {r[0]} {r[1]}: 근거 종류 {r[3]}')
        kinds.setdefault(r[0], set()).add(r[3])
        if not r[2] or r[2] == '-': errors.append(f'표 B {r[0]} {r[1]}: 문장 없음')
        key = (r[1], r[6])
        if key in sentence and sentence[key] != r[2]: errors.append(f'표 B {r[1]}({r[6]}): 같은 코드의 문장이 행마다 다름')
        sentence.setdefault(key, r[2])
        if not re.match(r'^(\d+|확인 불가)$', r[5]): errors.append(f'표 B {r[0]} {r[1]}: 인쇄쪽 {r[5]}')
        if 'http' not in r[7]: errors.append(f'표 B {r[0]} {r[1]}: URL 없음')
        if not date.match(r[8]): errors.append(f'표 B {r[0]} {r[1]}: 열람일 {r[8]}')
    if covered != ids: errors.append(f'표 B에 없는 연결: {sorted(ids - covered)}')
    for link, ks in kinds.items():
        if '영역' in ks and ks & {'직접', '해설'}: errors.append(f'표 B {link}: 직접·해설 행이 있는데 영역 행도 있음')
        if '없음' in ks and len(ks) > 1: errors.append(f'표 B {link}: 없음 행과 코드 행이 함께 있음')
# P0 항목이 P0 표지 없는 연결을 가리키는 쌍과, 어느 자료도 가리키지 않는 연결은 자료에서 센다.
pairs, used = set(), set()
for name in ['culture_activities', 'contacts', 'venues', 'events']:
    for item in json.loads((root / f'data/{name}.json').read_text(encoding='utf-8'))['items']:
        for ref in item.get('curriculum_refs', []):
            if item.get('stage') == 'P0' and not any(p.startswith('P0') for p in links[ref]['priority']):
                pairs.add((item['id'], ref))
for path in sorted((root / 'data').glob('*.json')):
    if path.name != 'curriculum_links.json':
        used |= set(re.findall(r'"((?:SOC|SCI|ETH)\d{2})"', path.read_text(encoding='utf-8')))
C = rows('표 C')
if C is None:
    errors.append('표 C 없음')
else:
    got = {(r[1], r[3]) for r in C if len(r) == 8}
    if got != pairs: errors.append(f'표 C 쌍: 빠짐 {sorted(pairs - got)}, 남음 {sorted(got - pairs)}')
    for r in C:
        if len(r) != 8: errors.append(f'표 C 칸 수 {len(r)}: {r[:2]}')
        elif r[5] not in {'P0 내용으로 다룸', 'P1 확장 연결', '근거 없음'}: errors.append(f'표 C {r[1]}→{r[3]}: 판정 {r[5]}')
D = rows('표 D')
if D is None:
    errors.append('표 D 없음')
else:
    got = {r[0] for r in D}
    if got != ids - used: errors.append(f'표 D: 빠짐 {sorted((ids - used) - got)}, 남음 {sorted(got - (ids - used))}')
E = rows('표 E')
if not E or not any('2022-33' in r[0] for r in E): errors.append('표 E에 2022-33 행 없음')
for title in ['표 F', '표 G']:
    if not rows(title): errors.append(f'{title} 없음 또는 빈 표')
if 'chainportal' in text.lower(): errors.append('금지 도메인이 적혀 있음')
print(f'자료 기준: P0 쌍 {len(pairs)}개, 연결 없는 요소 {len(ids - used)}개')
print('\n'.join(errors) if errors else 'OK')
sys.exit(1 if errors else 0)
EOF
```

- `ed2ff03` 자료에서는 첫 줄이 `자료 기준: P0 쌍 7개, 연결 없는 요소 20개`다. 다르면 기준 커밋을 확인하고 그 값을 적는다.
- Claude가 이 스크립트를 가짜 결과 파일로 돌려 보았다. 바른 파일에서 `OK`, 코드 꼴 오류·쌍 누락·판정과 제안 상태 불일치·같은 코드의 다른 문장·영역과 직접 행 섞임·인쇄쪽 꼴 오류(`12쪽`)를 각각 잡았다. 인쇄쪽 `확인 불가`는 통과한다.

**2. 바꾼 범위.**
- `git status --short`에 결과 파일(`??`)과 `MANIFEST.json`(` M`)만 보인다.
- `git diff --quiet <기준 커밋> -- data schemas tools src tests scripts public index.html package.json package-lock.json docs/DESIGN_v0.4.md docs/STATUS.md docs/DECISIONS.md docs/IMPLEMENTATION_PLAN.md docs/ai/tasks/README.md docs/ai/WORKFLOW.md docs/ai/tasks/CODEX_PREAMBLE.md README.md START_HERE.md PACKAGE_STATUS.json references`의 종료 코드가 0이다.

**3. 마감 검증.** `bash tools/ai/review_checks.sh <기준 커밋>`의 검사가 모두 통과한다(작성 때 8개).
- 자료 검사 건수는 시작 때보다 2 많다(결과 파일 1개). 다른 수면 이유를 적는다.
- vitest 파일·시험 수와 파이썬 시험 세 개의 수는 시작 때와 같다.
- 이 작업은 코드를 바꾸지 않는다. 실패하면 기대값을 건드리지 말고 출력 첫 줄과 함께 보고한다.

## 예상 질문과 기본값

Codex는 실행 중에 물을 수 없다. 아래 기본값대로 하고, 다르게 해야 할 이유가 있으면 ‘질문’에 적는다.

| 질문 | 기본값 |
|---|---|
| 공식 HWP를 웹 도구로 못 연다 | 같은 고시의 공식 PDF·웹 본문(국가법령정보센터 등)을 찾는다. 없으면 재게시본으로 대조하고 ‘재게시본’이라고 적는다. 시안 의심 문서는 쓰지 않는다. |
| NCIC가 가장 좋은 원문으로 보인다 | 열지 않는다(robots.txt `Disallow: /`). 검색 요약은 길잡이로만 쓴다. 같은 문서를 국가법령정보센터·교육부·국가교육위원회·시·도교육청에서 찾는다. |
| ‘현행판’은 어느 판인가 | 열람일에 확정·고시된 가장 최근 판. 시행일이 뒤면 그 사실을 적는다. 행정예고안은 현행판이 아니다(표 E ‘예고만’). |
| 2022-33 뒤 확정 개정 고시가 하나도 없다 | 공식 연혁(국가법령정보센터 행정규칙 연혁, 교육부·국가교육위원회 고시 목록)을 열어 확인했을 때만 그렇게 적는다. 그러면 현행판은 2022-33이고, 47개는 (나)로 `같음`이 될 수 있다. ‘현행판 변경 내용’에 `(나) 개정 없음`과 연혁 URL을 적는다. 연혁을 못 열었으면 `확인 불가`. |
| 개정 고시가 총론만 바꿨다 | 별책6·7·9 영향 ‘없음’. 그 근거로 개정문을 열었으면 47개 연결은 (나)로 `같음`이 될 수 있다. 개정문을 못 열었으면 `확인 불가`. |
| 고시 번호를 검색 요약에서만 봤다 | 표 E 판정 `검색 요약만`. 현행판 판정의 근거로 쓰지 않는다. |
| 요소의 핵심어가 성취기준 문장에 없다 | `해설`이나 `영역`으로 적는다. 코드를 만들지 않는다. |
| 한 연결에 맞는 성취기준이 여럿이다 | 모두 행으로 적는다. 고르지 않는다. |
| 과목 이름이 바뀌었거나 과목이 없어졌다 | 표 A 현행판 `바뀜`과 내용. 우리 값은 고치지 않는다. |
| 우리 인쇄쪽이 틀렸다 | 표 A `원문 인쇄쪽`에 원문 값, 6절에 수정안. `pdf_page` 검사(+6)와의 관계도 적는다. |
| PDF마다 쪽이 다르다 | 인쇄쪽(본문 아래 번호)을 쓴다. PDF 쪽과 차이는 ‘설계 판단’에 적는다. |
| 표 C 판정이 애매하다 | `P1 확장 연결`. 이유를 근거 칸에 적는다. |
| 표 D의 자료 후보를 얼마나 찾나 | 연결마다 3개까지. `data/*.json`에서만 찾는다. 새 항목을 지어내지 않는다. |
| 웹 도구가 실패한다(캐시 없음·내부 오류·403) | 그 URL은 표 G에 실패로 적는다. 사이트의 삭제로 판정하지 않는다. 다른 공식 경로를 찾는다. |
| robots.txt가 막는다 | 열지 않는다. 다른 공식 경로를 찾고 표 G(등록 URL)나 ‘설계 판단’(그 밖)에 적는다. |
| robots.txt를 읽을 수 없다(없음·오류·도구 실패) | 그 사실을 ‘설계 판단’의 원문 목록에 적고 진행한다. NCIC처럼 이미 막힘을 확인한 곳은 열지 않는다. |
| 2015 개정 문서가 검색에 섞인다 | 쓰지 않는다. 표지·고시 번호로 2022 개정인지 확인한다. |
| 검사 스크립트의 코드 정규식에 원문 코드가 안 맞는다 | 코드를 바꾸지 않는다. 원문 그대로 적고, 스크립트 오류를 ‘질문’에 적는다. |
| `MANIFEST.json`이 바뀌었다 | 정상이다. 결과 파일이 `docs/` 아래에 있다. 손으로 고치지 않는다. |
| review_checks의 검사 수가 8이 아니다 | 기준에 다른 작업(검증 도구)이 먼저 들어와 검사가 늘었을 수 있다. 모든 검사가 통과하면 된다. 검사 이름과 수를 적는다. |
| vitest·빌드가 샌드박스에서 실패한다 | 이 작업은 코드를 바꾸지 않는다. 고치려 하지 말고 오류 첫 줄과 함께 보고한다. `CODEX_SANDBOX`·권한 설정을 바꾸려 하지 않는다. |
| `docs/ai/tasks/results/TASK-0020.md`가 작업 폴더에 있다 | 고치지 않는다. 이 작업과 무관하다. |
| 자료의 오류를 발견했다(문구 오타·ID 오류 등) | 고치지 않는다. 교과 연결에 관한 것은 6절, 그 밖은 ‘범위 밖 발견’에 적는다. |
| 결과 파일이 너무 길다 | 표를 나누지 않는다. 표 하나에 과목 순서대로 적는다. 인용은 정해진 길이만 쓴다. |
| 시간이 모자란다 | ‘범위’의 작업 순서를 따른다. 뺄 수 있는 것(6절 JSON 조각 → 표 F 일부 → 표 D 자료 후보 칸)부터 뺀다. 표 A·B에서 못 끝낸 연결은 `확인 불가`(사유: 시간 부족)로 두고 ‘질문’에 적는다. |

## 완료 조건

1. **표 E:** 2022-33 행과, 찾은 확정 개정 고시가 모두 있다. 행정예고는 `예고만`이다. 각 행에 URL·열람일·판정이 있다.
2. **표 A:** 47행 모두 원문 요소 판정과 현행판 판정이 있다. `같음`에는 (가)·(나) 근거가 있다. `불일치`·`바뀜`에는 원문 값이 있다. `확인 불가`에는 이유가 있다.
3. **표 B:** 47개 연결이 모두 하나 이상의 행을 가진다. 코드 행마다 원문 문장·근거 종류·인쇄쪽(못 찾았으면 `확인 불가`와 ‘질문’ 기록)·판본·URL·열람일이 있다. 결과 보고 ‘설계 판단’에 ‘모든 코드는 원문에서 직접 보았다’는 확인과, 코드를 본 원문 목록을 적는다.
4. **표 C:** 검사 스크립트가 센 7쌍이 모두 있고 판정이 있다. DECISIONS 772행의 낡은 점과 고친 문장 제안이 있다.
5. **표 D:** 검사 스크립트가 센 20개가 모두 있다.
6. **표 F·G:** 표 G에 서로 다른 등록 URL 7개(‘구현 지시’ 8)의 접속 결과가 있다. 표 F에 출처 제안이 있다(시간이 모자라면 현행판 고시 행만, ‘범위’).
7. **6절 반영 제안:** ‘구현 지시’ 9의 여섯 항목이 있다. 47개 연결의 JSON 조각이 한 코드 블록에 있다(시간이 모자라 뺐으면 ‘질문’에 적었다).
8. ‘테스트’ 1의 출력 마지막 줄이 `OK`다.
9. ‘테스트’ 2의 범위 조건을 지켰다.
10. ‘테스트’ 3의 마감 검증이 모두 통과한다(작성 때 8종). 시작·끝 수치를 적었다.
11. ‘판정 집계’가 표와 맞는다.

**Claude 검수 때 할 일(Codex는 하지 않는다):**
- 검사 스크립트를 다시 돌린다.
- 표 B 표본 대조. 과목군(사회·윤리·과학)마다 3개 이상, `직접`·`해설` 행의 10% 이상을 무작위로 고른다.
  - 과학: C3 PDF 본문(Claude 환경에서 열림)과 공식 판의 문장을 비교한다. C3는 시안일 수 있으니 차이가 나오면 공식 판을 따른다.
  - 사회·윤리: C2·C6 PDF(Claude 셸에서 받음)의 문장과 비교한다. 그 밖의 재게시본은 문장 그대로의 검색으로 확인한다.
  - 원문에 없는 코드가 하나라도 나오면 반려한다(DESIGN 588행).
- 표 E의 고시 번호를 두 출처 이상에서 확인한다.
- 교차 확인된 항목만 넘긴다. 검사기 P0 규칙은 W2-0a, 자료(`curriculum_links.json`·`sources.json`·연결을 가리키는 자료)는 W2-0b, DECISIONS 772행 교사용 메모와 STATUS 36행은 Claude가 고친다.

## 결과 보고

`docs/ai/tasks/results/TASK-0021.md`에 ‘결과 파일 형식’대로 쓴다. 공통 머리말의 절도 모두 넣는다.

- **바꾼 파일:** 결과 파일, `MANIFEST.json`(스크립트로 다시 만듦). 그 밖은 없음.
- **설계 판단:** 쓴 원문 목록(URL·형식·쪽수·인쇄쪽과 PDF 쪽 차이), 재게시본을 쓴 곳과 이유, 현행판 정의를 적용한 방식, ‘모든 코드는 원문에서 직접 보았다’는 확인.
- **실행한 검증과 결과:** 시작·끝의 자료 검사 건수, vitest 파일·시험 수, 파이썬 시험 수. ‘테스트’ 1·2·3의 출력.
- **완료 조건 대조:** 조건마다 충족·미충족과 근거.
- **범위 밖 발견:** 고치지 않은 문제. 예: 교과 연결과 무관한 자료 문구, 다른 문서의 낡은 문장.
- **질문:** 기본값으로 처리했지만 Claude의 확인이 필요한 것. `확인 불가`로 남긴 연결과 이유, 표 C에서 애매했던 판정, 검사 스크립트와 원문이 안 맞은 곳. 없으면 ‘없음’.
