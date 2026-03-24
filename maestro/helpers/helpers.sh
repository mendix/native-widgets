#!/bin/bash

MAX_RETRIES=3
RETRY_DELAY=10
SESSION_REUSE_DIR=""

resolve_maestro_bin() {
  if [ -n "${MAESTRO_BIN:-}" ]; then
    echo "$MAESTRO_BIN"
  elif [ -x "$HOME/.local/bin/maestro/bin/maestro" ]; then
    echo "$HOME/.local/bin/maestro/bin/maestro"
  elif command -v maestro >/dev/null 2>&1; then
    command -v maestro
  else
    echo "maestro"
  fi
}

maestro_precondition_path() {
  echo "$SCRIPT_DIR/Precondition.yaml"
}

prepare_suite_session_reuse() {
  local precondition_src precondition_dst
  precondition_src=$(maestro_precondition_path)
  [ -f "$precondition_src" ] || { echo "Missing Maestro precondition: $precondition_src"; return 1; }

  if [ -z "$SESSION_REUSE_DIR" ]; then
    SESSION_REUSE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/native-widgets-maestro-session-reuse.XXXXXX")
  fi
  precondition_dst="$SESSION_REUSE_DIR/Precondition.yaml"

  python3 - "$precondition_src" "$precondition_dst" <<'PY'
import pathlib
import sys

source_path = pathlib.Path(sys.argv[1])
dest_path = pathlib.Path(sys.argv[2])
content = source_path.read_text(encoding="utf-8")
updated = content.replace("clearState: true", "clearState: false", 1)
if updated == content:
  raise SystemExit("Precondition.yaml does not contain 'clearState: true'")
dest_path.write_text(updated, encoding="utf-8")
PY
}

rewrite_test_for_session_reuse() {
  local source_file="$1"
  local file_hash output_file
  file_hash=$(python3 - "$source_file" <<'PY'
import hashlib
import sys

print(hashlib.sha256(sys.argv[1].encode("utf-8")).hexdigest())
PY
)
  output_file="$SESSION_REUSE_DIR/${file_hash}.yaml"

  python3 - "$source_file" "$output_file" <<'PY'
import pathlib
import re
import sys

source_path = pathlib.Path(sys.argv[1])
dest_path = pathlib.Path(sys.argv[2])
content = source_path.read_text(encoding="utf-8")
updated, replacements = re.subn(
  r'(^\s*file:\s*["\']).*Precondition\.yaml(["\']\s*$)',
  r'\1Precondition.yaml\2',
  content,
  count=1,
  flags=re.MULTILINE,
)
if replacements == 0:
  raise SystemExit(f"No Precondition.yaml reference found in {source_path}")
dest_path.write_text(updated, encoding="utf-8")
PY

  echo "$output_file"
}

stop_test_session() {
  if [ "$PLATFORM" == "ios" ]; then
    xcrun simctl terminate "${DEVICE_ID:-booted}" "$APP_ID" >/dev/null 2>&1 || true
  else
    if [ -n "${DEVICE_ID:-}" ]; then
      adb -s "$DEVICE_ID" shell am force-stop "$APP_ID" >/dev/null 2>&1 || true
    else
      adb shell am force-stop "$APP_ID" >/dev/null 2>&1 || true
    fi
  fi
}

run_maestro_test() {
  local yaml_test_file="$1"
  local maestro_bin
  maestro_bin=$(resolve_maestro_bin)
  "$maestro_bin" test --env APP_ID="$APP_ID" --env PLATFORM="$PLATFORM" --env MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 "$yaml_test_file"
}

# Function to restart the iOS simulator
restart_simulator() {
    echo "🔄 Restarting iOS Simulator..."
    xcrun simctl shutdown "$IOS_DEVICE"
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
  local test_index=0

  prepare_suite_session_reuse || return 1

  for yaml_test_file in "${test_files[@]}"; do
    test_index=$((test_index + 1))
    local effective_test_file="$yaml_test_file"
    if [ "$test_index" -eq 1 ]; then
      echo "🧪 Testing: $yaml_test_file (clean app state)"
    else
      effective_test_file=$(rewrite_test_for_session_reuse "$yaml_test_file") || return 1
      echo "🧪 Testing: $yaml_test_file (reused session)"
    fi
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
      set_status_bar
    fi
    if run_maestro_test "$effective_test_file"; then
      echo "✅ Test passed: $yaml_test_file"
      passed_tests+=("$yaml_test_file")
    else
      echo "❌ Test failed: $yaml_test_file"
      failed_tests+=("$yaml_test_file")
    fi
    stop_test_session
    completed_tests=$((completed_tests + 1))
    remaining_tests=$((total_tests - completed_tests))
    echo "📊 Progress: $completed_tests/$total_tests tests completed, $remaining_tests tests remaining. ✅ ${#passed_tests[@]} passed, ❌ ${#failed_tests[@]} failed."
  done
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
      if run_maestro_test "$yaml_test_file"; then
        echo "✅ Test passed: $yaml_test_file"
        passed_tests+=("$yaml_test_file")
        break
      else
        echo "❌ Test failed: $yaml_test_file (Attempt $((attempt + 1))/$MAX_RETRIES)"
        attempt=$((attempt + 1))
        if [ $attempt -lt $MAX_RETRIES ]; then
          echo "Retrying in $RETRY_DELAY seconds..."
          sleep $RETRY_DELAY
        else
          final_failed_tests+=("$yaml_test_file")
        fi
      fi
    done
    stop_test_session
    echo "📊 Retry Progress: $retry_count/$total_retries tests completed, ${#passed_tests[@]} passed, ${#final_failed_tests[@]} failed."
  done
}