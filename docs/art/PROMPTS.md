# 그림 제작 설정서 — 생성형 AI (미드저니 등)

작성일: 2026-10-04. 사용자 결정: 동료·배경 그림은 사람 일러스트 외주 없이 생성형 AI로 만든다.
이 문서는 같은 캐릭터를 여러 장에서 일관되게 유지하고, 출처와 권리 위험을 기록하기 위한 작업 규칙이다.
미술 방향은 [ART_DIRECTION.md](../ART_DIRECTION.md), 캐릭터 설정은 `data/characters.json`이 기준이다.
파라미터 이름과 범위는 미드저니 V7 기준이므로 작업 전에 현재 공식 문서로 확인한다.

## 1. 원칙

1. **그림에는 캐릭터나 장면만 그린다.** 카드 테두리·속성 아이콘·레벨·이름·반짝임은 게임 코드가 그린다. 글자·로고·숫자 배지·테두리가 들어간 결과는 버린다.
2. **다른 게임 그림을 입력하지 않는다.** 공유한 레퍼런스 화면(루미마스터 광고)이나 대항해시대·길드3 화면을 이미지 프롬프트·`--sref`·`--oref`로 넣지 않는다. "in the style of [작가·게임명]"도 쓰지 않는다. 화풍은 말로만 지정한다.
3. **출처를 남긴다.** 채택한 그림마다 도구·버전·프롬프트·화풍 코드·참조 이미지·작업 ID·사람이 고친 내용을 `src/assets/manifest.json`에 기록한다. AI만으로 만든 이미지는 저작권 보호가 약하므로, 고르고 고친 과정의 기록이 권리 주장의 근거가 된다.
4. **공개 전 노출에 주의한다.** 하위 요금제는 생성물이 공개 갤러리에 올라간다. 출시 전 캐릭터 노출을 피하려면 비공개 생성이 되는 요금제를 쓴다. 상업적 이용 조건은 약관으로 확인한다.
5. **공개할 때 AI 사용을 밝힌다.** 크레딧 예: "캐릭터·배경 일러스트: 미드저니로 생성, (이름)이 선별·편집". 유통처(예: Steam)의 AI 공개 요구와 국내 「인공지능 기본법」(2026-01-22 시행)의 표시 규정 적용 범위는 공개 전에 확인한다.

## 2. 작업 순서

| 단계 | 할 일 | 남길 기록 |
|---|---|---|
| ① 화풍 기준 | 공통 프롬프트로 여러 장을 뽑아 한 장을 화풍 기준으로 정한다 | `--sref` 코드 또는 기준 이미지 URL |
| ② 캐릭터 기준 | 캐릭터마다 여러 장을 뽑아 기준 이미지 1장을 확정한다 (카드용 3:4) | 프롬프트, 작업 ID, 기준 이미지 URL |
| ③ 장면 확장 | 기준 이미지를 `--oref`로 넣고 초상·업무 동작 4종을 만든다 | `--oref`, `--ow` 값 |
| ④ 수정 | 소품 색·손발 수 등은 부분 재생성이나 이미지 편집으로 고친다 | 고친 내용 |
| ⑤ 인계 | 고른 원본 PNG를 대화에 올린다. 배경 제거·자르기·규격 변환·게임 연결은 Claude가 한다 | 파일명 규칙(6절) |

거북과 뱀이 한 몸인 현돌(EMP04), 여러 동물의 부위를 합친 불가사리 쇠꼬미(EMP10)처럼 형태가 복합적인 신수는 일관성이 가장 흔들리기 쉽다. ② 단계에서 후보를 더 많이 뽑는다.

## 3. 공통 화풍 프롬프트 (동료)

카드 일러스트와 사무실 동작 그림은 화풍 기준을 따로 둔다([ART_DIRECTION.md](../ART_DIRECTION.md) ‘카드 일러스트 방향’).

**카드 일러스트** (② 단계 기준 이미지):

```
fantasy creature collectible card illustration, full-bleed scene, graceful elegant creature
with a soft cute face, decorative patterned background inspired by its habitat and legend
(stylized sky, plants, waves, snowflakes, starlight), ornamental stained-glass and art-nouveau
motifs, pastel iridescent palette with soft highlights, clean outlines, cel-shaded 2D,
character centered with empty space at the top and bottom 15 percent
--ar 3:4 --v 7 --stylize 250
--no text, letters, words, logo, watermark, signature, card frame, border, badge, number, ui, weapon, armor, blood
```

**사무실 동작·초상** (⑤ 단계 장면 확장):

```
cute chibi animal character, about 2.5 heads tall, round soft silhouette, big readable face,
small work prop, soft cel-shaded 2D game sprite, clean medium-weight outlines, full body,
centered, plain white background, no text
--ar 1:1 --v 7 --stylize 150
--no text, letters, logo, watermark, frame, border, badge, number, ui, weapon
```

화풍 기준을 정한 뒤에는 카드와 동작 그림 각각의 `--sref [화풍 코드]`를 붙인다. 동작 그림은 카드 기준 이미지를 `--oref`로 넣어 같은 인물로 만든다.

## 4. 동료 P0 6종 — 기준 프롬프트

각 줄 뒤에 3절의 공통 문구와 파라미터를 붙인다. 속성 색은 배경이 아니라 소품·의상의 강조색으로만 쓴다. 카드 배경색은 게임이 속성에 맞춰 칠한다.

| ID·이름 | 속성·직무 | 기준 프롬프트 (앞부분) |
|---|---|---|
| EMP01 귀솔 | 빛·영업 | `a small fennec fox office worker, oversized ears, round muzzle, cream and pale copper fur, folded mint scarf tied at the neck, holding a one-page quotation sheet, calm friendly smile` |
| EMP02 물보리 | 물·운영 | `a chubby river otter logistics worker, round waterproof work vest, shell-shaped buckle, short tail curled at the tip, holding a waterproof clipboard, cheerful focused look` |
| EMP03 솔솔밤 | 바람·영업 | `a flying squirrel salesperson with round cheeks, tan body, light green gliding membranes, small postal-style document satchel, mid-hop pose, bright curious eyes` |
| EMP04 현돌 (현무) | 물·운영 | `a cute baby black tortoise guardian beast with a small friendly snake companion coiled around its shell as one creature, dark navy shell divided into neat cargo-hold patterns, teal wave accents, the snake wears a tiny sorting tag, calm sturdy stance` |
| EMP05 화랑콩 | 불·영업 | `a round red panda with short bangs, orange-tipped tail, carrying a foldable product sample board and a small tool pouch, confident grin` |
| EMP06 바름 (해치) | 그림자·운영 | `a cute round mythical justice beast with a single small horn on its forehead, curly mane, a few scale patterns on its chest, pale gray body with navy trim, wearing a night-shift work apron, holding a magnifying glass over a ledger, serious but kind eyes` |

확정 후 점검: 귀솔의 큰 귀·민트색 목도리, 물보리의 조개 버클, 솔솔밤의 서류 가방, 현돌의 화물칸 무늬 등껍질과 뱀 짝꿍, 화랑콩의 견본판, 바름의 외뿔과 돋보기가 모든 장면에서 유지되어야 한다.

### 신화 모티프 사용 원칙

- 동료는 실재 동물이나 신화 속 신수·환수·괴물만 쓴다. 창작 결합 생물은 쓰지 않는다(2026-10-04 사용자 결정).
- 전승의 출전 조사는 `data/characters.json`의 `myth_reference`에 기록한다. 게임 설정은 창작 해석이며 전승의 확정 설명이 아니다.
- 바름(해치)은 서울특별시 공식 캐릭터 ‘해치’와 닮지 않게 만든다. 쇠꼬미(불가사리)는 영화 「불가사리」(1985)의 괴수 디자인과 닮지 않게 만든다.
- 신앙 대상으로 지금도 숭배되는 신격(예: 종교의 신, 신의 탈것)은 직원 캐릭터로 쓰지 않는다.

### 확장 동료 — 기준 프롬프트

국가별 확장 동료 48종(EMP13~EMP60)의 기준 프롬프트는 `data/characters.json`의 `visual_motif`를 영어로 옮겨 3절 공통 문구와 합쳐 만든다. 실재 동물은 종의 특징(무늬·부리·뿔 모양)을 정확히 묘사하고, `conservation.design_cautions_ko`와 `myth_reference.design_cautions_ko`를 지킨다.

### P1 신수 6종 — 기준 프롬프트

| ID·이름 | 모티프 | 기준 프롬프트 (앞부분) |
|---|---|---|
| EMP07 푸르릉 | 용 | `a cute round baby dragon with two short horns, cloud-like curled whiskers, teal scales, wearing a small raincoat` |
| EMP08 불씨롱 | 불사조 | `a round fledgling phoenix-like bird with three short tail plumes, apricot body, golden crest, wearing insulated work gloves` |
| EMP09 깃모아 | 그리핀 | `a chubby griffin-like creature with a bird beak, small lion paws, folding little wings, navy backpack, white eyebrow feathers` |
| EMP10 쇠꼬미 | 불가사리 | `a cute baby Bulgasari, a Korean folklore iron-eating beast, round bear-like body, short elephant-like trunk, tiger-striped legs, small ox tail, nibbling a rusty bolt, work apron with a wrench` |
| EMP11 유리뿔 | 사슴형 신수 | `a round young deer-like divine beast with short translucent antlers, cream fur, pale violet ears, a small compass on its collar` |
| EMP12 두루 | 백택 | `a fluffy round white mythical beast of wisdom, short soft horns, small gentle eye-shaped markings on its sides, carrying a scroll notebook and a magnifying glass` |

## 5. 장면 확장 (③ 단계)

기준 이미지를 `--oref [기준 이미지 URL] --ow 150`(값이 클수록 외형 유지, 자세 변화는 줄어듦)으로 넣고 다음 문구를 바꿔 가며 뽑는다.

| 용도 | 비율 | 프롬프트 앞부분 |
|---|---|---|
| 초상 | `--ar 1:1` | `same character, head and shoulders portrait, facing slightly left, plain background` |
| 대기 | `--ar 1:1` | `same character, full body, standing idle, slight smile, plain white background` |
| 걷기 | `--ar 1:1` | `same character, full body, side view walking pose, plain white background` |
| 업무 | `--ar 1:1` | `same character, full body, working with its prop at a small desk, plain white background` |
| 기쁨 | `--ar 1:1` | `same character, full body, happy jump, sparkles around, plain white background` |

업무 동작은 화면에서 약 128px로 작게 보이므로, 세부가 조금 달라도 다시 뽑지 않아도 된다. 카드 그림의 일관성에 시간을 쓴다.

## 6. 배경 — 대항해시대·더 길드 3 수준의 게임 그래픽 느낌

목표는 손으로 칠한 듯한 전략 게임 배경이다. 사실적인 원근, 따뜻한 빛, 작은 사람(동물) 활동이 보이는 장면이다. 게임 이름은 프롬프트에 쓰지 않는다.

공통 문구:

```
hand-painted strategy game background, detailed isometric view, warm late-afternoon light,
rich but soft colors, modern-day setting, small cute animal workers visible in the scene,
no text, no signs with letters, no ui
--ar 16:9 --v 7 --stylize 200
--no text, letters, logo, watermark, ui, frame
```

| 장소 | 화면 | 프롬프트 앞부분 |
|---|---|---|
| 본사 사무실·창고 | UI_COMPANY | `a small modern trading company office connected to a warehouse in a Korean port city, desks, shelves of boxes, forklift, large window to the harbor` |
| 무역회관 | 도시 진입점 1 | `a bright trade exchange hall with consultation booths, product samples on tables, maps on the wall without readable text` |
| 항만 물류단지 | 도시 진입점 2 | `a container port logistics yard, gantry cranes, stacked colorful containers, a small freight agency office` |
| 비즈니스 라운지 | 도시 진입점 3 | `a cozy harbor-side business lounge cafe, tables for meetings, warm lamps, sea view` |
| 문화생활·현지 탐방 | 도시 진입점 4 | `a lively traditional market street near a port, food stalls, small museum entrance, lanterns` |
| 금융센터 | 도시 진입점 5 | `a calm modern bank and finance center lobby, counters, plants, large windows` |

배경은 도시마다 같은 화풍 기준(`--sref`)을 쓴다. 실재 랜드마크를 그대로 그리지 않는다.

## 7. 점검표 (채택 전)

- [ ] 글자·로고·테두리·숫자 배지가 없다.
- [ ] 캐릭터 고유 특징이 기준 이미지와 같다.
- [ ] 손발 개수·눈·대칭이 자연스럽다.
- [ ] 128px로 줄여도 누구인지 알아볼 수 있다.
- [ ] 기존 캐릭터와 닮지 않았다 (이미지 역검색으로 표본 확인).
- [ ] 전투·무기·과도한 위협 표현이 없다.
- [ ] 국적·종족 고정관념을 드러내는 소품이나 표정이 없다.

## 8. 파일 인계와 규격

대화에 올릴 때 파일명: `EMP01_card.png`, `EMP01_portrait.png`, `EMP01_work-idle.png`(idle·walk·work·happy). 배경은 `BG_company.png`, `BG_venue-trade.png` 등.

Claude가 변환해 저장하는 위치와 규격:

| 용도 | 경로 | 규격 |
|---|---|---|
| 카드 | `public/assets/characters/EMP01/card.webp` | 3:4, 가로 768px 이상, 장면 배경을 꽉 채운 일러스트, 위아래 15%는 화면 표시가 덮음 |
| 초상 | `public/assets/characters/EMP01/portrait.webp` | 1:1, 256px 이상, 투명 배경 |
| 업무 동작 | `public/assets/characters/EMP01/work-idle.webp` 등 | 1:1, 256px 이상, 투명 배경 |
| 배경 | `public/assets/backgrounds/company.webp` 등 | 16:9, 가로 1600px 이상 |

`src/assets/manifest.json`에 `status: "approved"`로 등록된 그림만 화면에 쓰인다. 등록 항목 예:

```json
{
  "id": "EMP01_CARD",
  "kind": "character",
  "employee_id": "EMP01",
  "slot": "card",
  "path": "assets/characters/EMP01/card.webp",
  "status": "approved",
  "created_on": "2026-10-05",
  "provenance": {
    "method": "generative_ai_with_human_selection",
    "ai_generated": true,
    "tool": "Midjourney",
    "tool_version": "V7",
    "prompt": "…",
    "style_reference": "--sref …",
    "omni_reference": null,
    "job_id": "…",
    "human_edits": "배경 제거, 목도리 색 보정",
    "license_ko": "미드저니 약관(요금제) 확인. AI 단독 산출물은 저작권 보호가 약함",
    "attribution": "미드저니로 생성, ○○ 선별·편집"
  }
}
```
