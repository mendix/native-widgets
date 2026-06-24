#!/bin/bash

# Screenshot baselines are device/resolution-specific, so prefer a PINNED device for
# reproducible visual regression. If that exact device isn't on the runner image (e.g. a
# future macos-NN bump drops/renames it), fall back to the newest available iPhone and warn
# loudly that baselines likely need regenerating — degrade gracefully instead of hard-failing
# like the old hardcoded device did. Override the pin via PREFERRED_IOS_DEVICE.
# Exported (not just assigned) so the python3 process in the pipeline below inherits it.
# A `VAR=x cmd | python3` prefix only applies to `cmd`, NOT to python3 (separate pipeline
# process), so without `export` python sees an empty preferred name and always falls back.
export PREFERRED_IOS_DEVICE="${PREFERRED_IOS_DEVICE:-iPhone 17 Pro}"

start_simulator() {
    echo "Selecting iOS simulator (preferred: '$PREFERRED_IOS_DEVICE')..."

    # Parse `simctl list` JSON. Output is TAB-delimited (device names contain spaces) as:
    #   <udid>\t<name>\t<ios_ver>\t<status>   where status is "pinned" or "fallback".
    IFS=$'\t' read -r DEVICE_ID DEVICE_NAME RUNTIME_VER SELECT_STATUS < <(
        xcrun simctl list -j devices available | python3 -c '
import json, os, sys, re
preferred = os.environ.get("PREFERRED_IOS_DEVICE", "")
data = json.load(sys.stdin).get("devices", {})
best = None      # newest available iPhone overall (fallback)
pinned = None    # highest iOS runtime for the preferred device name
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
        if name == preferred and (pinned is None or ios_ver > pinned[0]):
            pinned = (ios_ver, d["udid"], name)
        mm = re.search(r"iPhone (\d+)", name)
        model = int(mm.group(1)) if mm else 0
        key = (ios_ver, model)
        if best is None or key > best[0]:
            best = (key, d["udid"], name, ios_ver)
if pinned:
    print("\t".join([pinned[1], pinned[2], f"{pinned[0][0]}.{pinned[0][1]}", "pinned"]))
elif best:
    print("\t".join([best[1], best[2], f"{best[3][0]}.{best[3][1]}", "fallback"]))
'
    )

    if [ -z "$DEVICE_ID" ]; then
        echo "Error: no available iPhone simulator found"
        xcrun simctl list devices available || true
        exit 1
    fi

    if [ "$SELECT_STATUS" = "fallback" ]; then
        echo "::warning::Pinned iOS device '$PREFERRED_IOS_DEVICE' not available; using newest '$DEVICE_NAME' (iOS $RUNTIME_VER). Screenshot baselines may differ — regenerate with update_baselines=true if visual asserts fail."
    fi

    echo "Using $DEVICE_NAME (iOS $RUNTIME_VER) [$SELECT_STATUS], UDID: $DEVICE_ID"
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