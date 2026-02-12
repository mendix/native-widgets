const { basename, join, dirname } = require("path");
const { readdir, copyFile, rm, mkdir } = require("fs/promises");
const {
    execShellCommand,
    getFiles,
    getPackageInfo,
    cloneRepo,
    createMPK,
    exportModuleWithWidgets,
    regex,
    copyFilesToMpk,
    getOssFiles
} = require("./module-automation/commons");

const repoRootPath = join(__dirname, "../../");

const moduleFolderNameInRepo = process.env.MODULE;
const version = process.env.VERSION.split("v")[1];

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    const modules = ["mobile-resources-native", "nanoflow-actions-native"];
    if (!modules.includes(moduleFolderNameInRepo) || !version) {
        return;
    }

    switch (moduleFolderNameInRepo) {
        case "mobile-resources-native":
            await createNativeMobileResourcesModule();
            break;
        case "nanoflow-actions-native":
            await createNanoflowCommonsModule();
            break;
    }
}

async function createNativeMobileResourcesModule() {
    console.log("Creating the Native Mobile Resource module.");
    const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
    const ossFiles = await getOssFiles(moduleFolder, true);
    const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);
    const widgetFolders = await readdir(join(repoRootPath, "packages/pluggableWidgets"));
    const nativeWidgetFolders = widgetFolders
        .filter(folder => folder.includes("-native"))
        .map(folder => join(repoRootPath, "packages/pluggableWidgets", folder));
    const moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "NativeMobileResources",
        moduleFolderNameInModeler: "nativemobileresources"
    };
    await updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders);
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    await exportModuleWithWidgets(moduleInfo.moduleNameInModeler, mpkOutput, nativeWidgetFolders, ossFiles);
    // TODO: mpk as an artifact to download from CI job
    console.log("Done.");
}

async function createNanoflowCommonsModule() {
    console.log("Creating the Nanoflow Commons module.");
    const moduleFolder = join(repoRootPath, "packages/jsActions", moduleFolderNameInRepo);
    const ossFiles = await getOssFiles(moduleFolder, true);
    const tmpFolder = join(repoRootPath, "tmp", moduleFolderNameInRepo);
    const moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "NanoflowCommons",
        moduleFolderNameInModeler: "nanoflowcommons"
    };

    await updateNativeComponentsTestProject(moduleInfo, tmpFolder);
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    await copyFilesToMpk(ossFiles, mpkOutput, moduleInfo.moduleNameInModeler);
    // TODO: mpk as an artifact to download from CI job
    console.log("Done.");
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders) {
    const jsActionsPath = join(repoRootPath, `packages/jsActions/${moduleFolderNameInRepo}/dist`);
    const jsActions = await getFiles(jsActionsPath);
    const tmpFolderActions = join(tmpFolder, `javascriptsource/${moduleInfo.moduleFolderNameInModeler}/actions`);

    console.log("Updating NativeComponentsTestProject...");
    await cloneRepo(moduleInfo.testProjectUrl, tmpFolder);

    console.log("Deleting existing JS Actions from test project...");
    await rm(tmpFolderActions, { force: true, recursive: true }); // this is useful to avoid retaining stale dependencies in the test project.
    await mkdir(tmpFolderActions);
    console.log("Copying widget resources JS actions into test project...");
    await Promise.all([
        ...jsActions.map(async file => {
            const dest = join(tmpFolderActions, file.replace(jsActionsPath, ""));
            await mkdir(dirname(dest), { recursive: true });
            await copyFile(file, dest);
        })
    ]);
    if (nativeWidgetFolders) {
        console.log("Deleting existing widgets from test project...");
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

        console.log("Copying widget resources widgets into test project...");
        await Promise.all([
            ...nativeWidgetFolders.map(async folder => {
                const src = (await getFiles(folder, [`.mpk`]))[0];
                const dest = join(widgetsDir, basename(src));
                await copyFile(src, dest);
            })
        ]);
    }
    await execShellCommand(`echo ${version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`, tmpFolder);
}
