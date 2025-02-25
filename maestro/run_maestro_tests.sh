#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR=$(dirname "$0")

# Source the helpers.sh script from the script's directory
source "$SCRIPT_DIR/helpers/helpers.sh" || { echo "Failed to source helpers.sh"; exit 1; }

# Check if run_tests function is available
command -v run_tests >/dev/null 2>&1 || { echo "run_tests function not found"; exit 1; }

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
final_failed_tests=()

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

# Display initial summary after first run of all tests
echo
echo "📊 Initial Test Execution Summary:"
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
else
  echo "No tests failed."
fi

# Retry only failed tests
if [ ${#failed_tests[@]} -gt 0 ]; then
  rerun_failed_tests "${failed_tests[@]}"
fi

# Display final summary
echo
echo "📊 Final Test Execution Summary:"
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
  exit 1
else
  echo "All tests passed!"
  exit 0
fi