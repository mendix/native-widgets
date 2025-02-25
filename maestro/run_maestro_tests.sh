#!/bin/bash

source ./helpers/helpers.sh

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
      passed_tests+=("$yaml_test_file")  # Add to passed_tests if it passes on retry
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