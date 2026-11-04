export function bigJsImportReplacer() {
    return {
        name: "bigjs-import-replacer",
        async generateBundle(options, bundle) {
            const [filename] = Object.keys(bundle);
            const fileInfo = bundle[filename];

            // Keep the Big import (Studio Pro does not re-add it at runtime), normalized to Studio Pro's quote style
            fileInfo.code = fileInfo.code.replace(
                /^import\s*\{\s*Big\s*\}\s*from\s*['"]big\.js['"];?/m,
                `import { Big } from "big.js";`
            );
        }
    };
}
