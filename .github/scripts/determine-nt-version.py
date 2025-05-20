import sys
import json
import os
import requests
from packaging import version
import re

mendix_version = sys.argv[1]
mendix_version_base = re.match(r'(\d+\.\d+\.\d+)', mendix_version).group(1)

print(f"Mendix version: {mendix_version}")
print(f"Mendix base version: {mendix_version_base}")

# Parse the JSON file
try:
    with open('mendix_version.json', 'r') as file:
        version_data = json.load(file)
except FileNotFoundError:
    print("mendix_version.json not found")
    sys.exit(1)

# Find the best matching version range
best_match = None
highest_min_version = version.parse("0.0.0")
mendix_version_obj = version.parse(mendix_version_base)

for range_str, data in version_data.items():
    if range_str.startswith(">="):
        min_ver_str = range_str[2:]
        min_ver = version.parse(min_ver_str)
        
        if mendix_version_obj >= min_ver and min_ver > highest_min_version:
            best_match = range_str
            highest_min_version = min_ver
            print(f"Found matching range: {range_str}")

if best_match:
    print(f"Best matching range: {best_match}")
    
    # Get the major version to look for in tags
    max_pattern = version_data[best_match].get("max", "")
    major_version = max_pattern.split('.')[0]
    
    print(f"Looking for latest version with major version: {major_version}")
    
    # Get available tags from native-template repository
    response = requests.get('https://api.github.com/repos/mendix/native-template/tags')
    if response.status_code == 200:
        all_tags = response.json()
        tag_names = [tag['name'] for tag in all_tags]
        print(f"Available tags: {tag_names}")
        
        # Find the latest version matching the major version
        matching_tags = []
        
        for tag in tag_names:
            # Remove 'v' prefix if present for comparison
            clean_tag = tag[1:] if tag.startswith('v') else tag
            
            # Check if the tag starts with the major version
            if clean_tag.startswith(f"{major_version}."):
                try:
                    # Try to parse as a version (this handles proper version numbers)
                    tag_version = version.parse(clean_tag)
                    matching_tags.append((tag, tag_version))
                except:
                    # Skip tags that don't parse as proper versions
                    pass
        
        if matching_tags:
            # Sort by version (highest last) and get the last one
            matching_tags.sort(key=lambda x: x[1])
            latest_version = matching_tags[-1][0]
            print(f"Selected Native Template version: {latest_version}")
            with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                f.write(f"nt_branch={latest_version}\n")
        else:
            # Fallback to min version if no matching tag found
            min_version = version_data[best_match].get("min", "")
            print(f"No matching tag found, using minimum version: {min_version}")
            with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                f.write(f"nt_branch={min_version}\n")
    else:
        print(f"Failed to get tags: {response.status_code}")
        print("Using master as fallback")
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write("nt_branch=master\n")
else:
    print("No matching version range found, using master")
    with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
        f.write("nt_branch=master\n")