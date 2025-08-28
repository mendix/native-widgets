const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const deleteDist = process.argv.includes("--delete-dist");
const skipPnpmBuild = process.argv.includes("--skip-build");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

const askQuestion = query => {
    return new Promise(resolve =>
        rl.question(query, ans => {
            resolve(ans);
            rl.close();
        })
    );
};

const log = {
    info: msg => console.log(`${colors.blue}${msg}${colors.reset}`),
    success: msg => console.log(`${colors.green}${msg}${colors.reset}`),
    warning: msg => console.log(`${colors.yellow}${msg}${colors.reset}`),
    error: msg => console.log(`${colors.red}${msg}${colors.reset}`)
};

const deleteDistFolders = () => {
    return new Promise((resolve, reject) => {
        if (!deleteDist) {
            log.warning("Skipping deletion of 'dist' folders.");
            resolve();
            return;
        }

        log.info("Deleting 'dist' folders in 'packages/pluggableWidgets/*'...");
        const distFolderPath = path.join(__dirname, "..", "..", "packages", "pluggableWidgets");
        fs.readdir(distFolderPath, { withFileTypes: true }, (err, files) => {
            if (err) {
                log.error(`Error reading directories: ${err}`);
                reject(err);
                return;
            }

            files.forEach(file => {
                if (file.isDirectory()) {
                    const distPath = path.join(distFolderPath, file.name, "dist");
                    if (fs.existsSync(distPath)) {
                        fs.rmSync(distPath, { recursive: true });
                        log.error(`Deleted: ${distPath}`);
                    }
                }
            });

            log.success("Deletion of 'dist' folders completed.");
            resolve();
        });
    });
};

const runPnpmBuild = () => {
    return new Promise((resolve, reject) => {
        if (skipPnpmBuild) {
            log.warning("Skipping 'pnpm build'...");
            resolve();
            return;
        }
        log.info("Running 'pnpm build'...");

        const buildProcess = spawn("pnpm", ["build"], { stdio: "pipe", shell: true });

        buildProcess.stdout.on("data", data => {
            process.stdout.write(`\r${colors.yellow}Building widgets... ${data.toString().trim()}${colors.reset}`);
        });

        buildProcess.stderr.on("data", data => {
            log.error(`Error: ${data.toString()}`);
        });

        buildProcess.on("close", code => {
            if (code !== 0) {
                log.error(`'pnpm build' failed with code ${code}`);
                resolve();
                return;
            }
            log.success("\n'pnpm build' completed.");
            resolve();
        });
    });
};

const copyMPKFiles = () => {
    return new Promise((resolve, reject) => {
        log.info("Copying '.mpk' files to 'dist/pluggableWidgets'...");
        const widgetsFolderPath = path.join(__dirname, "..", "..", "packages", "pluggableWidgets");
        const destinationFolderPath = path.join(__dirname, "..", "..", "dist", "pluggableWidgets");

        console.log("widgetsFolderPath", widgetsFolderPath);
        console.log("destinationFolderPath", destinationFolderPath);

        if (!fs.existsSync(destinationFolderPath)) {
            fs.mkdirSync(destinationFolderPath, { recursive: true });
            log.success(`Created directory: ${destinationFolderPath}`);
        }

        fs.readdir(widgetsFolderPath, { withFileTypes: true }, (err, widgets) => {
            if (err) {
                log.error(`Error reading widgets directory: ${err}`);
                reject(err);
                return;
            }

            widgets.forEach(widget => {
                if (widget.isDirectory()) {
                    const widgetDistPath = path.join(widgetsFolderPath, widget.name, "dist");
                    if (fs.existsSync(widgetDistPath)) {
                        fs.readdir(widgetDistPath, { withFileTypes: true }, (err, distContents) => {
                            if (err) {
                                log.error(`Error reading widget dist directory: ${err}`);
                                return;
                            }

                            distContents.forEach(distContent => {
                                if (distContent.isDirectory()) {
                                    const mpkFolderPath = path.join(widgetDistPath, distContent.name);
                                    fs.readdir(mpkFolderPath, (err, files) => {
                                        if (err) {
                                            log.error(`Error reading MPK directory: ${err}`);
                                            return;
                                        }

                                        files.forEach(file => {
                                            if (path.extname(file) === ".mpk") {
                                                const sourceFile = path.join(mpkFolderPath, file);
                                                const destinationFile = path.join(destinationFolderPath, file);

                                                fs.copyFileSync(sourceFile, destinationFile);
                                                log.success(
                                                    `Copied '${widget.name}/${file}' to 'dist/pluggableWidgets'`
                                                );
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                }
            });

            log.success("Copying of '.mpk' files completed.");
            resolve();
        });
    });
};

const main = async () => {
    try {
        await deleteDistFolders();

        if (deleteDist && skipPnpmBuild) {
            const answer = await askQuestion(
                "Warning: You have deleted 'dist' folders and skipped 'pnpm build'. This may result in no '.mpk' files to copy. Do you want to continue? (yes/no) "
            );
            if (answer.toLowerCase() !== "yes") {
                console.log("Operation cancelled.");
                return;
            }
        }

        if (!skipPnpmBuild) {
            await runPnpmBuild();
        }

        await copyMPKFiles();
        console.log("Script completed successfully!");
    } catch (error) {
        console.error("Script error:", error);
    }
};

main();
