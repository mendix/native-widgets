const { basename, join, dirname } = require("path");
const { readdir, copyFile, rm, mkdir } = require("fs/promises");
const {
    execShellCommand,
    getFiles,
    getPackageInfo,
    bumpVersionInPackageJson,
    commitAndCreatePullRequest,
    updateChangelogs,
    updateModuleChangelogs,
    githubAuthentication,
    cloneRepo,
    createMPK,
    createGithubRelease,
    exportModuleWithWidgets,
    regex
} = require("./module-automation/commons");

const repoRootPath = join(__dirname, "../../");
const [moduleFolderNameInRepo, version] = process.env.TAG.split("-v");

console.log(`[NATIVE MODULES] Starting native modules creation process`);
console.log(`[NATIVE MODULES] Repository root path: ${repoRootPath}`);
console.log(`[NATIVE MODULES] Module folder name: ${moduleFolderNameInRepo}`);
console.log(`[NATIVE MODULES] Version: ${version}`);
console.log(`[NATIVE MODULES] TAG environment variable: ${process.env.TAG}`);

main().catch(e => {
    console.error(`[NATIVE MODULES ERROR] Main process failed`);
    console.error(`[NATIVE MODULES ERROR] Module folder: ${moduleFolderNameInRepo}`);
    console.error(`[NATIVE MODULES ERROR] Version: ${version}`);
    console.error(`[NATIVE MODULES ERROR] TAG: ${process.env.TAG}`);
    console.error(`[NATIVE MODULES ERROR] Repository root: ${repoRootPath}`);
    console.error(`[NATIVE MODULES ERROR] Error: ${e.message}`);
    console.error(`[NATIVE MODULES ERROR] Stack trace: ${e.stack}`);
    process.exit(1);
});

async function main() {
    const modules = ["mobile-resources-native", "nanoflow-actions-native", "atlas-content-native"];

    console.log(`[MAIN] Supported modules: ${modules.join(", ")}`);
    console.log(`[MAIN] Checking if module '${moduleFolderNameInRepo}' is supported`);
    console.log(`[MAIN] Version to process: ${version}`);

    if (!modules.includes(moduleFolderNameInRepo) || !version) {
        console.log(`[MAIN] Skipping - module '${moduleFolderNameInRepo}' not in supported list or version missing`);
        console.log(`[MAIN] Supported modules: ${modules.join(", ")}`);
        console.log(`[MAIN] Provided module: ${moduleFolderNameInRepo}`);
        console.log(`[MAIN] Provided version: ${version}`);
        return;
    }

    console.log(`[MAIN] Processing module: ${moduleFolderNameInRepo} version ${version}`);

    switch (moduleFolderNameInRepo) {
        case "mobile-resources-native":
            console.log(`[MAIN] Creating Native Mobile Resources Module`);
            await createNativeMobileResourcesModule();
            break;
        case "nanoflow-actions-native":
            console.log(`[MAIN] Creating Nanoflow Commons Module`);
            await createNanoflowCommonsModule();
            break;
        case "atlas-content-native":
            console.log(`[MAIN] Creating Atlas Native Content Module`);
            await createAtlasNativeContentModule();
            break;
    }

    console.log(`[MAIN] Successfully completed processing for module: ${moduleFolderNameInRepo}`);
}

async function createNativeMobileResourcesModule() {
    console.log(`[MOBILE RESOURCES] Creating the Native Mobile Resource module`);

    try {
        const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
        const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);
        const widgetFolders = await readdir(join(repoRootPath, "packages/pluggableWidgets"));
        const nativeWidgetFolders = widgetFolders
            .filter(folder => folder.includes("-native"))
            .map(folder => join(repoRootPath, "packages/pluggableWidgets", folder));

        console.log(`[MOBILE RESOURCES] Module folder: ${moduleFolder}`);
        console.log(`[MOBILE RESOURCES] Temporary folder: ${tmpFolder}`);
        console.log(`[MOBILE RESOURCES] Found ${nativeWidgetFolders.length} native widget folders`);
        console.log(
            `[MOBILE RESOURCES] Native widget folders: ${nativeWidgetFolders.map(f => basename(f)).join(", ")}`
        );

        let moduleInfo = {
            ...(await getPackageInfo(moduleFolder)),
            moduleNameInModeler: "NativeMobileResources",
            moduleFolderNameInModeler: "nativemobileresources"
        };

        console.log(`[MOBILE RESOURCES] Initial module info loaded`);
        moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);

        await githubAuthentication(moduleInfo);
        const moduleChangelogs = await updateChangelogs(nativeWidgetFolders, moduleInfo);
        await commitAndCreatePullRequest(moduleInfo);
        await updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders);
        const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
        await exportModuleWithWidgets(moduleInfo.moduleNameInModeler, mpkOutput, nativeWidgetFolders);
        await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);

        if (process.env.CI !== "true") {
            try {
                await execShellCommand(`rm -rf ${tmpFolder}`);
                console.log(`[MOBILE RESOURCES] Cleaned up temporary folder: ${tmpFolder}`);
            } catch (e) {
                console.error(`[MOBILE RESOURCES] Failed to remove the temporary folder: ${tmpFolder}`);
                console.error(`[MOBILE RESOURCES] Error: ${e.message}`);
            }
        }

        console.log(`[MOBILE RESOURCES] Done creating Native Mobile Resource module`);
    } catch (error) {
        console.error(`[MOBILE RESOURCES ERROR] Failed to create Native Mobile Resource module`);
        console.error(`[MOBILE RESOURCES ERROR] Module folder name: ${moduleFolderNameInRepo}`);
        console.error(`[MOBILE RESOURCES ERROR] Version: ${version}`);
        console.error(`[MOBILE RESOURCES ERROR] Repository root: ${repoRootPath}`);
        console.error(`[MOBILE RESOURCES ERROR] Error: ${error.message}`);
        console.error(`[MOBILE RESOURCES ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createNanoflowCommonsModule() {
    console.log(`[NANOFLOW COMMONS] Creating the Nanoflow Commons module`);

    try {
        const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
        const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);

        console.log(`[NANOFLOW COMMONS] Module folder: ${moduleFolder}`);
        console.log(`[NANOFLOW COMMONS] Temporary folder: ${tmpFolder}`);

        let moduleInfo = {
            ...(await getPackageInfo(moduleFolder)),
            moduleNameInModeler: "NanoflowCommons",
            moduleFolderNameInModeler: "nanoflowcommons"
        };

        console.log(`[NANOFLOW COMMONS] Module info loaded`);
        moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);

        await githubAuthentication(moduleInfo);
        const moduleChangelogs = await updateModuleChangelogs(moduleInfo);
        await commitAndCreatePullRequest(moduleInfo);
        await updateNativeComponentsTestProject(moduleInfo, tmpFolder);
        const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
        await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);

        if (process.env.CI !== "true") {
            try {
                await execShellCommand(`rm -rf ${tmpFolder}`);
                console.log(`[NANOFLOW COMMONS] Cleaned up temporary folder: ${tmpFolder}`);
            } catch (e) {
                console.error(`[NANOFLOW COMMONS] Failed to remove the temporary folder: ${tmpFolder}`);
                console.error(`[NANOFLOW COMMONS] Error: ${e.message}`);
            }
        }

        console.log(`[NANOFLOW COMMONS] Done creating Nanoflow Commons module`);
    } catch (error) {
        console.error(`[NANOFLOW COMMONS ERROR] Failed to create Nanoflow Commons module`);
        console.error(`[NANOFLOW COMMONS ERROR] Module folder name: ${moduleFolderNameInRepo}`);
        console.error(`[NANOFLOW COMMONS ERROR] Version: ${version}`);
        console.error(`[NANOFLOW COMMONS ERROR] Repository root: ${repoRootPath}`);
        console.error(`[NANOFLOW COMMONS ERROR] Error: ${error.message}`);
        console.error(`[NANOFLOW COMMONS ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createAtlasNativeContentModule() {
    console.log(`[ATLAS NATIVE] Creating the Atlas Native Content module`);

    try {
        const moduleFolder = join(repoRootPath, `packages/modules/${moduleFolderNameInRepo}`);
        const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);

        console.log(`[ATLAS NATIVE] Module folder: ${moduleFolder}`);
        console.log(`[ATLAS NATIVE] Temporary folder: ${tmpFolder}`);

        let moduleInfo = {
            ...(await getPackageInfo(moduleFolder)),
            moduleNameInModeler: "Atlas_NativeMobile_Content",
            moduleFolderNameInModeler: "atlas_nativemobile_content"
        };

        console.log(`[ATLAS NATIVE] Module info loaded`);
        moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);

        await githubAuthentication(moduleInfo);
        const moduleChangelogs = await updateModuleChangelogs(moduleInfo);
        await commitAndCreatePullRequest(moduleInfo);
        await updateNativeComponentsTestProjectWithAtlas(moduleInfo, tmpFolder);
        const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
        await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);
        await execShellCommand(`rm -rf ${tmpFolder}`);

        console.log(`[ATLAS NATIVE] Done creating Atlas Native Content module`);
    } catch (error) {
        console.error(`[ATLAS NATIVE ERROR] Failed to create Atlas Native Content module`);
        console.error(`[ATLAS NATIVE ERROR] Module folder name: ${moduleFolderNameInRepo}`);
        console.error(`[ATLAS NATIVE ERROR] Version: ${version}`);
        console.error(`[ATLAS NATIVE ERROR] Repository root: ${repoRootPath}`);
        console.error(`[ATLAS NATIVE ERROR] Error: ${error.message}`);
        console.error(`[ATLAS NATIVE ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders) {
    console.log(`[TEST PROJECT UPDATE] Updating NativeComponentsTestProject`);
    console.log(`[TEST PROJECT UPDATE] Module: ${moduleInfo.nameWithSpace}`);
    console.log(`[TEST PROJECT UPDATE] Temporary folder: ${tmpFolder}`);
    console.log(`[TEST PROJECT UPDATE] Test project URL: ${moduleInfo.testProjectUrl}`);
    console.log(`[TEST PROJECT UPDATE] Has widget folders: ${!!nativeWidgetFolders}`);
    console.log(`[TEST PROJECT UPDATE] Widget folders count: ${nativeWidgetFolders?.length || 0}`);

    try {
        const jsActionsPath = join(repoRootPath, `packages/jsActions/${moduleFolderNameInRepo}/dist`);
        const jsActions = await getFiles(jsActionsPath);
        const tmpFolderActions = join(tmpFolder, `javascriptsource/${moduleInfo.moduleFolderNameInModeler}/actions`);

        console.log(`[TEST PROJECT UPDATE] JS Actions path: ${jsActionsPath}`);
        console.log(`[TEST PROJECT UPDATE] Found ${jsActions.length} JS Actions`);
        console.log(`[TEST PROJECT UPDATE] Target actions folder: ${tmpFolderActions}`);

        await cloneRepo(moduleInfo.testProjectUrl, tmpFolder);

        console.log(`[TEST PROJECT UPDATE] Deleting existing JS Actions from test project`);
        await rm(tmpFolderActions, { force: true, recursive: true }); // this is useful to avoid retaining stale dependencies in the test project.
        await mkdir(tmpFolderActions);

        console.log(`[TEST PROJECT UPDATE] Copying widget resources JS actions into test project`);
        await Promise.all([
            ...jsActions.map(async file => {
                const dest = join(tmpFolderActions, file.replace(jsActionsPath, ""));
                await mkdir(dirname(dest), { recursive: true });
                await copyFile(file, dest);
            })
        ]);

        if (nativeWidgetFolders) {
            console.log(`[TEST PROJECT UPDATE] Processing ${nativeWidgetFolders.length} native widget folders`);
            console.log(`[TEST PROJECT UPDATE] Deleting existing widgets from test project`);
            const widgetsDir = join(tmpFolder, "widgets");

            // backup two web widgets that are used in the test project
            const tempBackup = join(tmpFolder, "widgets-backup");
            await mkdir(tempBackup);

            const htmlSnippetWidgetName = "HTMLSnippet.mpk";
            const htmlSnippetTempPath = join(tempBackup, htmlSnippetWidgetName);
            const htmlSnippetPath = join(widgetsDir, htmlSnippetWidgetName);
            await copyFile(htmlSnippetPath, htmlSnippetTempPath);

            const sprintrFeedbackWidgetName = "SprintrFeedbackWidget.mpk";
            const sprintFeedbackTempPath = join(tempBackup, sprintrFeedbackWidgetName);
            const sprintrFeedbackPath = join(widgetsDir, sprintrFeedbackWidgetName);
            await copyFile(sprintrFeedbackPath, sprintFeedbackTempPath);

            await rm(widgetsDir, { force: true, recursive: true }); // this is useful to avoid retaining stale widgets in the test project.
            await mkdir(widgetsDir);

            await copyFile(htmlSnippetTempPath, htmlSnippetPath);
            await copyFile(sprintFeedbackTempPath, sprintrFeedbackPath);
            await rm(tempBackup, { force: true, recursive: true });

            console.log(`[TEST PROJECT UPDATE] Copying widget resources widgets into test project`);
            await Promise.all([
                ...nativeWidgetFolders.map(async folder => {
                    const src = (await getFiles(folder, [`.mpk`]))[0];
                    const dest = join(widgetsDir, basename(src));
                    await copyFile(src, dest);
                })
            ]);
        }

        await execShellCommand(
            `echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`,
            tmpFolder
        );
        const gitOutput = await execShellCommand(`cd ${tmpFolder} && git status`);
        if (!/nothing to commit/i.test(gitOutput)) {
            await execShellCommand(
                `git add . && git commit -m "Updated JS actions ${
                    nativeWidgetFolders ? "and widgets" : ""
                }" && git push`,
                tmpFolder
            );
            console.log(`[TEST PROJECT UPDATE] Successfully committed and pushed changes`);
        } else {
            console.warn(`[TEST PROJECT UPDATE] Nothing to commit from repo ${tmpFolder}`);
        }
    } catch (error) {
        console.error(`[TEST PROJECT UPDATE ERROR] Failed to update test project`);
        console.error(`[TEST PROJECT UPDATE ERROR] Module: ${moduleInfo.nameWithSpace}`);
        console.error(`[TEST PROJECT UPDATE ERROR] Version: ${version}`);
        console.error(`[TEST PROJECT UPDATE ERROR] Temporary folder: ${tmpFolder}`);
        console.error(`[TEST PROJECT UPDATE ERROR] Test project URL: ${moduleInfo.testProjectUrl}`);
        console.error(`[TEST PROJECT UPDATE ERROR] Error: ${error.message}`);
        console.error(`[TEST PROJECT UPDATE ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProjectWithAtlas(moduleInfo, tmpFolder) {
    const atlasNativeContentPath = join(
        repoRootPath,
        `packages/modules/${moduleFolderNameInRepo}/dist/themesource/${moduleInfo.moduleFolderNameInModeler}`
    );
    const atlasNativeContent = await getFiles(atlasNativeContentPath);
    const tmpFolderNativeStyles = join(tmpFolder, `themesource/${moduleInfo.moduleFolderNameInModeler}`);

    console.log("Updating NativeComponentsTestProject..");
    await cloneRepo(moduleInfo.testProjectUrl, tmpFolder);

    console.log("Copying Native styling files..");
    await Promise.all([
        ...atlasNativeContent.map(async file => {
            const dest = join(tmpFolderNativeStyles, file.replace(atlasNativeContentPath, ""));
            await rm(dest);
            await copyFile(file, dest);
        })
    ]);

    await execShellCommand(`echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`, tmpFolder);
    const gitOutput = await execShellCommand(`cd ${tmpFolder} && git status`);
    if (!/nothing to commit/i.test(gitOutput)) {
        await execShellCommand("git add . && git commit -m 'Updated Atlas native styling' && git push", tmpFolder);
    } else {
        console.warn(`Nothing to commit from repo ${tmpFolder}`);
    }
}
