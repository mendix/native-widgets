#!/bin/bash

# Configuration - modify these values as needed
DEVICE_TYPE="iPhone 16"
IOS_VERSION="18.5"

start_simulator() {
    echo "Starting iOS Simulator..."
    echo "Looking for: $DEVICE_TYPE with iOS $IOS_VERSION"
    
    # List available simulators to debug
    # echo "Available simulators:"
    # xcrun simctl list devices available
    
    # Try to find the specified device with the specified iOS version
    DEVICE_ID=$(xcrun simctl list devices available | grep -A1 "iOS $IOS_VERSION" | grep "$DEVICE_TYPE " | head -1 | grep -o "[A-F0-9-]{36}")
    
    if [ -z "$DEVICE_ID" ]; then
        echo "No $DEVICE_TYPE with iOS $IOS_VERSION found. Trying to create one..."
        # Try to create the device with the specified iOS version
        IOS_RUNTIME="com.apple.CoreSimulator.SimRuntime.iOS-${IOS_VERSION//./-}"
        DEVICE_TYPE_ID="com.apple.CoreSimulator.SimDeviceType.${DEVICE_TYPE// /-}"
        DEVICE_ID=$(xcrun simctl create "${DEVICE_TYPE} Test" "$DEVICE_TYPE_ID" "$IOS_RUNTIME" 2>/dev/null)
        
        if [ -z "$DEVICE_ID" ]; then
            echo "Failed to create $DEVICE_TYPE with iOS $IOS_VERSION. Using any available $DEVICE_TYPE."
            DEVICE_ID=$(xcrun simctl list devices available | grep "$DEVICE_TYPE " | head -1 | grep -o "[A-F0-9-]{36}")
        fi
    fi
    
    if [ -z "$DEVICE_ID" ]; then
        echo "Error: Could not find or create any $DEVICE_TYPE device"
        exit 1
    fi
    
    echo "Using device ID: $DEVICE_ID"
    export SIMULATOR_DEVICE_ID="$DEVICE_ID"
    
    # Boot the device
    xcrun simctl boot "$DEVICE_ID" || echo "Simulator already booted"
    sleep 30
    xcrun simctl bootstatus "$DEVICE_ID" || echo "Simulator booted successfully"
}

set_status_bar() {
    echo "Setting status bar on iOS Simulator..."
    if [ -z "$SIMULATOR_DEVICE_ID" ]; then
        echo "Error: SIMULATOR_DEVICE_ID not set"
        return 1
    fi
    xcrun simctl status_bar "$SIMULATOR_DEVICE_ID" override --time "11:01" --wifiBars 3 --cellularBars 4 --batteryState charged --batteryLevel 100
}

install_ios_app() {
    echo "Installing iOS app on simulator..."
    if [ -z "$SIMULATOR_DEVICE_ID" ]; then
        echo "Error: SIMULATOR_DEVICE_ID not set"
        return 1
    fi
    xcrun simctl install "$SIMULATOR_DEVICE_ID" ios-app/Debug-iphonesimulator/NativeTemplate.app
}

verify_installed_app() {
    echo "Verifying installed app..."
    if [ -z "$SIMULATOR_DEVICE_ID" ]; then
        echo "Error: SIMULATOR_DEVICE_ID not set"
        return 1
    fi
    xcrun simctl get_app_container "$SIMULATOR_DEVICE_ID" com.mendix.native.template
}

start_simulator
set_status_bar
install_ios_app
verify_installed_app