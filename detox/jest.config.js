module.exports = {
    preset: "ts-jest",
    reporters: ['detox/runners/jest/reporter'],
    globalSetup: "detox/runners/jest/globalSetup",
    globalTeardown: "detox/runners/jest/globalTeardown",
    testEnvironment: "detox/runners/jest/testEnvironment",
    rootDir: process.cwd(),
    setupFilesAfterEnv: [`${__dirname}/setup.js`],
    testMatch: ["<rootDir>/e2e/specs/**/*.spec.{js,jsx,ts,tsx}"],
    testPathIgnorePatterns: ["<rootDir>/dist", "<rootDir>/node_modules"],
    testTimeout: 300000,
    maxWorkers: 1,
    verbose: true,
    transform: {
        "^.+.tsx?$": ["ts-jest",{}],
    }
};
