/**
 * Applies the patches in ./patches to node_modules, as a postinstall step.
 *
 * The repo root patches dependencies through pnpm's `patchedDependencies`, but this Storybook host is
 * not a pnpm workspace member — it is an npm project with its own package-lock.json — so that
 * mechanism is not available here. The usual npm answer is patch-package; this does the same job with
 * `patch`, which is already present, rather than adding a dependency for one patch file.
 *
 * `patch` rather than `git apply`: git refuses to touch paths inside node_modules (it reports
 * "Skipped patch" and exits 0), which would make every patch look applied while changing nothing.
 *
 * Patch files use the patch-package layout — paths relative to the project root and starting with
 * node_modules/ — so they apply from this directory with -p1. Since postinstall runs on every
 * `npm install`, an already-applied patch is detected up front and skipped rather than treated as a
 * failure.
 */
const { spawnSync } = require("child_process");
const { existsSync, readdirSync } = require("fs");
const { join } = require("path");

const patchesDir = join(__dirname, "..", "patches");
const cwd = join(__dirname, "..");

if (!existsSync(patchesDir)) {
    process.exit(0);
}

const runPatch = (patch, ...flags) =>
    spawnSync("patch", ["-p1", "--forward", "--batch", ...flags, "-i", join("patches", patch)], {
        cwd,
        encoding: "utf8"
    });

let failed = false;

for (const patch of readdirSync(patchesDir).filter(name => name.endsWith(".patch"))) {
    // A dry run first: applying an already-applied patch is an error, so it has to be told apart
    // from a genuine failure before anything is written.
    const dryRun = runPatch(patch, "--dry-run");

    if (dryRun.status !== 0) {
        if (/previously applied|Reversed/i.test(dryRun.stdout + dryRun.stderr)) {
            console.log(`already applied: ${patch}`);
        } else {
            failed = true;
            console.error(`cannot apply: ${patch}`);
            console.error((dryRun.stdout || "") + (dryRun.stderr || ""));
        }
        continue;
    }

    const applied = runPatch(patch);

    if (applied.status === 0) {
        console.log(`applied: ${patch}`);
    } else {
        failed = true;
        console.error(`failed to apply: ${patch}`);
        console.error((applied.stdout || "") + (applied.stderr || ""));
    }
}

if (failed) {
    // A silently unpatched dependency turns into a confusing native build failure later, so stop here.
    process.exit(1);
}
