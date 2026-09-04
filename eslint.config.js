const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const path = require("path");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended
});

// Use FlatCompat to translate the legacy .eslintrc.js config to flat config
module.exports = [
    // First, load the ignore patterns (replaces .eslintignore)
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "packages/pluggableWidgets/rich-text-web/src/assets/plugins/**/*.js"
        ]
    },
    // Then extend from the legacy .eslintrc.js file
    ...compat.extends(path.resolve(__dirname, ".eslintrc.js")),
    // Nanoflow Commons actions also run on web, where `mendix-native` does not resolve at all, so a
    // static import would break the web bundle even on paths that never touch native. These actions
    // must go through src/native/mendix-native.ts, which owns the lazy import; src/native itself is
    // exempt. Native-only packages such as mobile-resources-native import `mendix-native` directly.
    {
        files: ["packages/jsActions/nanoflow-actions-native/src/**/*.{ts,tsx,js,jsx}"],
        ignores: ["packages/jsActions/nanoflow-actions-native/src/native/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            regex: "^mendix-native(/|$)",
                            message:
                                "Import from src/native/mendix-native instead, which owns the import of 'mendix-native'. In Nanoflow Commons a direct import also breaks the web bundle."
                        }
                    ]
                }
            ],
            // no-restricted-imports does not flag `import()` expressions, so the dynamic form is
            // matched separately.
            "no-restricted-syntax": [
                "error",
                {
                    selector: "ImportExpression > Literal[value=/^mendix-native(\\u002F|$)/]",
                    message:
                        "Import from src/native/mendix-native instead; that module owns the dynamic import of 'mendix-native'."
                }
            ]
        }
    }
];
