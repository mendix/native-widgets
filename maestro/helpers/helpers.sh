#!/bin/bash

# Function to restart the iOS simulator
restart_simulator() {
    echo "🔄 Restarting iOS Simulator..."
    xcrun simctl shutdown "$IOS_DEVICE"
    sleep 10
    bash ./maestro/helpers/prepare_ios.sh
}

# Function to set the status bar on the Android emulator
set_status_bar() {
    echo "Setting status bar on Android Emulator..."
    adb root
    adb shell "date -u 11010000" # Set time to 11:01 - due to some bug it always sets to 12:00
    adb shell svc wifi enable # Enable Wi-Fi
    adb shell svc data enable # Enable mobile data
    adb shell dumpsys battery set level 100 # Set battery level to 100%
    adb shell dumpsys battery set status 2 # Set battery status to charging
    adb reverse tcp:8080 tcp:8080 # Reverse port 8080

    # Verify the status bar settings
    retries=0
    max_retries=5
    while [ $retries -lt $max_retries ]; do
        current_time=$(adb shell "date +%H:%M")
        if [ "$current_time" == "00:00" ]; then
            echo "Status bar set successfully."
            break
        else
            echo "Retrying status bar settings..."
            adb shell "date -u 11010000"
            sleep 2
            retries=$((retries + 1))
        fi
    done

    if [ $retries -eq $max_retries ]; then
        echo "Failed to set status bar after $max_retries attempts."
    fi
}

# Function to ensure the emulator is ready
ensure_emulator_ready() {
    boot_completed=false
    while [ "$boot_completed" == "false" ]; do
        boot_completed=$(adb -s emulator-5554 shell getprop sys.boot_completed 2>/dev/null)
        if [ "$boot_completed" == "1" ]; then
            echo "Emulator is ready."
            break
        else
            echo "Waiting for emulator to be ready..."
            sleep 5
        fi
    done
}

# Function to run tests
run_tests() {
  local test_files=("$@")
  for yaml_test_file in "${test_files[@]}"; do
    echo "🧪 Testing: $yaml_test_file"
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
      set_status_bar
    fi
    if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 "$yaml_test_file"; then
      echo "✅ Test passed: $yaml_test_file"
      passed_tests+=("$yaml_test_file")
    else
      echo "❌ Test failed: $yaml_test_file"
      failed_tests+=("$yaml_test_file")
    fi
    completed_tests=$((completed_tests + 1))
    remaining_tests=$((total_tests - completed_tests))
    echo "📊 Progress: $completed_tests/$total_tests tests completed, $remaining_tests tests remaining. ✅ ${#passed_tests[@]} passed, ❌ ${#failed_tests[@]} failed."
  done
}

# Function to rerun failed tests
rerun_failed_tests() {
  local retry_failed_tests=("$@")
  local total_retries=${#retry_failed_tests[@]}
  local retry_count=0
  for yaml_test_file in "${retry_failed_tests[@]}"; do
    retry_count=$((retry_count + 1))
    echo "🧪 Retrying test $retry_count/$total_retries: $(basename "$yaml_test_file")"
    if [ "$PLATFORM" == "android" ]; then
      ensure_emulator_ready
    else
      restart_simulator
    fi
    if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID --env PLATFORM=$PLATFORM --env MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 "$yaml_test_file"; then
      echo "✅ Test passed: $yaml_test_file"
      passed_tests+=("$yaml_test_file")
    else
      echo "❌ Test failed: $yaml_test_file"
      final_failed_tests+=("$yaml_test_file")
    fi
    echo "📊 Retry Progress: $retry_count/$total_retries tests completed, ${#passed_tests[@]} passed, ${#final_failed_tests[@]} failed."
  done
}