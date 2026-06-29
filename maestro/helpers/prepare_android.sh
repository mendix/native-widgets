#!/bin/bash

MAX_RETRIES=5
RETRY_DELAY=10
RETRIES=0
BOOT_TIMEOUT=300

# Wait until the emulator is actually ready instead of guessing with a fixed sleep:
# device attached -> sys.boot_completed=1 -> package manager responds. Bounded so a
# never-booting emulator fails fast instead of hanging.
wait_for_emulator() {
    echo "Waiting for emulator to be ready..."
    adb wait-for-device
    local deadline=$(( $(date +%s) + BOOT_TIMEOUT ))
    until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] \
       && adb shell pm list packages >/dev/null 2>&1; do
        if [ "$(date +%s)" -ge "$deadline" ]; then
            echo "Emulator not ready after ${BOOT_TIMEOUT}s"
            exit 1
        fi
        sleep 2
    done
    echo "Emulator is ready."
}

wait_for_emulator

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