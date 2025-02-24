#!/bin/bash

if [ "$1" == "android" ]; then
  APP_ID="com.mendix.nativetemplate"
  PLATFORM="android"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.native.template"
  PLATFORM="ios"
  IOS_DEVICE="iPhone 16"
else
  echo "Usage: $0 [android|ios] [widget]"
  exit 1
fi

WIDGET=${2:-*}

passed_tests=()
failed_tests=()

# Determine the search path based on the widget selection
if [ "$WIDGET" == "*-native" ]; then
  search_path="packages/pluggableWidgets"
else
  search_path="packages/pluggableWidgets/$WIDGET"
fi

# Find all .yaml files under the determined search path, excluding platform-specific files
yaml_test_files=($(find $search_path -type f -path "*/maestro/*.yaml" ! -name "*_ios.yaml" ! -name "*_android.yaml"))
total_tests=${#yaml_test_files[@]}
completed_tests=0

MAX_RETRIES=2
RETRY_DELAY=10

# Function to restart the iOS simulator
restart_simulator() {
    echo "🔄 Restarting iOS Simulator..."
    xcrun simctl shutdown "$IOS_DEVICE"
    sleep 10
    ./maestro/prepare_ios.sh
}

# Function to set the status bar on the Android emulator
set_status_bar() {
    echo "Setting status bar on Android Emulator..."
    adb root
    adb shell "date -u 11010000" # Set time to 11:01
    adb shell svc wifi enable # Enable Wi-Fi
    adb shell svc data enable # Enable mobile data
    adb shell dumpsys battery set level 100 # Set battery level to 100%
    adb shell dumpsys battery set status 2 # Set battery status to charging
    adb reverse tcp:8080 tcp:8080 # Reverse port 8080
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
    if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 "$yaml_test_file"; then
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

# Run all tests once
run_tests "${yaml_test_files[@]}"

final_failed_tests=()

# Retry failed tests
if [ ${#failed_tests[@]} -gt 0 ]; then
  echo "🔄 Retrying failed tests..."
  for yaml_test_file in "${failed_tests[@]}"; do
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
    else
      restart_simulator
    fi
    if run_tests "$yaml_test_file"; then
      # Remove the test from failed_tests if it passes on retry
      failed_tests=("${failed_tests[@]/$yaml_test_file}")
    else
      # Add to final_failed_tests if it still fails
      final_failed_tests+=("$yaml_test_file")
    fi
  done
fi

echo
echo "📊 Test Execution Summary:"
echo "-----------------------"
if [ ${#passed_tests[@]} -gt 0 ]; then
  echo "✅ Passed Tests:"
  for test in "${passed_tests[@]}"; do
    echo "  - $(basename "$test")"
  done
else
  echo "No tests passed."
fi

if [ ${#final_failed_tests[@]} -gt 0 ]; then
  echo "❌ Failed Tests:"
  for test in "${final_failed_tests[@]}"; do
    echo "  - $(basename "$test")"
  done
  exit 1  # Mark the workflow stage as failed if any tests fail
else
  echo "All tests passed!"
  exit 0  # Mark the workflow stage as successful only if all tests pass
fi