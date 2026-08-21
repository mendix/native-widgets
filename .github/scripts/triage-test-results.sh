#!/usr/bin/env bash
#
# Triage the widget/JS E2E shards of a finished run and print a Markdown report to stdout
# (the aggregate-test-results job redirects it into $GITHUB_STEP_SUMMARY).
#
# The plain pass/fail table doesn't tell a reviewer *why* a shard is red — and most reds in
# this pipeline are infra flakes (corrupt emulator image, runtime not up, missing artifact),
# not real test failures. This script classifies each non-green shard from its job metadata
# and, for the test step itself, from a grep over its log, so someone who didn't write this
# branch can tell "re-run it" from "an actual widget broke" at a glance.
#
# Usage: triage-test-results.sh [<repo> [<run_id>]]
#   repo    defaults to $GITHUB_REPOSITORY
#   run_id  defaults to $GITHUB_RUN_ID
# Requires: gh (authenticated via $GH_TOKEN), jq.

set -euo pipefail

REPO="${1:-${GITHUB_REPOSITORY:?repo required}}"
RUN_ID="${2:-${GITHUB_RUN_ID:?run_id required}}"

# Pull every shard job (with its steps) once.
jobs_json="$(gh api --paginate \
  "repos/${REPO}/actions/runs/${RUN_ID}/jobs?per_page=100" \
  --jq '[.jobs[] | select(.name | test("widget-tests|js-tests"))]' \
  | jq -s 'add // []')"

# Cache the per-job log lookups so we hit the API at most once per failing shard.
fetch_log() {
  local job_id="$1" cache
  cache="$(mktemp)"
  gh api "repos/${REPO}/actions/jobs/${job_id}/logs" >"$cache" 2>/dev/null || true
  printf '%s' "$cache"
}

# Sub-classify a failed "Run … tests" step from its log. Patterns are ordered most-specific
# first; an emulator that never boots can't also mismatch a screenshot, so they're exclusive.
classify_test_step() {
  local log="$1"
  if grep -qiE 'Error reading Zip content from a SeekableByteChannel|could not connect to TCP port 5554|Timeout waiting for emulator|emulator: ERROR' "$log"; then
    echo '📵 Android emulator/adb never booted — corrupt system image (infra flake, re-run)'
  elif grep -qE 'Smoke check FAILED' "$log"; then
    echo '🚬 App did not launch — smoke check failed (build/bundle broken)'
  elif grep -qiE 'threshold not met|Screenshot comparison failed|Comparison error: Assert screenshot' "$log"; then
    echo '🖼 Screenshot mismatch — visual regression or stale baseline (REAL failure)'
  elif grep -qiE 'driver.*(failed to start|did not start)|Unable to launch.*driver|Failed to connect to 127\.0\.0\.1' "$log"; then
    echo '🤖 Maestro driver did not attach (flake)'
  else
    echo '❓ Test step failed — cause unclear, open the job log'
  fi
}

# Decide the triage cell for one job. Echoes "<cause>\t<bucket>" where bucket is
# real | flake | none (none = green/skipped, not counted as a failure).
triage_job() {
  local job="$1"
  local conclusion failed_step job_id log cause
  conclusion="$(jq -r '.conclusion // .status' <<<"$job")"
  job_id="$(jq -r '.id' <<<"$job")"

  case "$conclusion" in
    success) printf '—\tnone'; return ;;
    skipped) printf '—\tnone'; return ;;
    cancelled)
      printf '⏱ Timed out — hit the per-shard timeout-minutes cap (slow/wedged shard)\tflake'
      return ;;
  esac

  # failure (or anything unexpected): lead with the step that actually failed.
  failed_step="$(jq -r 'first(.steps[]? | select(.conclusion == "failure") | .name) // ""' <<<"$job")"
  case "$failed_step" in
    *Download*)        printf '📦 Required artifact missing — upstream build did not publish it\tflake'; return ;;
    *"Start Mendix runtime"*) printf '🔌 Mendix runtime never became ready\tflake'; return ;;
    *"Run "*tests*)
      log="$(fetch_log "$job_id")"
      cause="$(classify_test_step "$log")"
      rm -f "$log"
      case "$cause" in
        *REAL*|*broken*) printf '%s\treal' "$cause" ;;
        *)              printf '%s\tflake' "$cause" ;;
      esac
      return ;;
    "") printf '❓ Failed, but no single step is marked failed — open the job log\tflake'; return ;;
    *)  printf '🧰 Setup/infra step failed: %s\tflake' "$failed_step"; return ;;
  esac
}

result_badge() {
  case "$1" in
    success)   echo '✅ pass' ;;
    failure)   echo '❌ fail' ;;
    cancelled) echo '🚫 cancelled' ;;
    skipped)   echo '⏭️ skipped' ;;
    *)         echo "$1" ;;
  esac
}

# --- Render -----------------------------------------------------------------------------
# Sort so the rows that need a human come first: real failures, then infra/flake, then green.
# Each emitted line is "<priority>\t<markdown row>"; we sort on priority then strip it.
pass=0; real=0; flake=0; other=0
rows=""
while IFS= read -r job; do
  [ -z "$job" ] && continue
  name="$(jq -r '.name' <<<"$job")"
  conclusion="$(jq -r '.conclusion // .status' <<<"$job")"
  IFS=$'\t' read -r cause bucket <<<"$(triage_job "$job")"
  case "$conclusion" in
    success|skipped) pass=$((pass + 1)); prio=3 ;;
    *) case "$bucket" in
         real)  real=$((real + 1));   prio=0 ;;
         flake) flake=$((flake + 1)); prio=1 ;;
         *)     other=$((other + 1)); prio=2 ;;
       esac ;;
  esac
  rows+="${prio}	| ${name} | $(result_badge "$conclusion") | ${cause} |"$'\n'
done < <(jq -c '.[]' <<<"$jobs_json")

echo "## Native widget E2E results"
echo ""
echo "**${pass} green** · **${real} real failure(s)** 🖼🚬 · **${flake} likely infra/flake** (usually clears on re-run)"
echo ""
echo "| Shard | Result | Likely cause |"
echo "| --- | --- | --- |"
# Stable sort by priority (col 1), keeping discovery order within a bucket; drop the key column.
printf '%s' "$rows" | sort -s -t$'\t' -k1,1n | cut -f2-
echo ""
echo "<sub>🖼 screenshot mismatch · 🚬 app/build broken · 📵 emulator · 🔌 runtime · 📦 artifact · 🤖 driver · ⏱ timeout. "
echo "Only 🖼 and 🚬 point at the code under test; the rest are environment/flake and a re-run usually clears them.</sub>"
