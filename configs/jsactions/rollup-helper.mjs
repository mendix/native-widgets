/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { existsSync } from "fs";
import { join } from "path";
import fg from "fast-glob";
import shelljs from "shelljs";

const LICENSE_GLOB = "{licen[cs]e,LICEN[CS]E}?(.*)";

export async function copyLicenseFile(sourcePath, outDir) {
    const absolutePath = join(sourcePath, LICENSE_GLOB);
    const licenseFile = (await fg([absolutePath], { cwd: sourcePath, caseSensitiveMatch: false }))[0];
    if (existsSync(licenseFile)) {
        shelljs.cp(licenseFile, outDir);
    }
}

export const licenseCustomTemplate = dependencies =>
    JSON.stringify(
        dependencies.map(dependency => ({
            [dependency.name]: {
                version: dependency.version,
                ...(typeof dependency.isTransitive !== "undefined" ? { transitive: dependency.isTransitive } : null),
                url: dependency.homepage
            }
        }))
    );
