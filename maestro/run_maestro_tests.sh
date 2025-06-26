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

# Read the widget names from the second argument, defaulting to all widgets
IFS=',' read -r -a widgets <<< "${2:-*}"

passed_tests=()
failed_tests=()
final_failed_tests=()

# Function to run jsActions tests (mobile-resources-native and nanoflow-actions-native)
run_jsactions_tests() {
  local jsactions_paths=(
    "packages/jsActions/mobile-resources-native/e2e/specs/maestro"
    "packages/jsActions/nanoflow-actions-native/e2e/specs/maestro"
  )
  local all_yaml_files=()
  for path in "${jsactions_paths[@]}"; do
    if [ -d "$path" ]; then
      local yaml_files=( $(find "$path" -type f -name "*.yaml" ! -name "*_ios.yaml" ! -name "*_android.yaml") )
      all_yaml_files+=("${yaml_files[@]}")
    fi
  done
  if [ ${#all_yaml_files[@]} -eq 0 ]; then
    echo "No jsActions Maestro YAML tests found."
    return 0
  fi

  passed_tests=()
  failed_tests=()
  final_failed_tests=()

  run_tests "${all_yaml_files[@]}"

  echo
  echo "📊 Initial Test Execution Summary for jsActions:"
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

  if [ ${#failed_tests[@]} -gt 0 ]; then
    rerun_failed_tests "${failed_tests[@]}"
  fi

  echo
  echo "📊 Final Test Execution Summary for jsActions:"
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
    return 1
  else
    echo "All jsActions tests passed!"
    return 0
  fi
}

# Function to run tests for a specific widget
run_widget_tests() {
  local widget=$1
  local search_path="packages/pluggableWidgets/$widget"
  local yaml_test_files=($(find $search_path -type f -path "*/maestro/*.yaml" ! -name "*_ios.yaml" ! -name "*_android.yaml"))
  total_tests=${#yaml_test_files[@]}  # Set total_tests here
  local completed_tests=0

  # Run all tests once
  run_tests "${yaml_test_files[@]}"

  # Display initial summary after first run of all tests
  echo
  echo "📊 Initial Test Execution Summary for $widget:"
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
  echo "📊 Final Test Execution Summary for $widget:"
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
    return 1
  else
    echo "All tests passed for $widget!"
    return 0
  fi
}

# Run jsActions tests first
run_jsactions_tests
  if [ $? -ne 0 ]; then
    exit 1
  fi

# # Only run jsActions tests if all widgets are being tested (i.e., argument is '*-native')
# if [ "${2:-*-native}" = "*-native" ]; then
#   run_jsactions_tests
# fi

# Run tests for each widget
for widget in "${widgets[@]}"; do
  run_widget_tests "$widget"
  if [ $? -ne 0 ]; then
    exit 1
  fi
done

echo "All tests passed for all widgets!"
exit 0