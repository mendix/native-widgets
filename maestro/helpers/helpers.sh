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
    if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=$MAESTRO_DRIVER_STARTUP_TIMEOUT "$yaml_test_file"; then
      echo "✅ Test passed: $yaml_test_file"
      passed_tests+=("$yaml_test_file")
    else
      echo "❌ Test failed: $yaml_test_file"
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
  echo "🔎 Smoke check: app launches and 'Widgets menu' renders?"
  if [ "$PLATFORM" == "android" ]; then
    ensure_emulator_ready
    set_status_bar
  fi
  if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=$MAESTRO_DRIVER_STARTUP_TIMEOUT "$script_dir/Smoke.yaml"; then
    echo "✅ Smoke check passed — running widget flows."
    return 0
  else
    echo "❌ Smoke check FAILED — app did not launch / 'Widgets menu' never rendered."
    echo "   Build/bundle is likely broken; aborting shard fast instead of retrying every flow."
    return 1
  fi
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
      if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=$MAESTRO_DRIVER_STARTUP_TIMEOUT "$yaml_test_file"; then
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
    echo "📊 Retry Progress: $retry_count/$total_retries tests completed, ${#passed_tests[@]} passed, ${#final_failed_tests[@]} failed."
  done
}