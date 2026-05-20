#!/bin/bash

MAX_RETRIES=5
RETRY_DELAY=10
RETRIES=0

# Add a delay to ensure the emulator is fully booted
echo "Waiting for emulator to be ready..."
sleep 30

# Function to install the Android app on the emulator
install_android_app() {
    while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
        echo "Attempt $(($RETRIES + 1)) of $MAX_RETRIES: Installing APK..."

        adb install /home/runner/work/native-widgets/native-widgets/android-app/appstore/debug/app-appstore-debug.apk

        if adb shell pm list packages | grep -q "com.mendix.nativetemplate"; then
            echo "App installed successfully!"
            return 0
        fi

        echo "Installation failed. Retrying in $RETRY_DELAY seconds..."
        RETRIES=$((RETRIES + 1))
        sleep "$RETRY_DELAY"
    done

    echo "Failed to install APK after $MAX_RETRIES attempts."
    return 1
}

# Prepare the Android emulator and install the app
install_android_app