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

# Function to restart the emulator
restart_emulator() {
    echo "🔄 Restarting emulator..."
    adb -s emulator-5554 emu kill
    sleep 10
    ./maestro/prepare_android.sh
}

# Function to restart the iOS simulator
restart_simulator() {
    echo "🔄 Restarting iOS Simulator..."
    xcrun simctl shutdown "$IOS_DEVICE"
    sleep 10
    ./maestro/prepare_ios.sh
}

# Function to run tests
run_tests() {
  local test_files=("$@")
  for yaml_test_file in "${test_files[@]}"; do
    echo "🧪 Testing: $yaml_test_file"
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

# Retry failed tests
if [ ${#failed_tests[@]} -gt 0 ]; then
  echo "🔄 Retrying failed tests..."
  for yaml_test_file in "${failed_tests[@]}"; do
    if [ "$PLATFORM" == "android" ]; then
      restart_emulator
    else
      restart_simulator
    fi
    run_tests "$yaml_test_file"
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

if [ ${#failed_tests[@]} -gt 0 ]; then
  echo "❌ Failed Tests:"
  for test in "${failed_tests[@]}"; do
    echo "  - $(basename "$test")"
  done
  exit 1  # Mark the workflow stage as failed if any tests fail
else
  echo "All tests passed!"
  exit 0  # Mark the workflow stage as successful only if all tests pass
fi