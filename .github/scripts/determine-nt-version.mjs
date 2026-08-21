#!/usr/bin/env node
// Resolve which Native Template release/branch to build against, given the resolved Mendix
// version. No external deps: uses the global fetch + a small dotted-version comparator, so it
// runs on the runner's preinstalled node with no setup step.

import fs from "node:fs";

const mendixVersion = process.argv[2];
if (!mendixVersion) {
    console.error("Usage: determine-nt-version.mjs <mendix_version>");
    process.exit(1);
}

const baseMatch = mendixVersion.match(/(\d+\.\d+\.\d+)/);
if (!baseMatch) {
    console.error(`::error::Could not parse a X.Y.Z version from "${mendixVersion}"`);
    process.exit(1);
}
const mendixVersionBase = baseMatch[1];

console.log(`Mendix version: ${mendixVersion}`);
console.log(`Mendix base version: ${mendixVersionBase}`);

// Compare two dotted numeric versions (e.g. "11.11.0"). Returns 1 / 0 / -1.
// Non-numeric segments coerce to 0, mirroring the lenient parse the Python relied on.
function cmpVer(a, b) {
    const pa = a.split(".").map(n => parseInt(n, 10));
    const pb = b.split(".").map(n => parseInt(n, 10));
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] || 0;
        const y = pb[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

let versionData;
try {
    versionData = JSON.parse(fs.readFileSync("mendix_version.json", "utf8"));
} catch {
    console.error("::error::mendix_version.json not found");
    process.exit(1);
}

function writeOutput(branch) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `nt_branch=${branch}\n`);
}

// Pick the most specific ">=X.Y.Z" range the Mendix version satisfies (highest min wins).
let bestMatch = null;
let highestMin = "0.0.0";
for (const rangeStr of Object.keys(versionData)) {
    if (!rangeStr.startsWith(">=")) continue;
    const minVer = rangeStr.slice(2);
    if (cmpVer(mendixVersionBase, minVer) >= 0 && cmpVer(minVer, highestMin) > 0) {
        bestMatch = rangeStr;
        highestMin = minVer;
        console.log(`Found matching range: ${rangeStr}`);
    }
}

if (!bestMatch) {
    // Was a silent `nt_branch=master`. Fail loudly instead of building against an unpinned
    // moving target when the Mendix version matches no configured range.
    console.error(`::error::No Native Template version range matched Mendix ${mendixVersionBase}; refusing to fall back to master.`);
    process.exit(1);
}

console.log(`Best matching range: ${bestMatch}`);

const maxPattern = versionData[bestMatch].max || "";
let majorVersion = null;
if (maxPattern === "*") {
    console.log("Looking for latest available release (no major version restriction)");
} else {
    majorVersion = maxPattern.split(".")[0];
    console.log(`Looking for latest release with major version: ${majorVersion}`);
}

const response = await fetch("https://api.github.com/repos/mendix/native-template/releases", {
    headers: { "User-Agent": "native-widgets-ci", Accept: "application/vnd.github+json" }
});
if (!response.ok) {
    // Was a silent `nt_branch=master`. Fail loudly so a transient API/rate-limit blip can't
    // quietly pin the whole pipeline to master.
    console.error(`::error::Failed to fetch native-template releases: HTTP ${response.status}`);
    process.exit(1);
}

const allReleases = await response.json();
console.log(`Available releases: ${allReleases.map(r => r.tag_name).join(", ")}`);

const matching = [];
for (const release of allReleases) {
    const tag = release.tag_name;
    const cleanTag = tag.startsWith("v") ? tag.slice(1) : tag;
    if (!/^\d+\.\d+/.test(cleanTag)) continue; // skip non-version tags (the Python try/except)
    if (majorVersion === null || cleanTag.startsWith(`${majorVersion}.`)) {
        matching.push({ tag, clean: cleanTag });
    }
}

if (matching.length > 0) {
    matching.sort((a, b) => cmpVer(a.clean, b.clean));
    const latestTag = matching[matching.length - 1].tag;
    console.log(`Selected Native Template release: ${latestTag}`);
    writeOutput(latestTag);
} else {
    // No published release for this range yet — fall back to the range's known-good minimum
    // (a real pinned version, not master), matching the original behaviour.
    const minVersion = versionData[bestMatch].min || "";
    console.log(`No matching release found, using minimum version: ${minVersion}`);
    writeOutput(minVersion);
}
