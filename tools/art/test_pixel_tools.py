"""합성 그림으로 변환·검사의 계약과 실패 종료를 확인한다."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image, ImageFilter

try:
    from .palette import ROOT, export_palette, load_palette, nearest_color, nearest_indices, palette_rgb, rgb_to_lab
    from .pixelize import despeckle_pixels, pixelize
    from .check_pixel_asset import check_asset, slot_spec
except ImportError:
    from palette import ROOT, export_palette, load_palette, nearest_color, nearest_indices, palette_rgb, rgb_to_lab
    from pixelize import despeckle_pixels, pixelize
    from check_pixel_asset import check_asset, slot_spec


class PixelToolsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.palette = load_palette()
        self.colors = palette_rgb(self.palette)

    def command(self, script, *args):
        return subprocess.run([sys.executable, str(ROOT / 'tools/art' / script), *map(str, args)],
                              capture_output=True, text=True)

    def test_blurred_noisy_draft_round_trip_and_determinism(self):
        source = np.zeros((32, 32, 4), dtype=np.uint8)
        source[3:29, 3:29, :3] = self.colors[14]
        source[3:29, 3:29, 3] = 255
        source[8:24, 8:24, :3] = self.colors[18]
        enlarged = Image.fromarray(source).resize((256, 256), Image.Resampling.NEAREST).filter(ImageFilter.GaussianBlur(2))
        noisy = np.array(enlarged).astype(np.int16)
        noisy[..., :3] += np.random.default_rng(7).integers(-5, 6, noisy[..., :3].shape)
        enlarged = Image.fromarray(np.clip(noisy, 0, 255).astype(np.uint8))
        input_path, output_path = self.directory / 'draft.png', self.directory / 'pixel.png'
        enlarged.save(input_path)
        self.assertTrue(np.any((noisy[..., 3] > 0) & (noisy[..., 3] < 255)))
        hashes = []
        for _ in range(2):
            result = self.command('pixelize.py', input_path, output_path, '--size', '32x32', '--max-colors', 15, '--despeckle')
            self.assertEqual(result.returncode, 0, result.stderr)
            meta = json.loads(result.stdout)
            self.assertEqual((meta['width'], meta['height']), (32, 32))
            self.assertLessEqual(meta['colors_used'], 15)
            hashes.append(hashlib.sha256(output_path.read_bytes()).hexdigest())
            check = self.command('check_pixel_asset.py', output_path, '--size', '32x32', '--max-colors', 15)
            self.assertEqual(check.returncode, 0, check.stdout + check.stderr)
        self.assertEqual(hashes[0], hashes[1])
        with Image.open(output_path) as recovered:
            actual = np.asarray(recovered)
        self.assertGreaterEqual(np.mean(np.all(actual == source, axis=2)), 0.98)

    def test_checker_rejects_each_error_and_exit_code(self):
        base = np.zeros((8, 8, 4), dtype=np.uint8)
        base[..., :3], base[..., 3] = self.colors[0], 255
        cases = [('알파', (0, 0, 3), 127, []), ('팔레트', (0, 0, 0), 1, []),
                 ('크기', None, None, ['--size', '9x9']), ('색 수', None, None, ['--max-colors', '1'])]
        for name, index, value, options in cases:
            with self.subTest(name=name):
                pixels = base.copy()
                if index:
                    pixels[index] = value
                if name == '색 수':
                    pixels[0, 0, :3] = self.colors[1]
                path = self.directory / f'{name}.png'
                Image.fromarray(pixels).save(path)
                size_args = [] if name == '크기' else ['--size', '8x8']
                result = self.command('check_pixel_asset.py', path, *size_args, *options)
                self.assertEqual(result.returncode, 1, result.stdout)
                self.assertIn(name + ':', result.stdout)
                self.assertEqual(len(result.stdout.splitlines()), 1)

    def test_format_and_frame_grid(self):
        path = self.directory / 'test.bmp'
        Image.new('RGB', (7, 8), tuple(self.colors[0])).save(path)
        errors = check_asset(path, (7, 8), frame=(4, 4))
        self.assertTrue(any(e.startswith('형식:') for e in errors))
        self.assertTrue(any(e.startswith('칸 격자:') for e in errors))

    def test_slot_specs(self):
        for slot, spec in {'background': ((384,216),None,32), 'icon': ((16,16),None,15),
                           'map-icon': ((16,16),None,15), 'ship': ((24,16),None,15),
                           'frame': ((24,24),None,32)}.items():
            self.assertEqual(slot_spec(slot), spec)
        self.assertEqual(slot_spec('work'), ((128, 128), (32, 32), 15))
        self.assertEqual(slot_spec('portrait'), ((48, 48), None, 15))
        self.assertEqual(slot_spec('card'), ((96, 128), None, 32))
        self.assertEqual(slot_spec('map-east-asia'), ((546, 615), None, 20))
        self.assertEqual(slot_spec('map-world'), ((720, 244), None, 20))

    def test_palette_rejects_duplicate_and_reversed_lightness(self):
        for mode in ('duplicate', 'reverse', 'step', 'ramp', 'count', 'id'):
            with self.subTest(mode=mode):
                palette = copy.deepcopy(self.palette)
                if mode == 'duplicate':
                    palette['colors'][1]['hex'] = palette['colors'][4]['hex']
                elif mode == 'reverse':
                    a, b = palette['colors'][:2]
                    a['hex'], b['hex'] = b['hex'], a['hex']
                elif mode == 'step':
                    palette['colors'][1]['step'] = 1
                elif mode == 'ramp':
                    palette['ramps'][0]['id'] = 'unknown'
                elif mode == 'count':
                    palette['colors'].pop()
                else:
                    palette['colors'][1]['id'] = palette['colors'][0]['id']
                path = self.directory / 'palette.json'
                path.write_text(json.dumps(palette))
                messages = {'duplicate': 'hex가 중복', 'reverse': '밝기 역전', 'step': '1~4단계',
                            'ramp': '8줄기', 'count': '32색', 'id': 'ID가 중복'}
                with self.assertRaisesRegex(ValueError, messages[mode]):
                    load_palette(path)

    def test_gpl_export_and_lab(self):
        export_palette(self.palette, self.directory)
        lines = (self.directory / 'scitrade-32.gpl').read_text().splitlines()
        self.assertEqual(lines[:3], ['GIMP Palette', 'Name: scitrade-32', 'Columns: 4'])
        self.assertEqual(len([l for l in lines if l.strip() and l.strip()[0].isdigit()]), 32)
        self.assertEqual(len((self.directory / 'scitrade-32.hex').read_text().splitlines()), 32)
        self.assertAlmostEqual(rgb_to_lab([255, 255, 255])[0], 100, places=4)
        self.assertEqual(nearest_color(self.colors[12], self.palette)['id'], 'green-1')

    def test_modal_color_alpha_tie_and_arbitrary_size(self):
        # 평균색이 아닌 3표를 받은 원래 색을 유지한다.
        rgba = np.array([[list(self.colors[4]) + [255], list(self.colors[4]) + [255]],
                         [list(self.colors[4]) + [255], list(self.colors[19]) + [255]]], dtype=np.uint8)
        out = np.asarray(pixelize(Image.fromarray(rgba), (1, 1), self.palette))
        np.testing.assert_array_equal(out[0, 0], list(self.colors[4]) + [255])
        rgba[0, :, 3] = 0
        self.assertEqual(np.asarray(pixelize(Image.fromarray(rgba), (1, 1), self.palette))[0, 0, 3], 255)
        rgba[1, 0, 3] = 0
        self.assertEqual(np.asarray(pixelize(Image.fromarray(rgba), (1, 1), self.palette))[0, 0, 3], 0)
        enlarged = pixelize(Image.fromarray(rgba), (7, 9), self.palette)
        self.assertEqual(enlarged.size, (7, 9))
        self.assertTrue(set(np.unique(np.asarray(enlarged)[..., 3])) <= {0, 255})

    def test_despeckle_snapshot_and_transparency(self):
        grid = np.full((5, 5), 4, dtype=np.int16)
        grid[2, 2] = 8
        grid[0, 0] = -1
        result = despeckle_pixels(grid)
        self.assertEqual(result[2, 2], 4)
        self.assertEqual(grid[2, 2], 8)
        self.assertEqual(result[0, 0], -1)
        grid[2, 1] = 8
        self.assertEqual(despeckle_pixels(grid)[2, 2], 8)


    def test_lab_choice_differs_from_rgb_distance(self):
        sample = np.array([60, 46, 205])
        choices = np.array([[34, 87, 138], [124, 90, 158]])
        # RGB 거리는 첫 색, CIELAB은 두 번째 색을 고른다.
        self.assertEqual(((choices-sample)**2).sum(axis=1).argmin(), 0)
        self.assertEqual(int(nearest_indices(sample, choices)), 1)

    def test_lightness_seven_boundary(self):
        from unittest.mock import patch
        base = np.tile([0., 7., 14., 21.], 8)
        path = self.directory / 'palette.json'
        path.write_text(json.dumps(self.palette), encoding='utf-8')
        lab = np.zeros((32,3)); lab[:,0] = base
        module = load_palette.__module__
        with patch(module + '.rgb_to_lab', return_value=lab):
            self.assertEqual(load_palette(path), self.palette)
        lab[1,0] = 6.99999
        with patch(module + '.rgb_to_lab', return_value=lab):
            with self.assertRaisesRegex(ValueError, '최소 7'):
                load_palette(path)

    def test_max_colors_remaps_to_nearest_retained_lab_color(self):
        rgba = np.zeros((3,3,4), dtype=np.uint8)
        rgba[...,3] = 255; rgba[...,:3] = self.colors[4]
        rgba[0,:2,:3] = self.colors[16]; rgba[2,2,:3] = self.colors[12]
        out = np.asarray(pixelize(Image.fromarray(rgba), (3,3), self.palette, max_colors=2))
        expected = self.colors[[4,16]][int(nearest_indices(self.colors[12], self.colors[[4,16]]))]
        np.testing.assert_array_equal(out[2,2,:3], expected)
        self.assertEqual(len(np.unique(out[...,:3].reshape(-1,3),axis=0)), 2)
        source_path, output_path = self.directory/'three-colors.png', self.directory/'two-colors.png'
        Image.fromarray(rgba).save(source_path)
        command = self.command('pixelize.py', source_path, output_path, '--size', '3x3', '--max-colors', '2')
        self.assertEqual(command.returncode, 0, command.stderr)
        with Image.open(output_path) as image:
            np.testing.assert_array_equal(np.asarray(image), out)

    def test_despeckle_is_connected_to_pixelize_and_preserves_diagonals(self):
        grid = np.full((7,7), 4, dtype=np.int16)
        np.fill_diagonal(grid, 8)
        np.testing.assert_array_equal(despeckle_pixels(grid), grid)
        grid = np.full((5,5), 4, dtype=np.int16); grid[2,2] = 8
        rgba = np.full((5,5,4), 255, dtype=np.uint8); rgba[...,:3] = self.colors[grid]
        raw = pixelize(Image.fromarray(rgba), (5,5), self.palette)
        clean = pixelize(Image.fromarray(rgba), (5,5), self.palette, despeckle=True)
        np.testing.assert_array_equal(np.asarray(raw)[2,2,:3], self.colors[8])
        np.testing.assert_array_equal(np.asarray(clean)[2,2,:3], self.colors[4])
        source_path, output_path = self.directory/'speckle.png', self.directory/'clean.png'
        Image.fromarray(rgba).save(source_path)
        command = self.command('pixelize.py', source_path, output_path, '--size', '5x5', '--despeckle')
        self.assertEqual(command.returncode, 0, command.stderr)
        with Image.open(output_path) as image:
            np.testing.assert_array_equal(np.asarray(image), np.asarray(clean))
        # 4표로는 바꾸지 않는다.
        grid = np.array([[4,4,4],[4,8,12],[12,12,12]],dtype=np.int16)
        self.assertEqual(despeckle_pixels(grid)[1,1],8)

    def test_alpha_threshold_inclusive_boundary(self):
        rgba = np.zeros((1,3,4),dtype=np.uint8); rgba[...,:3] = self.colors[4]
        rgba[...,3] = [127,128,129]
        out = pixelize(Image.fromarray(rgba),(3,1),self.palette,alpha_threshold=128)
        np.testing.assert_array_equal(np.asarray(out)[...,3],[[0,255,255]])
        source_path, output_path = self.directory/'alpha.png', self.directory/'alpha-out.png'
        Image.fromarray(rgba).save(source_path)
        command = self.command('pixelize.py', source_path, output_path, '--size', '3x1', '--alpha-threshold', '129')
        self.assertEqual(command.returncode, 0, command.stderr)
        with Image.open(output_path) as image:
            np.testing.assert_array_equal(np.asarray(image)[...,3], [[0,0,255]])

    def test_color_count_fifteen_and_sixteen(self):
        for count in (15,16):
            path = self.directory / f'{count}.png'
            Image.fromarray(self.colors[:count].reshape(1,count,3)).save(path)
            errors = check_asset(path,(count,1),max_colors=15)
            self.assertEqual(bool(errors),count==16)
            if errors: self.assertTrue(errors[0].startswith('색 수:'))

    def test_png_depth_animation_gamma_and_profile(self):
        import struct
        from PIL.PngImagePlugin import PngInfo
        path = self.directory / 'special.png'
        Image.fromarray(np.full((4,4),40000,dtype=np.uint16)).save(path)
        self.assertTrue(any(e.startswith('비트 깊이:') for e in check_asset(path,(4,4))))
        result = self.command('pixelize.py',path,self.directory/'out.png','--size','4x4')
        self.assertEqual(result.returncode,1); self.assertIn('비트 깊이:',result.stderr)
        frames = [Image.new('RGB',(4,4),tuple(c)) for c in self.colors[:2]]
        frames[0].save(path,save_all=True,append_images=frames[1:],duration=100,loop=0)
        self.assertEqual(check_asset(path,(4,4)),['애니메이션: 움직이는 PNG(APNG)는 허용하지 않습니다.'])
        for gamma, valid in ((45455,True),(100000,False)):
            info = PngInfo(); info.add(b'gAMA',struct.pack('>I',gamma))
            frames[0].save(path,pnginfo=info)
            self.assertEqual(bool(check_asset(path,(4,4))),not valid)
        from PIL import ImageCms
        for profile, valid in ((ImageCms.createProfile('sRGB'),True),(ImageCms.createProfile('LAB'),False)):
            frames[0].save(path,icc_profile=ImageCms.ImageCmsProfile(profile).tobytes())
            errors = check_asset(path,(4,4))
            self.assertEqual(bool(errors),not valid)
            if errors: self.assertTrue(errors[0].startswith('색 프로필:'))


if __name__ == '__main__':
    unittest.main()
