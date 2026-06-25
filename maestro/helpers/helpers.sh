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
MAESTRO_DRIVER_STARTUP_TIMEOUT=120000

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
  # SIGINT lets the recorder finalize the file (moov atom / flush); SIGKILL would corrupt it.
  kill -INT "$REC_PID" 2>/dev/null || true
  wait "$REC_PID" 2>/dev/null || true
  if [ "$PLATFORM" == "android" ]; then
    sleep 2  # let screenrecord flush to /sdcard before pulling
    if [ "$keep" == "keep" ]; then
      adb pull "$ANDROID_REC_DEVICE_PATH" "$REC_FILE" >/dev/null 2>&1 || true
    fi
    adb shell rm -f "$ANDROID_REC_DEVICE_PATH" >/dev/null 2>&1 || true
  fi
  REC_PID=""
  if [ "$keep" != "keep" ]; then
    rm -f "$REC_FILE"
  fi
  REC_FILE=""
}

# Function to restart the iOS simulator
restart_simulator() {
    echo "🔄 Restarting iOS Simulator..."
    # Shut down whatever is booted; the device is auto-selected in prepare_ios.sh,
    # so we don't depend on a hardcoded device name here.
    xcrun simctl shutdown all || true
    sleep 10
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
    if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=$MAESTRO_DRIVER_STARTUP_TIMEOUT "$yaml_test_file"; then
      echo "✅ Test passed: $yaml_test_file"
      stop_recording discard
      passed_tests+=("$yaml_test_file")
    else
      echo "❌ Test failed: $yaml_test_file"
      stop_recording keep
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
    if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=$MAESTRO_DRIVER_STARTUP_TIMEOUT "$script_dir/Smoke.yaml"; then
      echo "✅ Smoke check passed — running widget flows."
      stop_recording discard
      return 0
    fi
    # Keep this attempt's clip — a launch crash / blank screen here is exactly what we want to see.
    stop_recording keep
    if [ "$attempt" -lt "$max_attempts" ]; then
      echo "⚠️  Smoke check attempt $attempt failed — resetting driver/simulator and retrying once."
      # Reset the layer that actually flakes: on iOS restart the sim (re-runs prepare_ios.sh,
      # re-establishing the Maestro driver); on Android just re-confirm the emulator is up.
      if [ "$PLATFORM" == "android" ]; then
        ensure_emulator_ready
      else
        restart_simulator
      fi
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
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
    else
      restart_simulator
    fi
    local attempt=0
    while [ $attempt -lt $MAX_RETRIES ]; do
      start_recording "$(basename "${yaml_test_file%.yaml}")"
      if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=$MAESTRO_DRIVER_STARTUP_TIMEOUT "$yaml_test_file"; then
        echo "✅ Test passed: $yaml_test_file"
        stop_recording discard
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