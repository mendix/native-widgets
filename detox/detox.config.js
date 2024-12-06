const ANDROID_SDK_VERSION = "34";
const ANDROID_DEVICE_TYPE = "pixel";
const IOS_SDK_VERSION = "17.5";
const IOS_DEVICE_TYPE = "iPhone 14";

module.exports = {
    ANDROID_SDK_VERSION,
    ANDROID_DEVICE_TYPE,
    IOS_SDK_VERSION,
    IOS_DEVICE_TYPE,
    "test-runner": `${__dirname}/../node_modules/.bin/jest`,
    "runner-config": `${__dirname}/jest.config.js`,
    skipLegacyWorkersInjection: true,
    apps: {
        "ios.developerapp": {
            type: "ios.app",
            binaryPath: `${__dirname}/apps/NativeTemplate.app`
        },
        "android.developerapp": {
            type: "android.apk",
            binaryPath: `${__dirname}/apps/app-appstore-debug.apk`,
            testBinaryPath: `${__dirname}/apps/app-appstore-debug-androidTest.apk`
        }
    },
    devices: {
        ios: {
            type: "ios.simulator",
            device: {
                type: IOS_DEVICE_TYPE,
                os: `iOS ${IOS_SDK_VERSION}`
            }
        },
        android: {
            type: "android.emulator",
            device: {
                avdName: `NATIVE_${ANDROID_DEVICE_TYPE}_${ANDROID_SDK_VERSION}`
            }
        }
    },
    configurations: {
        "ios.simulator.developerapp": {
            device: "ios",
            app: "ios.developerapp",
            behavior: {
                init: {
                    exposeGlobals: false,
                    reinstallApp: true
                }
            }
        },
        "android.emulator.developerapp": {
            device: "android",
            app: "android.developerapp",
            behavior: {
                init: {
                    exposeGlobals: false,
                    reinstallApp: process.env.CI !== "true"
                }
            }
        }
    },
    artifacts: {
        rootDir: "artifacts",
        plugins: {
            instruments: { enabled: false },
            log: { enabled: true },
            uiHierarchy: "enabled",
            screenshot: {
                enabled: true,
                shouldTakeAutomaticSnapshots: true,
                keepOnlyFailedTestsArtifacts: true,
                takeWhen: {
                    testStart: true,
                    testDone: true,
                    appNotReady: true
                }
            },
            video: {
                enabled: true,
                keepOnlyFailedTestsArtifacts: true
            }
        }
    }
};
