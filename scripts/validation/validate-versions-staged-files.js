const { readFile } = require("fs").promises;
const { promisify } = require("util");
const { join } = require("path");
const { exec } = require("child_process");
const { parseStringPromise } = require("xml2js");

const execAsync = promisify(exec);

preCommit().catch(error => {
    console.error(error);
    process.exit(1);
});

async function preCommit() {
    const { stdout: stagedFiles } = await execAsync("git diff --staged --name-only");
    const staged = stagedFiles.trim().split("\n").filter(Boolean);
    const changedWidgetPackages = [...new Set(staged.map(getChangedWidgetPackagePath).filter(Boolean))].map(path => ({
        path: join(process.cwd(), path)
    }));

    if (changedWidgetPackages.length) {
        const validationPromises = [];

        for (const changedWidgetPackage of changedWidgetPackages) {
            validationPromises.push(
                new Promise(async (resolve, reject) => {
                    const packageXmlAsJson = await parseStringPromise(
                        (await readFile(join(changedWidgetPackage.path, "src", "package.xml"))).toString(),
                        { ignoreAttrs: false }
                    );
                    const packageXmlVersion = packageXmlAsJson.package.clientModule[0].$.version;
                    const packageJson = JSON.parse(
                        (await readFile(join(changedWidgetPackage.path, "package.json"))).toString()
                    );
                    const packageJsonVersion = packageJson.version;
                    const filesMissingVersion = [];

                    if (!packageXmlVersion) filesMissingVersion.push("package.xml");
                    if (!packageJsonVersion) filesMissingVersion.push("package.json");

                    if (filesMissingVersion.length)
                        reject(`[${packageJson.name}] ${filesMissingVersion.join(" and ")} missing version.`);

                    if (packageJsonVersion === packageXmlVersion) resolve();

                    reject(`[${packageJson.name}] package.json and package.xml versions do not match.`);
                })
            );
        }

        const failedResults = await Promise.allSettled(validationPromises).then(results =>
            results.filter(result => result.status === "rejected").map(result => result.reason)
        );

        if (failedResults.length) {
            for (const error of failedResults) {
                console.error(error);
            }

            throw new Error("Widget version validation failed. See above for details.");
        }
    }
}

function getChangedWidgetPackagePath(changedFilePath) {
    if (!changedFilePath.match(/package\.(json|xml)$/)) {
        return null;
    }

    const changedWidgetPackageMatch = changedFilePath.match(/^packages\/(pluggable|custom)Widgets\/[^/]+/);

    return changedWidgetPackageMatch ? changedWidgetPackageMatch[0] : null;
}
