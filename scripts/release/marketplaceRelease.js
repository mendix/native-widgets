const nodefetch = require("node-fetch");
const { join } = require("path");

const config = {
    appStoreUrl: "https://appstore.home.mendix.com/rest/packagesapi/v2",
    contributorUrl: "https://contributor.mendix.com/apis/v1",
    // This one, for some reasons, needs to be added as OpenID header to contributor request.
    // The open id  value (a39025a8-55b8-4532-bc5d-4e74901d11f9) is taken from widgets@mendix.com
    // account and could be found at Profile -> Advanced -> Personal Info -> View My Data -> Open id
    // For each env (accp, test, prod) we have different Open Ids.
    // If this header is missing API will return 401.
    openIdUrl: process.env.OPENID_URL
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    const {
        name,
        widgetName,
        version,
        marketplace: { minimumMXVersion, marketplaceId }
    } = packageMetadata();

    console.log(`Starting release process for tag ${process.env.TAG}`);

    const pkgName = name ?? widgetName;
    if (!pkgName || !version || !minimumMXVersion || !marketplaceId || !version.includes(".")) {
        throw new Error(`${pkgPath} does not define expected keys.`);
    }

    if (version.split(".").length !== 3) {
        throw new Error(`${pkgPath} version is not defined correctly.`);
    }

    await uploadModuleToAppStore(pkgName, marketplaceId, version, minimumMXVersion);
}

async function uploadModuleToAppStore(pkgName, marketplaceId, version, minimumMXVersion) {
    try {
        const postResponse = await createDraft(marketplaceId, version, minimumMXVersion);
        await publishDraft(postResponse.UUID);
        console.log(`Successfully uploaded ${pkgName} to the Mendix Marketplace.`);

        await verifyReleasePublished(marketplaceId, version, pkgName);
    } catch (error) {
        error.message = `Failed uploading ${pkgName} to appstore with error: ${error.message}`;
        throw error;
    }
}

async function getGithubAssetUrl() {
    console.log("Retrieving informations from Github Tag");
    const tag = process.env.TAG;
    const githubHeaders = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};

    // Use direct tag lookup endpoint instead of listing releases
    // This avoids pagination issues and is more reliable
    const maxRetries = 5;
    const retryDelayMs = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Attempt ${attempt}/${maxRetries}: Fetching release for tag ${tag}`);

        const releaseData = await fetch(
            "GET",
            `https://api.github.com/repos/mendix/native-widgets/releases/tags/${tag}`,
            undefined,
            githubHeaders
        );

        if (releaseData && releaseData.id) {
            console.log(`Found release: ${releaseData.name} (id: ${releaseData.id})`);
            const downloadUrl = releaseData.assets?.find(asset => asset.name.endsWith(".mpk"))?.browser_download_url;
            if (!downloadUrl) {
                throw new Error(`Could not retrieve MPK url from GitHub release with tag ${tag}`);
            }
            return downloadUrl;
        }

        if (attempt < maxRetries) {
            console.log(`Release not found yet, waiting ${retryDelayMs / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    }

    throw new Error(`Could not find release with tag ${tag} on GitHub after ${maxRetries} attempts`);
}

async function createDraft(marketplaceId, version, minimumMXVersion) {
    console.log(`Creating draft in the Mendix Marketplace...`);
    console.log(`ID: ${marketplaceId} - Version: ${version} - MXVersion: ${minimumMXVersion}`);
    const [major, minor, patch] = version.split(".");
    const { marketplace } = packageMetadata();
    try {
        const body = {
            Name: marketplace.name,
            Description: marketplace.description,
            VersionMajor: major ?? 1,
            VersionMinor: minor ?? 0,
            VersionPatch: patch ?? 0,
            StudioProVersion: minimumMXVersion.split(".").slice(0, 3).join("."),
            IsSourceGitHub: true,
            GithubRepo: {
                UseReadmeForDoc: false,
                ArtifactURL: await getGithubAssetUrl()
            }
        };

        return fetchContributor("POST", `packages/${marketplaceId}/versions`, JSON.stringify(body));
    } catch (error) {
        error.message = `Failed creating draft in the appstore with error: ${error.message}`;
        throw error;
    }
}

function publishDraft(UUID) {
    console.log(`Publishing draft in the Mendix Marketplace...`);
    try {
        return fetchContributor("PATCH", `package-versions/${UUID}`, JSON.stringify({ Status: "Publish" }));
    } catch (error) {
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

function packageMetadata() {
    const pkgPath = join(process.cwd(), "package.json");
    const { name, widgetName, version, marketplace } = require(pkgPath);
    return { name, widgetName, version, marketplace };
}

async function verifyReleasePublished(contentId, expectedVersion, pkgName) {
    const normalizedExpectedVersion = expectedVersion.startsWith("v") ? expectedVersion.substring(1) : expectedVersion;

    console.log(`Verifying release ${normalizedExpectedVersion} is published for content ID ${contentId}...`);

    const patToken = process.env.MENDIX_PAT_TOKEN;
    if (!patToken) {
        console.warn("WARNING: MENDIX_PAT_TOKEN environment variable is not set. Skipping release verification.");
        return;
    }

    const maxRetries = 10;
    const retryDelayMs = 30000; // Keeping it high as it can take some time for the release to be available after publish API call returns success

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Verification attempt ${attempt}/${maxRetries}: Checking for version ${expectedVersion}`);

        try {
            // Call the Mendix Content API to get all released module versions
            const versionsResponse = await nodefetch(
                `https://marketplace-api.mendix.com/v1/content/${contentId}/versions`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `MxToken ${patToken}`
                    }
                }
            );

            if (!versionsResponse.ok) {
                const errorText = await versionsResponse.text();
                throw new Error(
                    `Content API returned status ${versionsResponse.status}: ${versionsResponse.statusText}. Response: ${errorText}`
                );
            }

            const responseData = await versionsResponse.json();

            if (!responseData.items || !Array.isArray(responseData.items)) {
                throw new Error(`Unexpected API response structure: ${JSON.stringify(responseData)}`);
            }

            const versions = responseData.items;

            const versionFound = versions.some(v => v.versionNumber === normalizedExpectedVersion);

            if (versionFound) {
                console.log(
                    `Successfully verified: Version ${normalizedExpectedVersion} is published on Mendix Marketplace!`
                );
                return;
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        } catch (error) {
            console.error(`Error during verification attempt ${attempt}: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }
    }

    throw new Error(
        `Release verification FAILED: Version ${normalizedExpectedVersion} for ${pkgName} (content ID: ${contentId}) ` +
            `was not found on Mendix Marketplace after ${maxRetries} attempts. ` +
            `The publish step reported success, but the version is not publicly available. `
    );
}
