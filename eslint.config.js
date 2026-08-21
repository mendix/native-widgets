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
    ...compat.extends(path.resolve(__dirname, ".eslintrc.js"))
];
