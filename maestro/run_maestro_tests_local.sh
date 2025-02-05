#!/bin/bash

# Update DEVICE_ID and path to the yaml file according to needs

if [ "$1" == "android" ]; then
  APP_ID="myapp.nativecomponentstestproject"
  DEVICE_ID="emulator-5554"
elif [ "$1" == "ios" ]; then
  APP_ID="myapp.nativecomponentstestproject"
  DEVICE_ID="8006E26A-352B-4553-BA00-D8AE2DE23313"
else
  echo "Usage: $0 [android|ios]"
  exit 1
fi

maestro --device $DEVICE_ID test --env APP_ID=$APP_ID ../packages/pluggableWidgets/bar-chart-native/e2e/specs/maestro/Bar_Chart.yaml