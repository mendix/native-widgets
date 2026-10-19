// Google MLKit (pulled in by react-native-vision-camera-barcode-scanner) ships fat static
// frameworks whose arm64 slice is tagged for iOS devices only, so linking an arm64 simulator
// build fails with "building for 'iOS-simulator', but linking in object file ... built for 'iOS'".
// This re-tags the arm64 objects as iOS-simulator in place (LC_BUILD_VERSION platform 2 -> 7).
// Only meant for the e2e simulator build; never ship the patched binaries.
const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join, basename } = require("path");

const podsDir = process.argv[2] || join(__dirname, "../../../native-template/ios/Pods");
const PODS = ["MLImage", "MLKitBarcodeScanning", "MLKitCommon", "MLKitVision"];

const FAT_MAGIC = 0xcafebabe;
const MH_MAGIC_64 = 0xfeedfacf;
const CPU_TYPE_ARM64 = 0x0100000c;
const LC_BUILD_VERSION = 0x32;
const PLATFORM_IOS = 2;
const PLATFORM_IOSSIMULATOR = 7;

function patchMachO(buf, offset) {
    if (buf.readUInt32LE(offset) !== MH_MAGIC_64 || buf.readUInt32LE(offset + 4) !== CPU_TYPE_ARM64) {
        return 0;
    }
    const ncmds = buf.readUInt32LE(offset + 16);
    let cmdOffset = offset + 32;
    let patched = 0;
    for (let i = 0; i < ncmds; i++) {
        const cmd = buf.readUInt32LE(cmdOffset);
        if (cmd === LC_BUILD_VERSION && buf.readUInt32LE(cmdOffset + 8) === PLATFORM_IOS) {
            buf.writeUInt32LE(PLATFORM_IOSSIMULATOR, cmdOffset + 8);
            patched++;
        }
        cmdOffset += buf.readUInt32LE(cmdOffset + 4);
    }
    return patched;
}

function patchArchive(buf, start, end) {
    let offset = start + 8; // "!<arch>\n"
    let patched = 0;
    while (offset + 60 <= end) {
        const name = buf.toString("ascii", offset, offset + 16).trim();
        const size = parseInt(buf.toString("ascii", offset + 48, offset + 58).trim(), 10);
        let data = offset + 60;
        // BSD long names: "#1/<len>" means the name is stored at the start of the member data.
        if (name.startsWith("#1/")) {
            data += parseInt(name.slice(3), 10);
        }
        patched += patchMachO(buf, data);
        offset += 60 + size + (size % 2);
    }
    return patched;
}

function patchSlice(buf, start, end) {
    if (buf.toString("ascii", start, start + 8) === "!<arch>\n") {
        return patchArchive(buf, start, end);
    }
    return patchMachO(buf, start);
}

function patchBinary(path) {
    const buf = readFileSync(path);
    let patched = 0;
    if (buf.readUInt32BE(0) === FAT_MAGIC) {
        const nfat = buf.readUInt32BE(4);
        for (let i = 0; i < nfat; i++) {
            const arch = 8 + i * 20;
            if (buf.readUInt32BE(arch) !== CPU_TYPE_ARM64) {
                continue;
            }
            const start = buf.readUInt32BE(arch + 8);
            patched += patchSlice(buf, start, start + buf.readUInt32BE(arch + 12));
        }
    } else {
        patched += patchSlice(buf, 0, buf.length);
    }
    if (patched > 0) {
        writeFileSync(path, buf);
    }
    console.log(`${path}: re-tagged ${patched} arm64 object(s) as iOS-simulator`);
}

for (const pod of PODS) {
    const frameworksDir = join(podsDir, pod, "Frameworks");
    if (!existsSync(frameworksDir)) {
        console.log(`${frameworksDir} not found, skipping`);
        continue;
    }
    for (const framework of readdirSync(frameworksDir).filter(f => f.endsWith(".framework"))) {
        patchBinary(join(frameworksDir, framework, basename(framework, ".framework")));
    }
}
