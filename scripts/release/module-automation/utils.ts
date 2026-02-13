import { access, copyFile, rename, rm } from "fs/promises";
import { basename, join } from "path";
import { globSync } from "glob";
import { exec } from "child_process";

export async function getOssFiles(
    folderPath: string,
    isOssReadmeRequired: boolean
): Promise<Array<{ src: string; dest: string }>> {
    if (!folderPath || typeof folderPath !== "string") {
        throw new TypeError(`Invalid folderPath: ${folderPath}`);
    }

    const licenseFile = join(folderPath, `License.txt`);
    try {
        await access(licenseFile);
    } catch {
        throw new Error(`License file not found at expected location: ${licenseFile}`);
    }

    const readmeossPattern = "*__*__READMEOSS_*.html";
    const readmeossFiles = globSync(readmeossPattern, { cwd: folderPath, absolute: true, ignore: "**/.*/**" });

    if (isOssReadmeRequired && readmeossFiles.length === 0) {
        throw new Error(`No OSS README file found in ${folderPath} matching ${readmeossPattern}`);
    }

    if (readmeossFiles.length === 0) {
        return [{ src: licenseFile, dest: basename(licenseFile) }];
    }

    const ossReadmeFile = readmeossFiles[0];

    return [
        { src: licenseFile, dest: basename(licenseFile) },
        { src: ossReadmeFile, dest: basename(ossReadmeFile) }
    ];
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

function execShellCommand(cmd: string, workingDirectory = process.cwd()): Promise<string> {
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
