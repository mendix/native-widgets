#!/bin/bash

if [ "$1" == "android" ]; then
  APP_ID="com.mendix.nativetemplate"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.native.template"
else
  echo "Usage: $0 [android|ios]"
  exit 1
fi

# Find all .yaml files under maestro/ folders within packages/ and execute
find packages/ -type f -path "*/maestro/*.yaml" | while read -r yaml_file; do
  $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID "$yaml_file"
done