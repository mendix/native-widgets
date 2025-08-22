const { readdir } = require("fs/promises");
const { join } = require("path");
const { ls } = require("shelljs");
const {
    getUnreleasedChangelogs,
    writeToWidgetChangelogs,
    githubAuthentication,
    createGithubReleaseFrom,
    commitAndCreatePullRequest
} = require("./module-automation/commons");

main().catch(e => {
    console.error(`[WIDGET RELEASE ERROR] Widget release process failed`);
    console.error(`[WIDGET RELEASE ERROR] Widget scope: ${process.argv[2]}`);
    console.error(`[WIDGET RELEASE ERROR] Error: ${e.message}`);
    console.error(`[WIDGET RELEASE ERROR] Stack trace: ${e.stack}`);
    process.exit(-1);
});

async function main() {
    const widgetScope = process.argv[2];

    console.log(`[WIDGET RELEASE] Starting widget release process`);
    console.log(`[WIDGET RELEASE] Widget scope: ${widgetScope}`);

    if (!widgetScope.endsWith("-web")) {
        const errorMessage = `${widgetScope} is not a valid widget package.`;
        console.error(`[WIDGET RELEASE ERROR] ${errorMessage}`);
        throw new Error(errorMessage);
    }

    try {
        const { releaseMpkPath, repositoryUrl, unreleasedChangelogs, version, widgetName, changelogPath } =
            await getWidgetReleaseInformation(widgetScope);

        console.log(`[WIDGET RELEASE] Widget information loaded`);
        console.log(`[WIDGET RELEASE] Widget name: ${widgetName}`);
        console.log(`[WIDGET RELEASE] Version: ${version}`);
        console.log(`[WIDGET RELEASE] Repository URL: ${repositoryUrl}`);
        console.log(`[WIDGET RELEASE] MPK path: ${releaseMpkPath}`);
        console.log(`[WIDGET RELEASE] Changelog path: ${changelogPath}`);

        if (!unreleasedChangelogs) {
            const errorMessage = `No unreleased changes found in the CHANGELOG.md for ${widgetName} ${version}.`;
            console.error(`[WIDGET RELEASE ERROR] ${errorMessage}`);
            throw new Error(errorMessage);
        }

        console.log(`[WIDGET RELEASE] Starting widget release process for ${widgetName} v${version}`);
        await githubAuthentication({ url: repositoryUrl });

        console.log(`[WIDGET RELEASE] Creating GitHub release`);
        await createGithubReleaseFrom({
            title: `${widgetName} (Web) - Marketplace Release v${version}`,
            body: unreleasedChangelogs.replace(/"/g, "'"),
            tag: `${widgetScope}-v${version}`,
            mpkOutput: releaseMpkPath,
            isDraft: true
        });

        console.log(`[WIDGET RELEASE] Updating widget CHANGELOG.md`);
        await writeToWidgetChangelogs(unreleasedChangelogs, { changelogPath, version });

        console.log(`[WIDGET RELEASE] Creating pull request for CHANGELOG.md`);
        await commitAndCreatePullRequest({ nameWithDash: widgetScope, version, nameWithSpace: widgetName });

        console.log(`[WIDGET RELEASE] Successfully completed widget release for ${widgetName} v${version}`);
    } catch (error) {
        console.error(`[WIDGET RELEASE ERROR] Failed to complete widget release`);
        console.error(`[WIDGET RELEASE ERROR] Widget scope: ${widgetScope}`);
        console.error(`[WIDGET RELEASE ERROR] Error: ${error.message}`);
        console.error(`[WIDGET RELEASE ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function getWidgetReleaseInformation(widgetScope) {
    console.log(`[WIDGET INFO] Getting widget release information for: ${widgetScope}`);

    try {
        const pluggableWidgetsFolder = join(process.cwd(), "packages/pluggableWidgets");
        const pluggableWidgets = await readdir(pluggableWidgetsFolder);

        console.log(`[WIDGET INFO] Pluggable widgets folder: ${pluggableWidgetsFolder}`);
        console.log(`[WIDGET INFO] Found ${pluggableWidgets.length} widgets in folder`);

        if (!pluggableWidgets.includes(widgetScope)) {
            const errorMessage = `${widgetScope} is not a valid pluggable widget.`;
            console.error(`[WIDGET INFO ERROR] ${errorMessage}`);
            console.error(`[WIDGET INFO ERROR] Available widgets: ${pluggableWidgets.join(", ")}`);
            throw new Error(errorMessage);
        }

        const widgetPath = join(pluggableWidgetsFolder, widgetScope);
        const pkgPath = join(widgetPath, "package.json");
        const { name, widgetName, version, repository } = require(pkgPath);

        console.log(`[WIDGET INFO] Widget path: ${widgetPath}`);
        console.log(`[WIDGET INFO] Package.json path: ${pkgPath}`);
        console.log(`[WIDGET INFO] Widget name: ${widgetName} (${name})`);
        console.log(`[WIDGET INFO] Version: ${version}`);
        console.log(`[WIDGET INFO] Repository: ${repository?.url}`);

        if (!name || !widgetName || !version || !version.includes(".") || !repository?.url) {
            const errorMessage = `${pkgPath} does not define expected keys.`;
            console.error(`[WIDGET INFO ERROR] ${errorMessage}`);
            console.error(`[WIDGET INFO ERROR] Name: ${name}`);
            console.error(`[WIDGET INFO ERROR] Widget name: ${widgetName}`);
            console.error(`[WIDGET INFO ERROR] Version: ${version}`);
            console.error(`[WIDGET INFO ERROR] Repository URL: ${repository?.url}`);
            throw new Error(errorMessage);
        }

        if (version.split(".").length !== 3) {
            const errorMessage = `${pkgPath} version is not defined correctly.`;
            console.error(`[WIDGET INFO ERROR] ${errorMessage}`);
            console.error(`[WIDGET INFO ERROR] Version provided: ${version}`);
            console.error(`[WIDGET INFO ERROR] Expected format: x.y.z`);
            throw new Error(errorMessage);
        }

        const mpkFile = ls(join(widgetPath, "dist", "**/*.mpk")).toString();

        if (!mpkFile) {
            const errorMessage = "MPK file not found";
            console.error(`[WIDGET INFO ERROR] ${errorMessage}`);
            console.error(`[WIDGET INFO ERROR] Searched in: ${join(widgetPath, "dist", "**/*.mpk")}`);
            throw new Error(errorMessage);
        }

        console.log(`[WIDGET INFO] MPK path: ${mpkFile}`);
        const changelogPath = join(widgetPath, "CHANGELOG.md");
        console.log(`[WIDGET INFO] Changelog path: ${changelogPath}`);

        const result = {
            releaseMpkPath: mpkFile,
            repositoryUrl: repository.url,
            unreleasedChangelogs: await getUnreleasedChangelogs({ version, changelogPath }),
            version,
            widgetName,
            changelogPath
        };

        console.log(`[WIDGET INFO] Successfully loaded widget information for ${widgetName}`);
        return result;
    } catch (error) {
        console.error(`[WIDGET INFO ERROR] Failed to get widget release information`);
        console.error(`[WIDGET INFO ERROR] Widget scope: ${widgetScope}`);
        console.error(`[WIDGET INFO ERROR] Error: ${error.message}`);
        console.error(`[WIDGET INFO ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}
