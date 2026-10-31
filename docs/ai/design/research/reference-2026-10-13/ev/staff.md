# 영역 staff: 동물·신수 직원 수집·성장 설계와 신수의 문화적 근거

## 요약

이번 묶음은 직원 수집·성장 조사다. 사용자 요청(회사 취급 물품을 좁게 정하기)과 직접 겹치지 않는다. 다만 Kairosoft의 'Game Dev Story'에서 직원 경험이 쌓이면 만들 수 있는 장르가 열리는 구조를 확인했다. 이를 처음에는 좁은 품목으로 시작하고 직원과 회사의 품목 경험에 따라 인접 품목을 여는 안(ST-N05)으로 연결했다. 현재 data/goods.json에는 커피·의류·화장품·냉동 수산물·가구·전자제품·자동차 부품·태양광 모듈 8종이 처음부터 나란히 있다.

확인한 핵심:
(1) 경영 시뮬레이션은 타고난 성격·특성과 훈련으로 얻는 자격·기술을 나눈다. Two Point Hospital의 공식 Steam 설명과 위키백과가 이를 보여준다. Game Dev Story는 같은 훈련을 반복하면 효과가 줄고, 고급 직업으로 바꾸려면 하위 직업 숙련이 필요하다.
(2) Palworld는 종(species)마다 작업 적성을 고정하고, 개체마다 무작위 패시브를 붙인다. 공식 홍보 문구는 '노동법 없음', '멸종위기 개체 밀렵으로 돈벌이'를 농담으로 내세웠고 비평을 받았다. 반대로 2025-12 Two Point Museum의 Zooseum 확장은 동물을 치료해 야생으로 돌려보내는 구조다.
(3) 신수의 근거는 한국민족문화대백과사전 8개 항목(사신도·현무·해태·기린·기린도·봉황·불가사리·불가사리 설화)을 직접 열어 확인했다. 사신(청룡·백호·주작·현무)과 사령(기린·봉황·거북·용)은 다른 묶음이다. 그런데 같은 백과사전 안에서도 '사령'이라는 말을 다르게 쓴다. 현무의 정체를 거북으로 볼지, 거북과 뱀으로 볼지도 항목마다 다르게 서술한다.
(4) 의인화가 학습에 주는 영향은 엇갈린다. Ganea 등(2014)에서는 의인화 그림과 의인화 언어를 함께 쓰면 사실 학습이 줄고 동물에게 사람 특성을 붙이는 경향이 늘었다. Geerdts 등(2016)에서는 학습 방해가 없었고, 의인화 그림이 오히려 도움이 되기도 했다. 두 연구 모두 미취학 아동 대상이라 중고등학생에게 그대로 옮기기 어렵다. Brom 등(2018) 메타분석은 얼굴 의인화와 색채 디자인이 학습에 작은 긍정 효과(d≈0.3~0.4)를 보였고, 내재 동기 효과는 아동에서 더 컸다고 보고했다.
(5) 원래 출신에 따라 붙던 능력치 보너스를 플레이어가 바꿀 수 있게 한 사례가 있다. Wizards of the Coast의 2020년 발표이며, 원문 대신 EN World 재게재본으로 확인했다.
(6) 무작위 영입의 위험: 루트박스 지출과 문제성 도박의 연관이 보고되었다(Zendle & Cairns 2018). 다만 인과관계는 밝혀지지 않았다. 한국에서는 확률형 아이템 정보공개 기준이 2024-02-19 문체부 보도자료로 나왔다.

저장소와 대조: 레벨1 능력 합계 300 고정, 희귀도 배율 없음, 국적 보너스 0, 무급 노동 금지, 멸종위기종을 포획하지 않는 원칙은 위 근거들과 맞다. 고칠 점도 있다. characters.json의 신화 출처 일부가 이제 접근 금지가 된 khan.co.kr이고, 불가사리 출처는 위키트리·지역 언론이다. 한국민족문화대백과사전 항목으로 바꿀 필요가 있다. 또 과제 설명은 평택 본사를 전제로 하지만, 작업 트리 문서·데이터의 만남 도시는 부산이고 평택 표기는 찾지 못했다.

## 사실(삼각검증 판정)

- (two_sources) 사신은 동쪽 청룡·서쪽 백호·남쪽 주작·북쪽 현무의 방위 수호 동물이며, 한국에서는 4~5세기 고구려 고분벽화에 처음 나타난다(같은 발행처 항목 2개라 독립 출처 3개 미달). [197][198] — 검증 메모: 사신도 항목(1995)과 현무 항목(1995, 현정준)은 같은 발행처의 다른 집필자 항목이다. 반쯤만 독립적이다. '4~5세기 고구려 고분벽화에 처음'이라는 부분은 사신도 항목 하나에만 근거한다.
- (two_sources) 기린·봉황·거북·용을 사령(四靈)이라 부르며, 기린은 어진 짐승(인수)이자 태평성대의 상징, 봉황은 덕치·천자의 상징으로 쓰였다(같은 백과사전의 서로 다른 집필 항목 3개). [200][201][202] — 검증 메모: 기린 항목과 봉황 항목은 집필자가 같다(서대석, 1995). 기린도 항목만 다른 집필자다(이재중, 2017). 그래서 독립 출처는 둘이다. '봉황=천자·덕치 상징'은 봉황 항목 하나에서 확인된다.
- (single_source) 해태(해치)는 옳고 그름을 가려 바르지 않은 쪽을 들이받는 외뿔 짐승으로 전하며, 조선 대사헌 흉배와 궁궐 장식에 쓰였고 화재·재앙을 막는 신수로도 여겨졌다. [199][224] — 검증 메모: 한국민족문화대백과사전 해태 항목 하나뿐이다. staff-repo는 저장소 내부 자료이고 khan.co.kr 등을 인용하므로 독립 출처로 세지 않는다.
- (two_sources) 불가사리(불가살이)는 쇠를 먹어 커지고 불로만 소멸하는 설화 속 괴생물이며, 민속에서는 화재·재앙을 막는 존재로 굴뚝 등에 새겨졌다. [203][204] — 검증 메모: 불가사리 항목(2024 집필)과 불가사리 설화 항목(2022, 박현숙)은 같은 발행처의 다른 집필자 항목이다. 원문은 '불로만'이 아니라 '상극인 불에 의해 소멸'이라고 쓴다.
- (triangulated) 의인화 동물 매체가 아동의 사실 학습과 인간 중심 추론에 미치는 영향은 연구마다 엇갈리며, 모두 미취학 아동 대상이다. [190][191][192][193] — 검증 메모: Ganea 등 2014, Waxman 등 2014, Geerdts(NAAEE 요약과 학위논문은 같은 저자라 하나로 셈)로 독립 연구가 셋이다. 셋 모두 3~5세 미취학 아동 대상이라는 점도 원문에서 확인했다.
- (single_source) 멀티미디어 학습 자료의 얼굴 의인화·색채 디자인은 학습에 작은 긍정 효과를 보였고, 내재 동기 효과는 아동에서 더 컸다는 잠정 증거가 있다. [194] — 검증 메모: Brom 등 2018 메타분석 하나뿐이다. 수치와 '잠정 증거'라는 표현은 원문과 맞다.
- (two_sources) 경영 시뮬레이션은 직원의 타고난 성격·특성과 훈련으로 얻는 자격·기술을 별도 축으로 둔다. [205][208][210][214] — 검증 메모: 실제로 확인된 것은 Two Point Hospital 한 게임에 대한 Steam 설명과 위키백과 두 출처다. Game Dev Story의 Steam 문구에는 성격과 자격을 나누는 구분이 없다. 팬 위키(kw-training)는 이번에 열 수 없었다. '경영 시뮬레이션은 …'이라는 일반화는 과하다.
- (single_source) Game Dev Story는 직업 변경 시스템을 두고, 고급 직업은 하위 직업 숙련(레벨 5)을 전제로 하며, 직원 경험이 쌓일수록 개발 가능한 장르가 넓어진다. [205][207][209] — 검증 메모: Steam 공식 설명이 확인해 주는 것은 직업 변경과 경험에 따른 장르 확장뿐이다. '고급 직업은 하위 직업 레벨 5'는 팬 위키에만 기대는데, 이번에 열지 못해 미확인이다.
- (single_source) Palworld는 작업 적성을 종 단위로 정하고, 개체별 무작위 패시브를 별도로 붙인다. [217][218][219] — 검증 메모: Steam 문구는 '어떤 Pal은 무엇을 잘한다'만 확인해 준다. 종 단위 적성과 개체별 무작위 패시브 0~4개는 팬 위키에만 기대고, 이번 검증에서는 다시 열지 못했다.
- (two_sources) Palworld의 생명체 노동·밀렵 농담식 연출은 주요 매체와 비평에서 비판을 받았다. [217][220][221] — 검증 메모: 독립 비평 출처는 위키백과(Rock Paper Shotgun과 PC Gamer 인용)와 Laptop Mag 둘이다. Steam은 비판 대상이지 비판 출처가 아니다. 위키백과에는 긍정 평가도 함께 실려 있다.
- (single_source) 최근 상용 경영 게임(Two Point Museum: Zooseum, 2025-12)은 동물을 치료·재야생화하면 보상하는 보전형 구조를 채택했다. [212][213] — 검증 메모: 보전형 구조의 근거는 Zooseum의 Steam 설명 하나다. Two Point Museum 본편의 Steam 설명은 보전 구조를 말하지 않는다. 사례도 한 게임뿐이다.
- (single_source) 루트박스 지출과 문제성 도박의 연관이 보고되었으나 인과는 미확정이며, 한국은 2024년 확률형 아이템 정보공개 기준을 마련했다. [195][196] — 검증 메모: 두 하위 주장이 각각 출처 하나(Zendle & Cairns 2018, 문체부 보도자료)에 기댄다. 서로 다른 내용이라 교차 확인이 되지 않는다.
- (single_source) 대형 RPG 발행사가 종족 출신에 묶인 능력치 증가를 플레이어가 바꿀 수 있게 하겠다고 공식 발표했다(2020). [222] — 검증 메모: EN World의 보도자료 재게재본 하나다. WotC 원문 페이지는 열지 않았다.
- (single_source) Scitrade 현재 설계는 레벨1 능력 합계 300, 희귀도 배율 1.0, 국적 보너스 0을 규칙으로 둔다. [224] — 검증 메모: 저장소 내부 설계 값이다(character_rules.json의 base_stat_budget 300과 nationality_bonus 0, 문서의 '희귀도 배율로 곱하지 않는다'). 최신 브랜치에서도 같다.

## 근거(인용)

- E:staff:0 [190] (confirmed, 신뢰 92) 동물을 의인화해 묘사하는 언어는 아이들이 동물에게 사람 특성을 붙이는 경향을 키웠고, 어린 아동의 새 사실 학습에도 영향을 주었다. — "The results show that the language used to describe animals in books has an effect on children's tendency to attribute human-like traits to animals, and that anthropomorphic storybooks affect younger children's learning of novel facts about animals." (Abstract)
- E:staff:1 [190] (confirmed, 신뢰 92) 연구 1의 대상은 3~5세 미취학 아동 70명이므로 중고등학생에게 결과를 옮길 때는 한계가 크다. — "Participants were divided into groups of 3-year-olds (N = 24; M = 40.6 months; Range = 36.0–47.1 months), 4-year-olds (N = 24; M = 53.0 months; Range = 48.0–59.6 months), and 5-year-olds (N = 22" (Study 1 > Methods > Participants)
- E:staff:2 [190] (confirmed, 신뢰 92) 의인화 그림과 의인화 언어를 함께 쓰면 3세·5세 모두 실제 동물에 관한 사실을 덜 배우고 덜 적용했다. — "However, when anthropomorphic language and pictures were combined (Full Anthropomorphism), children at both ages were less likely to learn the facts from the books and apply them to the real animal." (Study 2 > Results and discussion (요약 문단))
- E:staff:3 [190] (confirmed, 신뢰 92) 의인화 그림만으로는 아이들이 책에서 얻는 정보에 거의 영향이 없었다. 문제는 그림과 언어의 결합이었다. — "the results of Study 2 indicate that anthropomorphic illustrations in and of themselves have little effect on the information children take away from picture books." (Study 2 > Results and discussion)
- E:staff:4 [190] (confirmed, 신뢰 92) 저자들은 더 큰 아동도 의인화 언어로 진화 개념을 배우면 정확히 해석하기 어렵다는 선행연구를 인용했다(2차 인용이며 원문 미확인). — "research with older children has shown they have more difficulty accurately interpreting evolutionary change when those concepts are presented using anthropomorphic language (Legare et al., 2013)." (General discussion)
- E:staff:5 [190] (confirmed, 신뢰 92) 학습 효과가 가장 낮았던 '그림+언어 모두 의인화' 형식이 시판 그림책의 전형이라고 저자들은 지적했다. — "This type of book, which combines both fantastical language and anthropomorphic illustrations of animals, is typical of commercially available books." (General discussion)
- E:staff:6 [191] (confirmed, 신뢰 90) 의인화된 곰 이야기를 읽은 5세는 인간 중심 추론을, 동물 백과를 읽은 5세는 생물학적 추론을 보여, 직전에 접한 매체의 관점이 추론을 바꿨다. — "The priming had a dramatic effect. Children reading the Berenstain Bears showed the standard anthropocentric reasoning pattern, but those reading the Animal Encyclopedia adopted a biological pattern." (Abstract)
- E:staff:7 [191] (confirmed, 신뢰 90) 아동 매체는 인간 중심 추론을 부추길 수도 있고, 생물학적 관점으로 주의를 돌릴 수도 있는 양날의 칼이다. — "Thus, children’s books and other media are double-edged swords." (Abstract (마지막 부분))
- E:staff:8 [192] (confirmed, 신뢰 68) Geerdts 등(2016)에서는 의인화 언어·그림이 실제 동물에 대한 사실 학습을 방해하지 않았고 비현실적 심리 속성 믿음도 늘리지 않았다(2차 요약). — "Contrary to previous research, findings of this study indicated that anthropomorphic language and pictures in storybooks did not interfere with factual learning about real animals and did not lead children to hold unrealistic beliefs about the psychological properties of real animals." (연구 요약 본문 4번째 문단)
- E:staff:9 [192] (confirmed, 신뢰 68) Geerdts 연구의 표본은 3~5세 48명(통제 12명 별도)으로, 이 연구 역시 미취학 아동 대상이다. — "forty-eight preschool children (age 3-5) were randomly assigned to participate in one of four different experimental conditions" (연구 요약 본문 2번째 문단)
- E:staff:10 [192] (confirmed, 신뢰 68) Geerdts 등 2016의 서지는 Imagination, Cognition and Personality 36(1)이며, 이 요약은 쪽수를 22로만 표기한다. — "Geerdts, M.S., Van de Walle, G.A., & LoBue, V. (2016). Learning about real animals from anthropomorphic media. Imagination, Cognition and Personality, 36(1), 22." (서지 표기 행)
- E:staff:11 [193] (confirmed, 신뢰 80) Geerdts 학위논문 실험에서는 의인화 그림 책이 오히려 인간 중심 추론을 줄였다고 보고했다. — "Contrary to previous research, storybooks with anthropomorphic pictures led to an increase in children’s willingness to project a novel biological property from both humans and animals to other animals, thus decreasing anthropocentrism." (Abstract (Study 5))
- E:staff:12 [194] (confirmed, 신뢰 85) 멀티미디어 그래픽에 얼굴 의인화·밝은 색을 넣은 설계는 기억·이해·전이에 작은~중간 미만의 긍정 효과(d 약 0.3~0.4)를 보였다. — "We found significant positive meta-analytic effects for retention (k = 18, d+ = 0.387), comprehension (k = 14, d+ = 0.317), and transfer (k = 27, d+ = 0.327) under a random-effects model." (Abstract, p.1)
- E:staff:13 [194] (confirmed, 신뢰 85) 내재 동기에 대한 효과는 아동이 더 나이 많은 학습자보다 컸다는 잠정 증거가 있어, 중고등학생에게는 효과가 더 작을 수 있다. — "There was provisional evidence that age moderated the effect of the manipulations on intrinsic motivation, such that larger effects were revealed for children compared to older learners." (Abstract, p.1)
- E:staff:14 [195] (confirmed, 신뢰 88) 게이머 7,422명 조사에서 루트박스 지출액과 문제성 도박 심각도 사이에 연관(η2=0.054)이 나타났다. — "A large-scale survey of gamers (n=7,422) found evidence for a link (η2=0.054) between the amount that gamers spent on loot boxes and the severity of their problem gambling." (Abstract)
- E:staff:15 [195] (confirmed, 신뢰 88) 이 연구로는 루트박스가 문제성 도박의 원인인지, 문제성 도박자가 루트박스에 끌리는지 구별할 수 없다. — "It is unclear from this study whether buying loot boxes acts as a gateway to problem gambling, or whether spending large amounts of money on loot boxes appeals more to problem gamblers." (Abstract)
- E:staff:16 [196] (confirmed, 신뢰 90) 문체부는 2024-02-19 확률형 아이템 정보공개의 대상 범위·표시사항·방법 기준을 담은 해설서를 배포했다(첨부 해설서 본문은 미열람). — "확률형 아이템 정보공개 시행에 앞서 아이템 범위, 표시사항 및 방법 구체적 기준 마련" (보도자료 제목, 게시일 2024.02.19., 담당부서 게임콘텐츠산업과)
- E:staff:17 [197] (confirmed, 신뢰 88) 사신은 청룡·백호·주작·현무의 네 방위 수호 동물이며, 그 사상은 중국 전국~진한 시대에 정착한 것으로 추정된다. — "사신은 사령·사수라고도 하는데, 동쪽의 청룡, 서쪽의 백호, 남쪽의 주작, 북쪽의 현무를 일컫는다. 사신사상은 중국의 전국시대부터 진한시대에 정착한 것으로 추정된다." (사신도 > 요약)
- E:staff:18 [197] (confirmed, 신뢰 88) 한국에서 사신도는 4~5세기 고구려 고분벽화에서 처음 나타난다. — "가장 먼저 나타나는 것이 고구려 고분벽화로 요동성총(遼東城塚) 등 4∼5세기 고분에서부터 사신도가 등장한다." (사신도 > 내용 (한국 전래 문단))
- E:staff:19 [197] (confirmed, 신뢰 88) 사신도 속 현무는 실존 동물인 거북과 뱀이 서로 휘감긴 모습으로 그려졌다. — "거북과 뱀으로 표현되는 현무는 청룡 · 백호 · 주작 등과 다르게 실존하는 동물로 구성되어 있다. 뱀과 거북이 서로 몸을 휘감고 엉킨 모습으로 그려졌다." (사신도 > 내용 (형상 설명 마지막 문단))
- E:staff:20 [198] (confirmed, 신뢰 88) 현무의 정체는 대체로 신령한 거북(영구)으로 받아들여지며, 거북과 뱀으로 보는 견해는 일부 학자의 해석으로 소개된다. — "현무의 정체는 『예기』에서 “현무는 거북이다.”라 하였고, 또 북방 7수를 거북과 뱀의 형상으로 그린 학자도 있는데 대체로 현무를 영구(靈龜)로 보는 것으로 받아들여지고 있다." (현무 > 본문 2문단)
- E:staff:21 [199] (confirmed, 신뢰 88) 해태(해치)는 옳고 그름을 가려 바르지 못한 쪽을 뿔로 받는 외뿔 짐승으로 『이물지』에 전한다. — "중국 문헌인 『이물지(異物志)』에는 “동북 변방에 있는 짐승이며, 한 개의 뿔을 가지고 있는데, 성품이 충직하여 사람이 싸우는 것을 보면 바르지 못한 사람을 뿔로 받고, 사람이 다투는 것을 들었을 때는 옳지 않은 사람을 받는다.”고 설명되어 있다." (해태 > 본문 2문단)
- E:staff:22 [199] (confirmed, 신뢰 88) 해태는 법·심판의 상징으로 쓰였고, 조선에서는 대사헌의 흉배 장식에 쓰였다. — "법을 심판하는 사람은 해치관이라 하여 해태가 새겨진 관모를 쓰기도 하였다. 우리 나라에서는 대사헌의 흉배에 가식(加飾)되기도 하였다." (해태 > 본문 3문단)
- E:staff:23 [199] (confirmed, 신뢰 88) 해태는 화재·재앙을 막는 신수로 여겨져 광화문 앞과 근정전 등 궁궐 건축에 장식되었다. — "또, 화재나 재앙을 물리치는 신수(神獸)로 간주되어 궁궐 등의 건축물에 장식되기도 하였다." (해태 > 본문 5문단)
- E:staff:24 [200] (confirmed, 신뢰 88) 봉황은 기린·거북·용과 함께 사령의 하나이며, 수컷이 봉·암컷이 황이고 생김새는 문헌마다 다르다. — "고대 중국에서 신성시했던 새로 기린·거북·용과 함께 사령의 하나로 여겼다. 수컷을 봉, 암컷을 황이라고 하는데 생김새는 문헌에 따라 조금씩 다르게 묘사되어 있다." (봉황 > 요약)
- E:staff:25 [200] (confirmed, 신뢰 88) 한국에서 봉황은 조선 개창 이후 성군의 덕치를 상징하는 의미로 궁중 음악·춤에 쓰였다. — "우리나라 고대에는 봉황에 대한 신성관념이 증국처럼 강하지 않았으나 조선왕조 개창 후 성군의 덕치를 상징하는 의미로 궁중음악과 춤에 쓰였다." (봉황 > 요약 (원문의 '증국' 표기 그대로))
- E:staff:26 [201] (confirmed, 신뢰 88) 기린은 용·거북·봉황과 함께 사령으로 불린 상서로운 상상의 동물이다. — "용·거북·봉황과 함께 사령(四靈)이라 하며, 상서로운 동물로 인식되었다." (기린 > 본문 1문단)
- E:staff:27 [201] (confirmed, 신뢰 88) '기린아'는 재주가 뛰어난 아이를 이르는 말로, 기린은 뛰어남의 상징으로 쓰였다. — "재주와 기예가 뛰어난 아이를 ‘기린아(麒麟兒)’라고 일컫는다." (기린 > 본문 4문단)
- E:staff:28 [202] (confirmed, 신뢰 88) 기린은 어진 짐승(인수)이자 성인과 태평성대의 상징이었다. — "기린은 사령(四靈) 즉 용, 봉황, 거북과 함께 모든 동물의 우두머리로서, 인수(仁獸)인 동시에 성인(聖人)과 태평성대를 나타내는 상징적인 동물이었다." (기린도 > 내용 1문단)
- E:staff:29 [202] (confirmed, 신뢰 88) 오늘날 전설의 기린은 아프리카 동물 기린(지라프)과 혼용되므로 도감에서 둘을 구별해 줄 필요가 있다. — "현대에는 전설적인 기린의 상징성이 강조되지 않고 아프리카의 지라프와 혼용하고 있다." (기린도 > 요약)
- E:staff:30 [203] (confirmed, 신뢰 88) 설화 속 불가사리는 모습이 다양하고, 쇠를 먹어 몸집을 키우지만 불로 소멸한다. — "우리 설화 속의 불가사리는 돼지와 개미, 쥐, 말, 벌레 등 형태가 다양하며, 쇠붙이를 먹으며 몸집을 키우지만 상극인 불에 의해 소멸한다." (불가사리 > 요약)
- E:staff:31 [203] (confirmed, 신뢰 88) 한국의 불가살이는 중국의 맥과 별개로 발전한 것으로 보며, 『한국구비문학대계』에 설화 19편이 실려 있다. — "우리나라에 전해지는 ‘불가살이’와 중국의 ‘맥’은 쇠를 먹는다는 공통점이 있지만, 별개로 발전한 것으로 파악된다. 『한국구비문학대계』에는 모두 19편의 불가사리 설화가 전해지고 있다." (불가사리 > 내용 4문단)
- E:staff:32 [204] (confirmed, 신뢰 88) 불가사리는 설화에서는 파괴적 괴물이지만 민속에서는 재앙·화재를 막아 주는 존재로 여겨졌다. — "'불가사리'는 설화에서는 환상 속 괴물로 형상화되어 파괴적 면모를 지니지만 민속에서는 재앙과 화재를 예방해 주는 존재로 인식된다." (불가사리 설화 > 요약)
- E:staff:33 [204] (confirmed, 신뢰 88) 경복궁 자경전 담장 굴뚝의 불가사리 부조가 민속적 벽사 표현의 대표 예다. — "자경전 담장 굴뚝에 새겨진 불가사리 부조(浮彫)가 대표적이다." (불가사리 설화 > 문헌 자료 문단)
- E:staff:34 [204] (paraphrase_ok, 신뢰 88) 불가사리 설화의 쇠 먹성과 거대화는 인간 물욕의 상징으로 해석된다. 따라서 '자원 소비 증가'를 미덕처럼 연출하면 원전 의미와 어긋날 수 있다. — "'불가사리'의 쇠붙이 먹성과 신체의 거대화는 인간의 물욕의 상징으로 볼 수 있다." (불가사리 설화 > 해석 문단)
- E:staff:35 [205] (confirmed, 신뢰 80) Game Dev Story는 개발사 공식 설명에서 직원의 직업을 바꾸는 시스템을 핵심 기능으로 내세운다. — "Features the ability to develop your company's own game console, plus a system for changing your staff members' professions." (Steam 상세 설명 1~2행)
- E:staff:36 [205] (confirmed, 신뢰 80) 직원 경험이 쌓이면 개발할 수 있는 장르·내용이 넓어진다. 사업 범위를 처음부터 다 열지 않고 경험으로 확장하는 구조다. — "As your staff gets more experience, you will unlock a wider array of game genres and content to develop." (Steam 상세 설명)
- E:staff:37 [208] (unreachable, 신뢰 45) 같은 훈련을 반복하면 효과가 줄어 0이 될 수 있고, 더 높은 단계의 훈련을 써야 다시 성장한다(팬 위키). — "After using enough training methods on an employee, the effect they have on that employee diminishes, possibly to zero. However, using a more powerful training method will allow the employee to once again learn something." (Training (Game Dev Story) 본문 2문단)
- E:staff:38 [208] (unreachable, 신뢰 45) 레벨업은 연구 데이터를 쓰고 급여를 올리며, 훈련은 직원 체력과 현금을 쓰는 별도 경로다. — "unlike leveling which uses Research Data and raises their salary, training uses theirpower and cash." (Training (Game Dev Story) 본문 1문단 (원문 띄어쓰기 오류 그대로))
- E:staff:39 [207] (unreachable, 신뢰 45) Game Dev Story에서는 레벨업마다 급여가 1.2배씩 복리로 오른다(팬 위키 수치). — "Salaries grow at a compounding rate: each level up multiplies the salary by 1.2." (Employees (Game Dev Story) > 레벨·급여 문단)
- E:staff:40 [207] (unreachable, 신뢰 45) 해고한 직원이 훈련 능력치와 직업 레벨을 유지한 채 재고용될 수 있어, 해고·재고용으로 비용을 피하는 공략이 생긴다. — "If an employee is fired, they retain their salary, trained stats and job levels. They may be hired back through the normal method for that character" (Employees (Game Dev Story) > 해고 문단)
- E:staff:41 [209] (unreachable, 신뢰 45) 고급 직업 4종으로 바꾸려면 해당 하위 직업에서 레벨 5를 달성해야 한다. — "In order to move to one of the 4 advanced careers (Director / Producer / Hardware Engineer / Hacker), the employee must be level 5 in the requisite lower career(s)." (Careers (Game Dev Story) > 전직 문단)
- E:staff:42 [209] (unreachable, 신뢰 45) 직원은 여러 직업의 숙련 기록을 동시에 가질 수 있지만 활성 직업은 하나다. — "Each employee can have levels on all careers, but only one is active at a time." (Careers (Game Dev Story) 1문단)
- E:staff:43 [210] (confirmed, 신뢰 80) Two Point Hospital의 공식 설명은 직원을 훈련해 새 기술·능력을 붙이는 성장을 핵심 기능으로 제시한다. — "Train and improve your staff, levelling them up with new skills and abilities to make your hospital even more efficient." (Steam 상세 설명)
- E:staff:44 [210] (confirmed, 신뢰 80) Two Point Hospital의 직원은 성격 유형과 특성을 가지며, 이것이 효율에 영향을 준다. — "You’ll be managing staff with unique personality types and traits, so you’ll need to keep an eye on who’s being efficient – and who is just a pain in the neck." (Steam 상세 설명)
- E:staff:45 [214] (confirmed, 신뢰 58) Two Point Hospital에서는 의사뿐 아니라 모든 직원이 자격을 배워 특정 부서의 능력을 높일 수 있다. — "Staff training is more complex than in Theme Hospital; all staff, not just doctors, can learn and receive qualifications that grant them skills or improve their ability in a certain department." (Gameplay 3문단)
- E:staff:46 [214] (confirmed, 신뢰 58) 성격과 전문화는 훈련으로 얻는 자격과 별도로 업무 성과에 영향을 준다. — "Additionally, staff have personalities and specialisations which affect their job performance." (Gameplay 3문단)
- E:staff:47 [216] (confirmed, 신뢰 35) 팬 공략 사이트는 '특성' 최대 5개를 타고나거나 훈련실에서 얻는다고 쓰지만, 공식·위키백과의 자격/성격 구분과 용어가 섞여 있다. — "Your staff can have up to five traits, which they either come with, or can be trained in the Training room." (본문 1문단)
- E:staff:48 [215] (paraphrase_ok, 신뢰 58) Two Point Campus의 특성 시스템은 능력치 보너스보다 학생 간 관계 형성과 애착을 위해 설계되었다. — "The team added a "trait" system, which allows students to form relationships." (Development 문단)
- E:staff:49 [212] (confirmed, 신뢰 80) Two Point Museum(2025)은 덜 훈련된 전문가를 원정에 보내 성장시키는 구조를 사용한다. — "Send your team of partially trained Experts on Expeditions in search of rare and mostly well-preserved artefacts." (Steam 상세 설명 (Curator 문단))
- E:staff:50 [213] (confirmed, 신뢰 80) Zooseum 확장(2025-12)은 동물을 치료해 야생으로 돌려보내면 보상(Sanctuary Points)을 주는 보전형 수집 구조다. — "Rereleasing the animals will increase the biodiversity of Farflung Isles and earn Sanctuary Points, which can help the Zooseum adopt more animals in need of care." (Steam 상세 설명 (Farflung Isles 문단))
- E:staff:51 [213] (confirmed, 신뢰 80) 동물을 소유물로 모으는 대신 '치료·양육·재야생화'를 직원 직무로 정의한 상용 사례다. — "Now hiring for Wildlife Experts to heal, raise and re-wild some wonderful wildlife in our brand new museum location!" (Steam 상세 설명 첫 문단)
- E:staff:52 [217] (confirmed, 신뢰 80) Palworld 공식 문구는 생명체 노동을 '노동법 없음' 농담으로 홍보한다. — "Want to build a pyramid? Put an army of Pals on the job. Don't worry; there are no labor laws for Pals." (Steam 상세 설명 (Build 문단))
- E:staff:53 [217] (confirmed, 신뢰 80) Palworld 공식 설명은 멸종위기 개체를 보호구역에서 몰래 잡아 돈을 버는 것을 놀이로 제시한다. — "Endangered Pals live in wildlife sanctuaries. Sneak in and capture rare Pals to get rich quick! It's not a crime if you don't get caught, after all." (Steam 상세 설명 (Sanctuary 문단))
- E:staff:54 [217] (confirmed, 신뢰 80) Palworld에서는 개체 종류에 따라 잘하는 일이 다르다. — "Some Pals are good at planting seeds, while others are skilled at watering or harvesting crops." (Steam 상세 설명 (Farm 문단))
- E:staff:55 [218] (unreachable, 신뢰 45) Palworld의 작업 적성은 종 단위로 정해지며, 할 수 있는 작업 자체를 결정한다. — "Each Pal species has a set of work roles it can perform, known as Work Suitabilities. These determine which tasks a Pal can carry out at a base or in the field." (Working 개요 문단)
- E:staff:56 [218] (unreachable, 신뢰 45) 현재(1.0 이후) 위키 기준으로 작업 적성은 보통 1~8이고, 응축 아이템 사용마다 1씩 오른다. — "Work Suitability levels typically naturally range from 1 to 8, and can be increased by 1 per each use of the Pal Essence Condenser." (Working 개요 문단)
- E:staff:57 [218] (unreachable, 신뢰 45) Palworld는 작업 배치를 직접 지정하는 관리 시설로 생산성을 최적화한다. — "The Monitoring Stand allows players to control which jobs Pals perform and is essential for optimizing base productivity." (Recommended Setup)
- E:staff:58 [219] (unreachable, 신뢰 45) Palworld에는 종이 정하는 작업 적성과 별도로 개체마다 0~4개의 패시브가 붙는다. — "Each Pal can have between 0 and 4 Passive Skills at a time. A Pal cannot possess multiple copies of the same Passive Skill." (Passive Skills 개요)
- E:staff:59 [219] (unreachable, 신뢰 45) 패시브는 야생 생성 시 무작위로 붙어 같은 종이라도 개체마다 다르다. — "Wild generation – Pals encountered or hatched from wild Pal Eggs may spawn with random Passive Skills." (Passive Skills > 획득 경로 목록)
- E:staff:60 [220] (confirmed, 신뢰 58) Palworld는 2024년 1월 얼리액세스 이후 2026년 7월 정식(1.0) 출시되어, 출시 전후 자료의 수치가 다를 수 있다. — "The game was fully released on July 10, 2026." (도입부 1문단)
- E:staff:61 [220] (confirmed, 신뢰 58) 주요 게임 매체는 Palworld가 동물 학대·착취 노동 농담에 지나치게 기댄다고 비판했다. — "Rock Paper Shotgun and PC Gamer criticized Palworld for relying too heavily on shock humor about animal abuse and sweatshop labor in its gameplay" (Reception > Early access)
- E:staff:62 [220] (confirmed, 신뢰 58) 1.0에서 보호구역 메커니즘이 바뀌었으므로, Steam 문구와 실제 판본 규칙이 다를 수 있다. — "the 1.0 update incorporates more stealth and puzzle elements in these areas in the form of patrolling ancient drones" (Gameplay (Wildlife Sanctuaries 문단))
- E:staff:63 [221] (confirmed, 신뢰 62) Palworld에서는 동료 생명체를 노동에 쓰는 것이 사실상 필수라는 비평이 있다. — "So, human slavery isn’t required to enjoy “Palworld” to its fullest, but exploiting your animal companions and putting them to work in virtual sweatshops is almost a necessity." (Can you avoid it? 절 마지막 문단)
- E:staff:64 [222] (confirmed, 신뢰 55) WotC는 2020년, 종족 출신에 묶인 능력치 증가를 플레이어가 바꿀 수 있게 하겠다고 발표했다. — "Later this year, we will release a product (not yet announced) that offers a way for a player to customize their character’s origin, including the option to change the ability score increases that come from being an elf, a dwarf, or one of D&D's many other playable folk." (WotC 보도자료 재게재 본문 (2020-06-18 게시))
- E:staff:65 [222] (confirmed, 신뢰 55) 그 근거는 게임 속 각 인물이 고유한 능력을 지닌 개인이라는 점이었다. — "This option emphasizes that each person in the game is an individual with capabilities all their own." (WotC 보도자료 재게재 본문)
- E:staff:66 [223] (confirmed, 신뢰 60) Balmford 등(2002)은 4~11세 영국 초등학생 109명에게 자연물·인공물 지식을 비교했고, 결론은 포켓몬을 흔한 야생동물보다 더 잘 안다는 것이었다(2차 요약). — "Balmford and colleagues surveyed 109 United Kingdom (UK) primary schoolchildren (ages 4 to 11) to investigate their knowledge of natural and non-natural objects." (요약 본문 (The Bottom Line: Children know more about Pokémon than common wildlife))
- E:staff:67 [206] (confirmed, 신뢰 80) Kairosoft의 상점 경영작은 취급 상품을 연구해 가치를 높이는 구조로, 상품 깊이를 성장 축으로 쓴다. — "Research the products you're selling to raise their prices--and your profits!" (Steam 상세 설명 (Manage your dream store! 문단))
- E:staff:68 [224] (confirmed, 신뢰 70) 현재 설계는 희귀도를 능력 배율로 쓰지 않는다. — "희귀도는 만남 조건과 이야기의 희소성을 뜻한다. 희귀도 배율로 기본 능력을 곱하지 않는다." (docs/CHARACTERS_AND_ORGANIZATION.md > 직원·동료의 관계)
- E:staff:69 [224] (confirmed, 신뢰 70) 현재 설계는 만남 지역(출신)으로 능력 보너스를 주지 않는다(character_rules.json nationality_bonus: 0과 일치). — "처음 만나는 도시일 뿐이며 합류 후 근무 지역 제한이 없다. 출신으로 능력·지역 지식·친밀도 보너스를 주지 않는다." (docs/CHARACTERS_AND_ORGANIZATION.md > 국가별 동료 수집 > 원칙)
- E:staff:70 [224] (confirmed, 신뢰 70) 바름(해치)의 출전에 이제 접근 금지 도메인인 khan.co.kr 기사가 들어 있다(EMP51 곤붕도 khan.co.kr 인용). — "주간경향 「거적 쓰고 밀려났던…광화문 ‘해치’의 팔자」(2023)" (data/characters.json > items[EMP06].myth_reference.sources)
- E:staff:71 [224] (confirmed, 신뢰 70) 쇠꼬미(불가사리)의 출전은 지역 언론과 위키트리뿐이며, 한국민족문화대백과사전 항목으로 대체할 수 있다. — "위키트리 「한국 전통 요괴 13선」 https://www.wikitree.co.kr/articles/354152" (data/characters.json > items[EMP10].myth_reference.sources)
- E:staff:72 [224] (confirmed, 신뢰 70) 현재 데이터에는 서로 관련이 적은 8개 품목이 처음부터 나란히 있다(사용자 요청 '취급 물품 좁히기'와 대조되는 지점). — "COFFEE, APPAREL, COSMETICS, FROZEN_SEAFOOD, FURNITURE, ELECTRONICS, AUTO_PARTS, SOLAR_MODULES" (data/goods.json > items[].id (8건))

## 설계 관찰

- ST-N01 능력은 종이 아니라 이름 있는 개인에게 속한다: 원작 확인: Palworld는 작업 적성을 종 단위로 정하고(staff-palwiki-working), 개체별 무작위 패시브로 차이를 둔다(staff-palwiki-passive). WotC는 2020년 출신에 묶인 능력치 증가를 바꿀 수 있게 하며 '각 인물은 고유한 능력을 가진 개인'이라고 밝혔다(staff-enworld-wotc). 저장소 확인: Scitrade는 60종이 각각 한 명뿐이라 종과 개인이 같다. 그래서 '사막여우=교섭형' 같은 일반화가 생기기 쉽다(staff-repo: 귀솔 교섭 75). → 적용 제안: 도감과 카드에 능력은 '귀솔 개인의 경력·성향'이라고 문구로 표시하고, 종 설명란(실제 생태)과 업무 특성란을 분리한다. 후속 동료가 같은 종으로 나오면 주능력이 다르게 나오도록 데이터 검사(같은 species_ko의 primary_role 중복 경고)를 추가한다. 성별 필드는 능력 계산에 쓰지 않는다. [218][219][222][224] 판본: Palworld 수치는 1.0(2026-07) 이후 팬 위키 기준. WotC 발표는 원문 페이지 본문이 렌더링되지 않아 재게재본으로 확인. 겹침: DK4-O09(능력치를 국적·성별로 고정하지 않음)와 같은 방향이다. 이 관찰은 '종'까지 범위를 넓힌다.
- ST-N02 타고난 성격과 훈련 자격을 분리한 두 축: 원작 확인: Two Point Hospital은 성격 유형·특성과 훈련으로 얻는 자격을 따로 둔다(staff-steam-tph, staff-wp-tph). Two Point Campus의 특성은 관계 형성을 위해 설계되었다(staff-wp-tpc). 팬 사이트는 두 개념을 섞어 '특성 5개'라고 쓴다(staff-mgw-traits). → 적용 제안: Scitrade의 signature_trait(개인 특성)는 바꿀 수 없는 성향과 이야기로 두고, '원산지 증빙 검토'·'냉동 화물 온도기록 확인' 같은 업무 자격은 교육으로 얻는 훈련 태그로 분리한다. 자격 슬롯 수와 교육 비용·기간을 화면에 미리 보여 준다. 특성 효과는 현재처럼 평가 점수 +5 수준으로 제한한다. [210][214][215][216] 판본: 자격 슬롯 개수(팬 사이트의 5개)는 공식 자료로 확인하지 못했다. 수치는 옮기지 않는다. 겹침: CHARACTERS_AND_ORGANIZATION.md의 '별도 훈련 태그' 문장, DK4-O09와 겹친다.
- ST-N03 같은 교육의 반복 효과 체감: 원작 확인(팬 위키): Game Dev Story는 같은 훈련을 반복하면 효과가 0까지 줄고, 상위 훈련으로 다시 성장한다. 레벨업과 훈련은 비용 경로가 다르다(staff-kw-training). 저장소 확인: 일반 직무 교육은 1일·50,000 KRW·60 XP로 무제한 반복할 수 있다(staff-repo). → 적용 제안: 같은 직원이 같은 일반 교육을 반복하면 XP가 60→40→20 식으로 줄어드는 안을 DESIGN 값으로 검토한다. 실제 업무 완료와 문화 활동이 성장의 주 경로가 되게 한다. 체감은 미리 표시해 숨은 손해가 없게 한다. [208][224] 판본: Game Dev Story 수치(초기 증가량·체감 곡선)는 팬 위키 기준이며 판본별 차이는 미확인. 수치는 옮기지 않고 구조만 참고한다. 겹침: G3-04(활동 전 조건 공개), G3-06(교육 진행 가시화)과 겹친다.
- ST-N04 직무 전환은 숙련을 전제로, 종은 전제로 하지 않는다: 원작 확인: Game Dev Story는 직업 변경을 공식 기능으로 내세운다(staff-steam-gds). 고급 직업은 하위 직업 레벨 5가 전제이고, 직원은 여러 직업 숙련 기록을 갖지만 활성 직업은 하나다(staff-kw-careers). → 적용 제안: Scitrade 직원에게 '현재 직무'와 '직무별 경험 기록'을 따로 저장한다. 영업→구매조달, 운영→기술품질 같은 전환은 관련 업무 완료 수와 교육으로 열고, 속성·종으로 막지 않는다. 전환 후에도 이전 경험 기록은 남긴다. [205][209] 판본: Game Dev Story Steam판(2022) 기준이며, 모바일 원판과의 차이는 미확인. 겹침: DK4-O08(인물 위치를 직무와 업무 큐에 연결)과 겹치며, character_rules의 does_not_lock_profession과 일치한다.
- ST-N05 좁은 취급 품목에서 경험으로 넓히기 (사용자 요청 연결): 원작 확인: Game Dev Story에서는 직원 경험이 쌓이면 개발 가능한 장르가 넓어진다(staff-steam-gds). Biz Builder Delux에서는 취급 상품을 연구해 가치를 높인다(staff-steam-bizbuilder). 저장소 확인: goods.json에는 서로 관련이 적은 8개 품목이 처음부터 나란히 있다(staff-repo). → 적용 제안: 사용자 지시(2026-10-13, 취급 물품을 좁게)에 맞춰 1장 회사의 '주력 품목군'을 1~2개(예: 냉동 수산물+냉장 식품)로 정한다. 직원의 품목군 경험 기록(완료 거래·교육)이 쌓이면 인접 품목군을 연다. 품목 경험은 직원 개인 기록이자 회사 역량이며, 종·속성으로 주지 않는다. 실제 무역상사의 품목 집중은 별도 연구 묶음에서 근거를 확인한 뒤 확정한다. [205][206][224] 판본: 원작은 게임 장르·점포 상품이며 무역 품목이 아니다. 구조 유비일 뿐 현실 무역상사의 행동 근거가 아니다. 겹침: DK4-O11(투자가 공급 접근성을 바꿈), DK4-O12(지사장 거래 허용 품목)와 겹친다.
- ST-N06 작업 적성은 부드러운 가중치로, 작업 가능 여부의 문으로 쓰지 않는다: 원작 확인: Palworld의 작업 적성은 종이 할 수 있는 작업 자체를 결정한다. 적성은 자연값 1~8, 최대 10이고 아이템으로 올린다(staff-palwiki-working). 관리 시설로 작업을 배정한다. 저장소 확인: Scitrade 속성은 직업 자격이 아니며, 다른 속성도 교육으로 모든 기본 직무를 맡을 수 있다(staff-repo). → 적용 제안: 속성-업무 친화는 현재처럼 시너지 +5%와 추천 표시에만 쓰고, 어떤 직원도 기본 업무를 '불가'로 막지 않는다. 배치 화면에 '친화 업무' 배지를 보여 주되, 친화가 없는 직원을 배치해도 경고하지 않고 예상 처리량만 표시한다. [217][218][224] 판본: Palworld 1.0에서 적성 상한·응축 비용이 바뀌었다는 2차 정보가 있다. 얼리액세스 시기 공략과 섞지 않는다. 겹침: DK4-O08과 겹친다. 저장소 attribute_rule과 일치한다.
- ST-N07 생명체 직원을 무급 노동 슬롯이나 소모품으로 그리지 않기: 원작 확인: Palworld 공식 문구는 '노동법 없음'과 먹이만 주면 죽을 때까지 일한다는 농담을 쓴다(staff-steam-palworld). 주요 매체는 이를 동물 학대·착취 노동 농담 과용으로 비판했다(staff-wp-palworld, staff-laptopmag-pal). 원작 확인(팬 위키): Game Dev Story에서는 해고한 직원이 능력치를 유지한 채 재고용될 수 있어 비용 회피 공략이 생긴다(staff-kw-employees). → 적용 제안: 모든 동료 활동에 급여·시간·휴식이 있다는 현재 원칙을 유지하고, 과부하 시 피로와 휴가를 표시한다. 해고·재고용은 대기 기간과 관계 기록을 남겨 비용 회피 공략이 생기지 않게 한다. 교육용 게임이므로 '노동'을 농담 소재로 쓰지 않는다. [207][217][220][221] 판본: Palworld 문구는 Steam 현재 설명 기준(2026-10 열람). 겹침: CHARACTERS_AND_ORGANIZATION.md의 '무급 무제한 노동 슬롯이 되지 않도록'과 같은 방향이다. DK4-O09(피로·업무량 표시)와 겹친다.
- ST-N08 멸종위기 동료는 포획이 아니라 보전 협력으로 만난다: 원작 확인: Palworld 공식 설명은 보호구역의 멸종위기 개체를 몰래 잡아 돈을 버는 것을 제시한다(staff-steam-palworld). 1.0에서 이 구역 규칙이 바뀌었다(staff-wp-palworld). 반대로 Zooseum(2025-12)은 치료·양육·재야생화와 Sanctuary Points 보상 구조다(staff-steam-zooseum). → 적용 제안: 현재 conservation_rule을 유지하고, 합류 이야기를 '보전 기관 의뢰 완료→동료가 회사 일을 도우며 보전 활동 기록'으로 구성한다. 보전 협력 성과는 도감 이야기 해금(비경제 보상)으로만 준다. 해당 종·부산물 거래는 신고·차단 교육 사건으로만 등장시킨다. [213][217][220][224] 판본: Zooseum은 2025-12-02 출시 확장. 실제 게임 플레이는 검토하지 않았고 Steam 설명만 확인했다. 겹침: 저장소 conservation_rule·collection_rule과 일치한다. DK4·G3 관찰에는 해당 항목이 없다.
- ST-N09 의인화 캐릭터와 실제 동물 사실의 층 분리: 자료 확인: 의인화 그림과 의인화 언어를 함께 쓰면 미취학 아동의 사실 학습이 줄고 사람 특성을 붙이는 경향이 늘었다(staff-ganea2014). 매체 관점이 추론을 바꾼다(staff-waxman2014). 반면 의인화가 학습을 방해하지 않았다는 결과도 있다(staff-geerdts2016-eepro, staff-geerdts-diss). 얼굴 의인화 디자인은 학습에 작은 긍정 효과가 있었고, 동기 효과는 나이가 어릴수록 컸다(staff-brom2018). 포켓몬을 야생동물보다 잘 안다는 보고도 있다(staff-pokemon-eepro). → 적용 제안: SD 캐릭터 카드(의인화)와 도감의 '실제 동물' 칸(사실적 그림·사실 언어·서식지·보전 등급·출처)을 시각적으로 분리한다. 실제 동물 칸에서는 '귀솔은 생각한다' 같은 의인화 문장을 쓰지 않는다. 기린은 전설의 기린과 동물 기린(지라프)을 명시해 구별한다. 알파 테스트에서 실제 동물 사실 문항(사전·사후)을 넣어 효과를 직접 측정한다. [190][191][192][193][194][202][223] 판본: 근거 연구의 대상은 대부분 3~5세다. 중고등학생 대상 직접 근거는 찾지 못했으므로 효과를 단정하지 않는다. 겹침: DK4·G3 관찰과 직접 겹치지 않는다. ART_DIRECTION(SD+카드)과 연결된다.
- ST-N10 신수 출전 재정비: 금지 도메인·약한 출처를 한국민족문화대백과사전으로 교체: 저장소 확인: EMP06(해치)과 EMP51(곤붕)이 khan.co.kr을 인용하고, EMP10(불가사리)은 위키트리·지역 언론을 인용한다(staff-repo). 자료 확인: 한국민족문화대백과사전 해태·불가사리·불가사리 설화·현무·사신도 항목은 직접 열어 확인했다(staff-ek-*). → 적용 제안: myth_reference.sources를 E0062778(해태), E0024904·E0030766(불가사리), E0063329·E0025776(현무·사신도), E0008194·E0008197(기린), E0024064(봉황)로 교체·추가하고, '[출처: 항목명 - 한국민족문화대백과사전]' 표기 규칙을 따른다. 쇠꼬미 외형 설명(곰 몸·코끼리 코 등 합성)은 이 항목들에서 확인되지 않으므로 '창작 해석'으로 표시하거나 삭제한다. 현무는 '거북(영구)으로 보는 것이 일반적, 고분벽화에서는 거북과 뱀이 얽힌 모습'으로 두 설명을 함께 쓴다. [197][198][199][203][204][224] 판본: 백과사전 항목에는 '집필자의 학술적 견해로 한국학중앙연구원 공식 입장과 다를 수 있다'는 고지가 붙어 있다. 겹침: CHARACTERS_AND_ORGANIZATION.md의 '도감 공개 전 출처 대조' 원칙을 실행하는 일이다. DK4·G3와 겹치지 않는다.
- ST-N11 신수 특성은 전승 의미와 맞추되 운·길조 효과로 만들지 않는다: 자료 확인: 해태는 옳고 그름을 가리는 심판의 상징이다(staff-ek-haetae). 기린은 인수·태평성대, 봉황은 덕치의 상징이다(staff-ek-girindo, staff-ek-bonghwang). 불가사리는 쇠를 먹는 괴물이자 화재를 막는 존재이고, 물욕의 상징으로도 해석된다(staff-ek-bulgasari-seolhwa). 저장소 확인: 바름(해치)=문서 대조, 어진(기린)=계약 조건 요약, 쇠꼬미(불가사리)=예방 정비 특성(staff-repo). → 적용 제안: 해치→문서 대조, 기린→어진 약속 정리는 전승 의미와 잘 맞으므로 유지한다. 불가사리는 '쇠를 먹는다'를 금속 화물 손실이나 소비 증가로 연출하지 말고, 민속의 '화재 예방' 의미를 따라 안전·예방 정비 쪽으로 유지한다. 길조·운 보정(태평성대→매출 상승 등)은 넣지 않는다. 해치는 서울시 상징 캐릭터와 닮지 않게 하는 기존 주의를 유지한다. [199][200][202][204][224] 판본: 서울시 해치 상징 지정(2008)은 이번에 공식 페이지 본문을 열지 못해 미확인이다. 겹침: characters.json design_cautions_ko('행운·길조를 게임 효과로 만들지 않는다')와 일치한다.
- ST-N12 무작위 영입(뽑기)은 교육용 청소년 게임에 넣지 않는다: 자료 확인: 루트박스 지출과 문제성 도박의 연관(η2=0.054)이 보고되었으나 인과는 미확정이다(staff-zendle2018). 한국 문체부는 2024-02-19 확률형 아이템 정보공개 기준 해설서를 배포했다(staff-mcst2024). 원작 확인: Two Point·Kairosoft의 직원 성장은 비용과 시간 투자로 이루어진다(staff-steam-tph, staff-kw-training). → 적용 제안: 알파 이후에도 동료 합류는 의뢰·탐방·이야기 조건으로만 한다. 중복 획득, 확률 강화, 유료 재화는 넣지 않는다. 혹시 무작위 요소(만남 일정 등)를 넣더라도 경제적 대가와 연결하지 않고 결과를 미리 공개한다. [195][196][208][210] 판본: 해설서 PDF 본문과 법령 조문 원문은 열지 않았다(첨부 파일이 양식 POST로만 내려받기 가능). 겹침: CHARACTERS_AND_ORGANIZATION.md의 '랜덤 영입 미포함·확률형 정보공개 검토' 문단과 같은 방향이다.

## 들여오지 않을 것

- Palworld의 '멸종위기 개체를 보호구역에서 몰래 잡아 돈벌이' 구조와 문구: Scitrade의 conservation_rule과 정면으로 충돌하고, CITES 교육 목표와 반대 메시지를 준다.
- '노동법 없음', 먹이만 주면 죽을 때까지 일한다, 동료를 먹거나 희생하는 연출: 청소년 교육용 게임에서 생명체 착취를 농담으로 다루게 되며, 주요 매체도 비판한 지점이다. 무급 노동 슬롯 금지 원칙과도 충돌한다.
- 종(species) 단위로 작업 가능 여부를 막는 작업 적성 게이트: 능력을 종·출신으로 고정하지 않는 원칙(character_rules does_not_lock_profession, DK4-O09)과 충돌한다.
- Palworld식 교배·유전으로 능력 강화, 개체 거래: 동료를 처분 가능한 물건으로 다루지 않는다는 기존 결정(판매·방생·한정 일련번호 금지)과 충돌한다.
- Game Dev Story의 레벨당 급여 1.2배 복리 수치와 훈련 증가량 수치: 팬 위키 수치이고 게임 장르 밸런스용 값이다. 현실 급여 체계나 Scitrade 경제의 근거가 아니다.
- 해고 후 능력치를 유지한 채 재고용해 비용을 피하는 구조: 인사 결정을 공략으로 만들고 고용 관계를 가볍게 그린다.
- 랜덤 뽑기 영입, 중복 캐릭터 재료화, 확률 강화: 루트박스와 도박 문제의 연관 연구가 있고 확률 공개 규제 대상이다. 청소년 대상 교육 게임에 맞지 않으며 기존 결정과도 다르다.
- 기린·봉황·비휴 등 길조 신수의 '행운/매출 상승' 버프: 전승의 상징을 실증 경영 효과처럼 오해하게 하고 도박적 기대를 부추긴다.
- D&D의 고정 종족 능력치 보정 방식: 원 개발사도 출신과 능력치를 분리하는 방향으로 바꿨다.
- 팬 사이트의 'Two Point 직원 특성 최대 5개' 같은 미확인 수치: 공식 자료로 확인하지 못했고, 자격과 성격 용어를 섞은 2차 자료다.

## 출처끼리 어긋나는 점

- 의인화 학습 효과: Ganea 등(2014)은 의인화 그림과 의인화 언어를 함께 쓰면 사실 학습이 줄고 사람 특성을 붙이는 경향이 늘었다고 보고했다. Geerdts 등(2016, NAAEE 요약)과 Geerdts 학위논문은 학습 방해가 없었고, 의인화 그림이 인간 중심 추론을 줄였다고 보고했다. 과제·동물·측정 방식이 달라 직접 비교는 어렵다.
- Geerdts 등 2016의 쪽수: NAAEE 요약은 '36(1), 22'로만 표기한다. 다른 쪽수 범위(5–26) 표기는 검색 요약에서만 보았고 원문으로 확인하지 못했다.
- '사령(四靈)'의 범위: 한국민족문화대백과사전 사신도 항목은 '사신은 사령·사수라고도' 한다며 청룡·백호·주작·현무를 가리킨다. 기린·봉황·기린도 항목은 사령을 기린·봉황·거북·용으로 정의한다. 같은 백과사전 안에서 용어 쓰임이 다르다.
- 현무의 정체: 현무 항목(E0063329)은 '대체로 현무를 영구(靈龜)로 보는 것'이 일반적이고 거북·뱀 형상은 일부 학자의 해석이라고 쓴다. 사신도 항목(E0025776)은 '뱀과 거북이 서로 몸을 휘감고 엉킨 모습'을 표준 도상으로 서술한다. 저장소 characters.json은 거북과 뱀 형상만 쓴다.
- 불가사리 외형: 백과사전은 '돼지와 개미, 쥐, 말, 벌레 등 형태가 다양'하고 『대동운부군옥』에서는 곰 같다고 하며, 중국 맥 묘사에 곰·코끼리·소 등이 섞인다고 쓴다. 저장소의 '곰 몸에 코끼리 코, 무소 눈, 소꼬리, 호랑이 다리' 조합은 열어 본 백과사전 항목에서 확인되지 않는다.
- Two Point Hospital 용어: 위키백과와 Steam은 훈련으로 얻는 '자격(qualifications)·기술'과 '성격·특성'을 구분한다. 팬 공략 사이트는 '특성 최대 5개를 타고나거나 훈련실에서 얻는다'고 써서 두 개념을 섞는다.
- Palworld 정식 출시일: Steam 앱 정보는 2026-07-09, 위키백과는 2026-07-10이다(시간대 차이로 보이나 미확인).
- Palworld 보호구역: Steam 공식 설명은 멸종위기 개체 포획 돈벌이를 내세운다. 위키백과는 1.0에서 이 구역이 드론 회피·잠입 퍼즐 구조로 바뀌었다고 쓴다. 판본에 따라 규칙이 다르다.
- 과제 전제와 저장소: 과제는 '평택 본사'를 전제로 하지만, 이번에 읽은 작업 트리(/home/user/Scitrade)의 CHARACTERS_AND_ORGANIZATION.md와 employees.json은 한국 동료의 만남·소재 도시를 부산(BUSAN)으로 둔다. docs·data에서 '평택' 표기를 찾지 못했다(다른 브랜치 반영 여부 미확인).

## 빈칸

- 국립민속박물관 한국민속대백과사전(folkency.nfm.go.kr)은 JavaScript 단일 페이지라 항목 본문을 열지 못했다. 해태·불가사리·현무의 민속 사전 교차 확인은 미확인이다.
- 해치·사신·불가사리 근거는 모두 한국민족문화대백과사전 한 발행처의 항목이다. 서로 독립한 3개 출처 기준은 충족하지 못했다.
- 서울시 해치 상징 페이지는 TLS 오류와 메뉴만 있는 화면 때문에 본문을 확인하지 못했다. 2008년 상징 지정은 미확인이다.
- Two Point 공식 직원 특성·자격 목록은 확인하지 못했다(wiki.gg 401, fandom Cloudflare 차단). 슬롯 수·효과 수치는 미확인이다.
- Kairosoft 공식 사이트(kairopark.jp)에는 게임별 상세 페이지가 없었다. Game Dev Story 수치는 팬 위키에만 의존했다.
- Balmford 등 2002 Science 원문은 Cloudflare 차단으로 열지 못했다. '8세가 포켓몬 약 80%, 야생동물 약 50% 식별' 같은 수치는 미확인이다.
- Geerdts 등 2016 원문(SAGE)은 열지 않았다. NAAEE 2차 요약과 학위논문 초록만 확인했다.
- WotC 원문 페이지(dnd.wizards.com)는 본문이 렌더링되지 않았다. EN World 재게재본으로 인용했고, 이후 출간된 Tasha's Cauldron 규칙 원문은 미확인이다.
- 문체부 확률형 아이템 해설서 PDF와 게임산업법·시행령 조문 원문은 열지 않았다(첨부가 POST 양식으로만 내려받기 가능하고, 국가법령정보센터는 미접속).
- 중고등학생(12~18세)에게 의인화 동물 캐릭터가 주는 학습 효과를 직접 다룬 연구는 찾지 못했다. Brom 등은 얼굴 의인화 그래픽에 한정된 메타분석이다.
- 직원 능력치를 성별·국적으로 정했을 때 학습자 고정관념에 미치는 효과를 측정한 교육용 게임 연구는 찾지 못했다.
- Palworld 개발사 공식 사이트·패치노트는 열지 않았다. Steam 설명과 팬 위키에만 의존했다.
- 포켓몬류 수집의 공식 자료(포켓몬 공식 사이트)는 열지 않았다.
- 거상·Victoria 3·Democracy 4는 이번 묶음(직원 수집) 범위 밖이라 조사하지 않았다.
- 사용자 요청(취급 물품 좁히기)의 현실 근거, 즉 실제 중소 무역상사가 몇 개 품목군에 집중하는지는 이 묶음에서 조사하지 않았다. ST-N05는 게임 구조 유비만 제시한다.

## 검증 정정

- contradictions의 '과제 전제와 저장소(평택 표기 없음, 부산)' 항목은 틀렸으므로 삭제한다. /home/user/Scitrade 작업 트리가 오래된 브랜치 codex/TASK-0001(55d74a8)에 머물러 있어서 생긴 착오다. 최신 세션 브랜치 ccr-21863e28-zmusty(cf034bb)에서는 characters.json의 한국 동료 city_id가 PYEONGTAEK이다. CHARACTERS_AND_ORGANIZATION.md 106·114행도 '평택(2026-10-09 전환 전에는 부산)'이라고 적는다. 고칠 문장: '한국 동료의 만남 도시는 2026-10-09 평택 본사 전환으로 평택이다(최신 브랜치 기준).' 한편 khan.co.kr·위키트리 출처와 goods.json 8개 품목은 최신 브랜치에도 그대로 남아 있다.
- staff-geerdts-diss의 연도 '미확인'을 고친다: 'Megan Geerdts, Anthropomorphic media and children's biological knowledge, 박사학위논문, Rutgers University–Newark, 2014(2014-05), doi:10.7282/T32Z13RV.'
- 불가사리 외형 항목을 고친다. 저장소의 '곰 몸·코끼리 코·무소 눈·소꼬리·호랑이 다리' 조합은 백과사전이 설명하는 중국 '맥(貘)'의 혼합 묘사(곰·코끼리·소·사자 등)에 가깝다. 같은 백과사전은 한국 불가살이와 중국 맥이 '별개로 발전한 것으로 파악'한다. 『대동운부군옥』이 불가사리를 '곰같이 생겼다'고 한 기록은 불가사리 설화 항목(E0030766)에 있고, 불가사리 항목(E0024904)에는 없다. 고칠 문장: '쇠꼬미의 합성 외형은 중국 맥 도상에서 온 창작 해석이며, 한국 설화의 불가사리는 돼지·개미·쥐·말·벌레 등 형태가 다양하다.'
- fact 6을 이렇게 고친다: 'Two Point Hospital은 직원의 성격·특성과 훈련으로 얻는 자격을 별도로 둔다(Steam·위키백과).' 경영 시뮬레이션 전반으로 일반화하지 않는다.
- fact 9와 evidence 61의 '주요 매체는 … 비판했다'를 이렇게 고친다: 'Rock Paper Shotgun과 PC Gamer 등은 동물 학대·착취 노동 농담에 지나치게 기댄다고 비판했고, 착취를 게임 구조로 정면에서 다뤘다는 긍정 평가도 있었다(위키백과).'
- fact 3의 '불로만 소멸'을 '상극인 불에 의해 소멸'로 고친다(원문 표현).
- staff-mcst2024 관련 gap의 '해설서 PDF'를 고친다. 게시 첨부는 '[0219]문체부 보도자료-확률형 아이템 정보공개 관련 해설서 배포.hwpx' 등 HWPX 파일이다.
- staff-steam-tpm과 staff-steam-zooseum의 authors/publisher에 배급사 SEGA를 추가한다(Steam appdetails의 publishers: SEGA).
- evidence 51의 locator를 '첫 문단'에서 '확장 구성 목록(2 new animal-related rooms) 뒤 문단'으로 고친다.
- evidence 4와 47은 원문 그대로의 문장이므로 evidence_type을 paraphrase에서 direct_quote로 바꾼다.
- evidence 48 claim의 '능력치 보너스보다'를 지운다. 원문은 '학생들이 관계를 형성하게 하는 trait 시스템'이라고만 쓴다.
- Game Dev Story의 레벨 5 전직 조건과 레벨당 급여 1.2배, Palworld의 적성 1~8과 패시브 0~4는 이번 재검증에서 wiki.gg가 'Blocked' 페이지를 돌려줘 다시 확인하지 못했다. 설계 문서에서는 '팬 위키, 재검증 미완'으로 표시한다.
- Brom 등 2018 요약에 '내재 동기 효과는 robust(d+=0.255, k=23)'를 덧붙인다. 아동에게서 효과가 더 컸다는 연령 조절 효과는 'provisional'로 남긴다.
