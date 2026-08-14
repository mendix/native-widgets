const deepmerge = require("deepmerge");

const base = require("@mendix/pluggable-widgets-tools/configs/eslint.ts.base.json");

delete base.parserOptions.project;

module.exports = deepmerge(base, {
    rules: {
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "no-unused-expressions": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "no-undef": "off",
        // ESLint 9: no-return-await removed (disabled, no replacement since type-aware linting is off for performance)
        "no-return-await": "off",
        // Remove deprecated @typescript-eslint rules (already off in base, but silencing warnings)
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/class-name-casing": "off",
        "@typescript-eslint/no-object-literal-type-assertion": "off",
        "react-hooks/exhaustive-deps": "off",
        "@typescript-eslint/no-var-requires": "off"
    }
});
