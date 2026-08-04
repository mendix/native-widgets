#!/bin/bash

# One retry after the initial run (2 attempts total). Was 3, which combined with the
# initial run in run_tests meant up to 4 attempts per failing test — a genuinely broken
# build burned ~25 min instead of failing fast (S6: retry amplification).
MAX_RETRIES=1
RETRY_DELAY=10

# Timeout for the Maestro driver (instrumentation) to come up. Maestro's default is 15s;
# CI emulators/simulators are slower, but 5 min (300000) was the per-attempt multiplier that
# amplified broken-build runs to ~25 min. 2 min is generous for the driver to start while
# keeping the worst-case failure time bounded.
#
# MUST be exported: Maestro reads it with System.getenv (LocalXCTestInstaller), not as a flow
# variable, so passing it via `--env` was silently ignored.
export MAESTRO_DRIVER_STARTUP_TIMEOUT=240000

# --- Per-flow video recording (BrowserStack-style debugging) ----------------------------
# We record a screen video around every flow, then KEEP it only if the flow FAILS and DELETE
# it on pass — so artifact storage holds just the videos you actually need to debug, each a
# short clip of exactly the failing interaction (not one giant reel to scrub).
#   iOS:     `simctl io booted recordVideo` — runs until SIGINT, no length cap. SIGINT (not
#            SIGKILL) so the trailing moov atom is written and the mp4 is playable.
#   Android: `adb shell screenrecord` — caps at 180s/segment; a longer flow is truncated but
#            still useful. Started AFTER `adb root`/status-bar setup so adbd restarts don't
#            kill the recording mid-flow.
# Toggle with RECORD_VIDEO=false (default on) if recording ever worsens flake on the
# constrained CI runners.
RECORD_VIDEO="${RECORD_VIDEO:-true}"
VIDEO_DIR="${VIDEO_DIR:-$PWD/maestro/videos}"
ANDROID_REC_DEVICE_PATH="/sdcard/maestro-recording.mp4"
REC_PID=""
REC_FILE=""

start_recording() {
  [ "$RECORD_VIDEO" = "true" ] || return 0
  local label="$1"
  REC_PID=""
  mkdir -p "$VIDEO_DIR"
  # Sanitize the label into a filename; one widget per shard so collisions are intra-flow only
  # (a retry overwrites the first attempt's clip, which is what we want).
  REC_FILE="$VIDEO_DIR/${PLATFORM}-$(echo "$label" | tr -c 'A-Za-z0-9._-' '_').mp4"
  rm -f "$REC_FILE"
  if [ "$PLATFORM" == "android" ]; then
    adb shell screenrecord --bit-rate 4000000 --time-limit 180 "$ANDROID_REC_DEVICE_PATH" >/dev/null 2>&1 &
    REC_PID=$!
  else
    xcrun simctl io booted recordVideo --codec h264 --force "$REC_FILE" >/dev/null 2>&1 &
    REC_PID=$!
  fi
}

# stop_recording <keep|discard>
stop_recording() {
  [ "$RECORD_VIDEO" = "true" ] || return 0
  local keep="$1"
  [ -z "$REC_PID" ] && return 0
  if [ "$PLATFORM" == "android" ]; then
    # CRITICAL: stop the ON-DEVICE screenrecord, not just the local adb client. Killing only
    # REC_PID (the `adb shell screenrecord` client) leaves the recorder running on the device
    # until its --time-limit (180s), so `wait` would block ~2.5 min per flow and blow the job
    # timeout. `pkill -INT` makes screenrecord finalize the mp4 (moov atom) promptly.
    adb shell pkill -INT screenrecord >/dev/null 2>&1 || true
    sleep 2  # let screenrecord write the trailer + flush to /sdcard
    kill "$REC_PID" 2>/dev/null || true   # client should already be gone; ensure it, never block
    wait "$REC_PID" 2>/dev/null || true
    if [ "$keep" == "keep" ]; then
      adb pull "$ANDROID_REC_DEVICE_PATH" "$REC_FILE" >/dev/null 2>&1 || true
    fi
    adb shell rm -f "$ANDROID_REC_DEVICE_PATH" >/dev/null 2>&1 || true
  else
    # iOS: SIGINT lets simctl recordVideo finalize the file (moov atom); SIGKILL would corrupt it.
    # recordVideo has no time-limit, so the client exits promptly on the signal.
    kill -INT "$REC_PID" 2>/dev/null || true
    wait "$REC_PID" 2>/dev/null || true
  fi
  REC_PID=""
  if [ "$keep" != "keep" ]; then
    rm -f "$REC_FILE"
  fi
  REC_FILE=""
}

# A wedged XCUITest driver escapes as UnknownFailure to main, so a flow-level `retry:` can never
# catch it. Bound the wall clock here, then reset the device and retry once.

MAESTRO_FLOW_TIMEOUT="${MAESTRO_FLOW_TIMEOUT:-480}"

# Outside maestro's 0-1 range and below the 128+N signal range.
MAESTRO_INFRA_EXIT=90

# Deliberately narrow: a real assertion failure prints "Assertion is false" and matches none.
MAESTRO_INFRA_PATTERNS='kAXError|UnknownFailure|Exception in thread "main"|IOSDriverTimeoutException|Failed to connect to 127\.0\.0\.1'

# Maestro defaults this to ~/.maestro/tests/<timestamp>/, outside the workspace, so it was
# never uploaded.
DEBUG_OUTPUT_DIR="${DEBUG_OUTPUT_DIR:-$PWD/maestro/debug}"

# run_maestro <yaml_or_flow> [extra maestro args...] — sets DEBUG_RUN_DIR for the caller.
run_maestro() {
  local flow="$1"
  shift
  local log_file
  # Explicit XXXXXX template: GNU mktemp rejects `-t maestro-run` ("too few X's"), which left
  # log_file empty on the Linux runners.
  log_file="$(mktemp "${TMPDIR:-/tmp}/maestro-run.XXXXXX")" || log_file=""
  if [ -z "$log_file" ]; then
    log_file="${TMPDIR:-/tmp}/maestro-run.$$"
    : > "$log_file" 2>/dev/null || true
  fi

  DEBUG_RUN_DIR="$DEBUG_OUTPUT_DIR/${PLATFORM}-$(basename "${flow%.yaml}" | tr -c 'A-Za-z0-9._-' '_')"
  rm -rf "$DEBUG_RUN_DIR"
  mkdir -p "$DEBUG_RUN_DIR"
  set -- --debug-output "$DEBUG_RUN_DIR" --flatten-debug-output "$@"

  # Process substitution, not `| tee`: in a pipeline $! is tee's PID, leaving no handle on the
  # JVM to kill.
  "$HOME/.local/bin/maestro/bin/maestro" test "$@" \
    --env APP_ID="$APP_ID" --env PLATFORM="$PLATFORM" "$flow" \
    > >(tee "$log_file") 2>&1 &
  local maestro_pid=$!

  (
    local waited=0
    while [ "$waited" -lt "$MAESTRO_FLOW_TIMEOUT" ]; do
      kill -0 "$maestro_pid" 2>/dev/null || exit 0
      sleep 5
      waited=$((waited + 5))
    done
    echo "::warning::maestro exceeded ${MAESTRO_FLOW_TIMEOUT}s on $(basename "$flow") — killing it (hung driver)"
    kill -TERM "$maestro_pid" 2>/dev/null || true
    sleep 10
    kill -9 "$maestro_pid" 2>/dev/null || true
  ) &
  local watchdog_pid=$!

  wait "$maestro_pid"
  local status=$?
  kill "$watchdog_pid" 2>/dev/null || true
  wait "$watchdog_pid" 2>/dev/null || true

  # Let tee drain before reading the log; it is reaped asynchronously from the substitution.
  sleep 1

  # Only a FAILED run: a passing flow may mention a driver error Maestro recovered from.
  if [ "$status" -ne 0 ] &&
     { [ "$status" -gt 128 ] || grep -qE "$MAESTRO_INFRA_PATTERNS" "$log_file" 2>/dev/null; }; then
    rm -f "$log_file"
    return "$MAESTRO_INFRA_EXIT"
  fi
  rm -f "$log_file"
  return "$status"
}

# Move an attempt's evidence aside BEFORE the retry, which reuses both paths and would otherwise
# delete it: start_recording rm -f's the same REC_FILE and run_maestro rm -rf's the same
# DEBUG_RUN_DIR, so a flake that passes on retry left no video and no hierarchy to diagnose from.
preserve_fault_artifacts() {
  local video="${1:-}"
  local suffix="${2:-driver-fault}"
  if [ -n "$video" ] && [ -f "$video" ]; then
    mv -f "$video" "${video%.mp4}-${suffix}.mp4" 2>/dev/null || true
  fi
  if [ -n "${DEBUG_RUN_DIR:-}" ] && [ -d "$DEBUG_RUN_DIR" ]; then
    rm -rf "${DEBUG_RUN_DIR}-${suffix}"
    mv -f "$DEBUG_RUN_DIR" "${DEBUG_RUN_DIR}-${suffix}" 2>/dev/null || true
    # Cleared so a later discard_debug_output cannot remove the preserved copy.
    DEBUG_RUN_DIR=""
  fi
}

discard_debug_output() {
  [ -n "${DEBUG_RUN_DIR:-}" ] || return 0
  rm -rf "$DEBUG_RUN_DIR"
  DEBUG_RUN_DIR=""
}

reset_device() {
  if [ "$PLATFORM" == "android" ]; then
    ensure_emulator_ready
  else
    restart_simulator
  fi
}

cleanup_xctest_processes() {
    if [ "$PLATFORM" != "ios" ]; then
        return 0
    fi
    echo "🧹 Cleaning up stale XCTest processes..."
    pkill -9 -f "XCTRunner" 2>/dev/null || true
    pkill -9 -f "xctest" 2>/dev/null || true
    pkill -9 -f "maestro.*driver" 2>/dev/null || true
    sleep 2
}

# Function to restart the iOS simulator
#
# The shutdown is verified rather than discarded with `|| true`, which left the shard
# reinstalling the app on top of the same wedged runtime.
restart_simulator() {
    echo "🔄 Restarting iOS Simulator..."
    # Kill the XCTest runner FIRST: while it holds the device, shutdown can fail.
    cleanup_xctest_processes

    # `all` on a shard's first call, where SIMULATOR_DEVICE_ID isn't exported into this shell yet.
    local target="${SIMULATOR_DEVICE_ID:-all}"
    echo "Shutting down simulator ($target)..."
    if ! xcrun simctl shutdown "$target" 2>&1; then
        echo "shutdown reported an error; verifying device state anyway"
    fi

    local deadline=$((SECONDS + 30))
    while [ "$SECONDS" -lt "$deadline" ]; do
        if [ -n "${SIMULATOR_DEVICE_ID:-}" ]; then
            xcrun simctl list devices | grep -q "$SIMULATOR_DEVICE_ID.*Shutdown" && break
        else
            xcrun simctl list devices | grep -q "(Booted)" || break
        fi
        sleep 1
    done
    if [ "$SECONDS" -ge "$deadline" ]; then
        echo "::warning::Simulator did not reach Shutdown within 30s; the driver may still be wedged after this restart"
    fi

    bash ./maestro/helpers/prepare_ios.sh
}

# Function to set the status bar on the Android emulator
set_status_bar() {
    echo "Setting status bar on Android Emulator..."
    adb root
    adb shell "date -u 11010000" # Set time to 11:01 - due to some bug it always sets to 12:00
    adb shell svc wifi enable # Enable Wi-Fi
    adb shell svc data enable # Enable mobile data
    adb shell dumpsys battery set level 100 # Set battery level to 100%
    adb shell dumpsys battery set status 2 # Set battery status to charging
    adb reverse tcp:8080 tcp:8080 # Reverse port 8080

    # Verify the status bar settings
    retries=0
    max_retries=5
    while [ $retries -lt $max_retries ]; do
        current_time=$(adb shell "date +%H:%M")
        if [ "$current_time" == "00:00" ]; then
            echo "Status bar set successfully."
            break
        else
            echo "Retrying status bar settings..."
            adb shell "date -u 11010000"
            sleep 2
            retries=$((retries + 1))
        fi
    done

    if [ $retries -eq $max_retries ]; then
        echo "Failed to set status bar after $max_retries attempts."
    fi
}

# Function to ensure the emulator is ready
ensure_emulator_ready() {
    boot_completed=false
    while [ "$boot_completed" == "false" ]; do
        boot_completed=$(adb -s emulator-5554 shell getprop sys.boot_completed 2>/dev/null)
        if [ "$boot_completed" == "1" ]; then
            echo "Emulator is ready."
            break
        else
            echo "Waiting for emulator to be ready..."
            sleep 5
        fi
    done
}

# Maestro reinstalls the driver per invocation, and that window is what throws
# IOSDriverTimeoutException; the smoke check installs it fresh so the flows can reuse it.
MAESTRO_REUSE_DRIVER="${MAESTRO_REUSE_DRIVER:-true}"
flow_driver_args() {
  if [ "$PLATFORM" == "ios" ] && [ "$MAESTRO_REUSE_DRIVER" = "true" ]; then
    echo "--no-reinstall-driver"
  fi
}

# Function to run tests
run_tests() {
  local test_files=("$@")
  for yaml_test_file in "${test_files[@]}"; do
    echo "🧪 Testing: $yaml_test_file"
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
      set_status_bar
    fi
    start_recording "$(basename "${yaml_test_file%.yaml}")"
    run_maestro "$yaml_test_file" $(flow_driver_args)
    local status=$?
    if [ "$status" -eq 0 ]; then
      echo "✅ Test passed: $yaml_test_file"
      stop_recording discard
      discard_debug_output
      passed_tests+=("$yaml_test_file")
    elif [ "$status" -eq "$MAESTRO_INFRA_EXIT" ]; then
      echo "::warning::Driver/device fault on $(basename "$yaml_test_file") (not a test failure) — resetting device and retrying once"
      # Capture the path before stop_recording clears REC_FILE.
      local fault_video="$REC_FILE"
      stop_recording keep
      preserve_fault_artifacts "$fault_video"
      reset_device
      start_recording "$(basename "${yaml_test_file%.yaml}")"
      if run_maestro "$yaml_test_file"; then
        echo "✅ Test passed after device reset: $yaml_test_file"
        stop_recording discard
        discard_debug_output
        passed_tests+=("$yaml_test_file")
      else
        echo "❌ Test failed: $yaml_test_file"
        stop_recording keep
        failed_tests+=("$yaml_test_file")
      fi
    else
      echo "❌ Test failed: $yaml_test_file"
      # Capture the path before stop_recording clears REC_FILE.
      local failed_video="$REC_FILE"
      stop_recording keep
      # The retry reuses both paths, so a flake that passes on retry would erase the only
      # evidence of the failure. Keep this attempt's video and hierarchy under -attempt1.
      preserve_fault_artifacts "$failed_video" "attempt1"
      failed_tests+=("$yaml_test_file")
    fi
    completed_tests=$((completed_tests + 1))
    remaining_tests=$((total_tests - completed_tests))
    echo "📊 Progress: $completed_tests/$total_tests tests completed, $remaining_tests tests remaining. ✅ ${#passed_tests[@]} passed, ❌ ${#failed_tests[@]} failed."
  done
}

# Fast-fail smoke check (S6): verify the app launches and the Widgets menu renders ONCE,
# before running any widget flows. If it fails the build is fundamentally broken, so abort
# the shard immediately rather than burning every flow × retries up to the job timeout.
smoke_check() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  # 2 attempts. The first failure is usually a transient Maestro driver/simulator attach
  # flake (e.g. iOS "Unable to set permissions … Failed to connect to 127.0.0.1:<port>")
  # that kills an otherwise-healthy shard. We restart the driver/sim and retry ONCE — a
  # genuinely broken build still fails fast (~2 short attempts), so the fast-fail intent holds.
  local max_attempts=2
  local attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    echo "🔎 Smoke check (attempt $attempt/$max_attempts): app launches and 'Widgets menu' renders?"
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
      set_status_bar
    fi
    start_recording "smoke-attempt-$attempt"
    if run_maestro "$script_dir/Smoke.yaml"; then
      echo "✅ Smoke check passed — running widget flows."
      stop_recording discard
      discard_debug_output
      return 0
    fi
    # Keep this attempt's clip — a launch crash / blank screen here is exactly what we want to see.
    stop_recording keep
    if [ "$attempt" -lt "$max_attempts" ]; then
      echo "⚠️  Smoke check attempt $attempt failed — resetting driver/simulator and retrying once."
      reset_device
    fi
    attempt=$((attempt + 1))
  done
  echo "❌ Smoke check FAILED after $max_attempts attempts — app did not launch / 'Widgets menu' never rendered."
  echo "   Build/bundle is likely broken; aborting shard fast instead of retrying every flow."
  return 1
}

# Function to rerun failed tests
rerun_failed_tests() {
  local retry_failed_tests=("$@")
  local total_retries=${#retry_failed_tests[@]}
  local retry_count=0
  for yaml_test_file in "${retry_failed_tests[@]}"; do
    retry_count=$((retry_count + 1))
    echo "🧪 Retrying test $retry_count/$total_retries: $(basename "$yaml_test_file")"
    reset_device
    local attempt=0
    while [ $attempt -lt $MAX_RETRIES ]; do
      start_recording "$(basename "${yaml_test_file%.yaml}")"
      if run_maestro "$yaml_test_file"; then
        echo "✅ Test passed: $yaml_test_file"
        stop_recording discard
        discard_debug_output
        passed_tests+=("$yaml_test_file")
        break
      else
        echo "❌ Test failed: $yaml_test_file (Attempt $((attempt + 1))/$MAX_RETRIES)"
        stop_recording keep
        attempt=$((attempt + 1))
        if [ $attempt -lt $MAX_RETRIES ]; then
          echo "Retrying in $RETRY_DELAY seconds..."
          sleep $RETRY_DELAY
        else
          final_failed_tests+=("$yaml_test_file")
        fi
      fi
    done
    echo "📊 Retry Progress: $retry_count/$total_retries tests completed, ${#passed_tests[@]} passed, ${#final_failed_tests[@]} failed."
  done
}