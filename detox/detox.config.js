const ANDROID_SDK_VERSION = "30"; // Set to 30 because: https://github.com/wix/Detox/issues/3071
const ANDROID_DEVICE_TYPE = "pixel";
const IOS_SDK_VERSION = "16.2";
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
            binaryPath: `${__dirname}/apps/DeveloperApp.app`
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
    }
};
