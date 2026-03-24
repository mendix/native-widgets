#!/bin/bash

# Update DEVICE_ID according to needs
# Use command like: ./run_maestro_jsactions_tests_local.sh android/ios mobile-resources-native

SCRIPT_DIR=$(dirname "$0")

source "$SCRIPT_DIR/helpers/helpers.sh" || { echo "Failed to source helpers.sh"; exit 1; }

command -v run_tests >/dev/null 2>&1 || { echo "run_tests function not found"; exit 1; }

if [ "$1" == "android" ]; then
  APP_ID="com.mendix.nativetemplate"
  DEVICE_ID="emulator-5554"
  PLATFORM="android"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.native.template"
  DEVICE_ID="731B4851-2AB4-40D7-A586-6BAC6381674D"
  PLATFORM="ios"
else
  echo "Usage: $0 [android|ios] [action]"
  exit 1
fi

ACTION=${2:-*-native}
passed_tests=()
failed_tests=()
final_failed_tests=()
completed_tests=0

# Determine the search path based on the widget selection
if [ "$ACTION" == "*-native" ]; then
  search_path="../packages/jsActions"
else
  search_path="../packages/jsActions/$ACTION"
fi

yaml_test_files=()
while IFS= read -r yaml_test_file; do
  yaml_test_files+=("$yaml_test_file")
done < <(find "$search_path" -type f -path "*/maestro/*.yaml" ! -name "*_ios.yaml" ! -name "*_android.yaml" | sort)
total_tests=${#yaml_test_files[@]}

[ "$total_tests" -gt 0 ] || { echo "No Maestro YAML tests found in $search_path"; exit 0; }

run_tests "${yaml_test_files[@]}"

[ ${#failed_tests[@]} -eq 0 ] || exit 1