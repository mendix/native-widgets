#!/bin/bash
set -e

# Arguments
MDA_FILE="$1"
MENDIX_VERSION="$2"
JAVA_PATH="$3"
WORKSPACE="$4"

# Ensure setup script is executable
chmod +x .github/scripts/setup-runtime.sh

# Run setup
.github/scripts/setup-runtime.sh "$MDA_FILE" "$MENDIX_VERSION" "$JAVA_PATH" "$WORKSPACE"

# Stop any running Mendix runtime before starting a new one
if bin/m2ee -c "$WORKSPACE/project/m2ee-native.yml" status | grep -q "running"; then
  echo "Stopping previous Mendix runtime..."
  bin/m2ee -c "$WORKSPACE/project/m2ee-native.yml" stop
  sleep 10
fi

# Start runtime
START_OUTPUT=$(bin/m2ee -c "$WORKSPACE/project/m2ee-native.yml" --verbose --yolo start 2>&1)
echo "Full output from start command:"
echo "$START_OUTPUT"
if [ $? -eq 0 ]; then
  echo "Runtime started successfully (exit code)."
  exit 0
fi

echo "Runtime did not start successfully."
exit 1