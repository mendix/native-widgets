#!/bin/bash

# Update DEVICE_ID according to needs
# Use command like: ./run_maestro_widget_tests_local.sh android/ios progress-circle-native

SCRIPT_DIR=$(dirname "$0")

source "$SCRIPT_DIR/helpers/helpers.sh" || { echo "Failed to source helpers.sh"; exit 1; }

command -v run_tests >/dev/null 2>&1 || { echo "run_tests function not found"; exit 1; }

if [ "$1" == "android" ]; then
  APP_ID="com.mendix.nativetemplate"
  DEVICE_ID="emulator-5554"
  PLATFORM="android"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.native.template"
  DEVICE_ID="8CDB91BF-9D4A-4F1D-8952-A7ABBED10078"
  PLATFORM="ios"
else
  echo "Usage: $0 [android|ios] [widget]"
  exit 1
fi

WIDGET=${2:-*-native}
passed_tests=()
failed_tests=()
final_failed_tests=()
completed_tests=0

# Determine the search path based on the widget selection
if [ "$WIDGET" == "*-native" ]; then
  search_path="../packages/pluggableWidgets"
else
  search_path="../packages/pluggableWidgets/$WIDGET"
fi

yaml_test_files=()
while IFS= read -r yaml_test_file; do
  yaml_test_files+=("$yaml_test_file")
done < <(find "$search_path" -type f -path "*/maestro/*.yaml" ! -name "*_ios.yaml" ! -name "*_android.yaml" | sort)
total_tests=${#yaml_test_files[@]}

[ "$total_tests" -gt 0 ] || { echo "No Maestro YAML tests found in $search_path"; exit 0; }

run_tests "${yaml_test_files[@]}"

[ ${#failed_tests[@]} -eq 0 ] || exit 1