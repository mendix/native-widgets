#!/usr/bin/env bash
#
# Fail if any built widget .mpk carries an EMPTY node_modules/.
#
# A widget that vendors dependencies ships them under node_modules/ inside the .mpk; metro
# resolves a widget's imports from that vendored copy, not from the app's node_modules. A
# widget that needs no vendored dependency has no node_modules/ entry at all. The corruption
# this catches is neither: node_modules/ is PRESENT but holds no files — sometimes a bare
# empty dir, sometimes per-package dirs with nothing inside them. Only directory entries
# survive, and metro cannot resolve a directory containing no files.
#
# Such an .mpk installs cleanly and passes `mx update-widgets`, then kills the iOS/Android
# bundle four jobs later with "Unable to resolve module <dep> ... could not be found within
# the project" — which is how background-gradient-native failed: a restored dist cache
# supplied a BackgroundGradient.mpk with no react-native-linear-gradient copy in it.
#
# Deliberately structural, not semantic. Which imports MAY stay unvendored is per-widget
# rollup `nativeExternal` config (react-native-svg, reanimated, gesture-handler, big.js,
# @react-native-vector-icons, safe-area-context, util, ...) plus babel helpers supplied by
# the app, so an imports-vs-node_modules diff would have to mirror that config per widget.
# Tried: it flagged 18 of 41 known-good mpks. This signature flags 0 of those 41 and catches
# all 12 empty-vendor mpks in the artifact from run 30688977998.
#
# Usage: check-mpk-vendoring.sh [--quiet]
#   --quiet  report via exit code only (for probing a restored cache, where a bad entry is
#            handled by rebuilding rather than by failing the job)
set -uo pipefail

quiet=false
[ "${1:-}" = "--quiet" ] && quiet=true

log() { [ "$quiet" = true ] || echo "$@"; }

bad=0 checked=0
for mpk in $(find packages/pluggableWidgets/*/dist -type f -path '*/dist/*/*.mpk' 2>/dev/null); do
  widget=$(echo "$mpk" | cut -d/ -f3)
  checked=$((checked + 1))
  entries=$(unzip -Z1 "$mpk")
  echo "$entries" | grep -q '^node_modules' || continue
  # Files, not directories: a trailing "/" marks a directory entry.
  files=$(echo "$entries" | grep -E '^node_modules/.' | grep -vc '/$' || true)
  if [ "$files" -eq 0 ]; then
    bad=$((bad + 1))
    log "::error::$widget: $(basename "$mpk") has an empty node_modules/ — it vendors no dependency files, so metro will fail with \"could not be found within the project\". Rebuild this widget; if it came from the dist cache, that cache entry is poisoned."
  fi
done

log "Checked $checked mpk(s)."
if [ "$bad" -gt 0 ]; then
  log "$bad widget mpk(s) have an empty vendored dependency tree."
  exit 1
fi
log "All built mpks that vendor dependencies contain their files."
