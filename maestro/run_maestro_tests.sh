#!/bin/bash

if [ "$1" == "android" ]; then
  APP_ID="com.mendix.nativetemplate"
elif [ "$1" == "ios" ]; then
  APP_ID="com.mendix.native.template"
else
  echo "Usage: $0 [android|ios]"
  exit 1
fi

# Initialize arrays to track passed and failed tests
passed_tests=()
failed_tests=()

# Find all .yaml files under maestro/ folders within packages/ and execute them
find packages/ -type f -path "*/maestro/*.yaml" | while read -r yaml_test_file; do
  echo "Running test: $yaml_test_file"

  # Run the test and capture the result
  if $HOME/.local/bin/maestro/bin/maestro test --env APP_ID=$APP_ID "$yaml_test_file"; then
    echo "✅ Test passed: $yaml_test_file"
    passed_tests+=("$yaml_test_file")
  else
    echo "❌ Test failed: $yaml_test_file"
    failed_tests+=("$yaml_test_file")
  fi
done

# Debug: Print the contents of the arrays for debugging
echo
echo "Passed Tests:"
for test in "${passed_tests[@]}"; do
  echo "  - $test"
done

echo
echo "Failed Tests:"
for test in "${failed_tests[@]}"; do
  echo "  - $test"
done

# Print summary of test results
echo
echo "Test Execution Summary:"
echo "-----------------------"
if [ ${#passed_tests[@]} -gt 0 ]; then
  echo "✅ Passed Tests:"
  for test in "${passed_tests[@]}"; do
    echo "  - $test"
  done
else
  echo "No tests passed."
fi

if [ ${#failed_tests[@]} -gt 0 ]; then
  echo "❌ Failed Tests:"
  for test in "${failed_tests[@]}"; do
    echo "  - $test"
  done
  exit 1  # Mark the workflow as failed if any tests fail
else
  echo "All tests passed!"
  exit 0  # Mark the workflow as successful
fi
