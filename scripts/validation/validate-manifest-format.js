const { readFileSync, existsSync, readdirSync } = require("fs");
const { join } = require("path");

/**
 * CI Check: Prevent Empty Manifest Objects
 *
 * Purpose: Ensure JS-only widgets don't emit empty {} manifests.
 * Studio Pro's JSON parser uses MissingMemberHandling.Error with [JsonRequired],
 * so an empty object would fail the entire manifest file parse.
 *
 * Expected behavior:
 * - Widgets WITH native dependencies: emit {"nativeDependencies": {...}}
 * - Widgets WITHOUT native dependencies: emit NO FILE at all
 */

try {
    validateManifestFormat();
} catch (error) {
    console.error(error);
    process.exit(1);
}

function validateManifestFormat() {
    const violations = [];
    const widgetsDir = join(process.cwd(), "packages/pluggableWidgets");

    if (!existsSync(widgetsDir)) {
        console.log("✅ No widgets directory found");
        return;
    }

    const widgets = readdirSync(widgetsDir);
    let checkedCount = 0;

    for (const widget of widgets) {
        const manifestDir = join(widgetsDir, widget, "dist/tmp/widgets");

        if (!existsSync(manifestDir)) continue;

        const files = readdirSync(manifestDir).filter(f => f.endsWith(".json") && f !== "package.json");

        for (const file of files) {
            checkedCount++;
            const fullPath = join(manifestDir, file);

            try {
                const content = readFileSync(fullPath, "utf-8");

                // Check if file is empty (not even valid JSON)
                if (!content.trim()) {
                    violations.push({
                        widget,
                        file,
                        reason: "File is completely empty (not even valid JSON)"
                    });
                    continue;
                }

                const manifest = JSON.parse(content);

                // Check for empty manifest or empty nativeDependencies object
                const isEmpty =
                    Object.keys(manifest).length === 0 ||
                    (manifest.nativeDependencies && Object.keys(manifest.nativeDependencies).length === 0);

                if (isEmpty) {
                    violations.push({
                        widget,
                        file,
                        reason:
                            Object.keys(manifest).length === 0
                                ? "Manifest is completely empty: {}"
                                : "nativeDependencies object is empty: {}"
                    });
                }
            } catch (error) {
                // Invalid JSON is also a violation
                violations.push({
                    widget,
                    file,
                    reason: `Invalid JSON: ${error.message}`
                });
            }
        }
    }

    if (violations.length > 0) {
        console.error("\n❌ EMPTY MANIFEST VIOLATION DETECTED\n");
        console.error("The following widgets have empty manifest files:\n");

        for (const violation of violations) {
            console.error(`  Widget: ${violation.widget}`);
            console.error(`  File: ${violation.file}`);
            console.error(`  Issue: ${violation.reason}\n`);
        }

        console.error("⚠️  Empty manifests break Studio Pro's JSON parser!");
        console.error("   Expected behavior:");
        console.error("   - Widgets WITH native deps: emit {nativeDependencies: {...}}");
        console.error("   - Widgets WITHOUT native deps: emit NO FILE at all\n");
        console.error("This is a bug in the build tooling. Check writeNativeDependenciesJson().\n");

        throw new Error("Manifest format validation failed");
    }

    console.log(`✅ All manifests valid (checked ${checkedCount} manifest files)`);
}
