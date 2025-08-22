const nodefetch = require("node-fetch");
const { join } = require("path");

const config = {
    appStoreUrl: "https://appstore.home.mendix.com/rest/packagesapi/v2",
    contributorUrl: "https://contributor.mendixcloud.com/apis/v1",
    // This one, for some reasons, needs to be added as OpenID header to contributor request.
    // The open id  value (a39025a8-55b8-4532-bc5d-4e74901d11f9) is taken from widgets@mendix.com
    // account and could be found at Profile -> Advanced -> Personal Info -> View My Data -> Open id
    // For each env (accp, test, prod) we have different Open Ids.
    // If this header is missing API will return 401.
    openIdUrl: process.env.OPENID_URL
};

main().catch(e => {
    console.error(`[MARKETPLACE RELEASE ERROR] Marketplace release process failed`);
    console.error(`[MARKETPLACE RELEASE ERROR] TAG: ${process.env.TAG}`);
    console.error(`[MARKETPLACE RELEASE ERROR] Error: ${e.message}`);
    console.error(`[MARKETPLACE RELEASE ERROR] Stack trace: ${e.stack}`);
    process.exit(1);
});

async function main() {
    console.log(`[MARKETPLACE] Starting marketplace release process`);
    console.log(`[MARKETPLACE] TAG: ${process.env.TAG}`);

    try {
        const pkgPath = join(process.cwd(), "package.json");
        const {
            name,
            widgetName,
            version,
            marketplace: { minimumMXVersion, marketplaceId }
        } = require(pkgPath);

        console.log(`[MARKETPLACE] Package path: ${pkgPath}`);
        console.log(`[MARKETPLACE] Processing release for tag: ${process.env.TAG}`);

        const pkgName = name ?? widgetName;

        console.log(`[MARKETPLACE] Package name: ${pkgName}`);
        console.log(`[MARKETPLACE] Widget name: ${widgetName}`);
        console.log(`[MARKETPLACE] Version: ${version}`);
        console.log(`[MARKETPLACE] Minimum MX Version: ${minimumMXVersion}`);
        console.log(`[MARKETPLACE] Marketplace ID: ${marketplaceId}`);

        if (!pkgName || !version || !minimumMXVersion || !marketplaceId || !version.includes(".")) {
            const errorMessage = `${pkgPath} does not define expected keys.`;
            console.error(`[MARKETPLACE ERROR] ${errorMessage}`);
            console.error(`[MARKETPLACE ERROR] Package name: ${pkgName}`);
            console.error(`[MARKETPLACE ERROR] Version: ${version}`);
            console.error(`[MARKETPLACE ERROR] Minimum MX Version: ${minimumMXVersion}`);
            console.error(`[MARKETPLACE ERROR] Marketplace ID: ${marketplaceId}`);
            throw new Error(errorMessage);
        }

        if (version.split(".").length !== 3) {
            const errorMessage = `${pkgPath} version is not defined correctly.`;
            console.error(`[MARKETPLACE ERROR] ${errorMessage}`);
            console.error(`[MARKETPLACE ERROR] Version provided: ${version}`);
            console.error(`[MARKETPLACE ERROR] Expected format: x.y.z`);
            throw new Error(errorMessage);
        }

        await uploadModuleToAppStore(pkgName, marketplaceId, version, minimumMXVersion);
        console.log(`[MARKETPLACE] Successfully completed marketplace release for ${pkgName} v${version}`);
    } catch (error) {
        console.error(`[MARKETPLACE ERROR] Failed to complete marketplace release`);
        console.error(`[MARKETPLACE ERROR] TAG: ${process.env.TAG}`);
        console.error(`[MARKETPLACE ERROR] Error: ${error.message}`);
        console.error(`[MARKETPLACE ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function uploadModuleToAppStore(pkgName, marketplaceId, version, minimumMXVersion) {
    console.log(`[APPSTORE UPLOAD] Starting upload to App Store`);
    console.log(`[APPSTORE UPLOAD] Package name: ${pkgName}`);
    console.log(`[APPSTORE UPLOAD] Marketplace ID: ${marketplaceId}`);
    console.log(`[APPSTORE UPLOAD] Version: ${version}`);
    console.log(`[APPSTORE UPLOAD] Minimum MX Version: ${minimumMXVersion}`);

    try {
        const postResponse = await createDraft(marketplaceId, version, minimumMXVersion);
        console.log(`[APPSTORE UPLOAD] Successfully created draft with UUID: ${postResponse.UUID}`);

        await publishDraft(postResponse.UUID);
        console.log(`[APPSTORE UPLOAD] Successfully published draft`);
        console.log(`[APPSTORE UPLOAD] Successfully uploaded ${pkgName} to the Mendix Marketplace.`);
    } catch (error) {
        console.error(`[APPSTORE UPLOAD ERROR] Failed uploading to app store`);
        console.error(`[APPSTORE UPLOAD ERROR] Package name: ${pkgName}`);
        console.error(`[APPSTORE UPLOAD ERROR] Marketplace ID: ${marketplaceId}`);
        console.error(`[APPSTORE UPLOAD ERROR] Version: ${version}`);
        console.error(`[APPSTORE UPLOAD ERROR] Minimum MX Version: ${minimumMXVersion}`);
        console.error(`[APPSTORE UPLOAD ERROR] Error: ${error.message}`);
        console.error(`[APPSTORE UPLOAD ERROR] Stack trace: ${error.stack}`);
        error.message = `Failed uploading ${pkgName} to appstore with error: ${error.message}`;
        throw error;
    }
}

async function getGithubAssetUrl() {
    console.log(`[GITHUB ASSET] Retrieving information from GitHub Tag: ${process.env.TAG}`);

    try {
        const request = await fetch("GET", "https://api.github.com/repos/mendix/native-widgets/releases?per_page=20");
        const data = (await request) ?? [];

        console.log(`[GITHUB ASSET] Found ${data.length} releases on GitHub`);
        console.log(`[GITHUB ASSET] Looking for release with tag: ${process.env.TAG}`);

        // Log available releases for debugging
        const availableTags = data.map(release => release.tag_name);
        console.log(
            `[GITHUB ASSET] Available release tags: ${availableTags.slice(0, 10).join(", ")}${
                availableTags.length > 10 ? "..." : ""
            }`
        );

        const releaseId = data.find(info => info.tag_name === process.env.TAG)?.id;
        if (!releaseId) {
            console.error(`[GITHUB ASSET ERROR] Could not find release with tag ${process.env.TAG} on GitHub`);
            console.error(`[GITHUB ASSET ERROR] Available tags: ${availableTags.join(", ")}`);
            console.error(`[GITHUB ASSET ERROR] This usually means the GitHub release creation step failed earlier`);
            console.error(`[GITHUB ASSET ERROR] Check the native module creation logs for the GitHub release step`);
            console.error(`[GITHUB ASSET ERROR] `);
            console.error(`[GITHUB ASSET ERROR] To resolve this issue:`);
            console.error(`[GITHUB ASSET ERROR] 1. Check if the native module creation process completed successfully`);
            console.error(`[GITHUB ASSET ERROR] 2. Look for GitHub release creation errors in the logs`);
            console.error(`[GITHUB ASSET ERROR] 3. If needed, manually create the GitHub release with the MPK asset`);
            console.error(`[GITHUB ASSET ERROR] 4. Or re-run the native module creation process`);
            console.error(`[GITHUB ASSET ERROR] `);
            throw new Error(`Could not find release with tag ${process.env.TAG} on GitHub`);
        }

        console.log(`[GITHUB ASSET] Found release with ID: ${releaseId}`);

        const assetsRequest = await fetch(
            "GET",
            `https://api.github.com/repos/mendix/native-widgets/releases/${releaseId}/assets`
        );
        const assetsData = (await assetsRequest) ?? [];

        console.log(`[GITHUB ASSET] Found ${assetsData.length} assets in release`);

        const downloadUrl = assetsData.find(asset => asset.name.endsWith(".mpk"))?.browser_download_url;
        if (!downloadUrl) {
            console.error(
                `[GITHUB ASSET ERROR] Could not retrieve MPK URL from GitHub release with tag ${process.env.TAG}`
            );
            console.error(`[GITHUB ASSET ERROR] Available assets: ${assetsData.map(a => a.name).join(", ")}`);
            console.error(`[GITHUB ASSET ERROR] Looking for assets ending with .mpk`);
            throw new Error(`Could not retrieve MPK url from GitHub release with tag ${process.env.TAG}`);
        }

        console.log(`[GITHUB ASSET] Successfully found MPK download URL: ${downloadUrl}`);
        return downloadUrl;
    } catch (error) {
        console.error(`[GITHUB ASSET ERROR] Failed to retrieve GitHub asset URL`);
        console.error(`[GITHUB ASSET ERROR] Tag: ${process.env.TAG}`);
        console.error(`[GITHUB ASSET ERROR] Error: ${error.message}`);
        console.error(`[GITHUB ASSET ERROR] Stack trace: ${error.stack}`);
        throw error;
    }
}

async function createDraft(marketplaceId, version, minimumMXVersion) {
    console.log(`[MARKETPLACE DRAFT] Creating draft in the Mendix Marketplace`);
    console.log(`[MARKETPLACE DRAFT] ID: ${marketplaceId} - Version: ${version} - MXVersion: ${minimumMXVersion}`);
    console.log(`[MARKETPLACE DRAFT] TAG: ${process.env.TAG}`);

    const [major, minor, patch] = version.split(".");
    console.log(`[MARKETPLACE DRAFT] Version parts - Major: ${major}, Minor: ${minor}, Patch: ${patch}`);
    console.log(`[MARKETPLACE DRAFT] Studio Pro Version: ${minimumMXVersion.split(".").slice(0, 3).join(".")}`);

    try {
        console.log(`[MARKETPLACE DRAFT] Getting GitHub asset URL for release`);
        const artifactURL = await getGithubAssetUrl();

        const body = {
            VersionMajor: major ?? 1,
            VersionMinor: minor ?? 0,
            VersionPatch: patch ?? 0,
            StudioProVersion: minimumMXVersion.split(".").slice(0, 3).join("."),
            IsSourceGitHub: true,
            GithubRepo: {
                UseReadmeForDoc: false,
                ArtifactURL: artifactURL
            }
        };

        console.log(`[MARKETPLACE DRAFT] Request body prepared, sending to marketplace API`);
        console.log(`[MARKETPLACE DRAFT] Artifact URL: ${artifactURL}`);

        const result = await fetchContributor("POST", `packages/${marketplaceId}/versions`, JSON.stringify(body));
        console.log(`[MARKETPLACE DRAFT] Successfully created draft in marketplace`);
        return result;
    } catch (error) {
        console.error(`[MARKETPLACE DRAFT ERROR] Failed creating draft in the appstore`);
        console.error(`[MARKETPLACE DRAFT ERROR] Marketplace ID: ${marketplaceId}`);
        console.error(`[MARKETPLACE DRAFT ERROR] Version: ${version}`);
        console.error(`[MARKETPLACE DRAFT ERROR] MX Version: ${minimumMXVersion}`);
        console.error(`[MARKETPLACE DRAFT ERROR] TAG: ${process.env.TAG}`);
        console.error(`[MARKETPLACE DRAFT ERROR] Error: ${error.message}`);
        console.error(`[MARKETPLACE DRAFT ERROR] Stack trace: ${error.stack}`);
        error.message = `Failed creating draft in the appstore with error: ${error.message}`;
        throw error;
    }
}

function publishDraft(UUID) {
    console.log(`[MARKETPLACE PUBLISH] Publishing draft in the Mendix Marketplace`);
    console.log(`[MARKETPLACE PUBLISH] Draft UUID: ${UUID}`);

    try {
        const result = fetchContributor("PATCH", `package-versions/${UUID}`, JSON.stringify({ Status: "Publish" }));
        console.log(`[MARKETPLACE PUBLISH] Successfully initiated publish for draft: ${UUID}`);
        return result;
    } catch (error) {
        console.error(`[MARKETPLACE PUBLISH ERROR] Failed publishing draft in the appstore`);
        console.error(`[MARKETPLACE PUBLISH ERROR] Draft UUID: ${UUID}`);
        console.error(`[MARKETPLACE PUBLISH ERROR] Error: ${error.message}`);
        console.error(`[MARKETPLACE PUBLISH ERROR] Stack trace: ${error.stack}`);
        error.message = `Failed publishing draft in the appstore with error: ${error.message}`;
        throw error;
    }
}

async function fetchContributor(method, path, body) {
    const user = process.env.CPAPI_USERNAME;
    const pass = process.env.CPAPI_PASS_PROD;
    const credentials = `${user}:${pass}`;

    return fetch(method, `${config.contributorUrl}/${path}`, body, {
        OpenID: config.openIdUrl,
        Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`
    });
}

async function fetch(method, url, body, additionalHeaders) {
    let response;
    const httpsOptions = {
        method,
        redirect: "follow",
        headers: {
            Accept: "application/json",
            ...additionalHeaders,
            ...(body && { "Content-Type": "application/json" })
        },
        body
    };

    console.log(`Fetching URL (${method}): ${url}`);
    try {
        response = await nodefetch(url, httpsOptions);
    } catch (error) {
        throw new Error(`An error occurred while retrieving data from ${url}. Technical error: ${error.message}`);
    }
    console.log(`Response status Code ${response.status}`);
    if (response.status === 409) {
        throw new Error(
            `Fetching Failed (Code ${response.status}). Possible solution: Check & delete drafts in Mendix Marketplace.`
        );
    } else if (response.status === 503) {
        throw new Error(`Fetching Failed. "${url}" is unreachable (Code ${response.status}).`);
    } else if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Fetching Failed (Code ${response.status}). ${response.statusText}`);
    } else if (response.ok) {
        return response.json();
    } else {
        throw new Error(`Fetching Failed (Code ${response.status}). ${response.statusText}`);
    }
}
