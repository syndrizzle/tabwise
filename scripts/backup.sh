#!/usr/bin/env bash
# Full site backup: committed source (including the catalog data) plus a fresh production build.
set -euo pipefail
cd "$(dirname "$0")/.."

stamp=$(date +%Y-%m-%d)
out="backups/tabwise-backup-$stamp.zip"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

bun run build
mkdir -p backups "$work/tabwise-backup-$stamp"
git archive --format=tar HEAD | tar -x -C "$work/tabwise-backup-$stamp"
mkdir -p "$work/tabwise-backup-$stamp/dist"
cp -R dist/. "$work/tabwise-backup-$stamp/dist/"
git log --format='%h %ad %s' --date=short > "$work/tabwise-backup-$stamp/COMMITS.txt"

(cd "$work" && zip -qr - "tabwise-backup-$stamp") > "$out"
echo "Backup written to $out ($(du -h "$out" | cut -f1))"
