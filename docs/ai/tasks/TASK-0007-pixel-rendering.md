# TASK-0007 픽셀아트 렌더링·픽셀 지도·그림 검사 도구

- codex_model: `gpt-6.1-sol`
- reasoning_effort: `high`
- 선행 작업: 없음 (개발 브랜치 `ccr-21863e28-zmusty`의 현재 커밋)
- 결정 근거: `docs/DECISIONS.md` ‘픽셀아트 전환 — 2026-10-05’, `docs/art/PIXEL_SPEC.md`

## 목표

그림·지도를 픽셀아트로 바꾸기로 했다. 그림은 마지막에 만들지만, 코드와 규격은 지금 만든다. 이번 작업에서 만들 것은 셋이다.
1. 픽셀 그림을 정확히 보여 주는 화면 코드(보간 끄기, 기기 픽셀 기준 정수 배율).
2. 실제 해안선을 따르는 픽셀 지도 2장과 그 생성 코드.
3. AI 초안을 격자·팔레트에 맞추는 도구와 등록 전 검사 도구.

**게임 규칙·엔진·경제 값은 바꾸지 않는다.**

## 먼저 읽을 파일

- `docs/art/PIXEL_SPEC.md`: 이 작업의 기준이다. 크기·팔레트·형식·배율·지도 방식이 여기 있다.
- `docs/DECISIONS.md`의 ‘픽셀아트 전환’, `docs/art/PROMPTS.md` 0절, `docs/ART_DIRECTION.md` 맨 위 절.
- `src/assets/palette.json`(32색 초안), `src/assets/manifest.json`(`pixel_art`, `character_slots`, 지도 항목).
- `scripts/build_map.py`(지금의 위성 지도 생성), `src/ui/assets.ts`, `src/ui/map.ts`, `src/ui/projection.ts`, `src/ui/card.ts`, `src/ui/style.css`, `src/ui/main.ts`의 지도 부분(`map-frame`, `mapMode`).
- `data/world.json`의 도시·해협(관문) 좌표. `src/ui/map.ts`가 쓰는 불러오기 함수를 따른다.

## 범위

**포함 (이 파일들만 만들거나 고친다)**
- 새 파일: `src/ui/pixel.ts`, `src/ui/pixel.test.ts`, `src/ui/sprite.ts`, `src/ui/sprite.test.ts`, `tools/art/palette.py`, `tools/art/pixelize.py`, `tools/art/check_pixel_asset.py`, `tools/art/test_pixel_tools.py`, `scripts/test_build_map.py`, `docs/art/palette/scitrade-32.gpl`, `docs/art/palette/scitrade-32.hex`.
- 생성물: `public/assets/maps/east-asia.png`, `public/assets/maps/world.png`.
- 고칠 파일: `scripts/build_map.py`, `src/assets/manifest.json`(지도 두 항목만), `src/ui/assets.ts`, `src/ui/map.ts`, `src/ui/style.css`, `src/ui/main.ts`(지도 틀 크기 맞춤 연결만), `src/ui/card.ts`(그림이 있을 때의 `<img>` 줄만).
- 지울 파일: `public/assets/maps/east-asia.webp`, `public/assets/maps/world.webp`. 매니페스트가 더 이상 가리키지 않는다. 기록은 git에 남는다.

**제외**
- `src/engine/**`, `data/**`(읽기만), 기존 테스트의 기대값.
- `src/assets/palette.json`의 색 값. 문제가 보이면 보고서의 ‘질문’에 적는다.
- 글꼴 변경. 본문 글자는 그대로다(사용자 결정).
- 동료·배경 그림 제작. 그림은 마지막 일괄 제작 때 만든다.
- 지도 위 거점·배·항로·나침반 그림 교체. 지금의 벡터 표시를 유지한다.
- 새 패키지 설치. 이 환경에는 Pillow 12와 numpy 2가 이미 있다(`pip --user`). 그 밖의 파이썬·npm 패키지를 더하지 않는다.

## 구현 지시

### 1. 팔레트 도구 — `tools/art/palette.py`

- `src/assets/palette.json`을 읽는 함수. 다음을 검사하고, 어기면 이유를 담은 예외를 낸다:
  - 32색, `id`와 `hex`가 모두 서로 다름.
  - 8줄기 × 4단계.
  - 줄기 안에서 단계가 오를수록 CIELAB L*(sRGB, D65)가 커지고, 이웃 단계의 차이가 7 이상.
- 가장 가까운 팔레트 색 찾기(CIELAB 거리, CIE76이면 충분).
- 명령: `python3 tools/art/palette.py --export docs/art/palette/`는 다음 두 파일을 만든다.
  - GIMP 팔레트 `scitrade-32.gpl`: `GIMP Palette`, `Name:`, `Columns: 4` 머리말 + 32줄.
  - 한 줄에 색 하나인 `scitrade-32.hex`.

### 2. 격자·팔레트 맞춤 — `tools/art/pixelize.py`

AI 초안(크기 아무거나, RGBA)을 목표 논리 크기의 진짜 픽셀아트 초안으로 바꾼다. 사람 보정 전 단계다.
- 인자:
  - `입력 출력 --size WxH`.
  - 선택: `--max-colors N`, `--despeckle`, `--alpha-threshold 0~255`(기본 128).
- 처리 순서:
  1. 원본의 불투명 픽셀을 모두 가장 가까운 팔레트 색으로 바꾼다.
  2. 목표 격자의 칸마다 원본 영역의 **최빈 팔레트 색**을 고른다. 평균을 쓰지 않는다. 평균은 팔레트 밖 중간색을 만든다.
  3. 칸의 투명도: 영역에서 알파가 기준 미만인 픽셀이 절반을 넘으면 투명(0), 아니면 불투명(255).
  4. `--max-colors`: 가장 많이 쓴 N색만 남긴다. 나머지는 그 N색 중 가장 가까운 색으로 바꾼다.
  5. `--despeckle`: 외톨이 픽셀을 이웃 다수 색으로 바꾼다. 외톨이는 4-이웃에 같은 색이 없고, 8-이웃 중 3개 이상이 같은 다른 색인 불투명 픽셀이다.
- 출력은 PNG다. 사용한 색 수와 크기를 JSON 한 줄로 출력한다. 같은 입력이면 같은 바이트를 낸다.

### 3. 등록 전 검사 — `tools/art/check_pixel_asset.py`

- 인자: `파일 --slot <이름>` 또는 `--size WxH [--frame WxH] [--max-colors N]`.
- 슬롯 규격은 `PIXEL_SPEC.md` 2절 표와 같아야 한다.
  - 동료 슬롯(`card`, `portrait`, `work`)은 `src/assets/manifest.json`의 `character_slots`에서 읽는다.
  - 나머지(`background` 384×216, `icon` 16×16, `map-icon` 16×16, `ship` 24×16, `frame` 24×24, `map-east-asia` 546×615, `map-world` 720×244)는 스크립트 안의 표로 둔다.
  - 지도 슬롯의 색 상한은 20이다.
- 검사 항목: PNG 여부, 크기, 시트의 칸 격자(크기가 칸 크기의 배수), 알파가 0과 255뿐인지, 불투명 픽셀이 모두 팔레트 색인지, 불투명 색 수 상한.
- 실패는 항목마다 한국어 한 줄로 출력하고, 종료 코드는 1이다. 통과하면 0이다.

### 4. 픽셀 지도 — `scripts/build_map.py --style pixel`

- `--style satellite|pixel`(기본 `pixel`).
  - `satellite`의 처리 코드는 지우지 않고 그대로 둔다. 예전 결과를 재현할 수 있어야 한다.
  - `pixel`은 `east-asia.png`·`world.png`를 만든다.
- 논리 크기:
  - `east-asia` 546×615: 지금 자르는 원본 영역이 바로 이 크기다. 위성 지도는 이를 2배 확대한 것이다.
  - `world` 720×244: 1°당 2 논리 픽셀.
  - 지도 좌표 상자(매니페스트 `width`·`height` 1092×1230, 3600×1220)는 바꾸지 않는다. 따라서 1 논리 픽셀은 각각 2단위, 5단위다.
- 처리. 모두 논리 해상도에서 한다:
  1. 위성 영상과 높이 지도를 지금과 같은 경위도 범위로 자르고, 영역 평균으로 논리 크기로 줄인다.
  2. **육지 판정:** 지금 방식(높이 + 높이 육지 근처의 색 보완)을 쓴다. 이어서 3×3 다수결로 한 번 정리한다.
  3. **관문 통로:** `data/world.json`의 해협·운하 가운데 지도 범위 안에 있는 것마다, 그 좌표 픽셀과 반경 r(동아시아 2, 세계 1) 안을 바다로 만든다.
     - 그 주변 창(동아시아 9×9, 세계 5×5)에서 바다가 하나로 이어지지 않으면 생성 출력에 경고를 남긴다.
     - 실제 운송은 `routes.json`만 쓰므로 이 통로는 그림의 문제다.
  4. **지형 분류:**
     - 육지: 눈·얼음, 건조지, 숲, 저지대, 산지.
       - 색(밝기·채도·초록 우세)과 높이로 나눈다. 높은 곳은 산지가 우선이다.
       - 경계값은 코드 상단 상수로 두고 주석에 뜻을 적는다.
     - 바다: 해안 거리(논리 픽셀)로 얕은 바다·중간·깊은 바다. 거리 기준은 동아시아 2·6, 세계 1·3이다.
  5. **외톨이 정리:** 육지 분류 지도를 3×3 최빈값으로 한 번 정리한다. 정리한 뒤 외톨이 비율(8-이웃이 모두 다른 분류인 육지 픽셀 ÷ 육지 픽셀)을 출력한다.
  6. **음영:** 높이로 언덕 음영(광원 315°, 지금과 같음)을 계산하고 3단계로 나눈다. 분류마다 같은 줄기의 팔레트 색 2~3개로 칠한다.
  7. **해안:** 바다에 닿은 한 줄을 팔레트 색 하나로 그린다. 육지 쪽인지 바다 쪽인지는 정하고 보고서에 적는다.
  8. 가장자리 어둡게(그라데이션)와 선명화 필터는 쓰지 않는다. 팔레트 밖 색을 만든다.
- 출력:
  - 무손실 PNG(팔레트 모드 가능).
  - 메타 JSON: 경로, 크기, 입력 sha256, 출력 sha256, 사용 색 수, 외톨이 비율, 관문 경고, 거점 해안 경고.
  - 거점 해안 경고: 지도 범위 안의 도시 픽셀이 해안(바다에 닿은 육지 픽셀)에서 1픽셀보다 멀면 경고다. 도시를 옮기지 말고 경고만 출력한다.
- 순수 함수로 나눈다(분류, 다수결·최빈값, 관문 통로, 해안선, 팔레트 칠하기). `scripts/test_build_map.py`에서 작은 합성 배열로 시험할 수 있어야 한다.
- 원본 영상: `/tmp/claude-0/-home-user-Scitrade/f4d522f3-f152-5ace-92c9-a3132cd403a2/scratchpad/map/`(`bluemarble.jpg`, `topology.png`).
  - 이 폴더의 sha256이 매니페스트 `sources`의 값과 같은지 먼저 확인한다.
  - 원본 파일은 저장소에 넣지 않는다.

### 5. 매니페스트 지도 항목 — `src/assets/manifest.json`

- `MAP_EAST_ASIA`·`MAP_WORLD`:
  - `path`를 `.png`로 바꾼다. `width`·`height`·`bounds`는 그대로다.
  - `pixel_grid: { "logical_width", "logical_height", "units_per_pixel" }`를 더한다.
  - `provenance.processing`을 새 명령과 처리 순서로 고친다.
  - `provenance.palette`를 `"scitrade-32 (DRAFT_2026-10-05)"`로 둔다.
  - `created_on`은 `2026-10-05`다.
  - `known_issues_ko`를 고친다: 벡터 표시는 임시, 관문 통로를 낸 곳, 경고가 난 곳.
- `sources`·`license_ko`·`attribution`·`verification_status`는 그대로 둔다.

### 6. 정수 배율 — `src/ui/pixel.ts`

- 순수 함수 `integerScale(availableCssPx, logicalPx, dpr)` → `{ n, cssPx }`.
  - n = 최대(1, 내림(available × dpr ÷ logical)).
  - cssPx = n × logical ÷ dpr.
  - 부동소수 오차로 n이 하나 작아지지 않게 한다. 예: 900 × 1.25 ÷ 450은 정확히 2.5여야 한다.
- 순수 함수 `fitPixelBox({ w, h? }, { w, h }, dpr)`. 높이 제약이 있으면 폭·높이 중 작은 n을 쓴다.
- DOM 함수 `applyPixelScale(root)`:
  - `root` 안의 `[data-pixel-w][data-pixel-h]` 요소마다, 부모 요소 안쪽 폭으로 n을 계산해 `style.width`·`style.height`를 정한다.
  - 다시 계산하는 때:
    - 크기 변화(`ResizeObserver` 하나).
    - `devicePixelRatio` 변화: `matchMedia('(resolution: Xdppx)')`의 `change`가 오면 새 값으로 다시 등록한다.
  - `main.ts`가 화면을 다시 그릴 때마다 부르되, 감시자가 쌓이지 않게 한다. 모듈에 하나만 두고 다시 연결한다.
  - `ResizeObserver`·`matchMedia`가 없는 환경(vitest의 node 환경)에서는 아무것도 하지 않는다.

### 7. 지도 화면 — `src/ui/map.ts`, `src/ui/assets.ts`, `src/ui/style.css`, `src/ui/main.ts`

- `MapAsset`에 `pixelGrid?: { logicalWidth, logicalHeight, unitsPerPixel }`를 더한다.
- `pixelGrid`가 있으면:
  - **보기 영역 맞춤:** 보기 영역(viewBox)의 x·y·w·h를 `unitsPerPixel`의 배수로 맞춘다. 순수 함수 `snapViewBox(vb, unitsPerPixel, mapW, mapH)`로 내보낸다. 영역은 원래 영역을 포함하도록 넓히고, 지도 밖으로 나가지 않게 자른다.
  - **바탕 그림:** 바탕 `<image>`에 `class="map-base pixel-art"`를 단다.
  - **배율 표시:** `<svg>`에 `data-pixel-w = vb.w ÷ unitsPerPixel`, `data-pixel-h = vb.h ÷ unitsPerPixel`을 단다.
- `style.css`:
  - `.pixel-art { image-rendering: crisp-edges; image-rendering: pixelated; }`. 순서가 중요하다. 지원하는 브라우저에서는 뒤의 `pixelated`가 이긴다.
  - 정수 배율을 받는 지도는 `width: 100%` 대신 스크립트가 정한 크기를 쓴다. 스크립트가 없을 때를 대비해 기본은 `max-width: 100%`로 둔다.
  - 지도 틀 바탕색은 팔레트의 깊은 바다(`sea-1`)로 해서, 정수 배율로 남는 여백이 바다처럼 보이게 한다. 지도는 가운데 놓는다.
  - 세계 보기의 `min-width: 720px`는 정수 배율 계산으로 대체한다. 가로 스크롤은 유지한다.
- 거점·배·항로·글자 표시의 모양과 접근 이름(`aria-label`)은 바꾸지 않는다.
- **알려진 위험:** 브라우저가 SVG `<image>`에 `image-rendering: pixelated`를 적용하지 않을 수 있다. 이 환경에서 확인할 수 없으면 보고서에 그렇게 적는다. 대비책을 함께 구현한다:
  - `map.ts`에 상수 하나를 둔다. 이 값을 켜면 바탕을 SVG 밖 `<img class="map-base pixel-art">`로 그리고, 같은 상자 위에 SVG를 겹친다.
  - 기본값은 SVG `<image>`다. Claude가 브라우저 검수에서 고른다.

### 8. 동료 그림 연결 — `src/ui/assets.ts`, `src/ui/card.ts`, `src/ui/sprite.ts`

- `assets.ts`:
  - `characterImage`는 승인된 그림의 경로와 논리 크기를 돌려준다. 논리 크기는 매니페스트 `character_slots`에서 읽는다.
  - `characterSprite(employeeId)`는 `work` 시트의 경로·칸 크기·줄 이름·칸 수·칸 시간을 돌려준다. 승인된 그림이 없으면 `null`이다.
- `card.ts`: 카드 그림이 있을 때만 바뀐다.
  - `<img>`에 `pixel-art` 클래스를 단다.
  - `width`·`height`는 논리 크기(96·128)로 둔다.
  - `data-pixel-w`·`data-pixel-h`를 단다.
  - 자리표시자 줄과 레벨 표시 줄은 건드리지 않는다. TASK-0004가 같은 파일의 레벨 줄을 고치므로 충돌을 줄인다.
- `sprite.ts`의 `spriteHtml(sheet, { row, scaleN, label })`:
  - 스프라이트 시트의 한 줄을 칸 넘김으로 움직이는 요소를 돌려준다.
  - 칸 넘김은 CSS `steps(칸 수)` 애니메이션이고, `background-position`을 쓴다.
  - 배율은 CSS 사용자 속성으로 넘긴다.
  - `label`이 있으면 `role="img"`와 `aria-label`을 단다. 없으면 `aria-hidden="true"`다.
  - `style.css`의 `@media (prefers-reduced-motion: reduce)`에서 스프라이트 애니메이션을 끄고 첫 칸만 보이게 한다.
- 아직 승인된 동료 그림이 없으므로, 화면에는 지금 자리표시자가 그대로 보여야 한다.

## 테스트

- **vitest:**
  - `pixel.test.ts`: `integerScale`.
    - dpr 1, 1.25, 1.5, 2, 3.
    - 사용 가능 폭 < 논리 폭이면 n=1이고 cssPx가 폭보다 크다.
    - 부동소수 경계(정확히 나누어떨어지는 경우).
  - `pixel.test.ts`: `fitPixelBox`의 높이 제약.
  - 지도 테스트(새 파일 또는 `pixel.test.ts`):
    - `snapViewBox`가 배수로 맞추고, 원래 영역을 포함하며, 지도 밖으로 나가지 않는다.
    - `renderWorldMap` 결과에 `pixel-art`와 `data-pixel-w`·`data-pixel-h`가 있고, 값이 viewBox ÷ 단위와 같다.
    - 두 지도 자산 모두 `pixelGrid`를 돌려준다.
  - `sprite.test.ts`:
    - 줄 위치, `steps(4)`, 배율 속성.
    - 접근 이름이 있을 때와 없을 때.
    - 승인 그림이 없으면 `characterSprite`가 `null`이다.
- **파이썬:**
  - `tools/art/test_pixel_tools.py`(unittest, 임시 폴더에 합성 그림을 만든다):
    1. 32×32 원본을 8배 확대하고, 가장자리를 흐리게 하고, 잡음과 반투명 가장자리를 넣는다. 이것을 `pixelize.py`로 32×32로 되돌리면 `check_pixel_asset.py --slot portrait`가 아닌 `--size 32x32 --max-colors 15` 검사를 통과한다.
    2. 검사기가 다음 네 가지를 각각 거절한다: 반투명 알파, 팔레트 밖 색, 틀린 크기, 색 수 초과.
    3. 팔레트 검사가 다음을 잡는다: 중복 색, 줄기 안 밝기 역전. 사본으로 시험한다.
    4. `.gpl` 내보내기의 머리말과 32줄.
  - `scripts/test_build_map.py`(unittest, 합성 배열):
    - 관문 통로가 바다를 만든다.
    - 최빈값 정리가 외톨이를 없앤다.
    - 해안선이 한 줄이다.
    - 칠한 결과의 모든 색이 팔레트 안에 있다.
- **생성 확인:** 두 지도를 만들고, 같은 명령을 한 번 더 실행해 출력 sha256이 같은지 확인한다. 메타 JSON을 보고서에 붙인다.
- 기존 테스트는 기대값을 바꾸지 않고 모두 통과해야 한다.

## 완료 조건

1. 위 1~8이 모두 반영되었다.
2. 픽셀 지도 두 장이 다음을 만족한다.
   - 크기가 546×615, 720×244다.
   - 모든 색이 팔레트 안에 있고, 각 지도의 색은 20 이하다.
   - 범위 안 관문 픽셀이 모두 바다다.
   - 다시 만들면 같은 sha256이 나온다.
3. `check_pixel_asset.py --slot map-east-asia`·`--slot map-world`가 두 지도를 통과시킨다.
4. `src/engine/`과 `data/`를 바꾸지 않았고, 기존 기대값도 바꾸지 않았다.
5. 다음 검증이 모두 통과한다.
   - 머리말의 검증 다섯 개.
   - `python3 -m unittest discover -s tools/art -p 'test_*.py'`.
   - `python3 -m unittest discover -s scripts -p 'test_*.py'`.
   - `npm run build`의 산출물에 `east-asia.png`·`world.png`가 들어가고, `.webp`는 들어가지 않는다.

브라우저 확인(실제 화면에서 픽셀 폭이 고른지, dpr 1·1.25·2)은 Claude가 검수 때 한다.
