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
    console.error("[MAIN] [ERROR] Unhandled error in main function:", e);
    process.exit(-1);
});

async function main() {
    console.log("=== [WIDGET_RELEASE] Starting main function ===");

    const widgetScope = process.argv[2];
    console.log("[WIDGET_RELEASE] [INPUT] widgetScope from argv[2]:", widgetScope);
    console.log("[WIDGET_RELEASE] [INPUT] Full process.argv:", process.argv);

    console.log("[WIDGET_RELEASE] [VALIDATION] Checking if widgetScope ends with '-web'");
    if (!widgetScope.endsWith("-web")) {
        console.error("[WIDGET_RELEASE] [VALIDATION] [ERROR] Invalid widget package - does not end with '-web'");
        throw new Error(`${widgetScope} is not a valid widget package.`);
    }
    console.log("[WIDGET_RELEASE] [VALIDATION] Widget package validation passed");

    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] Getting widget release information");
    const { releaseMpkPath, repositoryUrl, unreleasedChangelogs, version, widgetName, changelogPath } =
        await getWidgetReleaseInformation(widgetScope);

    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] Widget release information retrieved:");
    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] - releaseMpkPath:", releaseMpkPath);
    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] - repositoryUrl:", repositoryUrl);
    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] - version:", version);
    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] - widgetName:", widgetName);
    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] - changelogPath:", changelogPath);
    console.log("[WIDGET_RELEASE] [INFO_RETRIEVAL] - unreleasedChangelogs length:", unreleasedChangelogs?.length || 0);

    console.log("[WIDGET_RELEASE] [VALIDATION] Checking if unreleased changelogs exist");
    if (!unreleasedChangelogs) {
        console.error("[WIDGET_RELEASE] [VALIDATION] [ERROR] No unreleased changes found");
        throw new Error(`No unreleased changes found in the CHANGELOG.md for ${widgetName} ${version}.`);
    }
    console.log("[WIDGET_RELEASE] [VALIDATION] Unreleased changelogs validation passed");

    console.log("Starting widget release...");

    console.log("[WIDGET_RELEASE] [AUTH] Starting GitHub authentication");
    await githubAuthentication({ url: repositoryUrl });
    console.log("[WIDGET_RELEASE] [AUTH] GitHub authentication completed");

    console.log("Creating Github release...");
    const releaseData = {
        title: `${widgetName} (Web) - Marketplace Release v${version}`,
        body: unreleasedChangelogs.replace(/"/g, "'"),
        tag: `${widgetScope}-v${version}`,
        mpkOutput: releaseMpkPath,
        isDraft: true
    };
    console.log("[WIDGET_RELEASE] [GITHUB_RELEASE] Release data:", releaseData);
    await createGithubReleaseFrom(releaseData);
    console.log("[WIDGET_RELEASE] [GITHUB_RELEASE] GitHub release created successfully");

    console.log("Updating widget CHANGELOG.md...");
    console.log("[WIDGET_RELEASE] [CHANGELOG] Updating widget changelog with data:", { changelogPath, version });
    await writeToWidgetChangelogs(unreleasedChangelogs, { changelogPath, version });
    console.log("[WIDGET_RELEASE] [CHANGELOG] Widget changelog updated successfully");

    console.log("Creating pull request for CHANGELOG.md...");
    const prData = { nameWithDash: widgetScope, version, nameWithSpace: widgetName };
    console.log("[WIDGET_RELEASE] [PULL_REQUEST] Creating PR with data:", prData);
    await commitAndCreatePullRequest(prData);
    console.log("[WIDGET_RELEASE] [PULL_REQUEST] Pull request created successfully");

    console.log("=== [WIDGET_RELEASE] Main function completed successfully ===");
    console.log("Done.");
}

async function getWidgetReleaseInformation(widgetScope) {
    console.log("=== [WIDGET_INFO] Starting getWidgetReleaseInformation ===");
    console.log("[WIDGET_INFO] [INPUT] widgetScope:", widgetScope);
    console.log("[WIDGET_INFO] [INPUT] process.cwd():", process.cwd());

    const pluggableWidgetsFolder = join(process.cwd(), "packages/pluggableWidgets");
    console.log("[WIDGET_INFO] [PATH] pluggableWidgetsFolder:", pluggableWidgetsFolder);

    console.log("[WIDGET_INFO] [DISCOVERY] Reading pluggable widgets directory");
    const pluggableWidgets = await readdir(pluggableWidgetsFolder);
    console.log("[WIDGET_INFO] [DISCOVERY] Found pluggable widgets:", pluggableWidgets);

    console.log("[WIDGET_INFO] [VALIDATION] Checking if widgetScope exists in pluggable widgets");
    if (!pluggableWidgets.includes(widgetScope)) {
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] Widget scope not found in pluggable widgets");
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] Available widgets:", pluggableWidgets);
        throw new Error(`${widgetScope} is not a valid pluggable widget.`);
    }
    console.log("[WIDGET_INFO] [VALIDATION] Widget scope validation passed");

    const widgetPath = join(pluggableWidgetsFolder, widgetScope);
    const pkgPath = join(widgetPath, "package.json");
    console.log("[WIDGET_INFO] [PATH] widgetPath:", widgetPath);
    console.log("[WIDGET_INFO] [PATH] pkgPath:", pkgPath);

    console.log("[WIDGET_INFO] [PACKAGE] Loading package.json");
    const { name, widgetName, version, repository } = require(pkgPath);
    console.log("[WIDGET_INFO] [PACKAGE] Package info loaded:");
    console.log("[WIDGET_INFO] [PACKAGE] - name:", name);
    console.log("[WIDGET_INFO] [PACKAGE] - widgetName:", widgetName);
    console.log("[WIDGET_INFO] [PACKAGE] - version:", version);
    console.log("[WIDGET_INFO] [PACKAGE] - repository:", repository);

    console.log(`Getting the widget release information for ${widgetName} widget...`);

    console.log("[WIDGET_INFO] [VALIDATION] Validating package.json required fields");
    if (!name || !widgetName || !version || !version.includes(".") || !repository?.url) {
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] Missing required fields in package.json");
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] Field validation:");
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] - name exists:", !!name);
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] - widgetName exists:", !!widgetName);
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] - version exists:", !!version);
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] - version has dot:", version?.includes("."));
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] - repository.url exists:", !!repository?.url);
        throw new Error(`${pkgPath} does not define expected keys.`);
    }

    console.log("[WIDGET_INFO] [VALIDATION] Validating version format (should have 3 parts)");
    const versionParts = version.split(".");
    console.log("[WIDGET_INFO] [VALIDATION] Version parts:", versionParts);
    if (versionParts.length !== 3) {
        console.error("[WIDGET_INFO] [VALIDATION] [ERROR] Version format invalid - should have 3 parts");
        throw new Error(`${pkgPath} version is not defined correctly.`);
    }
    console.log("[WIDGET_INFO] [VALIDATION] Version format validation passed");

    const mpkSearchPath = join(widgetPath, "dist", "**/*.mpk");
    console.log("[WIDGET_INFO] [MPK_SEARCH] Searching for MPK file at:", mpkSearchPath);
    const mpkFile = ls(mpkSearchPath).toString();
    console.log("[WIDGET_INFO] [MPK_SEARCH] MPK search result:", mpkFile);

    if (!mpkFile) {
        console.error("[WIDGET_INFO] [MPK_SEARCH] [ERROR] MPK file not found");
        throw new Error("MPK file not found");
    }

    console.log(`MPK path: ${mpkFile}`);
    const changelogPath = join(widgetPath, "CHANGELOG.md");
    console.log("[WIDGET_INFO] [PATH] changelogPath:", changelogPath);

    console.log("[WIDGET_INFO] [CHANGELOG] Getting unreleased changelogs");
    const unreleasedChangelogs = await getUnreleasedChangelogs({ version, changelogPath });
    console.log("[WIDGET_INFO] [CHANGELOG] Unreleased changelogs length:", unreleasedChangelogs?.length || 0);

    const result = {
        releaseMpkPath: mpkFile,
        repositoryUrl: repository.url,
        unreleasedChangelogs,
        version,
        widgetName,
        changelogPath
    };

    console.log("[WIDGET_INFO] [RESULT] Final widget release information:", result);
    console.log("=== [WIDGET_INFO] getWidgetReleaseInformation completed ===");

    return result;
}
