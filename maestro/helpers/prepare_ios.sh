#!/bin/bash

# Auto-select the newest available iPhone simulator (highest iOS runtime + highest iPhone
# model) instead of hardcoding a device/iOS version that breaks on every runner-image bump.
start_simulator() {
    echo "Selecting the newest available iPhone simulator..."

    # Parse `simctl list` JSON: pick the available iPhone with the highest (iOS version, model).
    read -r DEVICE_ID DEVICE_NAME RUNTIME_VER < <(
        xcrun simctl list -j devices available | python3 -c '
import json, sys, re
data = json.load(sys.stdin).get("devices", {})
best = None
for runtime, devices in data.items():
    m = re.search(r"iOS-(\d+)-(\d+)", runtime)
    if not m:
        continue
    ios_ver = (int(m.group(1)), int(m.group(2)))
    for d in devices:
        if not d.get("isAvailable", False):
            continue
        name = d.get("name", "")
        if not name.startswith("iPhone"):
            continue
        mm = re.search(r"iPhone (\d+)", name)
        model = int(mm.group(1)) if mm else 0
        key = (ios_ver, model)
        if best is None or key > best[0]:
            best = (key, d["udid"], name, ios_ver)
if best:
    print(best[1], best[2], f"{best[3][0]}.{best[3][1]}")
'
    )

    if [ -z "$DEVICE_ID" ]; then
        echo "Error: no available iPhone simulator found"
        xcrun simctl list devices available || true
        exit 1
    fi

    echo "Using $DEVICE_NAME (iOS $RUNTIME_VER), UDID: $DEVICE_ID"
    export SIMULATOR_DEVICE_ID="$DEVICE_ID"

    xcrun simctl boot "$DEVICE_ID" || echo "Simulator already booted"
    xcrun simctl bootstatus "$DEVICE_ID" -b || echo "Simulator booted"
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