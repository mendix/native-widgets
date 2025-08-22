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
const [moduleFolderNameInRepo, version] = process.env.TAG?.split("-v") || [];

console.log(`[NATIVE MODULES] Starting native modules creation process`);
console.log(`[NATIVE MODULES] Repository root path: ${repoRootPath}`);
console.log(`[NATIVE MODULES] Module folder name: ${moduleFolderNameInRepo}`);
console.log(`[NATIVE MODULES] Version: ${version}`);
console.log(`[NATIVE MODULES] TAG environment variable: ${process.env.TAG}`);

main().catch(e => {
    console.error(`[NATIVE MODULES ERROR] Fatal error in main process:`);
    console.error(`[NATIVE MODULES ERROR] ${e.message}`);
    console.error(`[NATIVE MODULES ERROR] Stack trace: ${e.stack}`);
    process.exit(1);
});

async function main() {
    console.log(`[NATIVE MODULES] Starting native module creation process`);
    console.log(`[NATIVE MODULES] TAG environment variable: ${process.env.TAG}`);
    console.log(`[NATIVE MODULES] Parsed module name: ${moduleFolderNameInRepo}`);
    console.log(`[NATIVE MODULES] Parsed version: ${version}`);

    const modules = ["mobile-resources-native", "nanoflow-actions-native", "atlas-content-native"];

    if (!process.env.TAG) {
        console.log(`[NATIVE MODULES] No TAG environment variable found. Exiting.`);
        return;
    }

    if (!moduleFolderNameInRepo || !version) {
        console.log(`[NATIVE MODULES] Could not parse TAG. Expected format: <module-name>-v<version>`);
        console.log(`[NATIVE MODULES] Received TAG: ${process.env.TAG}`);
        console.log(`[NATIVE MODULES] Parsed parts: module='${moduleFolderNameInRepo}', version='${version}'`);
        return;
    }

    if (!modules.includes(moduleFolderNameInRepo)) {
        console.log(`[NATIVE MODULES] Module '${moduleFolderNameInRepo}' is not a recognized module.`);
        console.log(`[NATIVE MODULES] Supported modules: ${modules.join(", ")}`);
        return;
    }

    console.log(`[NATIVE MODULES] Processing module: ${moduleFolderNameInRepo} version ${version}`);

    try {
        switch (moduleFolderNameInRepo) {
            case "mobile-resources-native":
                await createNativeMobileResourcesModule();
                break;
            case "nanoflow-actions-native":
                await createNanoflowCommonsModule();
                break;
            case "atlas-content-native":
                await createAtlasNativeContentModule();
                break;
        }
        console.log(`[NATIVE MODULES] Successfully completed processing for ${moduleFolderNameInRepo}`);
    } catch (error) {
        console.error(`[NATIVE MODULES ERROR] Failed to process module ${moduleFolderNameInRepo}`);
        console.error(`[NATIVE MODULES ERROR] Error: ${error.message}`);
        console.error(`[NATIVE MODULES ERROR] Stack trace: ${error.stack}`);
        throw error;
    }

    console.log(`[MAIN] Successfully completed processing for module: ${moduleFolderNameInRepo}`);
}

async function createNativeMobileResourcesModule() {
    console.log(`[MOBILE RESOURCES] Starting Native Mobile Resource module creation`);

    try {
        const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
        const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);

        console.log(`[MOBILE RESOURCES] Module folder: ${moduleFolder}`);
        console.log(`[MOBILE RESOURCES] Temporary folder: ${tmpFolder}`);

        console.log(`[MOBILE RESOURCES] Reading widget folders...`);
        const widgetFolders = await readdir(join(repoRootPath, "packages/pluggableWidgets"));
        const nativeWidgetFolders = widgetFolders
            .filter(folder => folder.includes("-native"))
            .map(folder => join(repoRootPath, "packages/pluggableWidgets", folder));

        console.log(`[MOBILE RESOURCES] Found ${widgetFolders.length} total widget folders`);
        console.log(`[MOBILE RESOURCES] Found ${nativeWidgetFolders.length} native widget folders`);

        console.log(`[MOBILE RESOURCES] Getting package info...`);
        let moduleInfo = {
            ...(await getPackageInfo(moduleFolder)),
            moduleNameInModeler: "NativeMobileResources",
            moduleFolderNameInModeler: "nativemobileresources"
        };

        console.log(`[MOBILE RESOURCES] Package name: ${moduleInfo.name}`);
        console.log(`[MOBILE RESOURCES] Current version: ${moduleInfo.version}`);

        console.log(`[MOBILE RESOURCES] Bumping version in package.json...`);
        moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);
        console.log(`[MOBILE RESOURCES] New version: ${moduleInfo.version}`);

        console.log(`[MOBILE RESOURCES] Setting up GitHub authentication...`);
        await githubAuthentication(moduleInfo);

        console.log(`[MOBILE RESOURCES] Updating changelogs...`);
        const moduleChangelogs = await updateChangelogs(nativeWidgetFolders, moduleInfo);
        console.log(`[MOBILE RESOURCES] Changelog length: ${moduleChangelogs?.length || 0} characters`);

        console.log(`[MOBILE RESOURCES] Creating pull request...`);
        await commitAndCreatePullRequest(moduleInfo);

        console.log(`[MOBILE RESOURCES] Updating Native Components Test Project...`);
        await updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders);

        console.log(`[MOBILE RESOURCES] Creating MPK file...`);
        const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
        console.log(`[MOBILE RESOURCES] MPK created at: ${mpkOutput}`);

        console.log(`[MOBILE RESOURCES] Exporting module with widgets...`);
        await exportModuleWithWidgets(moduleInfo.moduleNameInModeler, mpkOutput, nativeWidgetFolders);

        console.log(`[MOBILE RESOURCES] Creating GitHub release...`);
        await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);

        if (process.env.CI !== "true") {
            console.log(`[MOBILE RESOURCES] Cleaning up temporary folder...`);
            try {
                await execShellCommand(`rm -rf ${tmpFolder}`);
                console.log(`[MOBILE RESOURCES] Temporary folder cleaned up successfully`);
            } catch (e) {
                console.error(`[MOBILE RESOURCES ERROR] Failed to remove the temporary folder: ${e.message}`);
            }
        } else {
            console.log(`[MOBILE RESOURCES] Running in CI, skipping temporary folder cleanup`);
        }

        console.log(`[MOBILE RESOURCES] Native Mobile Resource module creation completed successfully`);
    } catch (error) {
        console.error(`[MOBILE RESOURCES ERROR] Failed to create Native Mobile Resource module`);
        console.error(`[MOBILE RESOURCES ERROR] Error: ${error.message}`);
        console.error(`[MOBILE RESOURCES ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createNanoflowCommonsModule() {
    console.log(`[NANOFLOW COMMONS] Starting Nanoflow Commons module creation`);

    try {
        const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
        const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);

        console.log(`[NANOFLOW COMMONS] Module folder: ${moduleFolder}`);
        console.log(`[NANOFLOW COMMONS] Temporary folder: ${tmpFolder}`);

        console.log(`[NANOFLOW COMMONS] Getting package info...`);
        let moduleInfo = {
            ...(await getPackageInfo(moduleFolder)),
            moduleNameInModeler: "NanoflowCommons",
            moduleFolderNameInModeler: "nanoflowcommons"
        };

        console.log(`[NANOFLOW COMMONS] Package name: ${moduleInfo.name}`);
        console.log(`[NANOFLOW COMMONS] Current version: ${moduleInfo.version}`);

        console.log(`[NANOFLOW COMMONS] Bumping version in package.json...`);
        moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);
        console.log(`[NANOFLOW COMMONS] New version: ${moduleInfo.version}`);

        console.log(`[NANOFLOW COMMONS] Setting up GitHub authentication...`);
        await githubAuthentication(moduleInfo);

        console.log(`[NANOFLOW COMMONS] Updating module changelogs...`);
        const moduleChangelogs = await updateModuleChangelogs(moduleInfo);
        console.log(`[NANOFLOW COMMONS] Changelog length: ${moduleChangelogs?.length || 0} characters`);

        console.log(`[NANOFLOW COMMONS] Creating pull request...`);
        await commitAndCreatePullRequest(moduleInfo);

        console.log(`[NANOFLOW COMMONS] Updating Native Components Test Project...`);
        await updateNativeComponentsTestProject(moduleInfo, tmpFolder);

        console.log(`[NANOFLOW COMMONS] Creating MPK file...`);
        const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
        console.log(`[NANOFLOW COMMONS] MPK created at: ${mpkOutput}`);

        console.log(`[NANOFLOW COMMONS] Creating GitHub release...`);
        await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);

        if (process.env.CI !== "true") {
            console.log(`[NANOFLOW COMMONS] Cleaning up temporary folder...`);
            try {
                await execShellCommand(`rm -rf ${tmpFolder}`);
                console.log(`[NANOFLOW COMMONS] Temporary folder cleaned up successfully`);
            } catch (e) {
                console.error(`[NANOFLOW COMMONS ERROR] Failed to remove the temporary folder: ${e.message}`);
            }
        } else {
            console.log(`[NANOFLOW COMMONS] Running in CI, skipping temporary folder cleanup`);
        }

        console.log(`[NANOFLOW COMMONS] Nanoflow Commons module creation completed successfully`);
    } catch (error) {
        console.error(`[NANOFLOW COMMONS ERROR] Failed to create Nanoflow Commons module`);
        console.error(`[NANOFLOW COMMONS ERROR] Error: ${error.message}`);
        console.error(`[NANOFLOW COMMONS ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createAtlasNativeContentModule() {
    console.log(`[ATLAS CONTENT] Starting Atlas Native Content module creation`);

    try {
        const moduleFolder = join(repoRootPath, `packages/modules/${moduleFolderNameInRepo}`);
        const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);

        console.log(`[ATLAS CONTENT] Module folder: ${moduleFolder}`);
        console.log(`[ATLAS CONTENT] Temporary folder: ${tmpFolder}`);

        console.log(`[ATLAS CONTENT] Getting package info...`);
        let moduleInfo = {
            ...(await getPackageInfo(moduleFolder)),
            moduleNameInModeler: "Atlas_NativeMobile_Content",
            moduleFolderNameInModeler: "atlas_nativemobile_content"
        };

        console.log(`[ATLAS CONTENT] Package name: ${moduleInfo.name}`);
        console.log(`[ATLAS CONTENT] Current version: ${moduleInfo.version}`);

        console.log(`[ATLAS CONTENT] Bumping version in package.json...`);
        moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);
        console.log(`[ATLAS CONTENT] New version: ${moduleInfo.version}`);

        console.log(`[ATLAS CONTENT] Setting up GitHub authentication...`);
        await githubAuthentication(moduleInfo);

        console.log(`[ATLAS CONTENT] Updating module changelogs...`);
        const moduleChangelogs = await updateModuleChangelogs(moduleInfo);
        console.log(`[ATLAS CONTENT] Changelog length: ${moduleChangelogs?.length || 0} characters`);

        console.log(`[ATLAS CONTENT] Creating pull request...`);
        await commitAndCreatePullRequest(moduleInfo);

        console.log(`[ATLAS CONTENT] Updating Native Components Test Project with Atlas...`);
        await updateNativeComponentsTestProjectWithAtlas(moduleInfo, tmpFolder);

        console.log(`[ATLAS CONTENT] Creating MPK file...`);
        const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
        console.log(`[ATLAS CONTENT] MPK created at: ${mpkOutput}`);

        console.log(`[ATLAS CONTENT] Creating GitHub release...`);
        await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);

        console.log(`[ATLAS CONTENT] Cleaning up temporary folder...`);
        await execShellCommand(`rm -rf ${tmpFolder}`);
        console.log(`[ATLAS CONTENT] Temporary folder cleaned up successfully`);

        console.log(`[ATLAS CONTENT] Atlas Native Content module creation completed successfully`);
    } catch (error) {
        console.error(`[ATLAS CONTENT ERROR] Failed to create Atlas Native Content module`);
        console.error(`[ATLAS CONTENT ERROR] Error: ${error.message}`);
        console.error(`[ATLAS CONTENT ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders) {
    console.log(`[TEST PROJECT] Starting Native Components Test Project update`);

    try {
        const jsActionsPath = join(repoRootPath, `packages/jsActions/${moduleFolderNameInRepo}/dist`);
        const tmpFolderActions = join(tmpFolder, `javascriptsource/${moduleInfo.moduleFolderNameInModeler}/actions`);

        console.log(`[TEST PROJECT] JS Actions path: ${jsActionsPath}`);
        console.log(`[TEST PROJECT] Target actions path: ${tmpFolderActions}`);

        console.log(`[TEST PROJECT] Getting JS Actions files...`);
        const jsActions = await getFiles(jsActionsPath);
        console.log(`[TEST PROJECT] Found ${jsActions.length} JS Actions files`);

        console.log(`[TEST PROJECT] Cloning test project repository...`);
        await cloneRepo(moduleInfo.testProjectUrl, tmpFolder);
        console.log(`[TEST PROJECT] Test project cloned successfully`);

        console.log(`[TEST PROJECT] Deleting existing JS Actions from test project...`);
        await rm(tmpFolderActions, { force: true, recursive: true }); // this is useful to avoid retaining stale dependencies in the test project.
        await mkdir(tmpFolderActions);
        console.log(`[TEST PROJECT] Existing JS Actions removed and directory recreated`);

        console.log(`[TEST PROJECT] Copying widget resources JS actions into test project...`);
        await Promise.all([
            ...jsActions.map(async file => {
                const dest = join(tmpFolderActions, file.replace(jsActionsPath, ""));
                await mkdir(dirname(dest), { recursive: true });
                await copyFile(file, dest);
            })
        ]);
        console.log(`[TEST PROJECT] JS Actions copied successfully`);

        if (nativeWidgetFolders) {
            console.log(`[TEST PROJECT] Processing ${nativeWidgetFolders.length} native widget folders...`);
            console.log(`[TEST PROJECT] Deleting existing widgets from test project...`);
            const widgetsDir = join(tmpFolder, "widgets");

            // backup two web widgets that are used in the test project
            const tempBackup = join(tmpFolder, "widgets-backup");
            await mkdir(tempBackup);
            console.log(`[TEST PROJECT] Created backup directory for web widgets`);

            const htmlSnippetWidgetName = "HTMLSnippet.mpk";
            const htmlSnippetTempPath = join(tempBackup, htmlSnippetWidgetName);
            const htmlSnippetPath = join(widgetsDir, htmlSnippetWidgetName);

            const sprintrFeedbackWidgetName = "SprintrFeedbackWidget.mpk";
            const sprintFeedbackTempPath = join(tempBackup, sprintrFeedbackWidgetName);
            const sprintrFeedbackPath = join(widgetsDir, sprintrFeedbackWidgetName);

            try {
                console.log(`[TEST PROJECT] Backing up web widgets...`);
                await copyFile(htmlSnippetPath, htmlSnippetTempPath);
                await copyFile(sprintrFeedbackPath, sprintFeedbackTempPath);
                console.log(`[TEST PROJECT] Web widgets backed up successfully`);
            } catch (error) {
                console.warn(`[TEST PROJECT WARN] Failed to backup some web widgets: ${error.message}`);
            }

            await rm(widgetsDir, { force: true, recursive: true }); // this is useful to avoid retaining stale widgets in the test project.
            await mkdir(widgetsDir);
            console.log(`[TEST PROJECT] Widgets directory recreated`);

            try {
                console.log(`[TEST PROJECT] Restoring web widgets...`);
                await copyFile(htmlSnippetTempPath, htmlSnippetPath);
                await copyFile(sprintFeedbackTempPath, sprintrFeedbackPath);
                console.log(`[TEST PROJECT] Web widgets restored successfully`);
            } catch (error) {
                console.warn(`[TEST PROJECT WARN] Failed to restore some web widgets: ${error.message}`);
            }

            await rm(tempBackup, { force: true, recursive: true });

            console.log(`[TEST PROJECT] Copying widget resources widgets into test project...`);
            await Promise.all([
                ...nativeWidgetFolders.map(async folder => {
                    try {
                        const mpkFiles = await getFiles(folder, [`.mpk`]);
                        if (mpkFiles.length === 0) {
                            console.warn(`[TEST PROJECT WARN] No MPK file found in ${folder}`);
                            return;
                        }
                        const src = mpkFiles[0];
                        const dest = join(widgetsDir, basename(src));
                        await copyFile(src, dest);
                        console.log(`[TEST PROJECT] Copied widget: ${basename(src)}`);
                    } catch (error) {
                        console.error(`[TEST PROJECT ERROR] Failed to copy widget from ${folder}: ${error.message}`);
                    }
                })
            ]);
            console.log(`[TEST PROJECT] All widgets copied successfully`);
        } else {
            console.log(`[TEST PROJECT] No native widget folders provided, skipping widget processing`);
        }

        console.log(`[TEST PROJECT] Updating version file...`);
        await execShellCommand(
            `echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`,
            tmpFolder
        );

        console.log(`[TEST PROJECT] Checking git status...`);
        const gitOutput = await execShellCommand(`cd ${tmpFolder} && git status`);
        if (!/nothing to commit/i.test(gitOutput)) {
            console.log(`[TEST PROJECT] Changes detected, committing and pushing...`);
            await execShellCommand(
                `git add . && git commit -m "Updated JS actions ${
                    nativeWidgetFolders ? "and widgets" : ""
                }" && git push`,
                tmpFolder
            );
            console.log(`[TEST PROJECT] Changes committed and pushed successfully`);
        } else {
            console.warn(`[TEST PROJECT WARN] Nothing to commit from repo ${tmpFolder}`);
        }

        console.log(`[TEST PROJECT] Native Components Test Project update completed successfully`);
    } catch (error) {
        console.error(`[TEST PROJECT ERROR] Failed to update Native Components Test Project`);
        console.error(`[TEST PROJECT ERROR] Error: ${error.message}`);
        console.error(`[TEST PROJECT ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProjectWithAtlas(moduleInfo, tmpFolder) {
    console.log(`[ATLAS TEST PROJECT] Starting Native Components Test Project update with Atlas`);

    try {
        const atlasNativeContentPath = join(
            repoRootPath,
            `packages/modules/${moduleFolderNameInRepo}/dist/themesource/${moduleInfo.moduleFolderNameInModeler}`
        );
        const tmpFolderNativeStyles = join(tmpFolder, `themesource/${moduleInfo.moduleFolderNameInModeler}`);

        console.log(`[ATLAS TEST PROJECT] Atlas content path: ${atlasNativeContentPath}`);
        console.log(`[ATLAS TEST PROJECT] Target styles path: ${tmpFolderNativeStyles}`);

        console.log(`[ATLAS TEST PROJECT] Getting Atlas native content files...`);
        const atlasNativeContent = await getFiles(atlasNativeContentPath);
        console.log(`[ATLAS TEST PROJECT] Found ${atlasNativeContent.length} Atlas content files`);

        console.log(`[ATLAS TEST PROJECT] Cloning test project repository...`);
        await cloneRepo(moduleInfo.testProjectUrl, tmpFolder);
        console.log(`[ATLAS TEST PROJECT] Test project cloned successfully`);

        console.log(`[ATLAS TEST PROJECT] Copying Native styling files...`);
        await Promise.all([
            ...atlasNativeContent.map(async file => {
                try {
                    const dest = join(tmpFolderNativeStyles, file.replace(atlasNativeContentPath, ""));
                    await rm(dest, { force: true });
                    await copyFile(file, dest);
                } catch (error) {
                    console.error(`[ATLAS TEST PROJECT ERROR] Failed to copy file ${file}: ${error.message}`);
                }
            })
        ]);
        console.log(`[ATLAS TEST PROJECT] Native styling files copied successfully`);

        console.log(`[ATLAS TEST PROJECT] Updating version file...`);
        await execShellCommand(
            `echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`,
            tmpFolder
        );

        console.log(`[ATLAS TEST PROJECT] Checking git status...`);
        const gitOutput = await execShellCommand(`cd ${tmpFolder} && git status`);
        if (!/nothing to commit/i.test(gitOutput)) {
            console.log(`[ATLAS TEST PROJECT] Changes detected, committing and pushing...`);
            await execShellCommand("git add . && git commit -m 'Updated Atlas native styling' && git push", tmpFolder);
            console.log(`[ATLAS TEST PROJECT] Changes committed and pushed successfully`);
        } else {
            console.warn(`[ATLAS TEST PROJECT WARN] Nothing to commit from repo ${tmpFolder}`);
        }

        console.log(`[ATLAS TEST PROJECT] Atlas test project update completed successfully`);
    } catch (error) {
        console.error(`[ATLAS TEST PROJECT ERROR] Failed to update Native Components Test Project with Atlas`);
        console.error(`[ATLAS TEST PROJECT ERROR] Error: ${error.message}`);
        console.error(`[ATLAS TEST PROJECT ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}
