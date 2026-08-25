export function bigJsImportReplacer() {
    return {
        name: "bigjs-import-replacer",
        async generateBundle(options, bundle) {
            const [filename] = Object.keys(bundle);
            const fileInfo = bundle[filename];

            // Remove Big import entirely - mxbuild will add it in the header at line 8
            fileInfo.code = fileInfo.code.replace(/^import\s*\{\s*Big\s*\}\s*from\s*['"]big\.js['"];?\s*\r?\n/m, "");
        }
    };
}
