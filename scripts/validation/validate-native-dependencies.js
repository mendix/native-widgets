const { existsSync, readdirSync } = require("fs");
const { join } = require("path");
const { execSync } = require("child_process");
const fg = require("fast-glob");

/**
 * CI Check: Detect New Native Dependencies
 *
 * Purpose: Warn when a widget adds a new dependency that contains native code.
 * This helps catch when developers accidentally add native dependencies,
 * which forces customers to rebuild their mobile apps.
 *
 * How it works:
 * - Compares package.json dependencies against previous commit (HEAD)
 * - For any NEW dependencies, checks if they contain native code
 * - Warns if the new dependency has ios/android folders
 *
 * Bypass: Include "NATIVE_DEPENDENCY_APPROVED" in the commit message.
 */

try {
    validateNativeDependencies();
} catch (error) {
    console.error(error);
    process.exit(1);
}

async function validateNativeDependencies() {
    // Check for bypass approval
    const commitMessage = process.env.CI_COMMIT_MESSAGE || "";
    const isApproved = commitMessage.includes("NATIVE_DEPENDENCY_APPROVED");

    if (isApproved) {
        console.log("✅ Native dependency changes approved via commit message");
        return;
    }

    const violations = [];
    const widgetsDir = join(process.cwd(), "packages/pluggableWidgets");

    if (!existsSync(widgetsDir)) {
        console.log("✅ No widgets directory found");
        return;
    }

    const widgets = readdirSync(widgetsDir);
    let checkedCount = 0;

    for (const widget of widgets) {
        const widgetPath = join(widgetsDir, widget);
        const packageJsonPath = join(widgetPath, "package.json");

        if (!existsSync(packageJsonPath)) continue;

        checkedCount++;

        try {
            // Get current package.json
            const currentPackageJson = require(packageJsonPath);
            const currentDeps = {
                ...currentPackageJson.dependencies,
                ...currentPackageJson.peerDependencies
            };

            // Get previous package.json from git (HEAD)
            let previousDeps = {};
            try {
                const relativePath = join("packages/pluggableWidgets", widget, "package.json");
                const previousContent = execSync(`git show HEAD:${relativePath}`, {
                    encoding: "utf-8",
                    stdio: ["pipe", "pipe", "ignore"]
                });
                const previousPackageJson = JSON.parse(previousContent);
                previousDeps = {
                    ...previousPackageJson.dependencies,
                    ...previousPackageJson.peerDependencies
                };
            } catch (error) {
                // package.json doesn't exist in previous commit (new widget)
                // We'll check all dependencies
            }

            // Find NEW dependencies (in current but not in previous)
            const newDeps = Object.keys(currentDeps).filter(dep => !previousDeps[dep]);

            if (newDeps.length === 0) continue;

            // Check each new dependency for native code
            for (const depName of newDeps) {
                const depPath = join(widgetPath, "node_modules", depName);

                if (!existsSync(depPath)) continue;

                const hasNative = await hasNativeCode(depPath);

                if (hasNative) {
                    violations.push({
                        widget,
                        dependency: `${depName}@${currentDeps[depName]}`,
                        path: depPath
                    });
                }
            }
        } catch (error) {
            console.warn(`⚠️  Could not check ${widget}: ${error.message}`);
        }
    }

    if (violations.length > 0) {
        console.error("\n❌ NEW NATIVE DEPENDENCY DETECTED\n");
        console.error("The following widgets added dependencies with native code:\n");

        for (const violation of violations) {
            console.error(`  Widget: ${violation.widget}`);
            console.error(`  New Dependency: ${violation.dependency}`);
            console.error(`  (Contains ios/android folders)\n`);
        }

        console.error("⚠️  Adding native dependencies is a BREAKING CHANGE:");
        console.error("   - Forces customers to rebuild their mobile apps");
        console.error("   - Requires resubmission to App Store / Play Store");
        console.error("   - Can take days/weeks for customer deployment\n");
        console.error("To approve this change, include 'NATIVE_DEPENDENCY_APPROVED' in your commit message.\n");

        throw new Error("Native dependency validation failed");
    }

    console.log(`✅ No new native dependencies detected (checked ${checkedCount} widgets)`);
}

/**
 * Check if a dependency contains native code
 * Same logic as the patched hasNativeCode function
 */
async function hasNativeCode(dir) {
    try {
        const files = await fg(["**/{android,ios}/*", "**/*.podspec"], {
            cwd: dir,
            ignore: ["**/example*/**", "**/__tests__/**", "**/docs/**"]
        });
        return files.length > 0;
    } catch (error) {
        return false;
    }
}
