#!/usr/bin/env bash
#
# Refresh the committed assertScreenshot baselines from a capture run.
#
# Prerequisite: trigger a capture run that produces (but does not assert) screenshots:
#   gh workflow run NativePipeline.yml --ref <branch> -f update_baselines=true
# When it finishes, run this script to pull the *-screenshots-* artifacts and drop them
# into maestro/images/expected/{android,ios}/, then review + commit.
#
# Usage:
#   maestro/helpers/update_baselines.sh [RUN_ID]
#
# RUN_ID  GitHub Actions run id to download from. Defaults to the most recent
#         NativePipeline run on the current branch.
set -euo pipefail

command -v gh >/dev/null 2>&1 || { echo "❌ gh CLI is required"; exit 1; }

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
expected_root="$repo_root/maestro/images/expected"

run_id="${1:-}"
if [ -z "$run_id" ]; then
  branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD)"
  echo "ℹ️  No run id given; using the latest NativePipeline run on '$branch'."
  run_id="$(gh run list --workflow NativePipeline.yml --branch "$branch" -L1 \
    --json databaseId -q '.[0].databaseId')"
  [ -n "$run_id" ] || { echo "❌ Could not find a run on '$branch'"; exit 1; }
fi
echo "📥 Downloading screenshot artifacts from run $run_id ..."

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
# Pull every per-widget / per-jsactions screenshot artifact (android-screenshots-*, ios-screenshots-*).
gh run download "$run_id" --pattern '*-screenshots-*' --dir "$tmp" \
  || { echo "❌ No screenshot artifacts found on run $run_id"; exit 1; }

total=0
for platform in android ios; do
  dest="$expected_root/$platform"
  mkdir -p "$dest"
  # Artifacts are named "<platform>-screenshots-<widget>"; copy every PNG inside, keyed by
  # basename (takeScreenshot writes flat <name>.png, so basename uniquely identifies a baseline).
  count=0
  while IFS= read -r -d '' png; do
    cp -f "$png" "$dest/$(basename "$png")"
    count=$((count + 1))
  done < <(find "$tmp" -type d -name "${platform}-screenshots-*" -exec find {} -name '*.png' -print0 \;)
  echo "  $platform: $count screenshots → $dest"
  total=$((total + count))
done

[ "$total" -gt 0 ] || { echo "❌ No PNGs found in the downloaded artifacts"; exit 1; }

echo
echo "✅ Updated $total baselines. Review and commit:"
echo "   git add maestro/images/expected && git status --short maestro/images/expected"
