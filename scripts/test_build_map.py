"""논리 격자의 지도 처리: 합성 배열과 실제 생성물의 팔레트 계약을 확인한다."""
import unittest
from pathlib import Path
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
    def test_gate_paths_are_four_connected_and_leave_other_land(self):
        bounds = {'lon_min': 30, 'lon_max': 36, 'lat_min': 26, 'lat_max': 34}
        land = np.ones((80,60),dtype=bool)
        carved, opened, _ = carve_gate_passages(land, [], bounds)
        self.assertTrue(land.all()); self.assertFalse(carved[70,40])
        self.assertTrue(carved[0,0])
        from build_map import component_labels
        self.assertEqual(len(set(component_labels(carved)[~carved])),1)

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
        world = json.loads((ROOT / 'data/world.json').read_text(encoding='utf-8'))
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

    def test_majority_preserves_peninsula_core_and_island_without_dilation(self):
        land = np.zeros((11,15),dtype=bool)
        land[2:8,2:6] = True
        land[4:7,6:10] = True  # 폭 3칸 반도
        land[3:6,12:15] = True  # 떨어진 섬
        out = majority_land(land)
        self.assertTrue(out[5,8]); self.assertTrue(out[4,13])
        self.assertFalse(out[3,8]); self.assertFalse(out[8,3])
        lone = np.zeros((5,5),dtype=bool); lone[2,2] = True
        self.assertFalse(majority_land(lone).any())

    def test_exact_palette_sea_coast_terrain_and_shade(self):
        palette = load_palette()
        lookup = {c['id']:tuple(bytes.fromhex(c['hex'][1:])) for c in palette['colors']}
        land = np.ones((7,20),dtype=bool); land[:,:4] = False
        classes = np.tile(np.repeat(np.arange(5),4),(7,1))
        shade = np.tile(np.arange(20)%3,(7,1))
        distance = np.tile([8,3,2,1]+[0]*16,(7,1))
        out = paint_palette(classes,land,shade,distance,(1,3),palette)
        for x,color in enumerate(['sea-1','sea-2','sea-2','sea-3','teal-4']):
            self.assertEqual(tuple(out[3,x]),lookup[color])
        from build_map import TERRAIN_RAMPS
        for x in range(5,20):
            self.assertEqual(tuple(out[3,x]),lookup[TERRAIN_RAMPS[classes[3,x]][shade[3,x]]])
        self.assertNotIn('teal-4',{color for ramp in TERRAIN_RAMPS.values() for color in ramp})
        self.assertTrue(set(TERRAIN_RAMPS[MOUNTAIN]).isdisjoint(TERRAIN_RAMPS[SNOW]))

    def test_vector_area_holes_longitude_wrap_and_thin_islands(self):
        import tempfile
        from pathlib import Path
        from build_map import rasterize_land
        with tempfile.TemporaryDirectory() as directory:
            land = Path(directory)/'land.json'; lakes = Path(directory)/'lakes.json'
            def polygon(rings): return {'type':'Feature','geometry':{'type':'Polygon','coordinates':rings}}
            def rectangle(x0,y0,x1,y1):return [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]
            land.write_text(json.dumps({'features':[polygon([rectangle(-175,0,-171,4),rectangle(-174,1,-173,2)])]}),encoding='utf-8')
            lakes.write_text(json.dumps({'features':[polygon([rectangle(-172,2,-171,3)])]}),encoding='utf-8')
            bounds={'lon_min':180,'lon_max':190,'lat_min':0,'lat_max':5}
            mask=rasterize_land(land,lakes,bounds,(10,5),12)
            self.assertTrue(mask[2,5]);self.assertFalse(mask[3,6]);self.assertFalse(mask[2,8])
            self.assertFalse(mask[2,4])

    def test_height_alignment_and_bilinear_enlargement(self):
        from build_map import resize_equirect
        source=Image.fromarray(np.array([[0,255],[64,128]],dtype=np.uint8))
        bounds={'lon_min':-90,'lon_max':90,'lat_min':-45,'lat_max':45}
        actual=resize_equirect(source,bounds,(9,9),Image.Resampling.BILINEAR)
        expected=source.resize((9,9),Image.Resampling.BILINEAR,box=(.5,.5,1.5,1.5))
        self.assertEqual(actual.tobytes(),expected.tobytes())
        self.assertNotEqual(actual.tobytes(),source.resize((9,9),Image.Resampling.BOX,box=(.5,.5,1.5,1.5)).tobytes())
        # 생성기가 확대에도 BILINEAR를 요청하는지 실제 호출을 가로챈다.
        from unittest.mock import patch
        from build_map import build_pixel, source_hashes
        args=self.source_args('east-asia')
        if not (args.source_dir/'topology.png').exists(): self.skipTest('높이 원본이 없어 생성기 확대 검사 생략')
        calls=[]
        def resized(image,bounds,size,resample):
            calls.append((image.mode,resample))
            return resize_equirect(image,bounds,size,resample)
        import tempfile,contextlib,io
        with tempfile.TemporaryDirectory() as directory, patch('build_map.resize_equirect',side_effect=resized), contextlib.redirect_stdout(io.StringIO()):
            build_pixel(args,source_hashes(args),Path(directory))
        self.assertIn(('L',Image.Resampling.BILINEAR),calls)
        self.assertNotIn(('L',Image.Resampling.BOX),calls)

    def source_args(self,region):
        from types import SimpleNamespace
        return SimpleNamespace(source_dir=ROOT.parent/'map',region=region,style='pixel')

    def test_regeneration_byte_identity_geography_and_connections(self):
        from build_map import build_pixel,source_hashes,CHECK_POINTS
        import tempfile,contextlib,io
        from pathlib import Path
        for region in PIXEL_SIZES:
            args=self.source_args(region)
            resolution='10m' if region=='east-asia' else '50m'
            required=['bluemarble.jpg','topology.png',f'ne/ne_{resolution}_land.geojson',f'ne/ne_{resolution}_lakes.geojson']
            missing=[name for name in required if not (args.source_dir/name).exists()]
            if missing: self.skipTest('재생성 원본 없음: '+', '.join(missing))
            with self.subTest(region=region),tempfile.TemporaryDirectory() as directory,contextlib.redirect_stdout(io.StringIO()):
                meta=build_pixel(args,source_hashes(args),Path(directory))
                self.assertEqual((Path(directory)/f'{region}.png').read_bytes(),(ROOT/f'public/assets/maps/{region}.png').read_bytes())
                self.assertTrue(all(c['passed'] for c in meta['city_coast_checks']),meta['city_coast_checks'])
                self.assertTrue(all(c['connected'] for c in meta['sea_connections']),meta['sea_connections'])
                self.assertEqual(meta['gate_warnings'],[])
                self.assertLessEqual(meta['color_isolated_ratio_8'],0.003)
                # 50% 면적 규칙과 충돌하는 기준점은 명시적인 예외 목록으로 남긴다.
                unresolved={'상하이 동쪽 해안'} | ({'오키나와 본섬'} if region=='world' else set())
                self.assertEqual({c['name'] for c in meta['point_checks'] if not c['passed']},unresolved)
                self.assertTrue(all(c['passed'] for c in meta['point_checks'] if c['name'] not in unresolved))

    def test_suez_passage_required_for_full_sea_connectivity(self):
        from build_map import sea_connections,PASSAGES
        # 지도 전체의 수에즈 양쪽을 막은 합성 육지 장벽. 다른 대양 우회는 없다.
        bounds={'lon_min':30,'lon_max':36,'lat_min':26,'lat_max':34}
        land=np.zeros((80,60),dtype=bool);land[30:40,:]=True
        gates=[]
        carved,opened,_=carve_gate_passages(land,gates,bounds)
        self.assertIn('SUEZ_CANAL',[p['id'] for p in opened])
        from build_map import component_labels,geo_pixel
        labels=component_labels(carved)
        points=[geo_pixel({'lon':lon,'lat':lat},bounds,(60,80)) for lon,lat in PASSAGES['SUEZ_CANAL']]
        self.assertEqual(labels[points[0][1],points[0][0]],labels[points[1][1],points[1][0]])


if __name__ == '__main__':
    unittest.main()
