#!/usr/bin/env python3
"""동아시아 해역 게임 지도 배경을 만든다.

입력 (공공 도메인 위성 합성 영상과 지형 높이 지도, 정거원통도법 4096×2048 / 2048×1024):
  bluemarble.jpg  NASA Blue Marble 합성 영상 — GitHub vasturiano/three-globe 예제 사본에서 받음
  topology.png    지형 높이 회색조 지도(바다 0) — 같은 저장소 예제 사본
출력: public/assets/maps/east-asia.webp

처리: 지역 자르기 → 2배 확대 → 산맥 음영(북서쪽 광원) → 수심 느낌의 바다 그라데이션
→ 모래색 해안선 → 가장자리 어둡게. 지형 색은 원본 위성 영상에서 가져오고 새로 칠하지 않는다.
필요 패키지: Pillow, numpy (게임 실행에는 필요 없음).

  python3 scripts/build_map.py --source-dir <입력 폴더>
"""
from pathlib import Path
import argparse
import hashlib
import json

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
# 지도 범위: 6개 거점(자카르타 −6.1° ~ 부산 35.1°, 싱가포르 103.8° ~ 요코하마 139.6°)을 모두 포함.
BOUNDS = {'lon_min': 98.0, 'lon_max': 146.0, 'lat_min': -10.0, 'lat_max': 44.0}
SCALE = 2


def crop_equirect(img, b):
    w, h = img.size
    x0 = (b['lon_min'] + 180) / 360 * w
    x1 = (b['lon_max'] + 180) / 360 * w
    y0 = (90 - b['lat_max']) / 180 * h
    y1 = (90 - b['lat_min']) / 180 * h
    return img.crop((round(x0), round(y0), round(x1), round(y1)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path)
    args = parser.parse_args()
    color_src = args.source_dir / 'bluemarble.jpg'
    topo_src = args.source_dir / 'topology.png'

    color = crop_equirect(Image.open(color_src).convert('RGB'), BOUNDS)
    size = (color.width * SCALE, color.height * SCALE)
    color = color.resize(size, Image.LANCZOS)
    topo = crop_equirect(Image.open(topo_src).convert('L'), BOUNDS).resize(size, Image.BICUBIC)

    rgb = np.asarray(color).astype(np.float32) / 255
    height = np.asarray(topo).astype(np.float32) / 255

    # 육지: 높이 > 0. 색(파란빛이 우세하지 않음)은 높이로 확인된 육지 근처의 해안 저지대 보완에만 쓴다.
    # 색만으로 판정하면 얕은 바다·산호초가 가짜 섬으로 잡힌다.
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    height_land = height > 0.004
    near_height_land = np.asarray(
        Image.fromarray((height_land * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 127
    land = height_land | ((b < np.maximum(r, g) + 0.04) & near_height_land)
    land_img = Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    land = np.asarray(land_img) > 127

    # 산맥 음영 (Horn 방식 근사, 광원 방위 315°·고도 40°).
    z = np.asarray(topo.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255 * 60
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
    near = np.asarray(Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22))).astype(np.float32) / 255
    near = np.clip(near * 2.2, 0, 1)[..., None] ** 0.8
    deep = np.array([0.05, 0.16, 0.33])
    shallow = np.array([0.16, 0.47, 0.56])
    sea_rgb = deep * (1 - near) + shallow * near
    sea_rgb = sea_rgb * 0.7 + rgb * 0.3 * 1.4

    out = np.where(land[..., None], land_rgb, sea_rgb)

    # 모래색 해안선.
    eroded = np.asarray(Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))) > 127
    coast = land & ~eroded
    coast_soft = np.asarray(Image.fromarray((coast * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))).astype(np.float32) / 255
    sand = np.array([0.93, 0.86, 0.66])
    out = out * (1 - 0.55 * coast_soft[..., None]) + sand * 0.55 * coast_soft[..., None]

    # 가장자리 어둡게.
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    d = np.hypot((xx - size[0] / 2) / (size[0] / 2), (yy - size[1] / 2) / (size[1] / 2))
    out = out * (1 - 0.28 * np.clip(d - 0.55, 0, 1)[..., None] / 0.85)

    img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))

    dest = ROOT / 'public' / 'assets' / 'maps' / 'east-asia.webp'
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


if __name__ == '__main__':
    main()
