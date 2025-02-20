#!/bin/bash

# Function to start the iOS simulator
start_simulator() {
    echo "Starting iOS Simulator..."
    xcrun simctl boot "iPhone 16" || echo "Simulator already booted"
    sleep 30
    xcrun simctl bootstatus || echo "Simulator booted successfully"
}

# Function to install the iOS app on the simulator
install_ios_app() {
    echo "Installing iOS app on simulator..."
    xcrun simctl install booted ios-app/Debug-iphonesimulator/NativeTemplate.app
}

# Function to verify the installed app
verify_installed_app() {
    echo "Verifying installed app..."
    xcrun simctl get_app_container booted com.mendix.native.template
}

# Function to launch the iOS app
launch_ios_app() {
    echo "Launching iOS app..."
    xcrun simctl launch booted com.mendix.native.template
}

# Prepare the iOS simulator and install the app
start_simulator
install_ios_app
verify_installed_app
launch_ios_app