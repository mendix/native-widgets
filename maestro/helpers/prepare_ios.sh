#!/bin/bash

start_simulator() {
    echo "Starting iOS Simulator..."
    xcrun simctl boot "iPhone 16" || echo "Simulator already booted"
    sleep 30
    xcrun simctl bootstatus || echo "Simulator booted successfully"
}

set_status_bar() {
    echo "Setting status bar on iOS Simulator..."
    xcrun simctl status_bar "iPhone 16" override --time "11:01" --wifiBars 3 --cellularBars 4 --batteryState charged --batteryLevel 100
}

install_ios_app() {
    echo "Installing iOS app on simulator..."
    xcrun simctl install booted ios-app/Debug-iphonesimulator/NativeTemplate.app
}

verify_installed_app() {
    echo "Verifying installed app..."
    xcrun simctl get_app_container booted com.mendix.native.template
}

start_simulator
set_status_bar
install_ios_app
verify_installed_app