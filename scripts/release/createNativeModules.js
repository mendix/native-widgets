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

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    console.log("=== [MAIN] Starting main function ===");
    console.log("[MAIN] [INPUT] moduleFolderNameInRepo:", moduleFolderNameInRepo);
    console.log("[MAIN] [INPUT] version:", version);

    const modules = ["mobile-resources-native", "nanoflow-actions-native", "atlas-content-native"];
    console.log("[MAIN] [CONFIG] Available modules:", modules);

    if (!modules.includes(moduleFolderNameInRepo) || !version) {
        console.log("[MAIN] [VALIDATION] Module not supported or version missing - exiting");
        console.log("[MAIN] [VALIDATION] Module in list:", modules.includes(moduleFolderNameInRepo));
        console.log("[MAIN] [VALIDATION] Version exists:", !!version);
        return;
    }

    console.log("[MAIN] [PROCESSING] Processing module:", moduleFolderNameInRepo);
    switch (moduleFolderNameInRepo) {
        case "mobile-resources-native":
            console.log("[MAIN] [ROUTE] Executing createNativeMobileResourcesModule");
            await createNativeMobileResourcesModule();
            break;
        case "nanoflow-actions-native":
            console.log("[MAIN] [ROUTE] Executing createNanoflowCommonsModule");
            await createNanoflowCommonsModule();
            break;
        case "atlas-content-native":
            console.log("[MAIN] [ROUTE] Executing createAtlasNativeContentModule");
            await createAtlasNativeContentModule();
            break;
    }
    console.log("=== [MAIN] Main function completed ===");
}

async function createNativeMobileResourcesModule() {
    console.log("=== [MOBILE_RESOURCES] Starting createNativeMobileResourcesModule ===");
    console.log("[MOBILE_RESOURCES] [INPUT] moduleFolderNameInRepo:", moduleFolderNameInRepo);
    console.log("[MOBILE_RESOURCES] [INPUT] version:", version);
    console.log("[MOBILE_RESOURCES] [INPUT] repoRootPath:", repoRootPath);

    console.log("Creating the Native Mobile Resource module.");
    const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
    const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);
    console.log("[MOBILE_RESOURCES] [PATH] moduleFolder:", moduleFolder);
    console.log("[MOBILE_RESOURCES] [PATH] tmpFolder:", tmpFolder);

    const widgetFolders = await readdir(join(repoRootPath, "packages/pluggableWidgets"));
    console.log("[MOBILE_RESOURCES] [DISCOVERY] Found widget folders:", widgetFolders);

    const nativeWidgetFolders = widgetFolders
        .filter(folder => folder.includes("-native"))
        .map(folder => join(repoRootPath, "packages/pluggableWidgets", folder));
    console.log("[MOBILE_RESOURCES] [FILTER] Native widget folders:", nativeWidgetFolders);

    let moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "NativeMobileResources",
        moduleFolderNameInModeler: "nativemobileresources"
    };
    console.log("[MOBILE_RESOURCES] [CONFIG] Initial moduleInfo:", moduleInfo);

    moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);
    console.log("[MOBILE_RESOURCES] [VERSION] Updated moduleInfo after version bump:", moduleInfo);

    console.log("[MOBILE_RESOURCES] [AUTH] Starting GitHub authentication");
    await githubAuthentication(moduleInfo);
    console.log("[MOBILE_RESOURCES] [AUTH] GitHub authentication completed");

    console.log("[MOBILE_RESOURCES] [CHANGELOG] Updating changelogs for native widgets");
    const moduleChangelogs = await updateChangelogs(nativeWidgetFolders, moduleInfo);
    console.log("[MOBILE_RESOURCES] [CHANGELOG] Module changelogs generated:", moduleChangelogs);

    console.log("[MOBILE_RESOURCES] [GIT] Creating commit and pull request");
    await commitAndCreatePullRequest(moduleInfo);
    console.log("[MOBILE_RESOURCES] [GIT] Commit and pull request completed");

    console.log("[MOBILE_RESOURCES] [TEST_PROJECT] Updating native components test project");
    await updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders);
    console.log("[MOBILE_RESOURCES] [TEST_PROJECT] Test project update completed");

    console.log("[MOBILE_RESOURCES] [MPK] Creating MPK package");
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    console.log("[MOBILE_RESOURCES] [MPK] MPK created at:", mpkOutput);

    console.log("[MOBILE_RESOURCES] [EXPORT] Exporting module with widgets");
    await exportModuleWithWidgets(moduleInfo.moduleNameInModeler, mpkOutput, nativeWidgetFolders);
    console.log("[MOBILE_RESOURCES] [EXPORT] Module export completed");

    console.log("[MOBILE_RESOURCES] [RELEASE] Creating GitHub release");
    await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);
    console.log("[MOBILE_RESOURCES] [RELEASE] GitHub release created");

    if (process.env.CI !== "true") {
        console.log("[MOBILE_RESOURCES] [CLEANUP] Removing temporary folder (non-CI environment)");
        try {
            await execShellCommand(`rm -rf ${tmpFolder}`);
            console.log("[MOBILE_RESOURCES] [CLEANUP] Temporary folder removed successfully");
        } catch (e) {
            console.error("[MOBILE_RESOURCES] [CLEANUP] [ERROR] Failed to remove the temporary folder:", e);
        }
    } else {
        console.log("[MOBILE_RESOURCES] [CLEANUP] Skipping cleanup in CI environment");
    }
    console.log("=== [MOBILE_RESOURCES] createNativeMobileResourcesModule completed ===");
    console.log("Done.");
}

async function createNanoflowCommonsModule() {
    console.log("=== [NANOFLOW_COMMONS] Starting createNanoflowCommonsModule ===");
    console.log("[NANOFLOW_COMMONS] [INPUT] moduleFolderNameInRepo:", moduleFolderNameInRepo);
    console.log("[NANOFLOW_COMMONS] [INPUT] version:", version);
    console.log("[NANOFLOW_COMMONS] [INPUT] repoRootPath:", repoRootPath);

    console.log("Creating the Nanoflow Commons module.");
    const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
    const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);
    console.log("[NANOFLOW_COMMONS] [PATH] moduleFolder:", moduleFolder);
    console.log("[NANOFLOW_COMMONS] [PATH] tmpFolder:", tmpFolder);

    let moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "NanoflowCommons",
        moduleFolderNameInModeler: "nanoflowcommons"
    };
    console.log("[NANOFLOW_COMMONS] [CONFIG] Initial moduleInfo:", moduleInfo);

    moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);
    console.log("[NANOFLOW_COMMONS] [VERSION] Updated moduleInfo after version bump:", moduleInfo);

    console.log("[NANOFLOW_COMMONS] [AUTH] Starting GitHub authentication");
    await githubAuthentication(moduleInfo);
    console.log("[NANOFLOW_COMMONS] [AUTH] GitHub authentication completed");

    console.log("[NANOFLOW_COMMONS] [CHANGELOG] Updating module changelogs");
    const moduleChangelogs = await updateModuleChangelogs(moduleInfo);
    console.log("[NANOFLOW_COMMONS] [CHANGELOG] Module changelogs generated:", moduleChangelogs);

    console.log("[NANOFLOW_COMMONS] [GIT] Creating commit and pull request");
    await commitAndCreatePullRequest(moduleInfo);
    console.log("[NANOFLOW_COMMONS] [GIT] Commit and pull request completed");

    console.log("[NANOFLOW_COMMONS] [TEST_PROJECT] Updating native components test project");
    await updateNativeComponentsTestProject(moduleInfo, tmpFolder);
    console.log("[NANOFLOW_COMMONS] [TEST_PROJECT] Test project update completed");

    console.log("[NANOFLOW_COMMONS] [MPK] Creating MPK package");
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    console.log("[NANOFLOW_COMMONS] [MPK] MPK created at:", mpkOutput);

    console.log("[NANOFLOW_COMMONS] [RELEASE] Creating GitHub release");
    await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);
    console.log("[NANOFLOW_COMMONS] [RELEASE] GitHub release created");

    if (process.env.CI !== "true") {
        console.log("[NANOFLOW_COMMONS] [CLEANUP] Removing temporary folder (non-CI environment)");
        try {
            await execShellCommand(`rm -rf ${tmpFolder}`);
            console.log("[NANOFLOW_COMMONS] [CLEANUP] Temporary folder removed successfully");
        } catch (e) {
            console.error("[NANOFLOW_COMMONS] [CLEANUP] [ERROR] Failed to remove the temporary folder:", e);
        }
    } else {
        console.log("[NANOFLOW_COMMONS] [CLEANUP] Skipping cleanup in CI environment");
    }
    console.log("=== [NANOFLOW_COMMONS] createNanoflowCommonsModule completed ===");
    console.log("Done.");
}

async function createAtlasNativeContentModule() {
    console.log("=== [ATLAS_NATIVE_CONTENT] Starting createAtlasNativeContentModule ===");
    console.log("[ATLAS_NATIVE_CONTENT] [INPUT] moduleFolderNameInRepo:", moduleFolderNameInRepo);
    console.log("[ATLAS_NATIVE_CONTENT] [INPUT] version:", version);
    console.log("[ATLAS_NATIVE_CONTENT] [INPUT] repoRootPath:", repoRootPath);

    console.log("Creating the Atlas Native Content module.");
    const moduleFolder = join(repoRootPath, `packages/modules/${moduleFolderNameInRepo}`);
    const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);
    console.log("[ATLAS_NATIVE_CONTENT] [PATH] moduleFolder:", moduleFolder);
    console.log("[ATLAS_NATIVE_CONTENT] [PATH] tmpFolder:", tmpFolder);

    let moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "Atlas_NativeMobile_Content",
        moduleFolderNameInModeler: "atlas_nativemobile_content"
    };
    console.log("[ATLAS_NATIVE_CONTENT] [CONFIG] Initial moduleInfo:", moduleInfo);

    moduleInfo = await bumpVersionInPackageJson(moduleFolder, moduleInfo);
    console.log("[ATLAS_NATIVE_CONTENT] [VERSION] Updated moduleInfo after version bump:", moduleInfo);

    console.log("[ATLAS_NATIVE_CONTENT] [AUTH] Starting GitHub authentication");
    await githubAuthentication(moduleInfo);
    console.log("[ATLAS_NATIVE_CONTENT] [AUTH] GitHub authentication completed");

    console.log("[ATLAS_NATIVE_CONTENT] [CHANGELOG] Updating module changelogs");
    const moduleChangelogs = await updateModuleChangelogs(moduleInfo);
    console.log("[ATLAS_NATIVE_CONTENT] [CHANGELOG] Module changelogs generated:", moduleChangelogs);

    console.log("[ATLAS_NATIVE_CONTENT] [GIT] Creating commit and pull request");
    await commitAndCreatePullRequest(moduleInfo);
    console.log("[ATLAS_NATIVE_CONTENT] [GIT] Commit and pull request completed");

    console.log("[ATLAS_NATIVE_CONTENT] [TEST_PROJECT] Updating native components test project with Atlas");
    await updateNativeComponentsTestProjectWithAtlas(moduleInfo, tmpFolder);
    console.log("[ATLAS_NATIVE_CONTENT] [TEST_PROJECT] Test project update completed");

    console.log("[ATLAS_NATIVE_CONTENT] [MPK] Creating MPK package");
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    console.log("[ATLAS_NATIVE_CONTENT] [MPK] MPK created at:", mpkOutput);

    console.log("[ATLAS_NATIVE_CONTENT] [RELEASE] Creating GitHub release");
    await createGithubRelease(moduleInfo, moduleChangelogs, mpkOutput);
    console.log("[ATLAS_NATIVE_CONTENT] [RELEASE] GitHub release created");

    console.log("[ATLAS_NATIVE_CONTENT] [CLEANUP] Removing temporary folder");
    await execShellCommand(`rm -rf ${tmpFolder}`);
    console.log("[ATLAS_NATIVE_CONTENT] [CLEANUP] Temporary folder removed successfully");

    console.log("=== [ATLAS_NATIVE_CONTENT] createAtlasNativeContentModule completed ===");
    console.log("Done.");
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders) {
    console.log("=== [TEST_PROJECT_UPDATE] Starting updateNativeComponentsTestProject ===");
    console.log("[TEST_PROJECT_UPDATE] [INPUT] moduleInfo:", moduleInfo);
    console.log("[TEST_PROJECT_UPDATE] [INPUT] tmpFolder:", tmpFolder);
    console.log("[TEST_PROJECT_UPDATE] [INPUT] nativeWidgetFolders:", nativeWidgetFolders);
    console.log("[TEST_PROJECT_UPDATE] [INPUT] version:", version);

    const jsActionsPath = join(repoRootPath, `packages/jsActions/${moduleFolderNameInRepo}/dist`);
    console.log("[TEST_PROJECT_UPDATE] [PATH] jsActionsPath:", jsActionsPath);

    const jsActions = await getFiles(jsActionsPath);
    console.log("[TEST_PROJECT_UPDATE] [DISCOVERY] Found JS actions:", jsActions);

    const tmpFolderActions = join(tmpFolder, `javascriptsource/${moduleInfo.moduleFolderNameInModeler}/actions`);
    console.log("[TEST_PROJECT_UPDATE] [PATH] tmpFolderActions:", tmpFolderActions);

    console.log("Updating NativeComponentsTestProject...");
    console.log("[TEST_PROJECT_UPDATE] [GIT] Cloning test project repository");
    await cloneRepo(moduleInfo.testProjectUrl, tmpFolder, moduleInfo.testProjectBranchName);
    console.log("[TEST_PROJECT_UPDATE] [GIT] Test project cloned to:", tmpFolder);

    console.log("Deleting existing JS Actions from test project...");
    console.log("[TEST_PROJECT_UPDATE] [CLEANUP] Removing existing actions at:", tmpFolderActions);
    await rm(tmpFolderActions, { force: true, recursive: true }); // this is useful to avoid retaining stale dependencies in the test project.
    await mkdir(tmpFolderActions);
    console.log("[TEST_PROJECT_UPDATE] [CLEANUP] Actions directory recreated");

    console.log("Copying widget resources JS actions into test project...");
    console.log("[TEST_PROJECT_UPDATE] [COPY] Starting JS actions copy operation");
    await Promise.all([
        ...jsActions.map(async file => {
            const dest = join(tmpFolderActions, file.replace(jsActionsPath, ""));
            console.log("[TEST_PROJECT_UPDATE] [COPY] Copying:", file, "->", dest);
            await mkdir(dirname(dest), { recursive: true });
            await copyFile(file, dest);
        })
    ]);
    console.log("[TEST_PROJECT_UPDATE] [COPY] JS actions copy completed");

    if (nativeWidgetFolders) {
        console.log("Deleting existing widgets from test project...");
        const widgetsDir = join(tmpFolder, "widgets");
        console.log("[TEST_PROJECT_UPDATE] [WIDGETS] widgetsDir:", widgetsDir);

        // backup two web widgets that are used in the test project
        const tempBackup = join(tmpFolder, "widgets-backup");
        console.log("[TEST_PROJECT_UPDATE] [BACKUP] Creating backup directory:", tempBackup);
        await mkdir(tempBackup);

        const htmlSnippetWidgetName = "HTMLSnippet.mpk";
        const htmlSnippetTempPath = join(tempBackup, htmlSnippetWidgetName);
        const htmlSnippetPath = join(widgetsDir, htmlSnippetWidgetName);
        console.log(
            "[TEST_PROJECT_UPDATE] [BACKUP] Backing up HTMLSnippet widget:",
            htmlSnippetPath,
            "->",
            htmlSnippetTempPath
        );
        await copyFile(htmlSnippetPath, htmlSnippetTempPath);

        const sprintrFeedbackWidgetName = "SprintrFeedbackWidget.mpk";
        const sprintFeedbackTempPath = join(tempBackup, sprintrFeedbackWidgetName);
        const sprintrFeedbackPath = join(widgetsDir, sprintrFeedbackWidgetName);
        console.log(
            "[TEST_PROJECT_UPDATE] [BACKUP] Backing up SprintrFeedback widget:",
            sprintrFeedbackPath,
            "->",
            sprintFeedbackTempPath
        );
        await copyFile(sprintrFeedbackPath, sprintFeedbackTempPath);

        console.log("[TEST_PROJECT_UPDATE] [CLEANUP] Removing widgets directory");
        await rm(widgetsDir, { force: true, recursive: true }); // this is useful to avoid retaining stale widgets in the test project.
        await mkdir(widgetsDir);

        console.log("[TEST_PROJECT_UPDATE] [RESTORE] Restoring backed up widgets");
        await copyFile(htmlSnippetTempPath, htmlSnippetPath);
        await copyFile(sprintFeedbackTempPath, sprintrFeedbackPath);
        await rm(tempBackup, { force: true, recursive: true });
        console.log("[TEST_PROJECT_UPDATE] [RESTORE] Backup restoration completed");

        console.log("Copying widget resources widgets into test project...");
        console.log("[TEST_PROJECT_UPDATE] [WIDGETS] Starting widget copy operation");
        await Promise.all([
            ...nativeWidgetFolders.map(async folder => {
                console.log("[TEST_PROJECT_UPDATE] [WIDGETS] Processing folder:", folder);
                const src = (await getFiles(folder, [`.mpk`]))[0];
                const dest = join(widgetsDir, basename(src));
                console.log("[TEST_PROJECT_UPDATE] [WIDGETS] Copying widget:", src, "->", dest);
                await copyFile(src, dest);
            })
        ]);
        console.log("[TEST_PROJECT_UPDATE] [WIDGETS] Widget copy completed");
    } else {
        console.log("[TEST_PROJECT_UPDATE] [WIDGETS] No native widget folders provided, skipping widget operations");
    }

    const versionCommand = `echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`;
    console.log("[TEST_PROJECT_UPDATE] [VERSION] Writing version file with command:", versionCommand);
    await execShellCommand(versionCommand, tmpFolder);

    console.log("[TEST_PROJECT_UPDATE] [GIT] Checking git status");
    const gitOutput = await execShellCommand(`cd ${tmpFolder} && git status`);
    console.log("[TEST_PROJECT_UPDATE] [GIT] Git status output:", gitOutput);

    if (!/nothing to commit/i.test(gitOutput)) {
        const commitMessage = `Updated JS actions ${nativeWidgetFolders ? "and widgets" : ""}`;
        const gitCommitCommand = `git add . && git commit -m "${commitMessage}" && git push`;
        console.log("[TEST_PROJECT_UPDATE] [GIT] Committing changes with command:", gitCommitCommand);
        await execShellCommand(gitCommitCommand, tmpFolder);
        console.log("[TEST_PROJECT_UPDATE] [GIT] Changes committed and pushed");
    } else {
        console.warn(`[TEST_PROJECT_UPDATE] [GIT] [WARNING] Nothing to commit from repo ${tmpFolder}`);
    }

    console.log("=== [TEST_PROJECT_UPDATE] updateNativeComponentsTestProject completed ===");
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProjectWithAtlas(moduleInfo, tmpFolder) {
    console.log("=== [ATLAS_TEST_PROJECT_UPDATE] Starting updateNativeComponentsTestProjectWithAtlas ===");
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [INPUT] moduleInfo:", moduleInfo);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [INPUT] tmpFolder:", tmpFolder);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [INPUT] version:", version);

    const atlasNativeContentPath = join(
        repoRootPath,
        `packages/modules/${moduleFolderNameInRepo}/dist/themesource/${moduleInfo.moduleFolderNameInModeler}`
    );
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [PATH] atlasNativeContentPath:", atlasNativeContentPath);

    const atlasNativeContent = await getFiles(atlasNativeContentPath);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [DISCOVERY] Found Atlas native content files:", atlasNativeContent);

    const tmpFolderNativeStyles = join(tmpFolder, `themesource/${moduleInfo.moduleFolderNameInModeler}`);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [PATH] tmpFolderNativeStyles:", tmpFolderNativeStyles);

    console.log("Updating NativeComponentsTestProject..");
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [GIT] Cloning test project repository");
    await cloneRepo(moduleInfo.testProjectUrl, tmpFolder, moduleInfo.testProjectBranchName);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [GIT] Test project cloned to:", tmpFolder);

    console.log("Copying Native styling files..");
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [COPY] Starting Atlas native styling files copy operation");
    await Promise.all([
        ...atlasNativeContent.map(async file => {
            const dest = join(tmpFolderNativeStyles, file.replace(atlasNativeContentPath, ""));
            console.log("[ATLAS_TEST_PROJECT_UPDATE] [COPY] Processing file:", file);
            console.log("[ATLAS_TEST_PROJECT_UPDATE] [COPY] Destination:", dest);
            console.log("[ATLAS_TEST_PROJECT_UPDATE] [COPY] Removing existing file at destination");
            await rm(dest);
            console.log("[ATLAS_TEST_PROJECT_UPDATE] [COPY] Copying file to destination");
            await copyFile(file, dest);
        })
    ]);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [COPY] Atlas native styling files copy completed");

    const versionCommand = `echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`;
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [VERSION] Writing version file with command:", versionCommand);
    await execShellCommand(versionCommand, tmpFolder);

    console.log("[ATLAS_TEST_PROJECT_UPDATE] [GIT] Checking git status");
    const gitOutput = await execShellCommand(`cd ${tmpFolder} && git status`);
    console.log("[ATLAS_TEST_PROJECT_UPDATE] [GIT] Git status output:", gitOutput);

    if (!/nothing to commit/i.test(gitOutput)) {
        const commitCommand = "git add . && git commit -m 'Updated Atlas native styling' && git push";
        console.log("[ATLAS_TEST_PROJECT_UPDATE] [GIT] Committing changes with command:", commitCommand);
        await execShellCommand(commitCommand, tmpFolder);
        console.log("[ATLAS_TEST_PROJECT_UPDATE] [GIT] Changes committed and pushed");
    } else {
        console.warn(`[ATLAS_TEST_PROJECT_UPDATE] [GIT] [WARNING] Nothing to commit from repo ${tmpFolder}`);
    }

    console.log("=== [ATLAS_TEST_PROJECT_UPDATE] updateNativeComponentsTestProjectWithAtlas completed ===");
}
