#!/usr/bin/env bash
set -e

# Get Mendix version from arguments
mendix_version="$1"
# Extract just the major.minor.patch part without any suffixes
mendix_version_base=$(echo $mendix_version | sed -E 's/([0-9]+\.[0-9]+\.[0-9]+).*/\1/')

echo "Mendix version: $mendix_version"
echo "Mendix base version: $mendix_version_base"

# Find all matches based on version ranges in JSON
matching_range=""
highest_min_value=0

# Process each version range in the JSON
while read -r range; do
  # Skip empty lines
  [ -z "$range" ] && continue

  if [[ $range == \>=* ]]; then
    # Extract minimum version from range (e.g. ">=10.22.0" -> "10.22.0")
    min_version=${range#>=}
    
    # Convert version to comparable numeric value
    IFS='.' read -r major minor patch <<< "$min_version"
    min_numeric=$((major*1000000 + minor*1000 + patch))
    
    # Convert Mendix version to comparable numeric value
    IFS='.' read -r mx_major mx_minor mx_patch <<< "$mendix_version_base"
    mx_numeric=$((mx_major*1000000 + mx_minor*1000 + mx_patch))
    
    # Check if Mendix version is greater than or equal to min version
    # AND if this is the highest minimum version we've seen so far
    if [ $mx_numeric -ge $min_numeric ] && [ $min_numeric -gt $highest_min_value ]; then
      matching_range="$range"
      highest_min_value=$min_numeric
      echo "Found matching range: $range (min_value: $min_numeric)"
    fi
  fi
done < <(cat mendix_version.json | grep -o '"[^"]*":' | sed 's/"//g' | sed 's/://g')

if [ -n "$matching_range" ]; then
  echo "Best matching range: $matching_range"
  
  # Extract the major version from max value
  max_pattern=$(cat mendix_version.json | grep -A 2 "\"$matching_range\":" | grep "\"max\":" | cut -d'"' -f4)
  major_version=$(echo "$max_pattern" | cut -d'.' -f1)
  
  echo "Looking for latest version with major version: $major_version"
  
  # Get available tags from native-template repository
  all_tags=$(curl -s https://api.github.com/repos/mendix/native-template/tags | grep '"name"' | cut -d'"' -f4)
  echo "Available tags: $all_tags"
  
  # Find the latest version matching the major version
  latest_version=""
  highest_numeric=0
  
  while read -r tag; do
    # Check for both tags with and without "v" prefix
    if [[ $tag == v$major_version.* || $tag == $major_version.* ]]; then
      echo "Found tag matching major version: $tag"
      
      # Remove "v" prefix if present
      clean_tag=${tag#v}
      
      # Convert version to numeric for comparison
      IFS='.' read -r t_major t_minor t_patch <<< "$clean_tag"
      # Handle cases where patch might contain non-numeric parts
      t_patch=$(echo "$t_patch" | sed 's/[^0-9].*$//')
      tag_numeric=$((t_major*1000000 + t_minor*1000 + t_patch))
      
      echo "Tag numeric value: $tag_numeric"
      
      if [ $tag_numeric -gt $highest_numeric ]; then
        highest_numeric=$tag_numeric
        latest_version="$tag"
        echo "New highest version: $latest_version ($highest_numeric)"
      fi
    fi
  done <<< "$all_tags"
  
  if [ -n "$latest_version" ]; then
    echo "Selected Native Template version: $latest_version"
    echo "nt_branch=$latest_version" >> $GITHUB_OUTPUT
  else
    # Fallback to min version if no matching tag found
    min_version=$(cat mendix_version.json | grep -A 2 "\"$matching_range\":" | grep "\"min\":" | cut -d'"' -f4)
    echo "No matching tag found, using minimum version: $min_version"
    echo "nt_branch=$min_version" >> $GITHUB_OUTPUT
  fi
else
  echo "No matching version range found, using master"
  echo "nt_branch=master" >> $GITHUB_OUTPUT
fi