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
    from .palette import ROOT, export_palette, load_palette, nearest_color, palette_rgb, rgb_to_lab
    from .pixelize import despeckle_pixels, pixelize
    from .check_pixel_asset import check_asset, slot_spec
except ImportError:
    from palette import ROOT, export_palette, load_palette, nearest_color, palette_rgb, rgb_to_lab
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
                    palette['colors'][1]['hex'] = palette['colors'][0]['hex']
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
                with self.assertRaises(ValueError):
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


if __name__ == '__main__':
    unittest.main()
