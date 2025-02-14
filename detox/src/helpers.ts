import { execSync } from "child_process";
import { by, element, device, waitFor } from "detox";
import { readFileSync } from "fs";
import { MatchImageSnapshotOptions } from "jest-image-snapshot";

export async function launchApp(): Promise<void> {
    await device.launchApp({
        newInstance: true,
        launchArgs: {
            detoxPrintBusyIdleResources: "YES",
            // Notifications
            detoxURLBlacklistRegex: ".*firestore.*",
            appUrl: "http://10.0.2.2:8080"
        },
        // JS actions
        permissions: { faceid: "YES", location: "inuse", camera: "YES", photos: "YES", notifications: "YES" }
    });

    /**
     * For some reason, whenever the app restarts on iOS, the topbar is reset.
     * So we need to run this command on every app launch.
     * For simplicity/consistency sake, we are running it here for Android as well.
     **/
    await setDemoMode();

    await waitFor(element(by.id("$screen")).atIndex(0))
        .toBeVisible()
        .withTimeout(180000);
}

export async function sessionLogout(): Promise<void> {
    /**
     * Since we have a runtime without license we are limited to 5 concurrent sessions
     * For iOS, the app is reinstalled ofter which seemms to create new sessions.
     * Old sessions are not cleaned up. The app contains an app event that signs out the session
     * when the app is put to background and foreground again.
     **/
    if (device.getPlatform() === "ios") {
        await device.sendToHome();
        await device.launchApp({ newInstance: false });
    }
}

async function setDemoMode(): Promise<void> {
    if (device.getPlatform() === "ios") {
        const type = device.name.substring(device.name.indexOf("(") + 1, device.name.lastIndexOf(")"));
        execSync(
            `xcrun simctl status_bar "${type}" override --time "2023-01-01T12:00:00Z" --batteryState charged --batteryLevel 100 --wifiBars 3`
        );
    } else {
        const id = device.id;
        // enter demo mode
        execSync(`adb -s ${id} shell settings put global sysui_demo_allowed 1`);
        // display time 12:00
        execSync(`adb -s ${id} shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200`);
        // Display full mobile data with 4g type and no wifi
        execSync(
            `adb -s ${id} shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e datatype 4g -e wifi false`
        );
        // Hide notifications
        execSync(
            `adb -s ${id} shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false`
        );
        // Show full battery but not in charging state
        execSync(
            `adb -s ${id} shell am broadcast -a com.android.systemui.demo -e command battery -e plugged false -e level 100`
        );
    }
}

export async function expectToMatchScreenshot(
    nativeElement?: Detox.NativeElement,
    options?: MatchImageSnapshotOptions
): Promise<void> {
    let screenshotPath: string;
    if (nativeElement) {
        screenshotPath = await nativeElement.takeScreenshot("screenshot");
    } else {
        if (device.getPlatform() === "android") {
            nativeElement = element(by.type("android.widget.FrameLayout")).atIndex(0);
            screenshotPath = await nativeElement.takeScreenshot("screenshot");
        } else {
            screenshotPath = await device.takeScreenshot("screenshot");
        }
    }
    expect(readFileSync(screenshotPath)).toMatchImageSnapshot(options);
}

export async function setText(element: Detox.NativeElement, text: string): Promise<void> {
    await element.clearText();
    await element.typeText(text);
    await element.tapReturnKey();
}

export async function tapBottomBarItem(caption: "Widgets" | "Actions" | "Commons" | "Deep Link"): Promise<void> {
    await element(by.id(`bottomBarItem$${caption}`)).tap();
}

export async function tapMenuItem(caption: string): Promise<void> {
    const firstLetter = caption.split("")[0].toUpperCase();
    await element(by.text(firstLetter)).atIndex(0).tap();
    await element(by.text(caption)).tap();
}

export async function sleep(time: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time));
}
