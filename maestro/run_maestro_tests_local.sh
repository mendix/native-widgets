#!/bin/bash

# Update DEVICE_ID and path to the yaml file according to needs
# Use command like: ./run_maestro_tests_local.sh android/ios proggress-circle-native

if [ "$1" == "android" ]; then
  #APP_ID="myapp.nativecomponentstestproject"
  APP_ID="com.mendix.nativetemplate"
  DEVICE_ID="emulator-5554"
  PLATFORM="android"
elif [ "$1" == "ios" ]; then
  #APP_ID="myapp.nativecomponentstestproject"
  APP_ID="com.mendix.native.template"
  DEVICE_ID="8CDB91BF-9D4A-4F1D-8952-A7ABBED10078"
  PLATFORM="ios"
else
  echo "Usage: $0 [android|ios] [widget]"
  exit 1
fi

WIDGET=${2:-*-native}

# Determine the search path based on the widget selection
if [ "$WIDGET" == "*-native" ]; then
  search_path="../packages/pluggableWidgets"
else
  search_path="../packages/pluggableWidgets/$WIDGET"
fi

# Find all .yaml files under the determined search path, excluding platform-specific files
for yaml_test_file in $(find $search_path -type f -path "*/maestro/*.yaml" ! -name "*_ios.yaml" ! -name "*_android.yaml"); do
  echo "Running test: $yaml_test_file"
  maestro --device $DEVICE_ID test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM "$yaml_test_file"
done