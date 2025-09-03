#!/usr/bin/env bash
set -e

# Get parameters from arguments
event_name="$1"
input_workspace="$2"
before_commit="$3"
current_commit="$4"

# List of all native widgets
all_widgets='["accordion-native","activity-indicator-native","animation-native","app-events-native","background-gradient-native","background-image-native","badge-native","bar-chart-native","barcode-scanner-native","bottom-sheet-native","carousel-native","color-picker-native","column-chart-native","feedback-native","floating-action-button-native","gallery-native","gallery-text-filter-native","image-native","intro-screen-native","line-chart-native","listview-swipe-native","maps-native","pie-doughnut-chart-native","popup-menu-native","progress-bar-native","progress-circle-native","qr-code-native","radio-buttons-native","range-slider-native","rating-native","repeater-native","safe-area-view-native","signature-native","slider-native","switch-native","toggle-buttons-native","video-player-native","web-view-native"]'

# Combined widgets and JS actions for default cases
all_widgets_and_js='["accordion-native","activity-indicator-native","animation-native","app-events-native","background-gradient-native","background-image-native","badge-native","bar-chart-native","barcode-scanner-native","bottom-sheet-native","carousel-native","color-picker-native","column-chart-native","feedback-native","floating-action-button-native","gallery-native","gallery-text-filter-native","image-native","intro-screen-native","line-chart-native","listview-swipe-native","maps-native","pie-doughnut-chart-native","popup-menu-native","progress-bar-native","progress-circle-native","qr-code-native","radio-buttons-native","range-slider-native","rating-native","repeater-native","safe-area-view-native","signature-native","slider-native","switch-native","toggle-buttons-native","video-player-native","web-view-native","mobile-resources-native","nanoflow-actions-native"]'

if [ "$event_name" == "pull_request" ]; then
  if git cat-file -e "$before_commit" 2>/dev/null; then
    changed_files=$(git diff --name-only "$before_commit" "$current_commit")
  else
    echo "Previous commit not found, using HEAD~1 as fallback"
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
  if [[ -n "$selected_workspaces" ]] && [[ "$js_actions_changed" == "true" ]]; then
    # Both widgets and JS actions changed
    # Convert space-separated widget names to JSON array format
    widget_array=$(echo "$selected_workspaces" | sed 's/ /","/g')
    echo "scope=--all --include '$selected_workspaces mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$widget_array\",\"mobile-resources-native\",\"nanoflow-actions-native\"]" >> $GITHUB_OUTPUT
  elif [[ -n "$selected_workspaces" ]] && [[ "$js_actions_changed" == "false" ]]; then
    # Only widgets changed
    widget_array=$(echo "$selected_workspaces" | sed 's/ /","/g')
    echo "scope=--all --include '$selected_workspaces'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$widget_array\"]" >> $GITHUB_OUTPUT
  elif [[ -z "$selected_workspaces" ]] && [[ "$js_actions_changed" == "true" ]]; then
    # Only JS actions changed
    echo "scope=--all --include 'mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=[\"mobile-resources-native\",\"nanoflow-actions-native\"]" >> $GITHUB_OUTPUT
  else
    # No specific changes detected in widgets or JS actions, run everything
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets_and_js}" >> $GITHUB_OUTPUT
  fi
else
  if [ -n "$input_workspace" ] && [ "$input_workspace" != "*-native" ] && [ "$input_workspace" != "js-actions" ]; then
    selected_workspaces=$(echo "$input_workspace" | sed 's/,/ /g')
    echo "scope=--all --include '${selected_workspaces}'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$input_workspace\"]" >> $GITHUB_OUTPUT
  elif [ "$input_workspace" == "js-actions" ]; then
    echo "scope=--all --include 'mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=[\"mobile-resources-native\",\"nanoflow-actions-native\"]" >> $GITHUB_OUTPUT
  else
    echo "scope=--all --include '*-native mobile-resources-native nanoflow-actions-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets_and_js}" >> $GITHUB_OUTPUT
  fi
fi

echo "Determined scope: $(cat $GITHUB_OUTPUT | grep scope= | cut -d= -f2)"
echo "Widgets: $(cat $GITHUB_OUTPUT | grep widgets= | cut -d= -f2)"