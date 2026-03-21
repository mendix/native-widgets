const deepmerge = require("deepmerge");

const base = require("@mendix/pluggable-widgets-tools/configs/eslint.ts.base.json");

delete base.parserOptions.project;

module.exports = deepmerge(base, {
    rules: {
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "no-unused-expressions": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "no-undef": "off"
    }
});
