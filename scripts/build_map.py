#!/usr/bin/env python3
"""게임 지도 배경을 만든다: 동아시아 해역(1장 확대 지도)과 태평양 중심 세계지도.

입력 (공공 도메인 위성 합성 영상과 지형 높이 지도, 정거원통도법 4096×2048 / 2048×1024):
  bluemarble.jpg  NASA Blue Marble 합성 영상 — GitHub vasturiano/three-globe 예제 사본에서 받음
  topology.png    지형 높이 회색조 지도(바다 0) — 같은 저장소 예제 사본
출력: 기본 pixel은 논리 해상도 PNG, satellite은 기존 WebP를 재현한다.

처리: 지역 자르기 → 2배 확대 → 산맥 음영(북서쪽 광원) → 수심 느낌의 바다 그라데이션
→ 모래색 해안선 → 가장자리 어둡게. 지형 색은 원본 위성 영상에서 가져오고 새로 칠하지 않는다.
필요 패키지: Pillow, numpy (게임 실행에는 필요 없음).

  python3 scripts/build_map.py --source-dir <입력 폴더> [--region east-asia|world] [--style pixel|satellite]

세계지도는 한국에서 익숙한 태평양 중심 배치다. 경도 −30°(대서양 한가운데)에서 잘라 330°까지 한 바퀴를 펼친다.
"""
from pathlib import Path
import argparse
import hashlib
import json

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REGIONS = {
    # 1장 6개 거점(자카르타 −6.1° ~ 부산 35.1°, 싱가포르 103.8° ~ 요코하마 139.6°)을 모두 포함. 원본의 2배 확대.
    'east-asia': {'bounds': {'lon_min': 98.0, 'lon_max': 146.0, 'lat_min': -10.0, 'lat_max': 44.0},
                  'px_per_deg': 4096 / 360 * 2, 'scale': 2, 'file': 'east-asia.webp'},
    # 세계 거점 20곳(멜버른 −37.8° ~ 로테르담 51.9°)과 희망봉을 포함. 경도는 −30°~330°로 한 바퀴.
    'world': {'bounds': {'lon_min': -30.0, 'lon_max': 330.0, 'lat_min': -50.0, 'lat_max': 72.0},
              'px_per_deg': 10.0, 'file': 'world.webp'},
}
# 동아시아 지도에서 정한 필터 반경(픽셀)의 기준 해상도. 다른 해상도에서는 같은 지리적 크기가 되도록 비례 조정한다.
REFERENCE_PX_PER_DEG = 4096 / 360 * 2


def crop_equirect(img, b):
    """정거원통도법 영상을 경위도 범위로 자른다. 경도가 180°를 넘으면 영상을 옆으로 이어 붙여 감싼다."""
    w, h = img.size
    if b['lon_max'] > 180:
        wide = Image.new(img.mode, (w * 2, h))
        wide.paste(img, (0, 0))
        wide.paste(img, (w, 0))
        img = wide
    x0 = (b['lon_min'] + 180) / 360 * w
    x1 = (b['lon_max'] + 180) / 360 * w
    y0 = (90 - b['lat_max']) / 180 * h
    y1 = (90 - b['lat_min']) / 180 * h
    return img.crop((round(x0), round(y0), round(x1), round(y1)))


def odd(n):
    n = max(3, round(n))
    return n if n % 2 else n + 1


def build_satellite(args):
    region = REGIONS[args.region]
    BOUNDS = region['bounds']
    f = region['px_per_deg'] / REFERENCE_PX_PER_DEG  # 동아시아 지도 = 1
    color_src = args.source_dir / 'bluemarble.jpg'
    topo_src = args.source_dir / 'topology.png'

    color = crop_equirect(Image.open(color_src).convert('RGB'), BOUNDS)
    if 'scale' in region:  # 잘라낸 원본 픽셀을 정수배로 확대 (동아시아 지도의 원래 방식)
        size = (color.width * region['scale'], color.height * region['scale'])
    else:
        size = (round((BOUNDS['lon_max'] - BOUNDS['lon_min']) * region['px_per_deg']),
                round((BOUNDS['lat_max'] - BOUNDS['lat_min']) * region['px_per_deg']))
    color = color.resize(size, Image.LANCZOS)
    topo = crop_equirect(Image.open(topo_src).convert('L'), BOUNDS).resize(size, Image.BICUBIC)

    rgb = np.asarray(color).astype(np.float32) / 255
    height = np.asarray(topo).astype(np.float32) / 255

    # 육지: 높이 > 0. 색(파란빛이 우세하지 않음)은 높이로 확인된 육지 근처의 해안 저지대 보완에만 쓴다.
    # 색만으로 판정하면 얕은 바다·산호초가 가짜 섬으로 잡힌다.
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    height_land = height > 0.004
    near_height_land = np.asarray(
        Image.fromarray((height_land * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9 if f == 1 else odd(9 * f)))) > 127
    land = height_land | ((b < np.maximum(r, g) + 0.04) & near_height_land)
    land_img = Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5 if f == 1 else odd(5 * f)))
    land = np.asarray(land_img) > 127

    # 산맥 음영 (Horn 방식 근사, 광원 방위 315°·고도 40°).
    z = np.asarray(topo.filter(ImageFilter.GaussianBlur(1.2 * f))).astype(np.float32) / 255 * 60 * f
    dy, dx = np.gradient(z)
    slope = np.arctan(np.hypot(dx, dy))
    aspect = np.arctan2(dy, -dx)
    az, alt = np.radians(315), np.radians(40)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    shade = np.clip(shade, 0, 1)

    # 육지: 채도·온기를 조금 올리고 음영을 곱한다.
    lum = rgb.mean(axis=2, keepdims=True)
    land_rgb = lum + (rgb - lum) * 1.25
    land_rgb = land_rgb * np.array([1.06, 1.02, 0.92]) * 1.18
    land_rgb = land_rgb * (0.55 + 0.75 * shade[..., None])

    # 바다: 해안에서 멀어질수록 깊은 남색. 원본 바다 질감을 30% 남긴다.
    near = np.asarray(Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22 * f))).astype(np.float32) / 255
    near = np.clip(near * 2.2, 0, 1)[..., None] ** 0.8
    deep = np.array([0.05, 0.16, 0.33])
    shallow = np.array([0.16, 0.47, 0.56])
    sea_rgb = deep * (1 - near) + shallow * near
    sea_rgb = sea_rgb * 0.7 + rgb * 0.3 * 1.4

    out = np.where(land[..., None], land_rgb, sea_rgb)

    # 모래색 해안선.
    eroded = np.asarray(Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))) > 127
    coast = land & ~eroded
    coast_soft = np.asarray(Image.fromarray((coast * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1 * max(f, 0.6)))).astype(np.float32) / 255
    sand = np.array([0.93, 0.86, 0.66])
    out = out * (1 - 0.55 * coast_soft[..., None]) + sand * 0.55 * coast_soft[..., None]

    # 가장자리 어둡게.
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    d = np.hypot((xx - size[0] / 2) / (size[0] / 2), (yy - size[1] / 2) / (size[1] / 2))
    out = out * (1 - 0.28 * np.clip(d - 0.55, 0, 1)[..., None] / 0.85)

    img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))

    dest = ROOT / 'public' / 'assets' / 'maps' / region['file']
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, 'WEBP', quality=82, method=6)
    meta = {
        'path': str(dest.relative_to(ROOT)),
        'width': size[0],
        'height': size[1],
        'bounds': BOUNDS,
        'projection': 'equirectangular',
        'inputs_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (color_src, topo_src)},
        'output_sha256': hashlib.sha256(dest.read_bytes()).hexdigest(),
    }
    print(json.dumps(meta, ensure_ascii=False, indent=2))




# 픽셀 분류 경계값. 높이는 원본 회색조의 0~1 값이며 실제 미터가 아니다.
HEIGHT_LAND = 0.004  # 기존 위성 지도와 같은 육지 높이 기준
MOUNTAIN_HEIGHT = 0.38  # 이보다 높은 곳은 색보다 산지 분류가 우선
SNOW_BRIGHTNESS = 0.72  # 밝고 무채색에 가까운 눈·얼음
SNOW_SATURATION = 0.16
DRY_RED_GREEN = 1.12  # 붉은빛이 초록보다 강한 흙·건조지
DRY_BRIGHTNESS = 0.32
FOREST_GREEN_MARGIN = 0.025  # 초록이 붉은빛보다 우세한 곳
FOREST_MAX_BRIGHTNESS = 0.42
SHADE_LOW = 0.45  # 북서쪽 언덕 음영을 어두움·중간·밝음으로 나누는 경계
SHADE_HIGH = 0.75
PIXEL_SIZES = {'east-asia': (546, 615), 'world': (720, 244)}
LOWLAND, FOREST, DRY, MOUNTAIN, SNOW = range(5)
TERRAIN_RAMPS = {
    LOWLAND: ('green-2', 'green-3', 'green-4'),
    FOREST: ('green-1', 'green-2', 'green-3'),
    DRY: ('earth-2', 'earth-3', 'earth-4'),
    MOUNTAIN: ('light-1', 'light-2', 'light-3'),
    SNOW: ('light-2', 'light-3', 'light-4'),
}


def shifted(array, dy, dx, fill=None):
    """이웃 배열을 만든다. 기본 가장자리는 복제하고, fill이 있으면 바깥을 그 값으로 둔다."""
    pad = max(abs(dy), abs(dx))
    if not pad:
        return array.copy()
    padded = np.pad(array, pad, mode='edge') if fill is None else np.pad(array, pad, constant_values=fill)
    h, w = array.shape
    return padded[pad + dy:pad + dy + h, pad + dx:pad + dx + w]


def majority_land(land):
    votes = sum(shifted(land.astype(np.int16), dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
    return votes >= 5


def classify_terrain(rgb, height, land):
    r, g, b = np.moveaxis(rgb, -1, 0)
    brightness = rgb.mean(axis=2)
    saturation = rgb.max(axis=2) - rgb.min(axis=2)
    classes = np.full(land.shape, LOWLAND, dtype=np.int16)
    classes[(g > r + FOREST_GREEN_MARGIN) & (g > b) & (brightness < FOREST_MAX_BRIGHTNESS)] = FOREST
    classes[(r > g * DRY_RED_GREEN) & (brightness > DRY_BRIGHTNESS)] = DRY
    classes[(brightness > SNOW_BRIGHTNESS) & (saturation < SNOW_SATURATION)] = SNOW
    classes[height > MOUNTAIN_HEIGHT] = MOUNTAIN
    return np.where(land, classes, -1)


def smooth_classes(classes, land):
    """육지 분류의 3×3 최빈값. 바다는 투표에서 빼고 동률은 원래 분류를 유지한다."""
    votes = np.stack([sum((shifted(classes, dy, dx, -1) == category).astype(np.int16)
                         for dy in (-1, 0, 1) for dx in (-1, 0, 1)) for category in range(5)])
    winner = votes.argmax(axis=0).astype(np.int16)
    best = votes.max(axis=0)
    own = np.take_along_axis(votes, np.maximum(classes, 0)[None, ...], axis=0)[0]
    winner[own == best] = classes[own == best]
    return np.where(land, winner, -1)


def isolated_ratio(classes, land):
    same = np.zeros(land.shape, dtype=bool)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx:
                same |= shifted(classes, dy, dx, -2) == classes
    return float(np.count_nonzero(land & ~same) / max(1, np.count_nonzero(land)))


def geo_pixel(position, bounds, size):
    """UI의 wrapLon·project와 같은 경도 감싸기. 좌표를 포함하는 논리 칸을 택한다."""
    lon = (position['lon'] - bounds['lon_min']) % 360 + bounds['lon_min']
    lat = position['lat']
    if lon > bounds['lon_max'] or not bounds['lat_min'] <= lat <= bounds['lat_max']:
        return None
    w, h = size
    return (min(w - 1, int((lon - bounds['lon_min']) / (bounds['lon_max'] - bounds['lon_min']) * w)),
            min(h - 1, int((bounds['lat_max'] - lat) / (bounds['lat_max'] - bounds['lat_min']) * h)))


def sea_components(land):
    """작은 관문 창 안에서 4-이웃으로 이어진 바다 덩어리 수를 센다."""
    unseen = set(zip(*np.nonzero(~land)))
    count = 0
    while unseen:
        count += 1
        stack = [unseen.pop()]
        while stack:
            y, x = stack.pop()
            for point in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if point in unseen:
                    unseen.remove(point)
                    stack.append(point)
    return count


def carve_gate_passages(land, gates, bounds, radius, window_radius):
    result = land.copy()
    opened, warnings = [], []
    h, w = land.shape
    # 모든 통로를 먼저 낸 뒤 연결 상태를 검사한다.
    for gate in gates:
        if gate['gate_type'] not in ('strait', 'canal'):
            continue
        point = geo_pixel(gate['geo_position'], bounds, (w, h))
        if point is None:
            continue
        x, y = point
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                if dx * dx + dy * dy <= radius * radius and 0 <= x + dx < w and 0 <= y + dy < h:
                    result[y + dy, x + dx] = False
        opened.append({'id': gate['id'], 'pixel': [x, y], 'radius': radius})
    for gate in opened:
        x, y = gate['pixel']
        window = result[max(0, y - window_radius):y + window_radius + 1,
                        max(0, x - window_radius):x + window_radius + 1]
        components = sea_components(window)
        if components != 1:
            warnings.append({'id': gate['id'], 'pixel': [x, y], 'sea_components': components,
                             'warning_ko': '관문 주변 바다가 4-이웃으로 하나로 이어지지 않습니다.'})
    return result, opened, warnings


def coastline(land):
    """4-이웃 바다에 닿은 육지 쪽 한 줄. 지도 바깥은 바다로 간주하지 않는다."""
    touches_sea = np.zeros(land.shape, dtype=bool)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        touches_sea |= ~shifted(land, dy, dx, True)
    return land & touches_sea


def sea_distance(land, max_distance):
    """유클리드 논리 픽셀 거리. 깊은 바다는 max_distance+1에서 잘라 계산량을 줄인다."""
    squared = np.full(land.shape, (max_distance + 1) ** 2, dtype=np.int16)
    for dy in range(-max_distance, max_distance + 1):
        for dx in range(-max_distance, max_distance + 1):
            distance = dx * dx + dy * dy
            if distance <= max_distance ** 2:
                squared = np.where(shifted(land, dy, dx, False), np.minimum(squared, distance), squared)
    return np.sqrt(squared)


def hillshade(height):
    # 기존 처리와 같은 방위 315°·고도 40°. 논리 격자에서만 기울기를 구한다.
    dy, dx = np.gradient(height * 60)
    slope = np.arctan(np.hypot(dx, dy))
    aspect = np.arctan2(dy, -dx)
    az, alt = np.radians(315), np.radians(40)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.digitize(np.clip(shade, 0, 1), [SHADE_LOW, SHADE_HIGH])


def paint_palette(classes, land, shade, distance, sea_limits, palette):
    lookup = {c['id']: tuple(bytes.fromhex(c['hex'][1:])) for c in palette['colors']}
    out = np.empty((*land.shape, 3), dtype=np.uint8)
    out[:] = lookup['sea-1']
    out[(~land) & (distance <= sea_limits[1])] = lookup['sea-2']
    out[(~land) & (distance <= sea_limits[0])] = lookup['sea-3']
    for category, ramp in TERRAIN_RAMPS.items():
        for level, color_id in enumerate(ramp):
            out[land & (classes == category) & (shade == level)] = lookup[color_id]
    out[coastline(land)] = lookup['earth-4']
    return out


def source_hashes(args):
    paths = [args.source_dir / 'bluemarble.jpg', args.source_dir / 'topology.png']
    hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
    manifest = json.loads((ROOT / 'src/assets/manifest.json').read_text())
    map_id = 'MAP_EAST_ASIA' if args.region == 'east-asia' else 'MAP_WORLD'
    sources = next(a for a in manifest['assets'] if a['id'] == map_id)['provenance']['sources']
    expected = [s['sha256'] for s in sources]
    if list(hashes.values()) != expected:
        raise ValueError('원본 영상 SHA-256이 매니페스트 sources와 다릅니다.')
    return hashes


def build_pixel(args, inputs):
    # 저장소 안 도구를 직접 실행할 때도 추가 패키지 설치 없이 가져온다.
    import sys
    sys.path.insert(0, str(ROOT))
    from tools.art.palette import load_palette

    bounds = REGIONS[args.region]['bounds']
    size = PIXEL_SIZES[args.region]
    with Image.open(args.source_dir / 'bluemarble.jpg') as source:
        color = crop_equirect(source.convert('RGB'), bounds).resize(size, Image.Resampling.BOX)
    with Image.open(args.source_dir / 'topology.png') as source:
        topo = crop_equirect(source.convert('L'), bounds).resize(size, Image.Resampling.BOX)
    rgb = np.asarray(color).astype(np.float64) / 255
    height = np.asarray(topo).astype(np.float64) / 255
    height_land = height > HEIGHT_LAND
    # 기존 높이 육지 근처의 색 보완을 논리 해상도에 맞춘 3×3 창에서 적용한다.
    near_height = sum(shifted(height_land.astype(np.int16), dy, dx)
                      for dy in (-1, 0, 1) for dx in (-1, 0, 1)) > 0
    r, g, b = np.moveaxis(rgb, -1, 0)
    land = majority_land(height_land | ((b < np.maximum(r, g) + 0.04) & near_height))
    world = json.loads((ROOT / 'data/world.json').read_text(encoding='utf-8'))
    regional = args.region == 'east-asia'
    land, opened, gate_warnings = carve_gate_passages(land, world.get('sea_gates', []), bounds,
                                                     2 if regional else 1, 4 if regional else 2)
    classes = smooth_classes(classify_terrain(rgb, height, land), land)
    ratio = isolated_ratio(classes, land)
    limits = (2, 6) if regional else (1, 3)
    out = paint_palette(classes, land, hillshade(height), sea_distance(land, limits[1]), limits, load_palette())
    coastal_y, coastal_x = np.nonzero(coastline(land))
    city_warnings = []
    for city in world['items']:
        if not city.get('geo_position'):
            continue
        point = geo_pixel(city['geo_position'], bounds, size)
        if point is None:
            continue
        x, y = point
        distance = float(np.sqrt(np.min((coastal_x - x) ** 2 + (coastal_y - y) ** 2))) if len(coastal_x) else None
        if distance is None or distance > 1:
            city_warnings.append({'id': city['id'], 'pixel': [x, y], 'coast_distance_px': distance,
                                  'warning_ko': '도시 좌표가 육지 쪽 해안선에서 1논리 픽셀보다 멉니다.'})
    dest = ROOT / 'public/assets/maps' / f'{args.region}.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out).save(dest, 'PNG', optimize=False, compress_level=9)
    meta = {'path': str(dest.relative_to(ROOT)), 'width': size[0], 'height': size[1],
            'bounds': bounds, 'projection': 'equirectangular', 'inputs_sha256': inputs,
            'output_sha256': hashlib.sha256(dest.read_bytes()).hexdigest(),
            'colors_used': len(np.unique(out.reshape(-1, 3), axis=0)), 'isolated_ratio': ratio,
            'gates_opened': opened, 'gate_warnings': gate_warnings, 'city_coast_warnings': city_warnings}
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    return meta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path)
    parser.add_argument('--region', choices=sorted(REGIONS), default='east-asia')
    parser.add_argument('--style', choices=['satellite', 'pixel'], default='pixel')
    args = parser.parse_args()
    try:
        inputs = source_hashes(args)
        if args.style == 'pixel':
            build_pixel(args, inputs)
        else:
            build_satellite(args)
    except (ValueError, OSError) as exc:
        parser.exit(1, f'{exc}\n')


if __name__ == '__main__':
    main()
