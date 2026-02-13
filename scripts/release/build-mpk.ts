import { basename, join, dirname } from "path";
import { readdir, copyFile, rm, mkdir } from "fs/promises";
import { appendFileSync } from "fs";
import {
    execShellCommand,
    getFiles,
    getPackageInfo,
    cloneRepo,
    createMPK,
    exportModuleWithWidgets,
    regex
} from "./module-automation/commons";
import { copyFilesToMpk, getOssFiles } from "./module-automation/utils";

const repoRootPath = join(__dirname, "../../");

const LOG_PREFIX = "[buildMpk]";
function log(message: string): void {
    console.log(`${LOG_PREFIX} ${message}`);
}

type ArtifactResult = {
    artifactPath: string;
    artifactName: string;
};

function setGithubActionsVars(artifact: ArtifactResult): void {
    const githubEnvPath = process.env.GITHUB_ENV;
    if (githubEnvPath) {
        appendFileSync(githubEnvPath, `ARTIFACT_PATH=${artifact.artifactPath}\n`);
        appendFileSync(githubEnvPath, `ARTIFACT_NAME=${artifact.artifactName}\n`);
        log(`Exported ARTIFACT_PATH and ARTIFACT_NAME to GITHUB_ENV`);
    }

    const githubOutputPath = process.env.GITHUB_OUTPUT;
    if (githubOutputPath) {
        appendFileSync(githubOutputPath, `artifact_path=${artifact.artifactPath}\n`);
        appendFileSync(githubOutputPath, `artifact_name=${artifact.artifactName}\n`);
        log(`Exported artifact_path and artifact_name to GITHUB_OUTPUT`);
    }
}

type InputVariables = {
    module: string;
    version: string;
};

const inputs: InputVariables = {
    module: "",
    version: ""
};

main()
    .then(writeArtifactEnvVariable)
    .catch(e => {
        console.error(e);
        process.exit(1);
    });

function writeArtifactEnvVariable(artifact: ArtifactResult): void {
    if (!artifact?.artifactPath || !artifact?.artifactName) {
        throw new Error(`${LOG_PREFIX} Expected an artifact result from main(), but got: ${JSON.stringify(artifact)}`);
    }

    log(`Setting environment variable ARTIFACT_PATH=${artifact.artifactPath}`);
    process.env.ARTIFACT_PATH = artifact.artifactPath;
    log(`Setting environment variable ARTIFACT_NAME=${artifact.artifactName}`);
    process.env.ARTIFACT_NAME = artifact.artifactName;
    log("Artifact environment variables set successfully.");

    setGithubActionsVars(artifact);
}

function validateInput(): void {
    const moduleName = process.env.MODULE;
    let version = process.env.VERSION;

    const modules = ["mobile-resources-native", "nanoflow-actions-native"];
    if (!moduleName || !modules.includes(moduleName)) {
        throw new Error(`${LOG_PREFIX} Invalid MODULE="${moduleName}". Expected one of: ${modules.join(", ")}`);
    }
    if (!version) {
        throw new Error(`${LOG_PREFIX} Invalid VERSION="${version}"`);
    }
    if (version?.startsWith("v")) {
        version = version.split("v")[1];
    }
    inputs.module = moduleName;
    inputs.version = version;
    log(`Starting (MODULE=${inputs.module}, VERSION=${inputs.version})`);
}

async function main(): Promise<ArtifactResult> {
    validateInput();
    switch (inputs.module) {
        case "mobile-resources-native":
            return createNativeMobileResourcesModule();
        case "nanoflow-actions-native":
            return createNanoflowCommonsModule();
    }
    throw new Error(`${LOG_PREFIX} No implementation for MODULE="${inputs.module}"`);
}

async function createNativeMobileResourcesModule(): Promise<ArtifactResult> {
    log("Creating the Native Mobile Resource module...");
    const moduleFolder = join(repoRootPath, "packages/jsActions", inputs.module);
    log(`Module folder: ${moduleFolder}`);
    const ossFiles = await getOssFiles(moduleFolder, false);
    log(`OSS files to include: ${ossFiles.length}`);
    const tmpFolder = join(repoRootPath, "tmp", inputs.module);
    log(`Temp folder: ${tmpFolder}`);
    const widgetFolders = await readdir(join(repoRootPath, "packages/pluggableWidgets"));
    const nativeWidgetFolders = widgetFolders
        .filter(folder => folder.includes("-native"))
        .map(folder => join(repoRootPath, "packages/pluggableWidgets", folder));
    log(`Native widget folders found: ${nativeWidgetFolders.length}`);
    const moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "NativeMobileResources",
        moduleFolderNameInModeler: "nativemobileresources"
    };
    log(
        `Module info: nameWithSpace=${moduleInfo.nameWithSpace ?? "<unknown>"}, minimumMXVersion=${
            moduleInfo.minimumMXVersion ?? "<unknown>"
        }, moduleNameInModeler=${moduleInfo.moduleNameInModeler}`
    );
    await updateNativeComponentsTestProject(moduleInfo, tmpFolder, nativeWidgetFolders);
    log("Creating MPK...");
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    log(`MPK created at: ${mpkOutput}`);
    log("Exporting module with widgets into MPK...");
    await exportModuleWithWidgets(moduleInfo.moduleNameInModeler, mpkOutput, nativeWidgetFolders, ossFiles);
    return {
        artifactPath: mpkOutput,
        artifactName: moduleInfo.moduleNameInModeler
    };
}

async function createNanoflowCommonsModule(): Promise<ArtifactResult> {
    log("Creating the Nanoflow Commons module...");
    const moduleFolder = join(repoRootPath, "packages/jsActions", inputs.module);
    log(`Module folder: ${moduleFolder}`);
    const ossFiles = await getOssFiles(moduleFolder, false);
    log(`OSS files to include: ${ossFiles.length}`);
    const tmpFolder = join(repoRootPath, "tmp", inputs.module);
    log(`Temp folder: ${tmpFolder}`);
    const moduleInfo = {
        ...(await getPackageInfo(moduleFolder)),
        moduleNameInModeler: "NanoflowCommons",
        moduleFolderNameInModeler: "nanoflowcommons"
    };

    log(
        `Module info: nameWithSpace=${moduleInfo.nameWithSpace ?? "<unknown>"}, minimumMXVersion=${
            moduleInfo.minimumMXVersion ?? "<unknown>"
        }, moduleNameInModeler=${moduleInfo.moduleNameInModeler}`
    );

    await updateNativeComponentsTestProject(moduleInfo, tmpFolder);
    log("Creating MPK...");
    const mpkOutput = await createMPK(tmpFolder, moduleInfo, regex.excludeFiles);
    log(`MPK created at: ${mpkOutput}`);
    log("Copying OSS files into MPK...");
    await copyFilesToMpk(ossFiles, mpkOutput, moduleInfo.moduleNameInModeler);
    return {
        artifactPath: mpkOutput,
        artifactName: moduleInfo.moduleNameInModeler
    };
}

// Update test project with latest changes and update version in themesource
async function updateNativeComponentsTestProject(
    moduleInfo: any,
    tmpFolder: string,
    nativeWidgetFolders?: string[]
): Promise<void> {
    const jsActionsPath = join(repoRootPath, `packages/jsActions/${inputs.module}/dist`);
    const jsActions: string[] = await getFiles(jsActionsPath);
    const tmpFolderActions = join(tmpFolder, `javascriptsource/${moduleInfo.moduleFolderNameInModeler}/actions`);

    log(`Updating NativeComponentsTestProject (repo=${moduleInfo.testProjectUrl ?? "<unknown>"})...`);
    log(`JS actions dist path: ${jsActionsPath}`);
    log(`JS actions files found: ${jsActions.length}`);
    await cloneRepo(moduleInfo.testProjectUrl, tmpFolder);

    log(`Deleting existing JS Actions from test project: ${tmpFolderActions}`);
    await rm(tmpFolderActions, { force: true, recursive: true }); // this is useful to avoid retaining stale dependencies in the test project.
    await mkdir(tmpFolderActions);
    log("Copying widget resources JS actions into test project...");
    await Promise.all([
        ...jsActions.map(async file => {
            const dest = join(tmpFolderActions, file.replace(jsActionsPath, ""));
            await mkdir(dirname(dest), { recursive: true });
            await copyFile(file, dest);
        })
    ]);
    if (nativeWidgetFolders) {
        log(`Deleting existing widgets from test project (widgets=${nativeWidgetFolders.length})...`);
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

        log("Copying widget resources widgets into test project...");
        await Promise.all([
            ...nativeWidgetFolders.map(async folder => {
                const src = (await getFiles(folder, [`.mpk`]))[0];
                const dest = join(widgetsDir, basename(src));
                await copyFile(src, dest);
            })
        ]);
    }
    log(`Writing themesource version file for ${moduleInfo.moduleFolderNameInModeler}...`);
    await execShellCommand(
        `echo ${inputs.version} > themesource/${moduleInfo.moduleFolderNameInModeler}/.version`,
        tmpFolder
    );
}
