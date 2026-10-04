#!/usr/bin/env python3
"""Refresh the development-data manifest and optionally build a portable ZIP."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = ['README.md', 'START_HERE.md', 'AGENTS.md', 'CLAUDE.md',
              'PACKAGE_STATUS.json', '.gitignore']
SOURCE_DIRS = ['docs', 'data', 'schemas', 'references', 'tests', 'tools']


def source_files():
    files = [ROOT / name for name in ROOT_FILES if (ROOT / name).is_file()]
    for dirname in SOURCE_DIRS:
        files.extend(path for path in (ROOT / dirname).rglob('*')
                     if path.is_file() and '__pycache__' not in path.parts
                     and path.suffix not in {'.pyc', '.pyo'})
    return sorted(files, key=lambda path: path.relative_to(ROOT).as_posix())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest-only', action='store_true')
    args = parser.parse_args()
    status = json.loads((ROOT / 'PACKAGE_STATUS.json').read_text(encoding='utf-8'))
    files = source_files()
    manifest = {
        'package_version': status['package_version'],
        'created_on': status['rebuilt_on'],
        'game_implemented': status['game_implemented'],
        'external_assets_bundled': False,
        'external_statistics_sample_bundled': 'ECB 10-day FX sample with attribution',
        'files': [{'path': path.relative_to(ROOT).as_posix(),
                   'size_bytes': path.stat().st_size,
                   'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                  for path in files],
    }
    manifest_path = ROOT / 'MANIFEST.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n',
                             encoding='utf-8')
    if args.manifest_only:
        print(f'Manifest refreshed: {len(files)} source files')
        return 0
    subprocess.run([sys.executable, str(ROOT/'tools'/'validate_data.py')], check=True)
    output_dir = ROOT / 'dist'
    output_dir.mkdir(exist_ok=True)
    name = 'Scitrade_development_v' + status['package_version']
    output = output_dir / (name + '.zip')
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in files + [manifest_path]:
            archive.write(path, name + '/' + path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('ZIP integrity check failed')
    print(f'Created {output.name}: {len(files)+1} files; ZIP integrity PASS')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
