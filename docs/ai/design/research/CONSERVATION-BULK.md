# 실재 동물 동료 31종 CITES·IUCN 일괄 대조 (TASK-0047)

- 작성: 세션 C, 2026-10-11. 열람일은 모두 2026-10-11.
- 대상: `data/characters.json`에서 `conservation`이 있는 동료 41종 가운데 [TASK-0046](CONSERVATION-RECHECK.md)에서 다룬 10종을 뺀 31종의 `iucn_status`·`cites_appendix`.
  - 국외 법정 보호(중국 국가 1급, 일본 특별천연기념물)는 범위 밖이다.
- 착수 근거: 허브가 전한 사용자 지시 “다른 세션들도 중단된 거 다 풀어라”(2026-10-11). TASK-0046 5절에서 다음 작업 후보로 올렸다.
- 자료 반영: 하지 않았다. 수정안은 4절에 있다. `characters.json` 반영 주체는 TASK-0046 [질문]으로 사용자 결정을 기다린다.

## 요약

- **IUCN:**
  - 31종 가운데 29종이 우리 값과 같다(Red List 2026-1).
  - 이리오모테살쾡이(EMP20)는 IUCN 데이터셋에 아종 평가가 없어 확인 불가다.
  - 극락조(EMP35)는 대표 종이 정해지지 않아 판정하지 않았다.
- **CITES: 31종 가운데 15종이 불일치다.**
  - 14종은 우리 값이 null인데 실제로는 부속서 Ⅰ 또는 Ⅱ에 있다.
  - 1종(고래상어)은 Ⅱ로 적었으나 현행 국내 고시는 **Ⅰ**이다.
  - 나머지 16종은 일치한다.
- **원인:** `cites_appendix: null`이 ‘미등재’와 ‘확인하지 않음’을 함께 뜻하고 있다.
  - TASK-0046의 4건과 합치면 실재 동물 41종 가운데 **19종의 CITES 값이 틀렸다.**
  - 특히 영장류 4종(일본원숭이·델라쿠르랑구르·래플스반다랑구르·붉은다리두크원숭이)과 들창코원숭이가 빠져 있었다. 이들은 ‘영장목 전종’ 같은 상위 분류군 등재로 들어간다. 종 이름만 찾으면 놓치는 유형이다.
- **최근 변경 2건:** 둘 다 2026-03-05 시행 국내 고시의 표 셀 위치로 확인했다.
  - 고래상어가 부속서 Ⅰ에 있다.
  - 알바트로스(*Phoebastria albatrus*)는 부속서 Ⅱ에 있다.
  - 작성자가 알던 등재(고래상어 Ⅱ, 알바트로스 Ⅰ)와 다르다. 고시 개정이 CITES 당사국총회 결과를 반영한 것으로 보이지만, 사무국 원문은 robots.txt 때문에 읽지 않았으므로 **‘국내 고시 기준’**으로만 적는다.

## 1. 원문과 방법

| 기호 | 원문 | 비고 |
|---|---|---|
| G | IUCN Red List Version 2026-1, IUCN 발행 GBIF 데이터셋([doi:10.15468/0qnb58](https://doi.org/10.15468/0qnb58)) | `api.gbif.org` 종 일치 → `iucnRedListCategory`. 동의어로 잡힌 학명(말레이맥)은 같은 데이터셋 안에서 이름으로 다시 찾았다 |
| C | 「국제적멸종위기종 목록」 기후에너지환경부고시 제2026-63호 [별표], 시행 2026-03-05 | [행정규칙](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000275380). HWPX(`flSeq=162188143`, SHA-256 `a622ca9c69c998e3a84ea6c71c02a21aa5223357a5838be73dccbab627585cc0`)의 표 셀 열 번호로 부속서를 읽었다 |

- **C를 읽은 방법:**
  - 표는 열 0이 ‘구분’(목·과), 열 1이 부속서 Ⅰ, 열 2가 Ⅱ, 열 3이 Ⅲ이다. 머리 셀 ‘부속서 Ⅰ/Ⅱ/Ⅲ’의 `colAddr`로 확인했다.
  - 처음에는 PDF 글자 위치로 읽었다. 그런데 쪽마다 열 폭이 달라 고래상어·알바트로스에서 판정이 흔들렸다. 그래서 HWPX의 셀 주소로 다시 판정했다.
  - 알려진 등재(말레이천산갑 Ⅰ, 영장목 전종 Ⅱ, 흰뿔쇠찌르레기 Ⅰ)로 열 대응을 검산했다.
- **상위 분류군 등재:** 종 이름이 없으면 속·과·목 ‘전종’ 행과 그 단서(‘부속서 I에 포함된 종 제외’ 등)를 따랐다.
- **학명은 동료 note의 설명으로 정했다.** 예: ‘얼룩코뿔새’ → *Anthracoceros albirostris*, ‘도리시마·신천옹’ → *Phoebastria albatrus*, ‘인도태평양혹등돌고래’ → *Sousa chinensis*.
  - 학명 대응이 틀리면 판정도 틀린다. 그래서 표에 학명을 함께 적었다.

## 2. 종별 판정

| 동료 | 종(학명) | IUCN 우리/G | 판정 | CITES 우리/C | 판정 | C의 근거 행 |
|---|---|---|---|---|---|---|
| EMP15 | 대왕판다 *Ailuropoda melanoleuca* | VU/VU | 일치 | I/Ⅰ | 일치 | 종 |
| EMP16 | 황금들창코원숭이 *Rhinopithecus roxellana* | EN/EN | 일치 | null/**Ⅰ** | **불일치** | 들창코원숭이속 전종 Ⅰ |
| EMP19 | 일본원숭이 *Macaca fuscata* | LC/LC | 일치 | null/**Ⅱ** | **불일치** | 영장목 전종 Ⅱ |
| EMP20 | 이리오모테살쾡이 *Prionailurus bengalensis iriomotensis* | CR/— | 확인 불가(G에 아종 평가 없음, 종 *P. bengalensis*는 LC) | null/**Ⅱ** | **불일치** | 고양이과 전종 Ⅱ(Ⅰ은 *P. b. bengalensis* 방글라데시·인도·태국 개체군만) |
| EMP24 | 물소(가축) *Bubalus bubalis* | null/NE | 일치 | null/적용 제외 | 일치 | 아시아물소 *B. arnee* Ⅲ(네팔), ‘*Bubalus bubalis*로 표기된 가축화된 표본은 협약 적용 대상에서 제외’. note의 야생 물소 EN도 G와 같음 |
| EMP25 | 사올라 *Pseudoryx nghetinhensis* | CR/CR | 일치 | null/**Ⅰ** | **불일치** | 종 |
| EMP26 | 천산갑 *Manis javanica*·*M. pentadactyla* | CR/CR·CR | 일치 | I/Ⅰ | 일치 | 종 |
| EMP27 | 델라쿠르랑구르 *Trachypithecus delacouri* | CR/CR | 일치 | null/**Ⅱ** | **불일치** | 영장목 전종 Ⅱ(같은 속에서 Ⅰ은 geei·pileatus·shortridgei뿐) |
| EMP30 | 작은쥐사슴 *Tragulus kanchil* | LC/LC | 일치 | null/미등재 | 일치 | 없음 |
| EMP31 | 얼룩코뿔새 *Anthracoceros albirostris* | LC/LC | 일치 | null/**Ⅱ** | **불일치** | 검은코뿔새속 전종 Ⅱ |
| EMP32 | 코모도왕도마뱀 *Varanus komodoensis* | EN/EN | 일치 | I/Ⅰ | 일치 | 종 |
| EMP33 | 오랑우탄 *Pongo* 3종 | CR/CR·CR·CR | 일치(타파눌리도 CR 확인) | I/Ⅰ | 일치 | 종 3개 |
| EMP34 | 자바코뿔소 *Rhinoceros sondaicus* | CR/CR | 일치 | I/Ⅰ | 일치 | 코뿔소과 전종 Ⅰ |
| EMP35 | 극락조 (극락조과) | null/— | 판정 안 함(대표 종 미정. 극락조속 여러 종이 LC·NT) | null/**Ⅱ** | **불일치** | 극락조과 전종 Ⅱ |
| EMP40 | 양쯔강악어 *Alligator sinensis* | CR/CR | 일치 | I/Ⅰ | 일치 | 종 |
| EMP41 | 중국장수도롱뇽 *Andrias davidianus* | CR/CR | 일치 | I/Ⅰ | 일치 → ‘CITES 등급 확인 필요’ 삭제 | 장수도롱뇽속 전종 Ⅰ |
| EMP42 | 아마미검은멧토끼 *Pentalagus furnessi* | EN/EN | 일치 | null/미등재 | 일치 | 없음 |
| EMP43 | 따오기 *Nipponia nippon* | EN/EN | 일치 | null/**Ⅰ** | **불일치** | 종 |
| EMP44 | 붉은다리두크원숭이 *Pygathrix nemaeus* | CR/CR | 일치 | null/**Ⅰ** | **불일치** | 납작코원숭이속 전종 Ⅰ |
| EMP45 | 양쯔강대왕자라 *Rafetus swinhoei* | CR/CR | 일치 | null/**Ⅱ** | **불일치** | 종(국명 ‘상하이자라’) |
| EMP46 | 래플스반다랑구르 *Presbytis femoralis* | CR/CR | 일치 | null/**Ⅱ** | **불일치** | 영장목 전종 Ⅱ(같은 속 Ⅰ은 potenziani뿐) |
| EMP47 | 발리찌르레기 *Leucopsar rothschildi* | CR/CR | 일치 | I/Ⅰ | 일치 → ‘확인 필요’ 삭제 | 종 |
| EMP48 | 말레이맥 *Tapirus indicus* | EN/EN | 일치 | I/Ⅰ | 일치 → ‘확인 필요’ 삭제 | 맥과 전종 Ⅰ(Ⅱ로 뺀 종은 따로 있음) |
| EMP50 | 인도태평양혹등돌고래 *Sousa chinensis* | VU/VU | 일치 | null/**Ⅰ** | **불일치** | 혹등참흰돌고래속 전종 Ⅰ |
| EMP52 | 넓적부리도요 *Calidris pygmaea* | CR/CR | 일치 | null/미등재 | 일치 | 없음(국내 멸종위기 Ⅰ급은 TASK-0046 W에서 확인, 우리 national 칸은 비어 있음 → 4절) |
| EMP53 | 알바트로스 *Phoebastria albatrus* | VU/VU | 일치 | null/**Ⅱ** | **불일치** | 알바트로스과 행, 열 2(Ⅱ) |
| EMP55 | 세가시투구게 *Tachypleus tridentatus* | EN/EN | 일치 | null/미등재 | 일치 | 없음 |
| EMP56 | 매부리바다거북 *Eretmochelys imbricata* | CR/CR | 일치 | I/Ⅰ | 일치 | 바다거북과 전종 Ⅰ |
| EMP58 | 말레오 *Macrocephalon maleo* | CR/CR | 일치 | null/**Ⅰ** | **불일치** | 종 |
| EMP59 | 인도네시아실러캔스 *Latimeria menadoensis* | VU/VU | 일치 | I/Ⅰ | 일치 | 실러캔스속 전종 Ⅰ |
| EMP60 | 고래상어 *Rhincodon typus* | EN/EN | 일치 | II/**Ⅰ** | **불일치** | 고래상어과 행, 열 1(Ⅰ) |

- **집계:**
  - IUCN: 일치 29, 확인 불가 1(EMP20), 판정 안 함 1(EMP35).
  - CITES: 일치 16, 불일치 15.
- **덤으로 찾은 것:** 넓적부리도요(EMP52)는 국내 멸종위기 야생생물 Ⅰ급이다(야생생물법 시행규칙 별표1 조류 Ⅰ급 3번, TASK-0046 원문 W). 그런데 우리 `national_protection_ko`는 비어 있다. 한국 서해안 갯벌을 들르는 종이라 이야기와도 이어진다.

## 3. 비판적 메모

- **불일치는 모두 빠뜨리거나 옛 값을 쓴 쪽이다.** 없는 등재를 지어낸 행은 없다. 그러나 도감이 `null`을 ‘CITES 없음’으로 보여 준다면 학습자에게 틀린 사실을 준다. 이유는 둘이다.
  - 영장류는 거의 모두 CITES 대상이다.
  - 학습 목표인 ‘국제 거래 규제’를 가르치는 데 정확히 이 사례들이 필요하다.
- **고래상어(Ⅱ→Ⅰ)와 알바트로스(Ⅰ로 기억 → 고시상 Ⅱ):** 둘 다 작성자의 사전 지식과 원문이 엇갈린 사례다. 두 해석이 가능하다.
  - 고시가 최근 당사국총회 결과를 반영했을 수 있다.
  - 고시의 표 편집 오류일 수도 있다.
  - 이 문서는 원문(국내 고시)을 따르되, 사무국 원문을 열 수 있는 사람이 한 번 대조하기를 권한다. 사용자가 CITES 부속서 PDF를 받아 주면 두 행만 맞춰 보면 된다.
- **판정의 약한 고리는 학명 대응이다.** ‘코뿔새’·‘알바트로스’·‘극락조’·‘천산갑’은 무리 이름이라 여러 종을 가리킨다. 동료마다 대표 학명을 자료에 칸으로 두는 것을 권한다(예: `conservation.scientific_name`).
  - 그러면 이런 대조를 사람이 학명을 추정하지 않고 기계적으로 다시 돌릴 수 있다.
  - 이 칸 추가는 스키마 변경이라 허브·사용자 결정이다.

## 4. 자료 수정안 (`data/characters.json`, 반영은 허브·사용자 판단)

| 동료 | 칸 | 지금 | 수정안 |
|---|---|---|---|
| EMP16 | `cites_appendix` | null | `I` |
| EMP19 | `cites_appendix` | null | `II` |
| EMP20 | `cites_appendix` | null | `II` |
| EMP25 | `cites_appendix` | null | `I` |
| EMP27 | `cites_appendix` | null | `II` |
| EMP31 | `cites_appendix` | null | `II` |
| EMP35 | `cites_appendix` | null | `II`(극락조과 전종) |
| EMP43 | `cites_appendix` | null | `I` |
| EMP44 | `cites_appendix` | null | `I` |
| EMP45 | `cites_appendix` | null | `II` |
| EMP46 | `cites_appendix` | null | `II` |
| EMP50 | `cites_appendix` | null | `I` |
| EMP53 | `cites_appendix` | null | `II`(국내 고시 기준) |
| EMP58 | `cites_appendix` | null | `I` |
| EMP60 | `cites_appendix` | `II` | `I`(국내 고시 기준, 2026-03-05 시행) |
| EMP52 | `national_protection_ko` | 비어 있음 | `멸종위기 야생생물 Ⅰ급` |
| EMP41·47·48 | `check_level`의 ‘CITES 등급은 확인 필요’ | 있음 | 삭제 |

- 모두 `checked_on`을 2026-10-11로 바꾸고 `sources`에 C·G를 더한다. 출처 ID를 새로 만들려면 `data/sources.json`(잠금)에 넣어야 하므로 허브 판단이다.
- **검사 규칙 제안(코드 작업이라 Codex 지시서감):** `validate_data.py`에 ‘`cites_appendix`가 null이면 `cites_checked_on`이 있어야 한다’ 같은 칸을 두어 ‘미확인’과 ‘미등재’를 나누는 방안.
  - 스키마·검사기 변경이라 허브에 [실행 요청] 여부를 묻는다.

## 5. 접속 기록

- 접속한 곳: `api.gbif.org`(robots.txt 허용, 간헐적 연결 끊김은 다시 시도), `law.go.kr`(허용).
- 쓰지 않은 곳: cites.org·BirdLife(robots.txt가 Anthropic 에이전트 차단), iucnredlist.org·gbif.org(Cloudflare 403), speciesplus.net(robots.txt `Disallow: /`). 사유는 TASK-0046 3절과 같다.
- 반박 검증 워크플로는 돌리지 않았다. 대신 두 방법(PDF 글자 위치, HWPX 셀 주소)으로 독립적으로 판정했다. 어긋난 2건은 셀 주소로 확정했다.
