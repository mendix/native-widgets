const { basename, extname, join, resolve } = require("path");
const { access, readdir, copyFile, readFile, writeFile, rename, rm, mkdir, chmod } = require("fs/promises");
const { exec } = require("child_process");

const regex = {
    changelogs: /(?<=## \[unreleased\]\n)((?!## \[\d+\.\d+\.\d+\])\W|\w)*/i,
    changelogsIncludingUnreleased: /## \[unreleased\]\n?((?!## \[\d+\.\d+\.\d+\])\W|\w)*/i,
    releasedVersions: /(?<=## \[)\d+\.\d+\.\d+(?=\])/g,
    excludeFiles: "^(resources|userlib)/.*"
};

async function setLocalGitCredentials(workingDirectory) {
    await execShellCommand(`git config user.name "${process.env.GH_NAME}"`, workingDirectory);
    await execShellCommand(`git config user.email "${process.env.GH_EMAIL}"`, workingDirectory);
}

function execShellCommand(cmd, workingDirectory = process.cwd()) {
    console.log(`[EXEC] Running command: ${cmd} in directory: ${workingDirectory}`);
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: workingDirectory }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[EXEC ERROR] Command failed: ${cmd}`);
                console.error(`[EXEC ERROR] Working directory: ${workingDirectory}`);
                console.error(`[EXEC ERROR] Stderr: ${stderr}`);
                console.error(`[EXEC ERROR] Stdout: ${stdout}`);
                console.error(`[EXEC ERROR] Error: ${error.message}`);
                reject(error);
            }
            if (stderr) {
                console.warn(`[EXEC WARN] Stderr: ${stderr}`);
            }
            console.log(`[EXEC SUCCESS] Command completed: ${cmd}`);
            resolve(stdout);
        });
    });
}

async function getFiles(dir, includeExtension = []) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        dirents
            .filter(dirent => !dirent.name.startsWith("."))
            .map(dirent => {
                const res = resolve(dir, dirent.name);
                return dirent.isDirectory() ? getFiles(res, includeExtension) : res;
            })
    );
    return files
        .flat()
        .filter(file => !includeExtension?.length || (extname(file) && includeExtension?.includes(extname(file))));
}

async function getPackageInfo(path) {
    const pkgPath = join(path, `package.json`);
    try {
        await access(pkgPath);
        const { name, widgetName, moduleName, version, marketplace, testProject, repository } = require(pkgPath);
        const packageInfo = {
            nameWithDash: name,
            nameWithSpace: moduleName ?? widgetName,
            version,
            minimumMXVersion: marketplace?.minimumMXVersion,
            url: repository?.url,
            testProjectUrl: testProject?.githubUrl,
            testProjectBranchName: testProject?.branchName,
            changelogPath: `${path}/CHANGELOG.md`
        };

        console.log(`[PACKAGE INFO] Loading package info from: ${pkgPath}`);
        console.log(`[PACKAGE INFO] Name: ${packageInfo.nameWithSpace} (${packageInfo.nameWithDash})`);
        console.log(`[PACKAGE INFO] Version: ${packageInfo.version}`);
        console.log(`[PACKAGE INFO] Minimum MX Version: ${packageInfo.minimumMXVersion}`);
        console.log(`[PACKAGE INFO] Repository URL: ${packageInfo.url}`);
        console.log(`[PACKAGE INFO] Test Project URL: ${packageInfo.testProjectUrl}`);
        console.log(`[PACKAGE INFO] Test Project Branch: ${packageInfo.testProjectBranchName}`);

        return packageInfo;
    } catch (error) {
        console.error(`[PACKAGE INFO ERROR] Path does not exist: ${pkgPath}`);
        console.error(`[PACKAGE INFO ERROR] Error details: ${error.message}`);
        console.error(`[PACKAGE INFO ERROR] Stack trace: ${error.stack}`);
        return null;
    }
}

// Create reusable mxbuild image
async function createModuleMpkInDocker(sourceDir, moduleName, mendixVersion, excludeFilesRegExp) {
    const existingImages = (await execShellCommand(`docker image ls -q mxbuild:${mendixVersion}`)).toString().trim();
    if (!existingImages) {
        console.log(`Creating new mxbuild docker image...`);
        await execShellCommand(
            `docker build -f ${join(process.cwd(), "scripts/automation/mxbuild.Dockerfile")} ` +
                `--build-arg MENDIX_VERSION=${mendixVersion} ` +
                `-t mxbuild:${mendixVersion} ${process.cwd()}`
        );
    }

    // Build testProject via mxbuild
    const projectFile = basename((await getFiles(sourceDir, [`.mpr`]))[0]);
    await execShellCommand(
        `docker run -t -v ${sourceDir}:/source ` +
            `--rm mxbuild:${mendixVersion} bash -c "mx update-widgets --loose-version-check /source/${projectFile} && dotnet /tmp/mxbuild/modeler/mx.dll create-module-package ${
                excludeFilesRegExp ? `--exclude-files='${excludeFilesRegExp}'` : ""
            } /source/${projectFile} ${moduleName}"`
    );
    console.log(`Module ${moduleName} created successfully.`);
}

async function bumpVersionInPackageJson(moduleFolder, moduleInfo) {
    const moduleVersionNew = process.env.TAG?.split("-v")?.[1];

    console.log(`[VERSION BUMP] Processing version bump for: ${moduleInfo.nameWithSpace}`);
    console.log(`[VERSION BUMP] Current version: ${moduleInfo.version}`);
    console.log(`[VERSION BUMP] Target version: ${moduleVersionNew}`);
    console.log(`[VERSION BUMP] Module folder: ${moduleFolder}`);
    console.log(`[VERSION BUMP] TAG environment variable: ${process.env.TAG}`);

    if (moduleInfo.version === moduleVersionNew) {
        const errorMessage = `It looks like version ${moduleInfo.version} of "${moduleInfo.nameWithSpace}" has been released already. Did you manually bump the version without releasing? Then you should revert the bump before retrying.`;
        console.error(`[VERSION BUMP ERROR] ${errorMessage}`);
        throw new Error(errorMessage);
    } else {
        console.log(
            `[VERSION BUMP] Bumping "${moduleInfo.nameWithSpace}" version from ${moduleInfo.version} to ${moduleVersionNew}..`
        );

        try {
            const pkgPath = join(moduleFolder, "package.json");
            const pkg = require(pkgPath);
            moduleInfo.version = pkg.version = moduleVersionNew;
            await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

            console.log(`[VERSION BUMP] Successfully updated package.json at: ${pkgPath}`);
            console.log(`[VERSION BUMP] New version set: ${moduleVersionNew}`);
        } catch (error) {
            console.error(`[VERSION BUMP ERROR] Failed to update package.json`);
            console.error(`[VERSION BUMP ERROR] Module: ${moduleInfo.nameWithSpace}`);
            console.error(`[VERSION BUMP ERROR] Folder: ${moduleFolder}`);
            console.error(`[VERSION BUMP ERROR] Current version: ${moduleInfo.version}`);
            console.error(`[VERSION BUMP ERROR] Target version: ${moduleVersionNew}`);
            console.error(`[VERSION BUMP ERROR] Error: ${error.message}`);
            console.error(`[VERSION BUMP ERROR] Stack trace: ${error.stack}`);
            throw error;
        }
    }
    return moduleInfo;
}

async function writeToWidgetChangelogs(changelogs, { nameWithSpace, changelogPath, version }) {
    const d = new Date();
    const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const content = await readFile(changelogPath, "utf8");
    const oldChangelogs = content.match(regex.changelogs)?.[0].trim();
    const newContent = content
        .replace(oldChangelogs, changelogs)
        .replace(`## [Unreleased]`, `## [Unreleased]\n\n## [${version}] - ${date}`);
    await writeFile(changelogPath, newContent);
}

async function writeToModuleChangelogs(changelogs, { nameWithSpace, changelogPath, version }) {
    const d = new Date();
    const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const content = await readFile(changelogPath, "utf8");
    const oldChangelogs = content.match(regex.changelogsIncludingUnreleased)?.[0].trim();
    const newContent = content.replace(
        oldChangelogs,
        `## [Unreleased]\n\n## [${version}] ${nameWithSpace} - ${date}\n${changelogs}`
    );
    await writeFile(changelogPath, newContent);
}

async function getUnreleasedChangelogs({ version, changelogPath }) {
    try {
        await access(changelogPath);
        const content = await readFile(changelogPath, "utf8");
        const changelogs = content.match(regex.changelogs)?.[0].trim();
        const releasedVersions = content.match(regex.releasedVersions);
        if (releasedVersions?.includes(version)) {
            throw new Error(
                `It looks like version ${version} from package.json is already released. Did you forget to bump the version? Path: ${changelogPath}`
            );
        }

        return changelogs || "";
    } catch (error) {
        console.error(error.message);
    }
}

// Update changelogs and create PR in widget-resources
async function commitAndCreatePullRequest(moduleInfo) {
    const changelogBranchName = `${moduleInfo.nameWithDash}-release-${moduleInfo.version}`;

    console.log(`[BRANCH] Creating branch: ${changelogBranchName}`);
    console.log(`[BRANCH] Module: ${moduleInfo.nameWithSpace}`);
    console.log(`[BRANCH] Version: ${moduleInfo.version}`);

    try {
        // Check if branch already exists locally or remotely and delete it
        const branchExists = await execShellCommand(`git branch --list ${changelogBranchName}`)
            .then(output => output.trim().length > 0)
            .catch(() => false);

        const remoteBranchExists = await execShellCommand(`git ls-remote --heads origin ${changelogBranchName}`)
            .then(output => output.trim().length > 0)
            .catch(() => false);

        if (branchExists) {
            console.log(`[BRANCH] Local branch ${changelogBranchName} exists, deleting it`);
            await execShellCommand(`git branch -D ${changelogBranchName}`);
        }

        if (remoteBranchExists) {
            console.log(`[BRANCH] Remote branch ${changelogBranchName} exists, deleting it`);
            await execShellCommand(`git push origin --delete ${changelogBranchName}`);
        }

        // Create new branch and push
        await execShellCommand(
            `git checkout -b ${changelogBranchName} && git add . && git commit -m "chore(${moduleInfo.nameWithDash}): update changelogs" && git push --set-upstream origin ${changelogBranchName}`
        );

        await execShellCommand(
            `gh pr create --title "${moduleInfo.nameWithSpace}: Updating changelogs" --body "This is an automated PR." --base main --head ${changelogBranchName}`
        );

        console.log(`[BRANCH] Created PR for changelog updates on branch: ${changelogBranchName}`);
    } catch (error) {
        console.error(`[BRANCH ERROR] Failed to create branch and PR`);
        console.error(`[BRANCH ERROR] Branch name: ${changelogBranchName}`);
        console.error(`[BRANCH ERROR] Module: ${moduleInfo.nameWithSpace}`);
        console.error(`[BRANCH ERROR] Version: ${moduleInfo.version}`);
        console.error(`[BRANCH ERROR] Error: ${error.message}`);
        console.error(`[BRANCH ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function updateWidgetChangelogs(widgetsFolders) {
    console.log("Updating widget changelogs..");
    const nativeWidgetsChangelogs = [];
    for await (const folder of widgetsFolders) {
        const widgetInfo = await getPackageInfo(folder);
        if (!widgetInfo) {
            continue;
        }
        const widgetChangelogs = await getUnreleasedChangelogs(widgetInfo);
        if (widgetChangelogs) {
            nativeWidgetsChangelogs.push(`## [${widgetInfo.version}] ${widgetInfo.nameWithSpace}\n${widgetChangelogs}`);
            console.log(`Writing "${widgetInfo.nameWithSpace}" changelogs to ${widgetInfo.changelogPath}`);
            await writeToWidgetChangelogs(widgetChangelogs, widgetInfo);
        }
    }
    return nativeWidgetsChangelogs;
}

async function updateModuleChangelogs(moduleInfo, nativeWidgetsChangelogs) {
    console.log("Updating module changelogs..");
    const moduleChangelogs = await getUnreleasedChangelogs(moduleInfo);
    const newModuleChangelogs = nativeWidgetsChangelogs?.length
        ? `${moduleChangelogs}\n\n${nativeWidgetsChangelogs.join("\n\n")}`
        : moduleChangelogs;
    if (newModuleChangelogs) {
        console.log(`Writing "${moduleInfo.nameWithSpace}" changelogs to ${moduleInfo.changelogPath}`);
        await writeToModuleChangelogs(newModuleChangelogs, moduleInfo);
    }
    return newModuleChangelogs;
}

async function updateChangelogs(widgetFolders, moduleInfo) {
    const nativeWidgetsChangelogs = await updateWidgetChangelogs(widgetFolders);
    return updateModuleChangelogs(moduleInfo, nativeWidgetsChangelogs);
}

async function githubAuthentication(moduleInfo) {
    await setLocalGitCredentials();
    await execShellCommand(
        `git remote set-url origin https://${process.env.GH_USERNAME}:${process.env.GH_PAT}@${moduleInfo.url.replace(
            "https://",
            ""
        )}`
    );
    await execShellCommand(`echo "${process.env.GH_PAT}" | gh auth login --with-token`);
}

async function cloneRepo(githubUrl, localFolder) {
    const githubUrlDomain = githubUrl.replace("https://", "");
    const githubUrlAuthenticated = `https://${process.env.GH_USERNAME}:${process.env.GH_PAT}@${githubUrlDomain}`;
    await rm(localFolder, { recursive: true, force: true });
    await mkdir(localFolder, { recursive: true });
    await execShellCommand(`git clone ${githubUrlAuthenticated} ${localFolder}`);
    await setLocalGitCredentials(localFolder);
}

async function createMPK(tmpFolder, moduleInfo, excludeFilesRegExp) {
    console.log(`[MPK CREATION] Starting MPK creation process`);
    console.log(`[MPK CREATION] Module: ${moduleInfo.nameWithSpace} (${moduleInfo.moduleNameInModeler})`);
    console.log(`[MPK CREATION] Version: ${moduleInfo.version}`);
    console.log(`[MPK CREATION] Minimum MX Version: ${moduleInfo.minimumMXVersion}`);
    console.log(`[MPK CREATION] Temporary folder: ${tmpFolder}`);
    console.log(`[MPK CREATION] Exclude files regex: ${excludeFilesRegExp}`);

    try {
        await createModuleMpkInDocker(
            tmpFolder,
            moduleInfo.moduleNameInModeler,
            moduleInfo.minimumMXVersion,
            excludeFilesRegExp
        );

        const mpkFiles = await getFiles(tmpFolder, [`.mpk`]);
        const mpkOutput = mpkFiles[0];

        console.log(`[MPK CREATION] Successfully created MPK: ${mpkOutput}`);
        return mpkOutput;
    } catch (error) {
        console.error(`[MPK CREATION ERROR] Failed to create MPK`);
        console.error(`[MPK CREATION ERROR] Module: ${moduleInfo.nameWithSpace} (${moduleInfo.moduleNameInModeler})`);
        console.error(`[MPK CREATION ERROR] Version: ${moduleInfo.version}`);
        console.error(`[MPK CREATION ERROR] MX Version: ${moduleInfo.minimumMXVersion}`);
        console.error(`[MPK CREATION ERROR] Temporary folder: ${tmpFolder}`);
        console.error(`[MPK CREATION ERROR] Exclude regex: ${excludeFilesRegExp}`);
        console.error(`[MPK CREATION ERROR] Error: ${error.message}`);
        console.error(`[MPK CREATION ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput) {
    console.log(`[GITHUB RELEASE] Creating GitHub release for module: ${moduleInfo.nameWithSpace}`);
    console.log(`[GITHUB RELEASE] Version: ${moduleInfo.version}`);
    console.log(`[GITHUB RELEASE] MX Version: ${moduleInfo.minimumMXVersion}`);
    console.log(`[GITHUB RELEASE] Tag: ${process.env.TAG}`);
    console.log(`[GITHUB RELEASE] MPK Output: ${mpkOutput}`);

    try {
        await createGithubReleaseFrom({
            title: `${moduleInfo.nameWithSpace} ${moduleInfo.version} - Mendix ${moduleInfo.minimumMXVersion}`,
            body: moduleChangelogs,
            tag: process.env.TAG,
            mpkOutput
        });

        console.log(
            `[GITHUB RELEASE] Successfully created GitHub release for: ${moduleInfo.nameWithSpace} ${moduleInfo.version}`
        );
    } catch (error) {
        console.error(`[GITHUB RELEASE ERROR] Failed to create GitHub release`);
        console.error(`[GITHUB RELEASE ERROR] Module: ${moduleInfo.nameWithSpace}`);
        console.error(`[GITHUB RELEASE ERROR] Version: ${moduleInfo.version}`);
        console.error(`[GITHUB RELEASE ERROR] MX Version: ${moduleInfo.minimumMXVersion}`);
        console.error(`[GITHUB RELEASE ERROR] Tag: ${process.env.TAG}`);
        console.error(`[GITHUB RELEASE ERROR] MPK Output: ${mpkOutput}`);
        console.error(`[GITHUB RELEASE ERROR] Error: ${error.message}`);
        console.error(`[GITHUB RELEASE ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createGithubReleaseFrom({ title, body = "", tag, mpkOutput, isDraft = false }) {
    const command = [
        `gh release create`,
        `--title '${title}'`,
        `--notes '${body.replaceAll("'", "`")}'`,
        isDraft ? "--draft" : "",
        `'${tag}'`,
        `'${mpkOutput}'`
    ]
        .filter(str => str !== "")
        .join(" ");

    await execShellCommand(command);
}

function zip(src, fileName) {
    return execShellCommand(`cd "${src}" && zip -r ../${fileName} .`);
}

function unzip(src, dest) {
    return execShellCommand(`unzip "${src}" -d "${dest}"`);
}

// Unzip the module, copy the widget and update package.xml
async function exportModuleWithWidgets(moduleName, mpkOutput, widgetsFolders) {
    console.log(`Adding ${widgetsFolders.length} widgets to module ${moduleName}`);
    const projectPath = mpkOutput.replace(".mpk", "");
    const packageXmlFile = join(projectPath, "package.xml");
    const widgetsDestination = join(projectPath, "widgets");
    const widgetEntries = [];
    // Unzip the mpk
    await unzip(mpkOutput, projectPath);
    await rm(mpkOutput, { recursive: true, force: true });
    // Copy widgets to widgets folder
    await mkdir(widgetsDestination, { recursive: true });
    for await (const folder of widgetsFolders) {
        console.log(`Adding ${basename(folder)} to ${moduleName}`);
        const src = (await getFiles(folder, [`.mpk`]))[0];
        const fileName = basename(src);
        const dest = join(widgetsDestination, fileName);
        widgetEntries.push(fileName);
        try {
            // explicitly set the dest mode, in certain scenarios the file is read only
            // https://chmodcommand.com/chmod-644/
            await chmod(dest, 0o644);
        } catch (chmodError) {
            console.warn(`[EXPORT MODULE] Could not change file permissions for ${dest}: ${chmodError.message}`);
        }
        await copyFile(src, dest);
    }
    // Add entries to the package.xml
    try {
        const content = await readFile(packageXmlFile, "utf8");
        if (content.length) {
            const filesEntry = "</files>";
            const filesContent = widgetEntries.map(mpkFile => `<file path="widgets/${mpkFile}" />`).join("\n\t\t\t");
            const [beginning, end] = content.split(filesEntry);
            const newContent = `${beginning}\t${filesContent}\n\t\t${filesEntry}${end}`;
            await writeFile(packageXmlFile, newContent);
        }
    } catch (e) {
        throw new Error(`Including widgets in module failed. package.xml of widget/module ${moduleName} not found`);
    }
    // Re-zip and rename
    await zip(projectPath, moduleName);
    await rename(`${projectPath}.zip`, mpkOutput);
}

module.exports = {
    setLocalGitCredentials,
    execShellCommand,
    getFiles,
    getPackageInfo,
    getUnreleasedChangelogs,
    githubAuthentication,
    createModuleMpkInDocker,
    bumpVersionInPackageJson,
    commitAndCreatePullRequest,
    updateWidgetChangelogs,
    updateModuleChangelogs,
    updateChangelogs,
    cloneRepo,
    createMPK,
    createGithubRelease,
    createGithubReleaseFrom,
    writeToWidgetChangelogs,
    zip,
    unzip,
    exportModuleWithWidgets,
    regex
};
