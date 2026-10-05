"""논리 격자의 지도 처리: 합성 배열과 실제 생성물의 팔레트 계약을 확인한다."""
import unittest
import numpy as np

from build_map import (ROOT, LOWLAND, FOREST, DRY, MOUNTAIN, SNOW, REGIONS, PIXEL_SIZES,
                       majority_land, classify_terrain, smooth_classes, isolated_ratio, coastline,
                       carve_gate_passages, geo_pixel, paint_palette, sea_distance)
import sys
sys.path.insert(0, str(ROOT))
from tools.art.palette import load_palette, palette_rgb
from PIL import Image
import json


class BuildMapTests(unittest.TestCase):
    def test_gate_carves_radius_and_reports_disconnected_sea(self):
        bounds = {'lon_min': 0, 'lon_max': 10, 'lat_min': 0, 'lat_max': 10}
        gates = [{'id': 'GATE', 'gate_type': 'canal', 'geo_position': {'lon': 5, 'lat': 5}},
                 {'id': 'OUTSIDE', 'gate_type': 'strait', 'geo_position': {'lon': 15, 'lat': 5}}]
        land = np.ones((10, 10), dtype=bool)
        carved, opened, warnings = carve_gate_passages(land, gates, bounds, 1, 2)
        self.assertTrue(land.all())
        self.assertEqual(np.count_nonzero(~carved), 5)
        self.assertFalse(carved[5, 5])
        self.assertEqual([g['id'] for g in opened], ['GATE'])
        self.assertEqual(warnings, [])
        land[3, 3] = False
        _, _, warnings = carve_gate_passages(land, gates, bounds, 1, 2)
        self.assertEqual(warnings[0]['sea_components'], 2)

    def test_majority_and_mode_remove_isolated_pixels(self):
        land = np.ones((5, 5), dtype=bool)
        land[2, 2] = False
        self.assertTrue(majority_land(land).all())
        land[:] = True
        classes = np.full((5, 5), LOWLAND, dtype=np.int16)
        classes[2, 2] = FOREST
        self.assertGreater(isolated_ratio(classes, land), 0)
        result = smooth_classes(classes, land)
        self.assertEqual(result[2, 2], LOWLAND)
        self.assertEqual(isolated_ratio(result, land), 0)
        land[0] = False
        classes[0] = -1
        self.assertTrue(np.all(smooth_classes(classes, land)[0] == -1))

    def test_coastline_is_one_land_pixel_thick(self):
        land = np.zeros((7, 7), dtype=bool)
        land[1:6, 1:6] = True
        coast = coastline(land)
        self.assertEqual(np.count_nonzero(coast), 16)
        self.assertFalse(coast[3, 3])
        self.assertTrue(np.all(~coast | land))
        self.assertFalse(coastline(np.ones((5, 5), dtype=bool)).any())

    def test_terrain_thresholds_and_mountain_precedence(self):
        rgb = np.array([[[0.25, 0.26, 0.25], [0.12, 0.25, 0.12], [0.7, 0.45, 0.25],
                         [0.9, 0.9, 0.9], [0.9, 0.9, 0.9], [0.1, 0.2, 0.4]]])
        height = np.array([[0.1, 0.1, 0.1, 0.5, 0.1, 0]])
        land = height > 0
        np.testing.assert_array_equal(classify_terrain(rgb, height, land), [[LOWLAND, FOREST, DRY, MOUNTAIN, SNOW, -1]])

    def test_distance_and_palette_painting(self):
        land = np.zeros((9, 9), dtype=bool)
        land[3:6, 3:6] = True
        distance = sea_distance(land, 3)
        self.assertEqual(distance[3, 2], 1)
        self.assertAlmostEqual(distance[2, 2], np.sqrt(2))
        classes = np.arange(81).reshape(9, 9) % 5
        shade = np.arange(81).reshape(9, 9) % 3
        palette = load_palette()
        painted = paint_palette(classes, land, shade, distance, (1, 3), palette)
        allowed = {tuple(c) for c in palette_rgb(palette)}
        used = {tuple(c) for c in painted.reshape(-1, 3)}
        self.assertTrue(used <= allowed)
        self.assertLessEqual(len(used), 20)
        np.testing.assert_array_equal(painted[0, 0], palette_rgb(palette)[4])

    def test_generated_maps_and_gate_centers(self):
        world = json.loads((ROOT / 'data/world.json').read_text())
        palette = load_palette()
        allowed = {tuple(c) for c in palette_rgb(palette)}
        sea = {tuple(c) for c in palette_rgb(palette)[4:7]}
        for region, size in PIXEL_SIZES.items():
            with self.subTest(region=region):
                with Image.open(ROOT / f'public/assets/maps/{region}.png') as image:
                    self.assertEqual(image.size, size)
                    pixels = np.asarray(image.convert('RGB'))
                used = {tuple(c) for c in pixels.reshape(-1, 3)}
                self.assertTrue(used <= allowed)
                self.assertLessEqual(len(used), 20)
                for gate in world['sea_gates']:
                    point = geo_pixel(gate['geo_position'], REGIONS[region]['bounds'], size)
                    if point:
                        x, y = point
                        self.assertIn(tuple(pixels[y, x]), sea, gate['id'])


if __name__ == '__main__':
    unittest.main()
