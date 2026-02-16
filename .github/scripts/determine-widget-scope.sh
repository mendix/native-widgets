#!/usr/bin/env bash
set -e

# Get parameters from arguments
event_name="$1"
input_workspace="$2"
before_commit="$3"
current_commit="$4"

# List of all native widgets
# Dynamically discover all native widgets from the packages/pluggableWidgets directory
# This ensures we don't miss any widgets when new ones are added
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
widget_dirs=$(find "$repo_root/packages/pluggableWidgets" -maxdepth 1 -type d -name "*-native" -exec basename {} \; | sort)
all_widgets=$(echo "$widget_dirs" | jq -R -s -c 'split("\n") | map(select(length > 0))')

# Combined widgets and JS actions for default cases
all_widgets_and_js=$(echo "$widget_dirs" | jq -R -s -c 'split("\n") | map(select(length > 0)) + ["mobile-resources-native", "nanoflow-actions-native"]')

if [ "$event_name" == "pull_request" ]; then
  base_sha=""
  head_sha=""

  # For pull_request events, github.event.before is usually empty.
  # Prefer reading the base/head SHAs from the GitHub event payload.
  if [ -n "${GITHUB_EVENT_PATH:-}" ] && [ -f "${GITHUB_EVENT_PATH:-}" ]; then
    base_sha=$(jq -r '.pull_request.base.sha // empty' "$GITHUB_EVENT_PATH" 2>/dev/null || true)
    head_sha=$(jq -r '.pull_request.head.sha // empty' "$GITHUB_EVENT_PATH" 2>/dev/null || true)
  fi

  if [ -n "$base_sha" ] && [ -n "$head_sha" ] && git cat-file -e "$base_sha" 2>/dev/null && git cat-file -e "$head_sha" 2>/dev/null; then
    changed_files=$(git diff --name-only "$base_sha" "$head_sha")
  elif [ -n "$before_commit" ] && git cat-file -e "$before_commit" 2>/dev/null; then
    changed_files=$(git diff --name-only "$before_commit" "$current_commit")
  else
    echo "Base/head SHAs not available locally; falling back to HEAD~1 diff"
    changed_files=$(git diff --name-only HEAD~1 "$current_commit")
  fi

  selected_workspaces=""
  js_actions_changed=false
  
  for file in $changed_files; do
    if [[ $file == packages/pluggableWidgets/* ]]; then
      widget=$(echo $file | cut -d'/' -f3)
      if [[ ! $selected_workspaces =~ $widget ]]; then
        selected_workspaces="$selected_workspaces $widget"
      fi
    elif [[ $file == packages/jsActions/mobile-resources-native/* ]] || [[ $file == packages/jsActions/nanoflow-actions-native/* ]]; then
      js_actions_changed=true
    fi
  done

  # Trim leading and trailing spaces from selected_workspaces
  selected_workspaces=$(echo $selected_workspaces | xargs)

  # Build the final scope and widgets output
  # Note: widgets output is used for both BUILDING and the widget TEST MATRIX
  # When only JS actions change, widgets_to_test is empty (no widget tests needed)
  # but we still need to build all widgets for the test project
  if [[ -n "$selected_workspaces" ]] && [[ "$js_actions_changed" == "true" ]]; then
    # Both widgets and JS actions changed
    # Convert space-separated widget names to JSON array format
    widget_array=$(echo "$selected_workspaces" | sed 's/ /","/g')
    echo "scope=--all --include '$selected_workspaces mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$widget_array\"]" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[\"$widget_array\"]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
  elif [[ -n "$selected_workspaces" ]] && [[ "$js_actions_changed" == "false" ]]; then
    # Only widgets changed
    widget_array=$(echo "$selected_workspaces" | sed 's/ /","/g')
    echo "scope=--all --include '$selected_workspaces'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$widget_array\"]" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[\"$widget_array\"]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=false" >> $GITHUB_OUTPUT
  elif [[ -z "$selected_workspaces" ]] && [[ "$js_actions_changed" == "true" ]]; then
    # Only JS actions changed - need to build ALL widgets because JS action tests 
    # require the full test project with all widgets to function properly
    # But widget tests should NOT run (empty widgets_to_test)
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
  else
    # No specific changes detected in widgets or JS actions, run everything
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=${all_widgets}" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
  fi
else
  if [ -n "$input_workspace" ] && [ "$input_workspace" != "*-native" ] && [ "$input_workspace" != "js-actions" ]; then
    # Specific widget(s) selected
    selected_workspaces=$(echo "$input_workspace" | sed 's/,/ /g')
    echo "scope=--all --include '${selected_workspaces}'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$input_workspace\"]" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[\"$input_workspace\"]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=false" >> $GITHUB_OUTPUT
  elif [ "$input_workspace" == "js-actions" ]; then
    # JS actions selected - need to build ALL widgets because JS action tests
    # require the full test project with all widgets to function properly
    # But widget tests should NOT run (empty widgets_to_test)
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
  else
    # All widgets (*-native) or default - run everything
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=${all_widgets}" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
  fi
fi

echo "Determined scope: $(cat $GITHUB_OUTPUT | grep 'scope=' | cut -d= -f2)"
echo "Widgets to build: $(cat $GITHUB_OUTPUT | grep '^widgets=' | cut -d= -f2)"
echo "Widgets to test: $(cat $GITHUB_OUTPUT | grep 'widgets_to_test=' | cut -d= -f2)"
echo "JS actions changed: $(cat $GITHUB_OUTPUT | grep 'js_actions_changed=' | cut -d= -f2)"