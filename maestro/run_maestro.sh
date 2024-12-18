#!/bin/bash

if [ "$1" == "android" ]; then
  APP_ID="myapp.nativecomponentstestproject"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.native.template"
else
  echo "Usage: $0 [android|ios]"
  exit 1
fi
maestro test --env APP_ID=$APP_ID ../packages/pluggableWidgets/app-events-native/e2e/specs/maestro/AppEvents.yaml