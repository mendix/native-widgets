#!/bin/bash

MAX_RETRIES=5
RETRY_DELAY=10
RETRIES=0

while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
    echo "Attempt $(($RETRIES + 1)) of $MAX_RETRIES: Installing APK..."

    adb install /home/runner/work/native-widgets/native-widgets/android-app/appstore/debug/app-appstore-debug.apk
    if adb shell pm list packages | grep -q "com.mendix.native.template"; then
        echo "App installed successfully!"
        exit 0
    fi

    echo "Installation failed. Retrying in $RETRY_DELAY seconds..."
    RETRIES=$((RETRIES + 1))
    sleep "$RETRY_DELAY"
done

echo "Failed to install APK after $MAX_RETRIES attempts."
exit 1