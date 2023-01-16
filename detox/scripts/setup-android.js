const { ANDROID_SDK_VERSION, ANDROID_DEVICE_TYPE } = require("../detox.config");
const { downloadFile, execCommand } = require("./helpers");

main().catch(e => {
    console.error(e);
    process.exit(-1);
});

async function main() {
    let targetProcessor = "x86_64";

    process.on("exit", exitCode => {
        return exitCode > 0 && console.log(`exiting the code implicitly ${exitCode}`);
    });

    process.argv.forEach(val => {
        if (val.startsWith("--target")) {
            const targetSliced = val.slice(val.indexOf("=") + 1, val.length);
            targetProcessor = targetSliced && targetSliced;
        }
    });

    if (!targetProcessor) {
        console.error(`Target processor (${targetProcessor}) is not valid!`);
        process.exit(1);
    }

    console.log("Downloading Android apps...");
    await Promise.all([
        downloadFile("https://www.dropbox.com/s/18szmaf73l1docj/app-detox-debug-androidTest.apk?dl=1"),
        downloadFile("https://www.dropbox.com/s/rya9h4fohvhl2fl/app-detox-debug.apk?dl=1")
    ]);

    console.log(`Installing Android SDK version ${ANDROID_SDK_VERSION}, target ${targetProcessor}...`);
    execCommand(`sdkmanager 'system-images;android-${ANDROID_SDK_VERSION};google_apis;${targetProcessor}'`);
    execCommand("sdkmanager --licenses");

    console.log("Creating Android emulator...");
    execCommand(
        `avdmanager -s create avd -n NATIVE_${ANDROID_DEVICE_TYPE}_${ANDROID_SDK_VERSION} -k 'system-images;android-${ANDROID_SDK_VERSION};google_apis;${targetProcessor}' -f -d '${ANDROID_DEVICE_TYPE}' -c 1000M`
    );

    console.log("Done!");
}
