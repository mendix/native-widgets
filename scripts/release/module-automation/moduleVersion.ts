import { basename, dirname } from "path";
import { exec } from "child_process";
import { readdir } from "fs/promises";
import { join } from "path";

type CommandResult = {
    code: number | null;
    output: string;
};

function runCommand(command: string, workingDirectory: string): Promise<CommandResult> {
    return new Promise(resolve => {
        exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
            const output = `${stdout}${stderr}`.trim();
            resolve({ code: error ? (error as unknown as { code?: number }).code ?? 1 : 0, output });
        });
    });
}

function dockerMxCommand(mendixVersion: string, projectFile: string, mxArguments: string): string {
    return (
        `docker run -t -v ${dirname(projectFile)}:/source --rm mxbuild:${mendixVersion} ` +
        `bash -c "mx ${mxArguments.replace("{project}", `/source/${basename(projectFile)}`)}"`
    );
}

async function findProjectFile(projectDir: string): Promise<string> {
    const entries = await readdir(projectDir, { withFileTypes: true });
    const projectFile = entries.find(entry => entry.isFile() && entry.name.endsWith(".mpr"));
    if (!projectFile) {
        throw new Error(`No .mpr file found in ${projectDir}`);
    }
    return join(projectDir, projectFile.name);
}

export async function setModuleVersion(
    projectDir: string,
    moduleName: string,
    version: string,
    mendixVersion: string
): Promise<void> {
    if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
        throw new Error(`Cannot set module version: "${version}" is not a SemVer major.minor.patch version`);
    }
    const projectFile = await findProjectFile(projectDir);

    const command = dockerMxCommand(
        mendixVersion,
        projectFile,
        `set-module-version {project} ${moduleName} ${version}`
    );
    const { code, output } = await runCommand(command, dirname(projectFile));
    if (code === 0) {
        console.log(`Set module "${moduleName}" version to ${version} via mx set-module-version.`);
    } else {
        throw new Error(
            `Failed to set version ${version} of module "${moduleName}" in ${projectFile}. Error: ${output || "<none>"}`
        );
    }
}
