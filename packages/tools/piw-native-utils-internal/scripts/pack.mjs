// Packs the utilities into a tarball that other projects can install, for example the Mendix client:
//   node scripts/pack.mjs <destination folder> [file name]
//
// The package.json that ships in the tarball has no scripts and no dev dependencies. The scripts of this
// workspace package (postinstall and prepare build the sources) would otherwise run when the tarball is installed
// and fail, because the sources are not part of it.
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(process.argv[2] ?? ".");
const fileName = process.argv[3];

if (!existsSync(join(packageDir, "dist"))) {
    throw new Error("There is no dist folder. Build the package first.");
}

const stage = mkdtempSync(join(tmpdir(), "piw-native-utils-pack-"));
try {
    cpSync(join(packageDir, "dist"), join(stage, "dist"), { recursive: true });
    for (const file of ["menu.js", "menu.d.ts"]) {
        copyFileSync(join(packageDir, file), join(stage, file));
    }
    // The licence lives in the root of the repository
    const license = resolve(packageDir, "../../../LICENSE");
    if (existsSync(license)) {
        copyFileSync(license, join(stage, "LICENSE"));
    }

    const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
    delete manifest.scripts;
    delete manifest.devDependencies;
    writeFileSync(join(stage, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const packed = execFileSync("npm", ["pack", "--pack-destination", destination, "--silent"], {
        cwd: stage,
        encoding: "utf8"
    })
        .trim()
        .split("\n")
        .pop();

    const result = fileName ? join(destination, fileName) : join(destination, packed);
    if (fileName) {
        renameSync(join(destination, packed), result);
    }
    console.log(result);
} finally {
    rmSync(stage, { recursive: true, force: true });
}
