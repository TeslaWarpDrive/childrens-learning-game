#!/usr/bin/env python3
"""Serve only public game files for a review tunnel, at the production URL prefix."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/letterswithlucy/'
PUBLIC_DIRS = {'home', 'accounts', 'grown-ups', 'v1-letter-post', 'v3-moonboat', 'v4-silk-thread', 'audio'}
PUBLIC_FILES = {'index.html', 'audio-map.js', 'sw.js'}
EXTENSIONS = {'.html', '.css', '.js', '.jpg', '.jpeg', '.webp', '.png', '.svg', '.mp3', '.woff2', '.ico'}

class Preview(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        route = unquote(urlsplit(path).path)
        if not route.startswith(PREFIX):
            return str(ROOT / '.preview-not-found')
        relative = Path(route[len(PREFIX):] or 'index.html')
        target = (ROOT / relative).resolve()
        if not target.is_relative_to(ROOT) or any(part.startswith('.') for part in relative.parts):
            return str(ROOT / '.preview-not-found')
        if relative.parts[0] not in PUBLIC_DIRS and str(relative) not in PUBLIC_FILES:
            return str(ROOT / '.preview-not-found')
        if target.is_dir():
            target = target / 'index.html'
        return str(target if target.suffix in EXTENSIONS else ROOT / '.preview-not-found')

    def list_directory(self, path):
        self.send_error(404)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Robots-Tag', 'noindex, nofollow')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Preview)
    print(f'Preview: http://127.0.0.1:{args.port}{PREFIX}', flush=True)
    server.serve_forever()
