#!/bin/bash

if [ "$1" == "android" ]; then
  APP_ID="com.mendix.nativetemplate"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.nativetemplate"
else
  echo "Usage: $0 [android|ios]"
  exit 1
fi

$HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID packages/pluggableWidgets/app-events-native/e2e/specs/maestro/AppEvents.yaml
