const { device } = require("detox");
const config = require("./detox.config");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const { join, resolve } = require("path");
const { execSync } = require("child_process");
const { expect } = require("@jest/globals");

jest.retryTimes(1);

expect.extend({
    toMatchImageSnapshot(screenshot, options = {}) {
        const platform = device.getPlatform();
        let type;
        let sdk;
        if (platform === "ios") {
            type = "iPhone";
            sdk = config.IOS_SDK_VERSION;
        } else {
            type = config.ANDROID_DEVICE_TYPE;
            sdk = config.ANDROID_SDK_VERSION;
        }

        const customSnapshotsDir = join(resolve("./"), "e2e", "images", "expected", platform, sdk, type);
        const customDiffDir = join(resolve("./"), "e2e", "images", "diffs", platform, sdk, type);
        const customReceivedDir = join(resolve("./"), "e2e", "images", "actual", platform, sdk, type);

        return toMatchImageSnapshot.call(this, screenshot, {
            customDiffConfig: { threshold: 0.15 },
            customDiffDir,
            customSnapshotsDir,
            customReceivedDir,
            storeReceivedOnFailure: false,
            failureThreshold: 10,
            failureThresholdType: "pixel",
            customSnapshotIdentifier: snapshotInfo => `${snapshotInfo.currentTestName} ${snapshotInfo.counter}`,
            ...options
        });
    }
});

global.expect = expect;

beforeAll(async () => {
    if (device.getPlatform() === "android") {
        const id = device.id;
        execSync(`adb -s ${id} shell setprop debug.hwui.renderer skiagl`);
        execSync(`adb -s ${id} reverse tcp:8080 tcp:8080`);
    }
});
