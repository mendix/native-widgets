#!/usr/bin/env bash
set -e

# Get parameters from arguments
event_name="$1"
input_workspace="$2"
before_commit="$3"
current_commit="$4"

# List of all native widgets
all_widgets='["accordion-native","activity-indicator-native","animation-native","app-events-native","background-gradient-native","background-image-native","badge-native","bar-chart-native","barcode-scanner-native","bottom-sheet-native","carousel-native","color-picker-native","column-chart-native","feedback-native","floating-action-button-native","gallery-native","gallery-text-filter-native","image-native","intro-screen-native","line-chart-native","listview-swipe-native","maps-native","pie-doughnut-chart-native","popup-menu-native","progress-bar-native","progress-circle-native","qr-code-native","radio-buttons-native","range-slider-native","rating-native","repeater-native","safe-area-view-native","signature-native","slider-native","switch-native","toggle-buttons-native","video-player-native","web-view-native"]'

if [ "$event_name" == "pull_request" ]; then
  if git cat-file -e "$before_commit" 2>/dev/null; then
    changed_files=$(git diff --name-only "$before_commit" "$current_commit")
  else
    echo "Previous commit not found, using HEAD~1 as fallback"
    changed_files=$(git diff --name-only HEAD~1 "$current_commit")
  fi

  selected_workspaces=""
  for file in $changed_files; do
    if [[ $file == packages/pluggableWidgets/* ]]; then
      widget=$(echo $file | cut -d'/' -f3)
      if [[ ! $selected_workspaces =~ $widget ]]; then
        selected_workspaces="$selected_workspaces $widget"
      fi
    fi
  done

  # Trim leading and trailing spaces from selected_workspaces
  selected_workspaces=$(echo $selected_workspaces | xargs)

  if [[ -n "$selected_workspaces" ]]; then
    echo "scope=--all --include '$selected_workspaces'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$selected_workspaces\"]" >> $GITHUB_OUTPUT
  else
    echo "scope=--all --include '*-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
  fi
else
  if [ -n "$input_workspace" ] && [ "$input_workspace" != "*-native" ]; then
    selected_workspaces=$(echo "$input_workspace" | sed 's/,/ /g')
    echo "scope=--all --include '${selected_workspaces}'" >> $GITHUB_OUTPUT
    echo "widgets=[\"$input_workspace\"]" >> $GITHUB_OUTPUT
  else
    echo "scope=--all --include '*-native'" >> $GITHUB_OUTPUT
    echo "widgets=${all_widgets}" >> $GITHUB_OUTPUT
  fi
fi

echo "Determined scope: $(cat $GITHUB_OUTPUT | grep scope= | cut -d= -f2)"
echo "Widgets: $(cat $GITHUB_OUTPUT | grep widgets= | cut -d= -f2)"