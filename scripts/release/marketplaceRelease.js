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

console.log("[MARKETPLACE] [CONFIG] Configuration loaded:");
console.log("[MARKETPLACE] [CONFIG] - appStoreUrl:", config.appStoreUrl);
console.log("[MARKETPLACE] [CONFIG] - contributorUrl:", config.contributorUrl);
console.log("[MARKETPLACE] [CONFIG] - openIdUrl:", config.openIdUrl ? "[SET]" : "[NOT SET]");

main().catch(e => {
    console.error("[MARKETPLACE] [ERROR] Unhandled error in main function:", e);
    process.exit(1);
});

async function main() {
    console.log("=== [MARKETPLACE] Starting main function ===");
    console.log("[MARKETPLACE] [INPUT] process.env.TAG:", process.env.TAG);
    console.log("[MARKETPLACE] [INPUT] process.cwd():", process.cwd());

    const pkgPath = join(process.cwd(), "package.json");
    console.log("[MARKETPLACE] [PATH] pkgPath:", pkgPath);

    console.log("[MARKETPLACE] [PACKAGE] Loading package.json");
    const {
        name,
        widgetName,
        version,
        marketplace: { minimumMXVersion, marketplaceId }
    } = require(pkgPath);

    console.log("[MARKETPLACE] [PACKAGE] Package info loaded:");
    console.log("[MARKETPLACE] [PACKAGE] - name:", name);
    console.log("[MARKETPLACE] [PACKAGE] - widgetName:", widgetName);
    console.log("[MARKETPLACE] [PACKAGE] - version:", version);
    console.log("[MARKETPLACE] [PACKAGE] - minimumMXVersion:", minimumMXVersion);
    console.log("[MARKETPLACE] [PACKAGE] - marketplaceId:", marketplaceId);

    console.log(`Starting release process for tag ${process.env.TAG}`);

    const pkgName = name ?? widgetName;
    console.log("[MARKETPLACE] [PROCESSING] Final package name:", pkgName);

    console.log("[MARKETPLACE] [VALIDATION] Validating required fields");
    if (!pkgName || !version || !minimumMXVersion || !marketplaceId || !version.includes(".")) {
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] Missing required fields:");
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] - pkgName exists:", !!pkgName);
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] - version exists:", !!version);
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] - minimumMXVersion exists:", !!minimumMXVersion);
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] - marketplaceId exists:", !!marketplaceId);
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] - version has dot:", version?.includes("."));
        throw new Error(`${pkgPath} does not define expected keys.`);
    }

    console.log("[MARKETPLACE] [VALIDATION] Validating version format (should have 3 parts)");
    const versionParts = version.split(".");
    console.log("[MARKETPLACE] [VALIDATION] Version parts:", versionParts);
    if (versionParts.length !== 3) {
        console.error("[MARKETPLACE] [VALIDATION] [ERROR] Version format invalid - should have 3 parts");
        throw new Error(`${pkgPath} version is not defined correctly.`);
    }
    console.log("[MARKETPLACE] [VALIDATION] All validations passed");

    console.log("[MARKETPLACE] [UPLOAD] Starting upload to App Store");
    await uploadModuleToAppStore(pkgName, marketplaceId, version, minimumMXVersion);
    console.log("=== [MARKETPLACE] Main function completed successfully ===");
}

async function uploadModuleToAppStore(pkgName, marketplaceId, version, minimumMXVersion) {
    console.log("=== [APPSTORE_UPLOAD] Starting uploadModuleToAppStore ===");
    console.log("[APPSTORE_UPLOAD] [INPUT] pkgName:", pkgName);
    console.log("[APPSTORE_UPLOAD] [INPUT] marketplaceId:", marketplaceId);
    console.log("[APPSTORE_UPLOAD] [INPUT] version:", version);
    console.log("[APPSTORE_UPLOAD] [INPUT] minimumMXVersion:", minimumMXVersion);

    try {
        console.log("[APPSTORE_UPLOAD] [DRAFT] Creating draft in marketplace");
        const postResponse = await createDraft(marketplaceId, version, minimumMXVersion);
        console.log("[APPSTORE_UPLOAD] [DRAFT] Draft creation response:", postResponse);

        console.log("[APPSTORE_UPLOAD] [PUBLISH] Publishing draft with UUID:", postResponse.UUID);
        await publishDraft(postResponse.UUID);
        console.log("[APPSTORE_UPLOAD] [PUBLISH] Draft published successfully");

        console.log(`Successfully uploaded ${pkgName} to the Mendix Marketplace.`);
        console.log("=== [APPSTORE_UPLOAD] uploadModuleToAppStore completed successfully ===");
    } catch (error) {
        console.error("[APPSTORE_UPLOAD] [ERROR] Upload failed:", error);
        error.message = `Failed uploading ${pkgName} to appstore with error: ${error.message}`;
        throw error;
    }
}

async function getGithubAssetUrl() {
    console.log("=== [GITHUB_ASSET] Starting getGithubAssetUrl ===");
    console.log("[GITHUB_ASSET] [INPUT] process.env.TAG:", process.env.TAG);

    console.log("Retrieving informations from Github Tag");
    const releasesUrl = "https://api.github.com/repos/mendix/native-widgets/releases?per_page=10";
    console.log("[GITHUB_ASSET] [API] Fetching releases from:", releasesUrl);

    const request = await fetch("GET", releasesUrl);
    const data = (await request) ?? [];
    console.log("[GITHUB_ASSET] [API] Releases data received, count:", data.length);
    console.log(
        "[GITHUB_ASSET] [API] Available release tags:",
        data.map(r => r.tag_name)
    );

    const releaseId = data.find(info => info.tag_name === process.env.TAG)?.id;
    console.log("[GITHUB_ASSET] [SEARCH] Looking for tag:", process.env.TAG);
    console.log("[GITHUB_ASSET] [SEARCH] Found release ID:", releaseId);

    if (!releaseId) {
        console.error("[GITHUB_ASSET] [ERROR] Could not find release with specified tag");
        throw new Error(`Could not find release with tag ${process.env.TAG} on GitHub`);
    }

    const assetsUrl = `https://api.github.com/repos/mendix/native-widgets/releases/${releaseId}/assets`;
    console.log("[GITHUB_ASSET] [ASSETS] Fetching assets from:", assetsUrl);

    const assetsRequest = await fetch("GET", assetsUrl);
    const assetsData = (await assetsRequest) ?? [];
    console.log("[GITHUB_ASSET] [ASSETS] Assets data received, count:", assetsData.length);
    console.log(
        "[GITHUB_ASSET] [ASSETS] Available asset names:",
        assetsData.map(a => a.name)
    );

    const downloadUrl = assetsData.find(asset => asset.name.endsWith(".mpk"))?.browser_download_url;
    console.log("[GITHUB_ASSET] [SEARCH] Looking for .mpk asset");
    console.log("[GITHUB_ASSET] [SEARCH] Found download URL:", downloadUrl);

    if (!downloadUrl) {
        console.error("[GITHUB_ASSET] [ERROR] Could not find .mpk asset in release");
        throw new Error(`Could not retrieve MPK url from GitHub release with tag ${process.env.TAG}`);
    }

    console.log("=== [GITHUB_ASSET] getGithubAssetUrl completed successfully ===");
    return downloadUrl;
}

async function createDraft(marketplaceId, version, minimumMXVersion) {
    console.log("=== [CREATE_DRAFT] Starting createDraft ===");
    console.log("[CREATE_DRAFT] [INPUT] marketplaceId:", marketplaceId);
    console.log("[CREATE_DRAFT] [INPUT] version:", version);
    console.log("[CREATE_DRAFT] [INPUT] minimumMXVersion:", minimumMXVersion);

    console.log(`Creating draft in the Mendix Marketplace...`);
    console.log(`ID: ${marketplaceId} - Version: ${version} - MXVersion: ${minimumMXVersion}`);

    const [major, minor, patch] = version.split(".");
    console.log("[CREATE_DRAFT] [VERSION] Version parts parsed:");
    console.log("[CREATE_DRAFT] [VERSION] - major:", major);
    console.log("[CREATE_DRAFT] [VERSION] - minor:", minor);
    console.log("[CREATE_DRAFT] [VERSION] - patch:", patch);

    const studioProVersion = minimumMXVersion.split(".").slice(0, 3).join(".");
    console.log("[CREATE_DRAFT] [VERSION] StudioProVersion:", studioProVersion);

    try {
        console.log("[CREATE_DRAFT] [GITHUB] Getting GitHub asset URL");
        const artifactURL = await getGithubAssetUrl();
        console.log("[CREATE_DRAFT] [GITHUB] Artifact URL retrieved:", artifactURL);

        const body = {
            VersionMajor: major ?? 1,
            VersionMinor: minor ?? 0,
            VersionPatch: patch ?? 0,
            StudioProVersion: studioProVersion,
            IsSourceGitHub: true,
            GithubRepo: {
                UseReadmeForDoc: false,
                ArtifactURL: artifactURL
            }
        };

        console.log("[CREATE_DRAFT] [REQUEST] Request body prepared:", body);
        console.log("[CREATE_DRAFT] [API] Making POST request to create draft");

        const result = await fetchContributor("POST", `packages/${marketplaceId}/versions`, JSON.stringify(body));
        console.log("[CREATE_DRAFT] [API] Draft creation response:", result);
        console.log("=== [CREATE_DRAFT] createDraft completed successfully ===");

        return result;
    } catch (error) {
        console.error("[CREATE_DRAFT] [ERROR] Failed to create draft:", error);
        error.message = `Failed creating draft in the appstore with error: ${error.message}`;
        throw error;
    }
}

function publishDraft(UUID) {
    console.log("=== [PUBLISH_DRAFT] Starting publishDraft ===");
    console.log("[PUBLISH_DRAFT] [INPUT] UUID:", UUID);

    console.log(`Publishing draft in the Mendix Marketplace...`);
    try {
        const requestBody = JSON.stringify({ Status: "Publish" });
        console.log("[PUBLISH_DRAFT] [REQUEST] Request body:", requestBody);
        console.log("[PUBLISH_DRAFT] [API] Making PATCH request to publish draft");

        const result = fetchContributor("PATCH", `package-versions/${UUID}`, requestBody);
        console.log("=== [PUBLISH_DRAFT] publishDraft completed successfully ===");
        return result;
    } catch (error) {
        console.error("[PUBLISH_DRAFT] [ERROR] Failed to publish draft:", error);
        error.message = `Failed publishing draft in the appstore with error: ${error.message}`;
        throw error;
    }
}

async function fetchContributor(method, path, body) {
    console.log("=== [FETCH_CONTRIBUTOR] Starting fetchContributor ===");
    console.log("[FETCH_CONTRIBUTOR] [INPUT] method:", method);
    console.log("[FETCH_CONTRIBUTOR] [INPUT] path:", path);
    console.log("[FETCH_CONTRIBUTOR] [INPUT] body:", body);

    const user = process.env.CPAPI_USERNAME;
    const pass = process.env.CPAPI_PASS_PROD;
    console.log("[FETCH_CONTRIBUTOR] [AUTH] Username:", user ? "[SET]" : "[NOT SET]");
    console.log("[FETCH_CONTRIBUTOR] [AUTH] Password:", pass ? "[SET]" : "[NOT SET]");

    const credentials = `${user}:${pass}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64");
    console.log("[FETCH_CONTRIBUTOR] [AUTH] Credentials encoded for Basic auth");

    const url = `${config.contributorUrl}/${path}`;
    console.log("[FETCH_CONTRIBUTOR] [URL] Full URL:", url);

    const headers = {
        OpenID: config.openIdUrl,
        Authorization: `Basic ${encodedCredentials}`
    };
    console.log("[FETCH_CONTRIBUTOR] [HEADERS] Request headers prepared:");
    console.log("[FETCH_CONTRIBUTOR] [HEADERS] - OpenID:", headers.OpenID ? "[SET]" : "[NOT SET]");
    console.log("[FETCH_CONTRIBUTOR] [HEADERS] - Authorization: [SET]");

    const result = await fetch(method, url, body, headers);
    console.log("=== [FETCH_CONTRIBUTOR] fetchContributor completed successfully ===");
    return result;
}

async function fetch(method, url, body, additionalHeaders) {
    console.log("=== [FETCH] Starting fetch ===");
    console.log("[FETCH] [INPUT] method:", method);
    console.log("[FETCH] [INPUT] url:", url);
    console.log("[FETCH] [INPUT] body:", body ? `[${typeof body}]` : "[EMPTY]");
    console.log("[FETCH] [INPUT] additionalHeaders:", additionalHeaders);

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

    console.log("[FETCH] [CONFIG] HTTPS options prepared:");
    console.log("[FETCH] [CONFIG] - method:", httpsOptions.method);
    console.log("[FETCH] [CONFIG] - redirect:", httpsOptions.redirect);
    console.log("[FETCH] [CONFIG] - headers:", httpsOptions.headers);
    console.log("[FETCH] [CONFIG] - body exists:", !!httpsOptions.body);

    console.log(`Fetching URL (${method}): ${url}`);
    try {
        console.log("[FETCH] [REQUEST] Making HTTP request");
        response = await nodefetch(url, httpsOptions);
        console.log("[FETCH] [RESPONSE] Response received");
    } catch (error) {
        console.error("[FETCH] [ERROR] Network error:", error);
        throw new Error(`An error occurred while retrieving data from ${url}. Technical error: ${error.message}`);
    }

    console.log(`Response status Code ${response.status}`);
    console.log("[FETCH] [RESPONSE] Response status:", response.status);
    console.log("[FETCH] [RESPONSE] Response ok:", response.ok);
    console.log("[FETCH] [RESPONSE] Response statusText:", response.statusText);

    if (response.status === 409) {
        console.error("[FETCH] [ERROR] Conflict error (409) - possible draft already exists");
        throw new Error(
            `Fetching Failed (Code ${response.status}). Possible solution: Check & delete drafts in Mendix Marketplace.`
        );
    } else if (response.status === 503) {
        console.error("[FETCH] [ERROR] Service unavailable (503)");
        throw new Error(`Fetching Failed. "${url}" is unreachable (Code ${response.status}).`);
    } else if (response.status !== 200 && response.status !== 201) {
        console.error("[FETCH] [ERROR] HTTP error:", response.status, response.statusText);
        throw new Error(`Fetching Failed (Code ${response.status}). ${response.statusText}`);
    } else if (response.ok) {
        console.log("[FETCH] [SUCCESS] Request successful, parsing JSON response");
        const result = await response.json();
        console.log("[FETCH] [SUCCESS] JSON response parsed");
        console.log("=== [FETCH] fetch completed successfully ===");
        return result;
    } else {
        console.error("[FETCH] [ERROR] Response not ok despite status code");
        throw new Error(`Fetching Failed (Code ${response.status}). ${response.statusText}`);
    }
}
