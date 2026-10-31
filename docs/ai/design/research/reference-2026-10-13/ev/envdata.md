# 영역 envdata: 국가 데이터·통상 외교를 게임 환경으로: 공개 데이터와 라이선스

## 요약

사용자 요청(2026-10-13)은 "회사가 취급하는 물품을 좁게 정하자"였다. 이 요청을 공개 무역 자료의 근거와 라이선스 조사에 연결했다. 공개 실증 자료도 이 방향을 대체로 지지한다. 2000년 미국 제조업 수출기업 가운데 42.2%는 HS 10단위 기준 단일 품목만 수출했고, 64%는 수출국이 한 나라였다(NBER w13054). 관세청의 2025년 첫수출기업 분석에서도 기업당 평균 수출 품목은 1.4개, 수출국은 1.6개국이었다(KDI 경제정보센터 요약). 반대 근거도 있다. 5개 이상 품목을 수출하는 기업은 전체의 25.9%였지만 수출액의 98%를 차지했다. 따라서 '작게 시작하고, 품목·시장을 늘리는 것이 성장'이라는 구조가 사실에 가깝다. 현재 저장소 data/goods.json에는 품목 8개(COFFEE·APPAREL·COSMETICS·FROZEN_SEAFOOD·FURNITURE·ELECTRONICS·AUTO_PARTS·SOLAR_MODULES)가 모두 DESIGN 값으로 있고, HS 매핑은 NOT_VERIFIED다. 품목을 좁히면 실제 자료를 붙일 HS 코드도 몇 개로 줄어 스냅숏 크기와 라이선스 위험이 함께 작아진다.

라이선스는 출처마다 크게 다르다.
- World Bank WDI: CC BY 4.0이다(카탈로그 131판, 2026-10-09 갱신, 연간).
- UNCTAD Data Hub: CC BY 3.0 IGO이며, 출처를 표시하면 복제와 재배포를 할 수 있다.
- KOSIS: 상업적 이용과 재배포까지 허용한다. 다만 국제·북한통계는 비상업 용도만 허용하고 재배포를 금지한다.
- 관세청 공공데이터포털 API: '이용허락범위 제한 없음'이다.
- UN Comtrade: '내부 이용'이 원칙이다. 형태를 바꾸지 않은 재배포는 원칙적으로 허락이 필요하다. 다만 적은 양을 표·그래프로 싣는 경우, 무료 시각화 앱, 지수·증가율처럼 실질적으로 변환한 자료에는 허락과 수수료가 필요 없다고 명시한다.
- WTO IDB/CTS: 개인·교실 이용은 허락 없이 할 수 있다. 분석 발표를 넘는 재배포는 WTO 사무국의 사전 승인이 필요하다(WITS 약관 기준이며, wto.org 원문은 접속 차단으로 미확인).
- ECB 통계: 출처를 표시하고 수정하지 않는 조건으로 무료 재이용할 수 있다. 기준환율은 '정보 목적'이며 거래 목적 사용은 강하게 권하지 않는다.
- 한국은행 홈페이지 정보: 출처 표시가 의무이고, 가공했다면 가공 사실도 밝혀야 한다. ECOS Open API 이용약관 본문은 화면이 스크립트로만 그려져 확인하지 못했다.

갱신 주기도 다르다.
- 관세청 통계: 매월 15일경 신고 정정을 반영해 갱신한다.
- UN Comtrade: 국가가 수정치를 내면 덮어쓴다.
- LSCI: 분기마다 3·6·9·12월 중순에 공표하며, 2024년부터 2023년 1분기 평균을 100으로 다시 맞췄다.
- 미국 OFAC 제재 목록: 정해진 일정 없이 수시로 갱신된다.
- HS 품목분류: 2028-01-01 제8판이 발효된다.

이에 따라 설계 제안은 다음과 같다.
1. 실측 자료는 날짜·해시·라이선스·판본을 붙인 스냅숏으로만 들인다.
2. 게임에는 원자료 대신 등급·지수로 변환한 값을 쓴다.
3. 현재의 check_fact_mixing.py 규칙(DESIGN_AS_OBSERVED 등)에 라이선스·조회일 필수 검사를 더한다.
4. FTA·관세 양허·무역구제·수출통제·제재는 실명 국가·기업이 아닌 가상 상대와 날짜를 붙인 규칙 카드로, 회사 밖 사건으로 다룬다.

한계도 있다. WTO·UNCTAD 본 사이트, tradedata.go.kr, law.go.kr, ECOS 약관은 접속이 막혔거나 내용을 읽지 못해 여러 핵심 사실이 독립 출처 1~2개에 그친다.

## 사실(삼각검증 판정)

- (two_sources) 수출을 막 시작한 기업이나 일반 수출기업 상당수는 품목 1~2개, 대상국 1~2곳으로 거래한다. 한편 수출액의 대부분은 다품목·다시장 기업이 차지한다. [37][280][281] — 검증 메모: '품목·대상국 1~2개' 부분은 NBER(미국 2000년, HS 10단위 제조업)과 관세청(한국 2025년 첫수출기업, 단위 미확인) 두 출처로 확인했다. 다만 모집단·연도·품목 단위가 달라 같은 지표가 아니다. '수출액 대부분은 다품목 기업' 부분은 NBER만 직접 뒷받침한다. KDI 무역집중도는 기업 규모 집중을 말할 뿐 다품목 여부는 말하지 않는다.
- (single_source) UN Comtrade 자료는 원칙적으로 내부 이용용이다. 원값을 그대로 재배포하려면 허락이 필요하다. 다만 소량 게시, 무료 시각화 앱, 실질적으로 변환한 지표는 예외다. [250][251][255][256][257] — 검증 메모: Comtrade 도움말 세 문서, shop.un.org, ITSB 뉴스레터는 모두 UNSD 한 기관의 규정이다. WITS는 그 구판을 옮겨 적었고 'in any form'으로 현행과 어긋난다. 독립 출처는 사실상 하나다. 또한 현행 FAQ는 '영리 목적이라도 총 10만 건 미만의 소량은 추가 라이선스 없이 재배포 가능'이라고 명시한다. 이 문장이 사실 서술에서 빠져 있다.
- (single_source) World Bank WDI는 CC BY 4.0이고, UNCTAD Data Hub는 CC BY 3.0 IGO다. WITS를 거쳐 제공되는 TRAINS·WTO IDB/CTS는 별도 조건을 따른다. [257][259][260][261][263] — 검증 메모: 세 하위 주장(WDI CC BY 4.0, UNCTAD CC BY 3.0 IGO, TRAINS 맞춤 라이선스·IDB 조건)은 각각 자료 소유 기관 한 곳의 1차 페이지로 확인했다. 1차 자료라 신뢰도는 높지만, 하위 주장마다 출처는 하나다. WTO IDB 조건은 WITS가 옮긴 문구뿐이다.
- (single_source) 한국 공공 통계의 라이선스는 출처마다 다르다. KOSIS 국내 통계는 상업 이용과 재배포가 가능하지만 국제통계는 비상업 용도만 허용하고 재배포를 금지한다. 공공누리는 유형에 따라 상업 이용이나 변경이 금지된다. 관세청 공공데이터 API는 이용허락범위 제한이 없다. [268][269][270][271] — 검증 메모: KOSIS, 공공누리, 관세청 API 조건은 각각 해당 기관 한 곳의 1차 페이지다. KOSIS 간행물은 공공누리 유형을 따른다는 예외를 덧붙여야 한다.
- (two_sources) 공개 무역 통계는 공표 후에도 수정된다. 관세청은 매월 15일경 정정분을 반영하고, Comtrade는 수정치로 덮어쓴다. 같은 교역도 CIF와 FOB 차이 때문에 수출국 값과 수입국 값이 다르다. [253][254][269][283] — 검증 메모: '공표 뒤 수정'은 관세청과 UNSD 두 독립 기관이 확인한다. 'CIF·FOB 비대칭'은 UNSD 도움말과 CEPII BACI로 확인했다. 다만 BACI 인용문은 '두 숫자가 존재한다'까지만 말하고, CIF/FOB 언급은 이번에 다시 대조하지 않았다.
- (single_source) LSCI는 분기마다 공표되고 2023년 1분기 평균을 100으로 한다. 환적 비중이 큰 항만은 화주가 실제로 접근하는 정도보다 높게 나올 수 있다. [264][265][266] — 검증 메모: 분기 공표는 UNCTAD 일정표, '2023년 1분기=100'은 파나마 팩트시트(2차 자료), 환적 과대평가는 PEMP로, 하위 주장마다 출처가 하나다. PEMP는 구판 지수(2006=100, 5개 요소)를 설명한다. 그래서 '2023 Q1=100'에 대한 독립 확인은 없다.
- (single_source) 중앙은행 기준환율은 정보용이다. 출처를 표시해야 하고, ECB는 수정하지 않는 조건을, 한국은행은 가공 사실의 표시를 요구한다. [272][274][275] — 검증 메모: '기준환율은 정보용'과 '무수정 조건'은 ECB만 말한다. 한국은행 출처는 홈페이지 정보 일반의 저작권 방침이고 환율의 성격은 다루지 않는다. '중앙은행 기준환율은 정보용'으로 일반화하는 것은 근거가 부족하다.
- (single_source) 통상 환경은 날짜에 따라 달라진다. FTA는 발효·서명·협상 단계가 바뀌고, 제재 목록은 일정 없이 갱신되며, HS 품목분류는 2028년에 개정된다. [276][278][279] — 검증 메모: FTA 단계(산업통상부), 제재 목록 수시 갱신(OFAC), HS 2028 발효(WCO)는 서로 다른 하위 주장이고 각각 출처가 하나다. 모두 1차 기관 자료라 신뢰도는 높다.
- (two_sources) 국제기구마다 같은 관세영역을 다른 이름으로 표기한다. [250][257] — 검증 메모: WITS(WTO 표기 'Taipei, Chinese')와 UN Comtrade('Taiwan, Province of China')는 서로 다른 기관이다. 각자의 표기를 직접 확인했다.
- (two_sources) 실제 자료를 게임에 넣을 때는 공정한 밸런스를 위해 설계자의 변환이 필요하다. 정의가 조금씩 다른 자료를 섞으면 오해가 생긴다. [282][283] — 검증 메모: '밸런스를 위해 변환이 필요하다'는 Data Games 논문 하나뿐이다(Open Data Civilization 사례에 대한 진행 중 과제로 서술되어 있고, 일반 원칙으로 제시된 것은 아니다). '정의가 조금씩 다른 자료를 섞으면 오해가 생긴다'는 Data Games와 BACI 두 출처가 뒷받침한다.
- (single_source) Scitrade 저장소는 실측 환율 표본을 운영 데이터와 분리해 두었다. 품목 8개의 HS 코드는 아직 검증되지 않았다. [284][285] — 검증 메모: 저장소 파일을 직접 읽어 확인했다. 독립 출처 개념이 적용되지 않는 내부 사실이다. 검사기는 다른 브랜치의 worktree 기준이다.

## 근거(인용)

- E:envdata:0 [37] (confirmed, 신뢰 90) 2000년 미국 수출기업 중 42.2%는 단일 품목만 수출했지만 수출액 비중은 0.4%에 그쳤다. — "In 2000, 42.2 percent of firms exported a single product abroad (first row, top panel). Here, too, however, these exporters represented a small share of aggregate exports, just 0.4 percent" (p.10, 'Trade is Even Scarcer Than Thought' 절 Table 4 설명 문단)
- E:envdata:1 [37] (confirmed, 신뢰 90) 5개 이상 품목을 수출하는 기업은 25.9%였지만 수출액의 98%를 차지했다. — "Firms exporting five or more products accounted for 25.9 percent of firms but 98 percent of export value" (p.10, Table 4 설명 문단)
- E:envdata:2 [37] (confirmed, 신뢰 90) 미국 제조업 수출기업의 64%는 수출 대상국이 한 나라였다. — "Table 4 shows that 64 percent of U.S. manufacturing firms that export do so to a single destination country" (p.9, 'Trade is Even Scarcer Than Thought' 절)
- E:envdata:3 [37] (confirmed, 신뢰 90) 품목 수는 HS 10단위로 셌으므로 '단일 품목'은 매우 좁은 범위의 단일 상품을 뜻한다. — "firms that export more than one ten-digit Harmonized System (HS) product comprise 58 percent of exporting firms and account for more than 99 percent of export value" (p.10, 'Multi-Product Firms and Exporting' 절)
- E:envdata:4 [280] (confirmed, 신뢰 92) 2025년 한국 첫수출기업은 평균 1.4개 품목을 수출했다. — "품목별로는 기계·컴퓨터, 전기제품, 화장품, 플라스틱, 자동차 순으로 많이 수출되었고, 1개 업체가 평균 1.4개 품목을 수출함." (본문 요약 셋째 항목)
- E:envdata:5 [280] (confirmed, 신뢰 92) 2025년 한국 첫수출기업 1곳의 평균 수출 대상국은 1.6개국이었다. — "수출국은 173개국에 달하며, 업체수 기준으로는 중국·미국·일본·베트남·유럽연합 순이고, 1개 업체가 평균 1.6개국에 수출함." (본문 요약 다섯째 항목)
- E:envdata:6 [280] (confirmed, 신뢰 92) 첫수출기업의 80%는 연 수출액이 10만 달러 미만인 소규모 업체였다. — "업체별 평균 수출액은 35만 달러, 10만 달러 미만 수출기업이 전체의 80%를 차지해 소규모 업체 비중이 높음." (본문 요약 넷째 항목)
- E:envdata:7 [281] (confirmed, 신뢰 90) 한국 수출은 소수 대기업에 집중되어 있어, 작은 무역상사와 대기업의 품목 폭이 크게 다를 수 있다. — "상위 10대 수출기업의 무역집중도는 50.1%로 전년동분기대비 13.5%p 상승했고, 상위 100대 기업 기준 무역집중도는 73.4%로 7.2%p 증가함." (요약 다섯째 항목(2026.05.21 발표))
- E:envdata:8 [250] (confirmed, 신뢰 92) UN Comtrade 자료는 원칙적으로 내부 이용용이며 재배포에는 UNSD 허락이 필요하다. — "UN Comtrade data are provided for internal use only and may not be re-disseminated in any form without UNSD’s permission. The exemption (e.g., a small amount of data) is explained in the section on re-dissemination." ('Copyright Statement and Citation' 절)
- E:envdata:9 [250] (unchecked, 신뢰 92) UN Comtrade 자료를 쓸 때는 출처를 'UN Comtrade'로 적는다. — "Regarding citation, refer to the data source as “UN Comtrade.”" ('Copyright Statement and Citation' 절)
- E:envdata:10 [250] (confirmed, 신뢰 92) Comtrade는 화면 스크래핑과 일일 한도 우회를 금지하고 API 사용을 요구한다. — "users are expected to consider others by avoiding excessive usage, such as web scraping via bots or registering multiple accounts to circumvent the daily limit." ('Fair Usage' 절)
- E:envdata:11 [251] (confirmed, 신뢰 93) 소량의 Comtrade 자료를 표·그래프로 게시하는 것은 영리 여부와 무관하게 허락이 필요 없다. — "Publication of limited amounts of UN Comtrade data in a few tables, graphs, visualization in printed or digital platform, regardless for profit or not-for-profit purposes" ('The license to distribute is not applied, and permission is not required for the following use cases' 목록 첫 항목)
- E:envdata:12 [251] (confirmed, 신뢰 93) 실질적으로 변환된 자료는 유료 배포 라이선스 대상이 아니다. — "If data being re-disseminated are substantially different from the data provided in the UN Comtrade, then a license to distribute with a fee shall not apply." ('Permission for re-dissemination and use of data within applications' 절)
- E:envdata:13 [251] (confirmed, 신뢰 93) 새 지표·지수를 만드는 것은 '변환된 자료'의 예로 명시된다. — "Creating new indicators, indices, or analytical measures." ('What constitutes “transformed” or “substantially different” data' 절 예시 목록)
- E:envdata:14 [251] (confirmed, 신뢰 93) 반올림·형식 변경·열 이름 변경은 변환으로 보지 않으므로, 원값을 반올림해 게임에 넣는 것은 재배포에 해당할 수 있다. — "Examples that do not constitute substantial transformation include: Rounding values." (같은 절, 변환에 해당하지 않는 예시)
- E:envdata:15 [252] (confirmed, 신뢰 90) 무료 등록 계정은 호출당 10만 건 내려받기와 하루 500회 API 호출로 제한된다. — "These features include data preview, data download of 100K records per call, and data API access for up to 500 calls/day." ('Which subscriptions can I choose from?' 절)
- E:envdata:16 [253] (confirmed, 신뢰 90) Comtrade는 수정치가 나오면 이전 값을 덮어쓰므로, 같은 조회도 시점에 따라 값이 달라질 수 있다. — "In the UN Comtrade system, the revised data will replace the initial submission, as the system retains the most recent version." ('Revision of data' 절)
- E:envdata:17 [254] (confirmed, 신뢰 90) 수입은 CIF, 수출은 FOB로 기록되어 같은 거래의 양국 통계가 어긋난다. — "Imports are reported in CIF-type values, and exports are reported in FOB-type values;" ('Merchandise Trade' 절, 비대칭 사유 목록)
- E:envdata:18 [283] (confirmed, 신뢰 85) 같은 교역 흐름에 수출국·수입국의 숫자 두 개가 존재하며 이를 맞추려면 별도 추정 절차가 필요하다. — "When both exporting and importing countries report flows, we have two different figures for the same flow." (Non-technical summary, p.3)
- E:envdata:19 [255] (confirmed, 신뢰 80) UN 판매 페이지는 재배포 전제로 Premium Pro 구독을 요구한다. — "Prerequisite: to be able to re-disseminate, you have to be an active Premium Pro subscriber" (Comtrade 절, 'The re-dissemination of UN Comtrade data')
- E:envdata:20 [255] (confirmed, 신뢰 80) 10만 건 이하·무료 공개 시각화에는 재배포 수수료가 면제된다. — "Exception: No re-dissemination fee for the following use cases: A small number of records (up to 100,000) In Public/free-of-charge data visualization/analytics" (같은 절 예외 항목)
- E:envdata:21 [256] (paraphrase_ok, 신뢰 85) 무료·비영리 시각화 앱 면제 규정은 2014년 2월 개정부터 이어져 왔다. — "The new policy waives the re-dissemination fee if the Comtrade data is used within free-of-charge (or not-for-profit) visualization and analytical applications." (p.1, 'Policy on use and re-dissemination of UN Comtrade data (February 2014 revision)' 기사(2단 편집을 이어 읽음))
- E:envdata:22 [257] (confirmed, 신뢰 72) WITS 약관은 Comtrade 자료를 서면 허락 없이 어떤 형태로도 재배포할 수 없다고 적는다. — "These data are copyrighted by the United Nations. They are made available for internal use only and may not be re-disseminated in any form without written permission of the United Nations Statistics Division (UNSD)." (COMTRADE 항목 1)
- E:envdata:23 [257] (confirmed, 신뢰 72) WITS 약관은 쿼리당 5만 건 한도를 적고 있다(구 판본 문구). — "A download limit of 50,000 data records per query is applicable for technical reasons." (COMTRADE 항목 2)
- E:envdata:24 [258] (confirmed, 신뢰 85) WITS FAQ는 같은 한도를 쿼리당 10만 건으로 적어 약관 페이지와 어긋난다. — "A download limit of 100,000 data records per query is applicable for technical reasons." ('Where do I get more information about UN Comtrade database?' 항목 2)
- E:envdata:25 [257] (confirmed, 신뢰 72) WTO IDB/CTS 관세 자료는 개인·교실 용도로 별도 요청 없이 내려받을 수 있다. — "Permission to download information in part or in full from this database is granted for personal or classroom use, without fee and without formal request." (WTO’s Integrated Data Base (IDB) and Consolidated Tariff Schedules (CTS) 절)
- E:envdata:26 [257] (confirmed, 신뢰 72) 분석 발표를 넘는 WTO 관세 자료 재배포에는 WTO 사무국의 사전 승인이 필요하다. — "Any re-dissemination by third parties of IDB or CTS data based on data downloads which goes beyond the purpose of publication of analytical work must be approved by the WTO Secretariat prior to such re-dissemination;" (CONDITIONS OF USE AND PUBLICATION)
- E:envdata:27 [257] (confirmed, 신뢰 72) 국제기구마다 같은 관세영역의 표기가 달라, 국가 이름을 그대로 들여오면 민감한 표기 문제가 생긴다. — "The Separate Customs Territory of Taiwan, Penghu, Kinmen and Matsu is referred to in this application as "Taipei, Chinese"." (WTO IDB/CTS 절 Note)
- E:envdata:28 [250] (confirmed, 신뢰 92) UN Comtrade는 같은 영역을 WTO와 다른 이름으로 표기한다. — "Taiwan, Province of China Trade Data" (도움말 센터 Metadata 분류의 문서 제목(목록))
- E:envdata:29 [259] (confirmed, 신뢰 88) WITS로 제공되는 UNCTAD TRAINS 관세 자료는 CC BY가 아닌 별도(맞춤) 라이선스다. — "License: Custom License This dataset is licensed under Custom License" (Data Access and Licensing 절)
- E:envdata:30 [260] (confirmed, 신뢰 92) World Development Indicators는 CC BY 4.0으로 제공된다. — "License: Creative Commons Attribution 4.0 This dataset is licensed under Creative Commons Attribution 4.0" (Data Access and Licensing 절)
- E:envdata:31 [260] (confirmed, 신뢰 92) WDI는 판본 번호(131)와 갱신일이 있으므로 스냅숏에 판본을 기록할 수 있다. — "Metadata last updated on Oct 12, 2026" (페이지 상단(판본 목록 131 Latest), 연간(Periodicity Annual))
- E:envdata:32 [261] (confirmed, 신뢰 92) CC BY 4.0 자료는 출처와 변경 사실(번역 포함)을 표시하면 변형·상업 이용이 가능하다. — "The Creative Commons Attribution 4.0 International license allows users to copy, modify and distribute data in any format for any purpose, including commercial use. Users are only obligated to give appropriate credit (attribution) and indicate if they have made any changes, including translations." (Creative Commons Attribution 4.0 (CC-BY 4.0) 절)
- E:envdata:33 [261] (unchecked, 신뢰 92) World Bank 자료라도 데이터셋마다 라이선스가 다르므로 개별 확인이 필요하다. — "Many datasets are available under other licenses. They are labeled accordingly, and when they are accessed by users, users agree to comply with all of the terms of the respective licenses" (Data Access And Licensing 첫 문단)
- E:envdata:34 [262] (confirmed, 신뢰 88) 별도 라이선스가 표시되지 않은 World Bank 자료는 비상업 이용만 가능하고 2차 저작물을 만들 수 없다. — "For the remainder of the Materials, you may make non-commercial uses thereof, but you may not make any derivative work or commercial use, including without limitation reselling them" (Terms & Conditions, Materials 이용 조항)
- E:envdata:35 [263] (confirmed, 신뢰 90) UNCTAD Data Hub 자료(LSCI 포함)는 출처를 표시하면 자유롭게 복제·재배포할 수 있다. — "All data and metadata provided on the UNCTAD Data Hub may be copied freely, duplicated and further distributed provided that United Nations Trade and Development Data Hub is cited as the source." (General information – 'Can I use UNCTAD Data Hub data in a publication?')
- E:envdata:36 [263] (confirmed, 신뢰 90) UNCTAD Data Hub의 라이선스는 CC BY 3.0 IGO다. — "Yes. All materials provided on this website are copyrighted under the Creative Commons Attribution 3.0 IGO license." (General information 같은 문항)
- E:envdata:37 [264] (confirmed, 신뢰 90) 국가별 LSCI는 분기마다 공표되며, 2026년 3분기 자료는 2026-09-18에 나왔다. — "18 September 2026 Liner shipping: Connectivity index - Quarterly (analytical) Q1 2006 - Q3 2026" (Release Calendar, September 2026 항목)
- E:envdata:38 [264] (confirmed, 신뢰 90) 다음 LSCI 공표는 2026-12-18로 예정되어 있다. — "18 December 2026 Liner shipping: Connectivity index - Monthly (analytical) Feb 2006 - Dec 2026" (Release Calendar, December 2026 항목)
- E:envdata:39 [265] (confirmed, 신뢰 68) LSCI는 2024년부터 2023년 1분기 평균을 100으로 다시 맞췄으므로, 이전 판 값과 섞으면 안 된다. — "Starting 2024 it is rescaled to make equal 100 the average in the first quarter of 2023. The new time series replaces the earlier UNCTAD LSCI, which had been generated from 2004 onwards." (Data collected 칸 하단)
- E:envdata:40 [265] (confirmed, 신뢰 68) 현행 LSCI는 기항 횟수·선복량·서비스 수·선사 수·최대 선형·직항 연결국 수의 6개 요소로 만든다. — "LSCI is generated from six components:" (Data collected 칸)
- E:envdata:41 [266] (confirmed, 신뢰 70) 환적 비중이 큰 항만은 LSCI가 화주 입장의 실제 접근성보다 높게 나올 수 있다. — "In the case of a high level of transshipment calls, the number of ship calls can be somewhat misleading, as those calls are not related to connectivity to the global trade system but to the presence of a transshipment hub." (Scheduled ship calls 항목)
- E:envdata:42 [266] (confirmed, 신뢰 70) 교재 동반 사이트의 지도·설명은 재배포가 금지되어 게임에 쓸 수 없다. — "The material cannot be copied or redistributed in ANY FORM and on ANY MEDIA. For specific uses permission MUST be requested." (Conditions 절)
- E:envdata:43 [267] (confirmed, 신뢰 85) WTO Timeseries API는 양허·실행·특혜관세 지표와 교역 통계를 제공한다. — "Available time series cover merchandise trade and trade in services statistics (annual, quarterly and monthly), market access indicators (bound, applied & preferential tariffs), non-tariff information as well as other indicators." ('WTO Timeseries API' 절)
- E:envdata:44 [268] (confirmed, 신뢰 90) 공공누리 제2·4유형 저작물은 상업적 이용이 금지되므로, 상용 출시를 목표로 하는 게임에 그대로 넣을 수 없다. — "제2유형 : 출처표시 + 상업적 이용금지" (공공누리 유형 안내 표)
- E:envdata:45 [268] (confirmed, 신뢰 90) 공공누리 제3·4유형은 형식 변경까지 금지하므로, 게임 화면용으로 바꿔 쓸 수 없다. — "공공저작물의 변경이 금지됨을 의미합니다. 내용상의 변경뿐만 아니라 형식의 변경과 원저작물을 번역·편곡·각색·영상제작(2차적 저작물 작성) 하는 것도 금지 됩니다." (변경금지 조건 설명)
- E:envdata:46 [271] (confirmed, 신뢰 92) KOSIS 국내 통계는 상업적 이용과 재배포까지 가능하다. — "이용자는 KOSIS 통계정보를 자유롭게 사용, 재사용 및 재배포할 수 있으며 통계정보의 비상업적 또는 상업적 활용이 모두 가능합니다." (통계정보 이용방법 – 활용범위)
- E:envdata:47 [271] (confirmed, 신뢰 92) KOSIS의 국제통계는 비상업 용도만 가능하고 재배포가 금지된다. — "국제통계 및 북한통계는 비상업적 목적으로만 사용하여야 하며 이 경우에도 재배포는 금지됩니다." (통계정보 이용방법 – 예외사항)
- E:envdata:48 [271] (confirmed, 신뢰 92) KOSIS는 출처 표시에 조회일을 포함하도록 요구하므로, 스냅숏에 조회일을 기록해야 한다. — "참조일자 : KOSIS에서 통계자료를 조회 또는 다운로드한 날짜(YYYY.MM.DD)" (출처명시 – 출처 정보)
- E:envdata:49 [271] (unchecked, 신뢰 92) 실측 통계를 게임 밸런스에 맞게 임의로 바꾸고도 'KOSIS 수치'라고 표시하면 안 된다. — "통계정보를 임의로 변경하거나 왜곡하지 않아야 합니다." (이용시 준수사항)
- E:envdata:50 [269] (confirmed, 신뢰 88) 관세청 수출입실적은 매월 15일경 신고 정정을 반영해 과거 자료까지 고친다. — "공표시기 : 매월 15일경 수출입 신고의 정정, 취하 등 변경내역을 반영하여 전월까지의 자료를 현행화" (상세 및 제공정보)
- E:envdata:51 [269] (unchecked, 신뢰 88) 관세청 통계 금액은 미 달러 기준이며 수입과 수출의 가격 기준이 다르다. — "금액은 수입(과세가격미화금액), 수출(신고미화금액) 기준임" (상세 및 제공정보 – 통계제공 기준)
- E:envdata:52 [269] (confirmed, 신뢰 88) 이 API는 이용허락범위 제한이 없다고 표시되어 있으나, 갱신 주기를 '실시간'으로 적어 본문의 '월 1회'와 어긋난다. — "업데이트 주기 실시간 이용허락범위 이용허락범위 제한 없음" (이용 조건 및 라이선스 정보)
- E:envdata:53 [270] (confirmed, 신뢰 88) 관세청 신성질별 분류는 HS 10단위를 755개 성질 코드로 묶은 체계라, 게임 품목군을 정의할 때 참고할 수 있다. — "대분류-중분류-소분류-세분류-세세분류로 이루어져 있으며, 최하위단위(세세분류) 기준 755개의 코드로 구성되어 있습니다." (상세 및 제공정보 설명)
- E:envdata:54 [270] (confirmed, 신뢰 88) 통계 코드 체계 자체가 바뀌므로, 스냅숏에는 코드 판본도 기록해야 한다. — "'26.7.1.자 전남광주통합,인천 지방행정체계 개편으로 수출입신고 시도코드가 변경되었으니, 수출입실적 조회 시 참고하시기 바랍니다" (상세 및 제공정보 하단 공지)
- E:envdata:55 [272] (confirmed, 신뢰 90) 한국은행 정보를 가공해 게임에 쓰면 출처와 가공 사실을 모두 표시해야 한다. — "한국은행 홈페이지에 게시된 정보를 이용할 때에는 출처가 한국은행임을 반드시 밝혀야 하며, 해당 정보를 수정, 변경, 가공할 경우에도 이를 분명히 밝혀야 합니다." (저작권보호방침 4항)
- E:envdata:56 [273] (confirmed, 신뢰 70) ECOS Open API는 인증키 신청 때 비영리·영리 이용형태를 구분하지만, 약관 본문은 확인하지 못했다. — ""useForm":{"ko":"이용형태"},"nonprofit":{"ko":"비영리"},"profit":{"ko":"영리(정보판매 등의 상업적 이용)"}" (ECOS Open API 화면 번들의 인증키 신청 양식 문자열)
- E:envdata:57 [274] (confirmed, 신뢰 92) ECB 통계는 출처를 표시하고 수정하지 않는 조건으로 무료 재이용할 수 있다. — "All publicly available ESCB statistics may be reused free of charge on the condition that the source is quoted (e.g. “Source: ECB statistics.”) and that the statistics (including metadata) are not modified." (Usage policy 본문)
- E:envdata:58 [275] (confirmed, 신뢰 92) ECB 기준환율은 정보용이므로, 게임 안 은행 거래환율과 구분해 표시해야 한다. — "The reference rates are published for information purposes only. Using the rates for transaction purposes is strongly discouraged." (Euro foreign exchange reference rates 설명 문단)
- E:envdata:59 [276] (paraphrase_ok, 신뢰 90) 한국의 통상 협정은 발효·서명/타결·협상 중 단계로 나뉘고 상태가 계속 바뀐다. — "서명/타결 한-에콰도르 SECA 한-GCC FTA 한-조지아 CEPA 한-EU DTA 한-말레이시아 FTA 한-세르비아 CEPA 한-몽골 CEPA 한-방글라데시 CEPA 협상중 한-태국 CEPA 한-파키스탄 CEPA" (우리나라FTA > 체결현황 메뉴)
- E:envdata:60 [276] (confirmed, 신뢰 90) 정부 자료도 순위에 기준 연도를 붙이므로, 게임 안 국가 설명에도 기준 연도가 필요하다. — "중국우리의 제1위 교역대상국(’24년기준)" (체결현황 지도 – 중국 항목)
- E:envdata:61 [277] (confirmed, 신뢰 80) 한국의 무역구제 제도는 덤핑방지관세·상계관세·세이프가드와 불공정무역행위 조사로 구성된다. — "무역구제제도 덤핑방지관세 상계관세 세이프가드 불공정무역행위 조사 국제무역규범 위반제도 조사 무역구제사례" (누리집 제도소개 메뉴)
- E:envdata:62 [278] (confirmed, 신뢰 92) 제재 대상 목록은 정해진 일정 없이 수시로 바뀌어 고정 스냅숏으로는 사실성을 유지할 수 없다. — "The SDN list is frequently updated. There is no predetermined timetable, but rather names are added or removed as necessary and appropriate." (FAQ 20)
- E:envdata:63 [278] (confirmed, 신뢰 92) 제재 목록에 오르면 거래 상대방 확인(스크리닝)이 계약 전 필수 절차가 된다. — "Their assets are blocked and U.S. persons are generally prohibited from dealing with them." (FAQ 18)
- E:envdata:64 [279] (confirmed, 신뢰 92) HS 품목분류는 2028-01-01에 개정판이 발효되므로, 품목의 HS 코드에는 판본을 기록해야 한다. — "HS 2028, the eighth edition of the Harmonized System (HS) Nomenclature, will enter into force on 1 January 2028." (Amendments effective from 1 January 2028)
- E:envdata:65 [282] (confirmed, 신뢰 80) 실제 자료로 내용을 만들고 그 자료를 탐색·학습하게 하는 게임을 'data games'로 정의한 선행 연구가 있다. — "We define data games as games where gameplay and/or game content is based on real-world data external to the game, and where gameplay supports the exploration of and learning from this data." (Abstract)
- E:envdata:66 [282] (confirmed, 신뢰 80) 실제 자원 분포는 공정한 게임 밸런스와 거의 맞지 않아 설계자의 변환이 필요하다. — "the resource distribution of the real world is rarely conducive to balanced and fair gameplay." (2.5절(Open Data Civilization) 설명)
- E:envdata:67 [282] (confirmed, 신뢰 80) 연도·지역·정의가 조금씩 다른 자료를 한 화면에서 비교하면 오해가 생길 수 있다. — "A related aspect is that of data “diversity”. That is, finding data that is almost, but not quite, comparable." (4.2 Data Selection and Access)
- E:envdata:68 [285] (confirmed, 신뢰 80) 저장소의 실측 환율 표본은 운영 데이터로 자동 적재하지 않는 시험용 스냅숏으로 분리되어 있다. — ""purpose": "import_test_only", "auto_load_as_operating_data": false" (data/observed_fx_sample.json 상위 필드)
- E:envdata:69 [285] (confirmed, 신뢰 80) 현재 게임 품목 8개는 HS 코드와 판본이 비어 있어 실측 자료와 연결되지 않은 상태다. — ""hs_code": null, "hs_edition": null, "hs_mapping_status": "NOT_VERIFIED"" (data/goods.json items[0](COFFEE), 8개 품목 공통)
- E:envdata:70 [284] (confirmed, 신뢰 80) 사실 섞임 검사기는 설계값과 실측값의 혼동을 잡는 규칙이 있지만, 라이선스·조회일·판본은 검사하지 않는다. — "'DESIGN_WITH_OBSERVED_LEVEL', 'DESIGN_SOURCE_LEVEL', 'DESIGN_AS_OBSERVED'" (tools/check_fact_mixing.py CODES·MESSAGES 정의)

## 설계 관찰

- ENV-N01 취급 품목을 1~2개 품목군으로 좁히고, 품목·시장 확장을 성장으로 설계: [자료에서 확인] 2000년 미국 수출기업의 42.2%는 단일 품목(HS 10단위)만 수출했고, 64%는 대상국이 한 나라였다. 2025년 한국 첫수출기업은 평균 1.4개 품목을 1.6개국에 수출했다. 반면 5개 이상 품목을 수출하는 기업이 수출액의 98%를 차지했고, 품목 수와 대상국 수의 상관계수는 0.81이었다. [저장소 현황] goods.json에는 품목 8개가 모두 DESIGN 값으로 있다. → 적용 제안: 1장 시작 회사는 품목군 1~2개(예: 8개 중 COFFEE와 COSMETICS처럼 보관 조건이 다른 두 품목)만 취급한다. 새 품목군은 거래처 신뢰, 보관 설비(냉동 창고 등), 인허가 서류, 담당 직원(동물·신수)의 숙련을 갖추었을 때 추가한다. 품목·시장 확장을 회사 성장의 주된 축으로 삼는다. 품목을 늘리면 창고·검사·서류 부담도 함께 늘어 '넓히는 비용'을 배우게 한다. 장마다 늘릴 수 있는 품목 수에 상한을 둔다. [37][280][281][285] 판본: NBER 수치는 2000년 미국 제조업 HS 10단위 기준이다. KDI 요약의 '품목' 단위(HS 몇 단위인지)는 미확인이다. 한국 전체 수출기업(첫수출기업 제외)의 품목 수 분포는 확인하지 못했다. 겹침: DK4-O11(투자가 공급 접근성을 바꿈), DK4-O12(지사장에게 거래 허용 품목 위임)와 겹친다. G3-03(HS·보관 조건을 함께 표시하는 시장표)에는 품목이 적을수록 표가 단순해지는 이점이 있다.
- ENV-N02 실측 자료는 날짜·판본·해시·라이선스가 붙은 스냅숏으로만 반입: [자료에서 확인] Comtrade는 수정치로 덮어쓴다. 관세청은 매월 15일경 과거분을 고치고 시도 코드도 바꾼다. WDI는 판본 번호(131)를 쓴다. KOSIS는 출처 표시에 조회일을 요구한다. [저장소] observed_fx_sample.json은 retrieved_on, raw_sha256, purpose=import_test_only, auto_load_as_operating_data=false를 이미 갖추었다. → 적용 제안: observed_fx_sample.json 형식을 모든 실측 자료의 표준 머리말로 넓힌다. 필수 필드는 publisher, dataset, version 또는 release_date, retrieved_on, source_url, raw_sha256, license_id, attribution_text, code_edition(HS·지역 코드 판본), revision_policy_note다. 게임은 실행 중 API를 부르지 않고 빌드 때 고정한 스냅숏만 읽는다. 알파 테스트 판에는 스냅숏 날짜를 화면 각주로 보인다. [253][260][269][270][271][285] 판본: Comtrade 무료 계정의 한도(하루 500회, 호출당 10만 건)는 2026년 도움말 기준이다. WITS 페이지의 5만 건 문구는 구 판본이다. 겹침: 기존 data_basis(OBSERVED_AND_DERIVED)와 sources.json 구조를 넓히는 제안이다. DK4-O06(갱신 시각을 보여주는 시세 화면)과 겹친다.
- ENV-N03 라이선스 등급별 반입 규칙(묶어 배포 가능·변환해서만·반입 금지): [자료에서 확인] 출처를 표시하면 변형·재배포가 가능한 자료는 CC BY 4.0(WDI), CC BY 3.0 IGO(UNCTAD), KOSIS 국내 통계, 공공누리 제1유형이다. 원값 재배포에 허락이 필요한 자료는 Comtrade다. 분석 발표를 넘는 재배포에 WTO 승인이 필요한 자료는 WTO IDB/CTS다. TRAINS는 맞춤 라이선스다. 비상업 용도와 재배포 금지 조건이 붙은 자료는 KOSIS 국제통계와 공공누리 제2·4유형이다. ECB 통계는 수정하지 않는 조건이다. → 적용 제안: sources.json에 license_tier를 둔다. A는 원값 번들 허용(출처 표시), B는 변환 지표만 허용(원값 비포함), C는 반입 금지(설계 참고만)다. 검사기는 A가 아닌 출처를 인용한 수치 필드가 번들에 원값으로 있으면 실패시킨다. 상용 출시(8/10 목표)를 고려해 비상업 조건이 붙은 자료는 C로 분류한다. [250][251][257][259][260][261][263][268][271][274] 판본: WTO 원문(wto.org)은 접속 차단으로 읽지 못했다. WTO 조건은 WITS 약관에 옮겨 적힌 문구 기준이다. ECOS Open API 약관 본문은 미확인이다. 겹침: 기존 DK4-O·G3 관찰에는 라이선스 규칙이 없다. 새 영역이다.
- ENV-N04 실측값을 게임 수치로 직접 쓰지 않고 등급·지수로 변환: [자료에서 확인] Comtrade는 새 지표·지수·증가율·점유율을 '실질적 변환'으로 인정하지만, 반올림은 변환으로 보지 않는다. Data Games 연구는 실제 자원 분포가 공정한 밸런스와 거의 맞지 않는다고 지적한다. KOSIS는 수치를 임의로 바꾸면 안 된다고 한다. → 적용 제안: 예: 커피 HS 0901 품목의 국가별 수입 수요는 연 증가율을 5단계 수요 등급(매우 낮음~매우 높음)으로 바꿔 거래처 생성 확률에만 쓴다. 화면에는 '실제 통계를 바탕으로 만든 게임 등급'이라고 표시한다. 원값은 학습 카드(출처·연도·단위 포함)에서만 A등급 출처로 보여준다. 변환식과 기준 연도를 데이터 파일에 기록해 재현할 수 있게 한다. [251][271][282] 판본: Comtrade의 변환 판단은 사례별 결정 여지가 있다고 명시되어 있다('case-by-case decisions'). 확정 판단은 UNSD에 문의할 사항이다. 겹침: DK4-O06(기준가격 대비 지수와 실제 금액 구분)과 직접 겹친다. DK4-O04(원인 카드)와는 등급 변화의 원인을 카드로 보여주는 방식으로 연결된다.
- ENV-N05 사실 섞임 검사기에 출처 메타데이터 규칙 추가: [저장소] check_fact_mixing.py에는 DESIGN_WITH_OBSERVED_LEVEL, DESIGN_SOURCE_LEVEL, DESIGN_AS_OBSERVED가 있어 설계값과 실측값의 혼동을 잡는다. 라이선스, 조회일, 코드 판본, 변환 여부는 검사하지 않는다. → 적용 제안: 검사 코드를 추가한다. OBSERVED_WITHOUT_LICENSE는 실측 객체에 license_tier가 없을 때 실패한다. OBSERVED_WITHOUT_RETRIEVED_ON은 조회일이 없을 때 실패한다. RAW_VALUE_FROM_RESTRICTED는 B·C등급 출처의 원값이 번들 필드에 있을 때 실패한다. HS_WITHOUT_EDITION은 hs_code가 있는데 hs_edition이 없을 때 실패한다. TRANSFORM_WITHOUT_FORMULA는 등급값에 변환식이 없을 때 실패한다. 화면 문구에서 '실제 통계' 표기와 DESIGN 값이 같은 문장에 오면 경고한다. [271][279][284][285] 판본: 검사기는 worktree wt-TASK-0056 기준으로 읽었다. /home/user/Scitrade 본 작업 트리에는 이 파일이 없다. 겹침: 기존 검사기를 넓히는 제안이다. 게임 규칙과는 겹치지 않는다.
- ENV-N06 LSCI를 항만 '정기선 기항 빈도 등급' 환경변수로 사용: [자료에서 확인] LSCI는 분기마다 공표되고 2023년 1분기 평균을 100으로 한다. 기항 수, 선복량, 서비스 수, 선사 수, 최대 선형, 직항 연결국 수로 구성된다. 환적 허브에서는 화주 접근성을 과대평가할 수 있다. 출처를 표시하면 재배포가 가능하다(CC BY 3.0 IGO). → 적용 제안: world.json 거점마다 '정기선 연결 등급' 1~5를 LSCI 국가·항만 분기값에서 변환해 둔다. 이 등급은 예약 가능한 선편의 주간 횟수와 대체 항로 수에만 영향을 주고, 운송일수 계산에는 쓰지 않는다. 환적 허브에는 '환적 중심' 표시를 붙여 등급과 실제 접근성의 차이를 설명한다. 순위('세계 n위')는 게임 문장에 쓰지 않는다. [263][264][265][266] 판본: 2024년 재기준화 이전 값(2004·2006 기준)과 섞지 않는다. 국가 LSCI와 항만 LSCI는 별도 계열이다. 방법론 원문(unctad.org)은 Cloudflare 차단으로 읽지 못했고, 구성 요소는 2차 자료로 확인했다. 겹침: DK4-O07(항로 지도에 거리·시간·제약 표시), DK4-O10(출발 전 선편 확인)과 겹친다. 기존 검사기의 RANK_WITHOUT_BASIS 규칙과 일관된다.
- ENV-N07 환율은 '참고 기준환율'과 '거래 환율(스프레드 포함)'을 분리: [자료에서 확인] ECB 기준환율은 정보용이며 거래 목적 사용은 강하게 권하지 않는다. 재이용 조건은 출처 표시와 무수정이다. 한국은행은 출처 표시와 가공 사실 표시를 요구한다. [저장소] KRW/USD를 ECB 두 환율로 나누어 계산한 파생값을 보관하고 있다. → 적용 제안: 화면에 '참고 환율(실측 스냅숏, 날짜·출처)'과 '거래 환율(게임 은행, 설계값 = 참고 환율 ± 스프레드)'을 나란히 보인다. 거래 환율 경로는 설계값(DESIGN)으로 표시하고, 실측 구간의 범위 안에서만 움직이게 한다. 파생값에는 원래 계열을 함께 남기고 '계산값'이라고 표시해, ECB의 무수정 조건에 맞게 원 통계와 구분한다. [272][274][275][285] 판본: ECOS 환율 계열의 이용약관은 미확인이다. 파생값 계산이 ECB 정책의 '수정'에 해당하는지는 원문에 명시가 없다. 판단이 필요한 미확인 사항이다. 겹침: DK4-O05(확정 전에 환전 비용 표시), DK4-O06(통화·갱신 시각 표시)과 겹친다.
- ENV-N08 FTA·관세 양허를 날짜가 붙은 '협정 상태 카드'로 회사 밖에 둔다: [자료에서 확인] 한국 FTA는 발효·서명/타결·협상 중 단계로 나뉘고 목록이 계속 바뀐다(2026-10 확인 기준으로 한-GCC·한-말레이시아 등은 서명/타결, 한-태국·한-파키스탄은 협상 중). WTO API는 양허·실행·특혜관세 지표를 제공하지만, 관세 원자료는 재배포 승인이 필요하다. → 적용 제안: 회사가 바꿀 수 없는 환경 카드로 '협정 상태(기준일)'를 둔다. 카드에는 특혜관세를 받으려면 원산지 증빙이 필요하다는 요건과, 증빙이 없으면 일반 관세가 적용된다는 결과만 넣는다. 관세율 숫자는 취급 품목 1~2개의 HS 6단위에 한해 확인한 경우만 실측으로 쓰고, 나머지는 '게임 설정 관세'로 표시한다. 협정 발효를 장 안의 사건으로 쓸 때는 가상 상대국으로 바꾼다. [257][267][276][279] 판본: FTA 체결현황은 2026-10-13 조회 기준이다. 발효 협정 수를 숫자로 확정하지 않았다(목록에 DPA 같은 디지털 협정이 섞여 있다). 품목별 양허 세율은 확인하지 않았다. 겹침: DK4-O04(통상규제 원인 카드)와 겹친다. Democracy 4식 정책 그물을 기업 안으로 옮긴다는 사용자 방향에 맞춰, 협정은 그물 밖에서 들어오는 외부 입력으로 둔다.
- ENV-N09 무역구제는 가상 품목·가상 국가의 '조사 진행' 사건으로: [자료에서 확인] 무역위원회의 제도 범주는 덤핑방지관세, 상계관세, 세이프가드, 불공정무역행위 조사다. → 적용 제안: 취급 품목과 같은 품목군에 '가상 국가 A산 제품에 대한 덤핑방지 조사 개시'가 일어나는 사건을 둔다. 결과는 조사 기간 동안의 매입처 선택 위험(잠정 관세 가능성)으로 나타나고, 플레이어는 대체 조달처와 계약 조항(관세 변동 부담)으로 대응한다. 실제 사건·실명 기업·실제 판정 세율은 쓰지 않는다. 신청·조사·판정 단계 이름은 교육용으로 사실에 맞게 쓴다. [277] 판본: 절차 단계와 기간은 법령 원문(law.go.kr 접속 실패)을 확인하지 못했다. 단계 이름 외의 기간 수치는 설계값으로 둔다. 겹침: DK4-O04(원인 카드와 영향 시작 시점 표시)와 겹친다.
- ENV-N10 수출통제·제재는 '거래 상대 확인' 절차로 가르치고 실명 목록은 쓰지 않는다: [자료에서 확인] OFAC SDN 목록은 정해진 일정 없이 수시로 갱신된다. 목록에 오른 대상은 자산이 동결되고 미국인과의 거래가 일반적으로 금지된다. → 적용 제안: 계약 확정 전에 '거래 상대 확인' 단계를 둔다. 가상 확인 목록과 대조하고, 목록 갱신 사건이 날 수 있으며, 의심 신호(최종 용도 불명 등)가 있으면 보류한다. 확인 목록의 이름은 모두 가상 기관명으로 한다. 실제 국가를 '제재 대상'으로 지정하지 않는다. 중고생 대상이므로 지정학적 책임 서사는 넣지 않고, 서류 확인 습관을 배우는 데 초점을 둔다. [278] 판본: 한국 전략물자·상황허가 제도의 공식 원문(전략물자관리원, 법령)은 이번에 읽지 못했다. 교육용 문구에 '캐치올' 같은 제도명을 쓰기 전에 공식 자료로 교차 확인해야 한다. 겹침: DK4-O10(출발 전 서류 준비 검증)과 겹친다.
- ENV-N11 국가·지역 이름은 게임 고유 ID와 중립 명칭을 쓰고, 출처의 국가 목록을 그대로 들이지 않는다: [자료에서 확인] 같은 관세영역을 WTO 쪽은 'Taipei, Chinese', UN Comtrade는 'Taiwan, Province of China'로 표기한다. 국제기구 약관에는 국경·영토에 관한 면책 문구가 붙어 있다. → 적용 제안: 자료를 반입할 때 출처의 국가 코드를 world.json 거점 ID로만 대응시키고, 화면 이름은 게임 명칭 사전에서 가져온다. 거점이 아닌 국가·지역은 게임에 이름을 띄우지 않고 '그 밖의 시장'으로 묶는다. 대응표에는 출처별 원래 표기를 기록해 검토할 수 있게 한다. [250][257] 판본: 표기 정책은 기관과 시점에 따라 바뀔 수 있다. 겹침: world.json 거점 체계와 check_fact_mixing의 UNKNOWN_CITY_ID 규칙과 겹친다.
- ENV-N12 잠정치·수정·CIF/FOB 차이를 학습 소재로 사용: [자료에서 확인] 관세청 통계는 매월 정정되고, 수입은 과세가격·수출은 신고가격 기준이다. Comtrade는 수정치로 덮어쓴다. 양국 통계는 CIF/FOB와 시차 때문에 어긋나며, BACI는 이를 맞추는 추정 절차를 쓴다. → 적용 제안: 회사 월간 보고서의 '시장 통계' 칸에 잠정·확정 표시를 둔다. 학습 카드 하나를 두어 '같은 커피 교역이 왜 두 나라 통계에서 다른가(CIF·FOB, 운송 중 시차)'를 보여주고, 플레이어가 견적에서 고른 인코텀즈와 연결한다. 판정은 퀴즈가 아니라 보고서 해석 대화로 한다. [253][254][269][283] 판본: BACI 방법론은 2010년 판(1994–2007 자료) 기준이다. 최신 판의 방법 변경은 미확인이다. 겹침: DK4-O05(견적에 운임·보험 표시), DK4-O06(통화·단위·갱신 시각)과 겹친다.
- ENV-N13 품목마다 HS 판본을 고정하고 2028 개정에 대비: [자료에서 확인] HS 2028(제8판)은 2028-01-01에 발효된다. 관세청 성질 분류도 'HS 2022 연계표'처럼 판본을 표시한다. [저장소] goods.json은 hs_code와 hs_edition이 null이다. → 적용 제안: 품목을 좁힌 뒤 1장 품목의 HS 2022 6단위 코드를 공식 자료로 확인해 넣는다. hs_edition='HS2022'와 확인일을 기록한다. 2028 개정 상관표는 확인 작업 목록에만 남기고 게임 규칙에는 넣지 않는다. [270][279][285] 판본: 1장 품목의 실제 HS 코드 대응은 이번 조사 범위에서 확인하지 않았다. 겹침: G3-03(HS·보관 조건을 함께 표시)와 겹친다.

## 들여오지 않을 것

- UN Comtrade 원값 표(국가×품목×연도)를 게임 번들·저장소에 그대로 넣기: 내부 이용이 원칙이고 형태를 바꾸지 않은 재배포에는 UNSD 허락이 필요하다. 반올림·형식 변경은 변환으로 인정되지 않는다(envdata-ct-policy, envdata-ct-redissem).
- WTO IDB/CTS·UNCTAD TRAINS 관세 원자료 일괄 반입: 분석 발표를 넘는 재배포에는 WTO 사전 승인이 필요하다. TRAINS는 맞춤 라이선스이며 조건 원문은 미확인이다(envdata-wits-terms, envdata-wb-trains-cat).
- 학생 브라우저에서 실시간 공개 API 호출(Comtrade·ECOS·관세청): API 키 노출, 하루 호출 한도, 공정 이용 위반 위험이 있다. 수정치 덮어쓰기 때문에 같은 판을 재현할 수도 없다(envdata-ct-subs, envdata-ct-policy, envdata-ct-pipeline).
- KOSIS 국제통계·공공누리 제2·4유형 자료: 비상업 용도만 허용하거나 재배포·변경을 금지하므로 상용 출시를 목표로 하는 게임과 맞지 않는다(envdata-kosis-guide, envdata-kogl).
- Port Economics, Management and Policy 사이트의 지도·도표·문장: 어떤 형태로든 복제·재배포를 금지한다고 명시되어 있다(envdata-pemp-lsci).
- ECB·한국은행 기준환율을 게임 안 '거래 환율'로 그대로 사용: 기준환율은 정보용이며 거래 목적 사용은 권장되지 않는다. 게임 거래 환율은 설계값으로 따로 표시해야 한다(envdata-ecb-ref).
- 실제 제재·수출통제 대상 국가와 기관 이름을 게임의 적대 상대로 쓰기: 목록이 일정 없이 바뀌어 사실성이 금방 깨진다. 중고생 교육용 게임에서 실제 국가를 낙인찍는 민감성이 있다(envdata-ofac-faq).
- 실제 무역구제 사건(실명 기업·국가·판정 세율): 실명 기업은 게임 밖 자료에서만 쓴다는 프로젝트 규칙과 맞지 않고, 판정은 사건별 법적 판단이다. 법령 원문도 확인하지 못했다.
- LSCI 값으로 '세계 n위 항만' 문장 만들기, LSCI로 운송일수 계산: LSCI는 연결성 지수이지 순위표나 운송 시간이 아니며, 환적 허브를 과대평가할 수 있다. 저장소 규칙(RANK_WITHOUT_BASIS)과도 충돌한다(envdata-pemp-lsci, envdata-lsci-factsheet).
- 출처의 국가 목록과 국가명을 그대로 화면 이름으로 쓰기: 기관마다 표기가 달라 민감한 표기 분쟁을 게임이 떠안게 된다(envdata-wits-terms, envdata-ct-policy).
- 'FTA n개 발효' 같은 협정 수를 날짜 없는 고정 사실로 쓰기: 협정 단계가 계속 바뀌고, 목록에 FTA가 아닌 디지털 협정(DPA·DTA)이 섞여 있어 세는 기준이 모호하다(envdata-fta-status).
- '다품목 기업이 수출을 지배한다'는 실증을 게임의 확정 성장 법칙으로 쓰기: 2000년 미국 자료의 상관관계일 뿐 인과 법칙이 아니다. 업종과 국가에 따라 다르다(envdata-nber-firms). 게임에서는 설계값으로 표시한다.

## 출처끼리 어긋나는 점

- Comtrade 내려받기 한도: WITS 약관은 '50,000 data records per query', WITS FAQ는 '100,000'으로 적는다. 2026년 Comtrade 도움말은 무료 계정 기준 '100K records per call'과 '500 calls/day'다. WITS 약관 문구가 구 판본으로 보인다.
- Comtrade 재배포 범위: WITS 약관은 서면 허락 없이 'in any form' 재배포할 수 없다고 적는다. 현행 Comtrade 도움말은 소량 표·그래프 게시, 무료 시각화 앱, 실질적 변환 자료에 허락이 필요 없다고 한다. 시기가 다른 규정이 함께 유통되고 있다.
- Comtrade 재배포 전제: UN 판매 페이지(shop.un.org)는 재배포의 전제로 'active Premium Pro subscriber'를 요구한다. Comtrade 도움말은 무료 시각화 앱과 소량 게시를 라이선스 없이 허용하는 목록으로 제시해 강조점이 다르다.
- LSCI 구성 요소 수: UNCTAD 요약 팩트시트(파나마 2차 자료)는 6개 요소라고 하고, PEMP 교재 페이지는 'five major components'로 설명한다. 기준값도 PEMP는 초기 지수가 '2006년 최고값=100'이었다고 하고, 팩트시트는 이전 계열이 '2004년부터' 작성되었다고 해서 서술이 다르다.
- 관세청 시군구별 품목별 수출입실적 API의 갱신 주기: 같은 페이지 본문은 '공표주기 1개월, 매월 15일경'이라고 하고, 메타데이터 칸은 '업데이트 주기 실시간'이라고 적는다.
- 같은 관세영역의 명칭이 WTO 계열(WITS 약관)에서는 'Taipei, Chinese', UN Comtrade 도움말에서는 'Taiwan, Province of China'로 다르다.
- UNCTAD 공표 일정에서 월간 LSCI의 시작 시점이 공표분마다 'Jan 2006'과 'Feb 2006'으로 다르게 적혀 있다.
- 자료 재이용 조건의 방향 차이: World Bank CC BY 4.0과 KOSIS 국내 통계는 변형·재배포를 허용한다. ECB는 '수정하지 않는 조건'을 둔다. 한국은행은 가공을 허용하되 가공 사실 표시를 요구한다. 파생 환율(KRW/USD)을 만드는 저장소 방식이 어느 기준에 맞는지는 출처마다 판단이 다르다.

## 빈칸

- WTO 공식 사이트(www.wto.org, ttd.wto.org, docs.wto.org)는 DNS 실패 또는 402 응답으로 읽지 못했다. WTO 자료 이용 조건은 WITS 약관에 옮겨 적힌 문구로만 확인했다. WTO 저작권·허가 페이지와 G/MA/238 문서 원문은 미확인이다.
- 한국은행 ECOS Open API 이용약관 본문은 화면이 스크립트로만 그려져 읽지 못했다. 한국은행 홈페이지 저작권보호방침이 ECOS 통계에도 적용되는지는 미확인이다. ECOS 환율 계열의 갱신 시각도 미확인이다.
- 관세청 수출입무역통계 누리집(tradedata.go.kr)과 국가법령정보센터(law.go.kr)는 접속에 실패했다. 관세청 통계 누리집의 자체 이용약관과 관세법·대외무역법의 무역구제·전략물자 조문은 미확인이다.
- UNCTAD 본 사이트(unctad.org)는 Cloudflare 차단으로 LSCI 방법론 원문과 TRAINS 이용 조건 원문을 읽지 못했다. LSCI 구성은 2차 자료 두 곳(파나마 물류 플랫폼, PEMP)에 의존한다.
- UN Comtrade 라이선스 계약서 원문(comtrade.un.org/licenseagreement.html)은 DNS 실패로 읽지 못했다.
- JEP 2007 학술지 원문(aeaweb)은 Cloudflare 차단으로 열지 못했다. LSE 판은 robots.txt가 Claude-User를 막아 사용하지 않았다(실수로 연 랜딩 페이지는 폐기). NBER 워킹페이퍼 판으로 대체했다.
- 한국 수출기업 전체(첫수출기업 제외)의 품목 수 분포 공식 통계를 찾지 못했다. KDI 요약의 '품목' 분류 단위(HS 몇 단위인지)도 미확인이다.
- 전략물자관리원(kosti.or.kr)의 상황허가(캐치올) 공식 설명 페이지를 찾지 못했다. 미국 BIS Entity List 페이지는 404였다. 수출통제 관련 근거는 OFAC 하나뿐이다.
- FTA 발효 협정의 공식 개수, 품목별 양허 세율, 원산지 기준은 확인하지 않았다.
- 여러 핵심 사실(LSCI 방법론, 무역구제 범주, 제재 목록 갱신)은 독립 출처 3개를 채우지 못하고 1~2개에 그쳤다.
- Victoria 3, Democracy 4, 거상 및 사용자가 준 나무위키 링크는 이 묶음(공개 자료·라이선스)의 초점이 아니어서 열지 않았다. 해당 원작과의 겹침은 기존 DK4-O·G3 관찰 ID로만 표시했다.

## 검증 정정

- 요약의 'World Bank WDI: CC BY 4.0이다(카탈로그 131판, 2026-10-09 갱신, 연간)'를 'World Bank WDI: CC BY 4.0이다(카탈로그 131판, 메타데이터 2026-10-12 갱신·자료 파일 2026-10-09 갱신, 연간)'로 고친다.
- 요약의 UN Comtrade 항목을 다음처럼 고친다. 'UN Comtrade: 내부 이용이 원칙이다. 다만 현행 도움말은 영리 목적이라도 총 10만 건 미만의 소량 자료는 추가 라이선스 없이 재배포할 수 있다고 한다. 지수·증가율·점유율처럼 실질적으로 변환한 자료는 영리 여부와 관계없이 저작권 제한이 없다고 한다. 무료 시각화 앱 면제는 상용 게임에는 해당하지 않을 수 있다(영리 시각화 앱은 유료 라이선스 대상).'
- do_not_import 첫 항목('Comtrade 원값 표를 그대로 넣기')의 이유를 다음처럼 고친다. '총 10만 건 이상이면 유료 배포 라이선스가 필요하다. 10만 건 미만은 영리 목적이라도 추가 라이선스 없이 재배포할 수 있지만, 수정치 덮어쓰기와 재현성 문제 때문에 변환 지표만 넣는다.' 원값 반입을 일률적으로 '허락 필요'로 쓰면 원문보다 엄격한 오기다.
- contradictions 셋째 항목(shop.un.org의 Premium Pro 전제)은 모순이 아니다. Comtrade 도움말에도 'To re-disseminate UN Comtrade data with a fee, a user must be an active premium subscriber'가 있어, Premium 전제는 '유료 라이선스로 원값을 재배포하는 경우'에만 해당한다. '적용 범위가 다른 규정'으로 고친다.
- facts 7번의 '중앙은행 기준환율은 정보용이다'를 'ECB는 기준환율이 정보용이며 거래 목적 사용을 강하게 권하지 않는다고 밝힌다(한국은행의 같은 취지 문구는 미확인)'로 고친다.
- evidence 59(FTA 체결현황) 인용은 축약본이다. '협상중' 목록에는 한-중-일 FTA, 한-MERCOSUR TA, 한-러시아 FTA, 한-우즈베키스탄 STEP이 한-태국·한-파키스탄보다 먼저 나온다. 축자 인용 표시를 빼거나 생략 부호(…)를 넣는다.
- evidence 63의 claim을 'OFAC 제재 목록에 오른 대상은 자산이 동결되고 미국인(U.S. persons)의 거래가 일반적으로 금지된다'로 고친다. '계약 전 필수 절차가 된다'는 한국 기업에 대한 원문 근거가 없는 추론이므로 설계 해석으로 분리한다.
- evidence 40의 '최대 선형'을 '최대 평균 선형을 가진 서비스의 평균 선박 크기'로 고친다.
- contradictions 넷째 항목(LSCI 요소 수·기준값)은 같은 지수의 서로 다른 판을 설명한 것이다. PEMP는 '초기 지수'(2006 최고값=100, 5개 요소)를, 팩트시트는 '직항 국가쌍 수를 더해 2006년부터 새로 만든 계열, 2024년부터 2023 Q1=100'을 설명한다. 이 항목은 '판본 차이'로 고친다.
- KOSIS 라이선스 서술에 '단, KOSIS 간행물은 공공누리 유형 안내에 따른다'는 예외를 덧붙인다.
- goods.json 서술의 '품목 8개가 모두 DESIGN 값으로 있다'를 '파일 단위 data_basis가 DESIGN이고, 8개 품목 모두 hs_code·hs_edition이 null(NOT_VERIFIED)이다'로 고친다.
- Data Games 서지의 연도 2013은 PDF 본문이 아니라 파일명·학회명(FDG/PCG Workshop)에 기댄 것이다. 서지에 '연도: 파일명 기준'이라고 표시한다.
