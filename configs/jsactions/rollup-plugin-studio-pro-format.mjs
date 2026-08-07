/**
 * Rollup plugin to prepare JS action files for mx create-module-package transformation.
 *
 * Strips imports that mx will inject (mx-global, Big) and fixes displaced marker comments.
 * The mx create-module-package command will then add the Studio Pro header and proper formatting.
 *
 * Adapted from pwawrapper's mendixMarkers plugin approach.
 */
export function studioProFormat() {
    return {
        name: "studio-pro-format",
        generateBundle(options, bundle) {
            let fixed = 0;
            for (const [fileName, chunk] of Object.entries(bundle)) {
                if (chunk.type !== "chunk" || !fileName.endsWith(".js")) continue;
                const original = chunk.code;
                const patched = prepareForMxTransform(original);
                if (patched !== original) {
                    chunk.code = patched;
                    fixed++;
                }
            }
            if (fixed > 0) {
                console.log(`✅ Prepared ${fixed} file(s) for mx transformation`);
            }
        }
    };
}

function prepareForMxTransform(code) {
    // Strip imports that mx create-module-package will inject to avoid duplicates
    let out = code
        .replace(/^import\s+["']mx-global["'];\s*\n?/m, "")
        .replace(/^import\s+\{[^}]+\}\s+from\s+["']big\.js["'];\s*\n?/m, "");

    // The Studio Pro header comment (lines 1-7) will be naturally stripped by TypeScript
    // since it's a standalone comment block not attached to code.
    // mx create-module-package will regenerate it along with the imports.

    return out;
}
