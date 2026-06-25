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

# Convert a space-separated list of widget names into a JSON array (or [] when empty).
to_json_array() {
  if [[ -z "$1" ]]; then
    echo "[]"
  else
    echo "[\"$(echo "$1" | sed 's/ /","/g')\"]"
  fi
}

if [ "$event_name" == "pull_request" ]; then
  if git cat-file -e "$before_commit" 2>/dev/null; then
    changed_files=$(git diff --name-only "$before_commit" "$current_commit")
  else
    echo "Previous commit not found, using HEAD~1 as fallback"
    changed_files=$(git diff --name-only HEAD~1 "$current_commit")
  fi

  # selected_workspaces = widgets to TEST (any change under the widget folder).
  # build_workspaces   = widgets to BUILD (only when a build-affecting file changed).
  selected_workspaces=""
  build_workspaces=""
  js_actions_changed=false

  for file in $changed_files; do
    if [[ $file == packages/pluggableWidgets/* ]]; then
      widget=$(echo $file | cut -d'/' -f3)
      subdir=$(echo $file | cut -d'/' -f4)
      if [[ ! $selected_workspaces =~ $widget ]]; then
        selected_workspaces="$selected_workspaces $widget"
      fi
      # A change confined to the widget's e2e/ folder (Maestro flows + screenshots) changes
      # only the TEST, not the built artifact — so it should NOT trigger a rebuild. The widget
      # still goes into selected_workspaces above (it gets TESTED), but it's kept out of the
      # BUILD scope; its .mpk comes from the test project's committed baseline, exactly like
      # every other not-rebuilt widget in a partial run.
      if [[ "$subdir" != "e2e" ]] && [[ ! $build_workspaces =~ $widget ]]; then
        build_workspaces="$build_workspaces $widget"
      fi
    elif [[ $file == packages/jsActions/mobile-resources-native/* ]] || [[ $file == packages/jsActions/nanoflow-actions-native/* ]]; then
      js_actions_changed=true
    fi
  done

  # Trim leading and trailing spaces
  selected_workspaces=$(echo $selected_workspaces | xargs)
  build_workspaces=$(echo $build_workspaces | xargs)

  # Build the final scope and widgets output
  # Note: widgets output is used for both BUILDING and the widget TEST MATRIX
  # When only JS actions change, widgets_to_test is empty (no widget tests needed)
  # but we still need to build all widgets for the test project
  # full_build=true when every widget is (re)built — used by the resources job to safely
  # restore/save a content-hashed dist cache. It is false for partial builds (a specific
  # subset of widgets), whose dist set is incomplete and must not populate the shared cache.
  if [[ -n "$selected_workspaces" ]] && [[ "$js_actions_changed" == "true" ]]; then
    # Both widgets and JS actions changed. Build only build-affected widgets (+ JS actions),
    # but test every changed widget. build_workspaces may be empty (all changes were e2e-only),
    # in which case no widgets are rebuilt and they test against the baseline project.
    echo "scope=--all --include '$selected_workspaces mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=$(to_json_array "$build_workspaces")" >> $GITHUB_OUTPUT
    echo "widgets_to_test=$(to_json_array "$selected_workspaces")" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
    echo "full_build=false" >> $GITHUB_OUTPUT
  elif [[ -n "$selected_workspaces" ]] && [[ "$js_actions_changed" == "false" ]]; then
    # Only widgets changed. Build only build-affected widgets; test every changed widget.
    echo "scope=--all --include '$selected_workspaces'" >> $GITHUB_OUTPUT
    echo "widgets=$(to_json_array "$build_workspaces")" >> $GITHUB_OUTPUT
    echo "widgets_to_test=$(to_json_array "$selected_workspaces")" >> $GITHUB_OUTPUT
    echo "js_actions_changed=false" >> $GITHUB_OUTPUT
    echo "full_build=false" >> $GITHUB_OUTPUT
  elif [[ -z "$selected_workspaces" ]] && [[ "$js_actions_changed" == "true" ]]; then
    # Only JS actions changed - need to build ALL widgets because JS action tests
    # require the full test project with all widgets to function properly
    # But widget tests should NOT run (empty widgets_to_test)
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
    echo "full_build=true" >> $GITHUB_OUTPUT
  else
    # No specific changes detected in widgets or JS actions, run everything
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=${all_widgets}" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
    echo "full_build=true" >> $GITHUB_OUTPUT
  fi
else
  if [ -n "$input_workspace" ] && [ "$input_workspace" != "*-native" ] && [ "$input_workspace" != "js-actions" ]; then
    # Specific widget(s) selected
    selected_workspaces=$(echo "$input_workspace" | sed 's/,/ /g')
    echo "scope=--all --include '${selected_workspaces}'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$input_workspace\"]" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[\"$input_workspace\"]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=false" >> $GITHUB_OUTPUT
    echo "full_build=false" >> $GITHUB_OUTPUT
  elif [ "$input_workspace" == "js-actions" ]; then
    # JS actions selected - need to build ALL widgets because JS action tests
    # require the full test project with all widgets to function properly
    # But widget tests should NOT run (empty widgets_to_test)
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=[]" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
    echo "full_build=true" >> $GITHUB_OUTPUT
  else
    # All widgets (*-native) or default - run everything
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
    echo "widgets_to_test=${all_widgets}" >> $GITHUB_OUTPUT
    echo "js_actions_changed=true" >> $GITHUB_OUTPUT
    echo "full_build=true" >> $GITHUB_OUTPUT
  fi
fi

echo "Determined scope: $(cat $GITHUB_OUTPUT | grep 'scope=' | cut -d= -f2)"
echo "Widgets to build: $(cat $GITHUB_OUTPUT | grep '^widgets=' | cut -d= -f2)"
echo "Widgets to test: $(cat $GITHUB_OUTPUT | grep 'widgets_to_test=' | cut -d= -f2)"
echo "JS actions changed: $(cat $GITHUB_OUTPUT | grep 'js_actions_changed=' | cut -d= -f2)"