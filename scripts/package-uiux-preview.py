#!/usr/bin/env python3
"""Copy public game assets into an empty directory for the separate preview site."""
import argparse
import shutil
from pathlib import Path

from preview_uiux import ROOT, PUBLIC_DIRS, PUBLIC_FILES, EXTENSIONS

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
args.destination.mkdir(parents=True, exist_ok=True)
if any(args.destination.iterdir()):
    parser.error('Use an empty destination to avoid including files from an earlier build.')
public = args.destination / 'dist'
public.mkdir()
for folder in sorted(PUBLIC_DIRS):
    for source in (ROOT / folder).rglob('*'):
        if source.is_file() and source.suffix in EXTENSIONS:
            target = public / source.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
for name in PUBLIC_FILES:
    shutil.copy2(ROOT / name, public / name)
(args.destination / '.openai').mkdir()
shutil.copy2(ROOT / '.openai/hosting.json', args.destination / '.openai/hosting.json')
print(args.destination.resolve())
