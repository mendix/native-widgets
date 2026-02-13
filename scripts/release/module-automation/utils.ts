import { access, copyFile, rename, rm } from "fs/promises";
import { basename, join } from "path";
import { globSync } from "glob";
import { exec } from "child_process";

type OssReadMeValidationCriteria = {
    package: string;
    version: string;
};

export async function getOssFiles(
    folderPath: string,
    validationCriteria?: OssReadMeValidationCriteria
): Promise<Array<{ src: string; dest: string }>> {
    if (!folderPath || typeof folderPath !== "string") {
        throw new TypeError(`Invalid folderPath: ${folderPath}`);
    }

    const license = join(folderPath, `License.txt`);
    try {
        await access(license);
    } catch {
        throw new Error(`License file not found at expected location: ${license}`);
    }

    const readmePattern = "*__*__READMEOSS_*.html";
    const readme = globSync(readmePattern, { cwd: folderPath, absolute: true, ignore: "**/.*/**" })[0];
    if (validationCriteria) {
        validateOssReadme(readme, validationCriteria);
    }
    return [{ src: license, dest: basename(license) }, ...(readme ? [{ src: readme, dest: basename(readme) }] : [])];
}

type FilePathPair = { src: string; dest: string };

export async function copyFilesToMpk(files: FilePathPair[], mpkOutput: string, moduleName: string): Promise<void> {
    const projectPath = mpkOutput.replace(".mpk", "");
    // Unzip the mpk
    await unzip(mpkOutput, projectPath);
    await rm(mpkOutput, { recursive: true, force: true });
    // Add additional files to the MPK
    for await (const file of files) {
        await copyFile(file.src, join(projectPath, file.dest));
    }
    // Re-zip and rename
    await zip(projectPath, moduleName);
    await rename(`${projectPath}.zip`, mpkOutput);
}

export function zip(src: string, fileName: string): Promise<string> {
    return execShellCommand(`cd "${src}" && zip -r ../${fileName} .`);
}

export function unzip(src: string, dest: string): Promise<string> {
    return execShellCommand(`unzip "${src}" -d "${dest}"`);
}

export function execShellCommand(cmd: string, workingDirectory = process.cwd()): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: workingDirectory }, (error, stdout, stderr) => {
            if (error) {
                console.warn(stderr);
                console.warn(stdout);
                reject(error);
            }
            if (stderr) {
                console.warn(stderr);
            }
            resolve(stdout);
        });
    });
}

export function validateOssReadme(ossReadme: string, validationCriteria: OssReadMeValidationCriteria): void {
    if (!ossReadme || typeof ossReadme !== "string") {
        throw new TypeError(`Invalid OSS README path/name: ${ossReadme}`);
    }
    if (!validationCriteria.version || typeof validationCriteria.version !== "string") {
        throw new TypeError(`Invalid version: ${validationCriteria.version}`);
    }
    if (!validationCriteria.package || typeof validationCriteria.package !== "string") {
        throw new TypeError(`Invalid package name: ${validationCriteria.package}`);
    }

    const fileName = basename(ossReadme);
    const expectedPackage = validationCriteria.package.trim();
    const expectedVersion = validationCriteria.version.trim();

    // File name pattern: SiemensMendix<PACKAGE>__<VERSION>__READMEOSS_*.html
    // Example: SiemensMendixNanoflowCommons__6.3.1__READMEOSS_2026-02-10__04-28-37.html
    const parsed = fileName.match(/^SiemensMendix(.+?)__(.+?)__READMEOSS_(.+)\.html$/);

    if (!parsed) {
        throw new Error(
            `OSS README validation failed: '${fileName}' does not match expected pattern ` +
                `'SiemensMendix<PACKAGE>__<VERSION>__READMEOSS_*.html'.`
        );
    }

    const foundPackage = parsed[1];
    const foundVersion = parsed[2];

    if (foundPackage !== expectedPackage) {
        throw new Error(
            `OSS README validation failed: expected package '${expectedPackage}' but found '${foundPackage}' in '${fileName}'.`
        );
    }

    if (foundVersion !== expectedVersion) {
        throw new Error(
            `OSS README validation failed: expected version '${expectedVersion}' but found '${foundVersion}' in '${fileName}'.`
        );
    }
}
