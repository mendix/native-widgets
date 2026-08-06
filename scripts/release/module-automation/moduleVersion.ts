import { basename, dirname } from "path";
import { exec } from "child_process";
import { findProjectFile, readModuleVersionFromProject, setModuleVersionInProject } from "./setModuleVersion";

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

// Runs in the same image createModuleMpkInDocker uses, whose /bin/mx wraps mx.dll. The
// project directory is mounted at /source so mx writes to the caller's copy.
function dockerMxCommand(mendixVersion: string, projectFile: string, mxArguments: string): string {
    return (
        `docker run -t -v ${dirname(projectFile)}:/source --rm mxbuild:${mendixVersion} ` +
        `bash -c "mx ${mxArguments.replace("{project}", `/source/${basename(projectFile)}`)}"`
    );
}

/**
 * Set a module's version, preferring `mx set-module-version` and falling back to patching
 * the project file directly.
 *
 * The CLI is the supported route, but it only accepts modules authored as add-on modules
 * and exits 1 with "does not have a version" for anything else — which is the case for
 * every module this repo releases. The fallback is therefore the path taken today; the CLI
 * is tried first so that a future Studio Pro version, or a module converted to an add-on,
 * silently starts using the supported route instead.
 *
 * Either way the resulting version is read back from the project and verified, so a
 * silently ineffective write fails the release rather than shipping a wrong version.
 */
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

    let usedCli = false;
    if (mendixVersion) {
        const command = dockerMxCommand(
            mendixVersion,
            projectFile,
            `set-module-version {project} ${moduleName} ${version}`
        );
        const { code, output } = await runCommand(command, dirname(projectFile));
        if (code === 0) {
            console.log(`Set module "${moduleName}" version to ${version} via mx set-module-version.`);
            usedCli = true;
        } else {
            console.log(
                `mx set-module-version could not set the version of "${moduleName}" (exit ${code}), ` +
                    `falling back to patching the project file. Output: ${output || "<none>"}`
            );
        }
    } else {
        console.log(`No Mendix version given, patching the project file directly for "${moduleName}".`);
    }

    if (!usedCli) {
        await setModuleVersionInProject(projectDir, moduleName, version);
    }

    const written = await readModuleVersionFromProject(projectDir, moduleName);
    if (written !== version) {
        throw new Error(
            `Failed to set version of module "${moduleName}" in ${projectFile}: ` +
                `expected ${version}, found ${written ?? "<none>"}`
        );
    }
}
