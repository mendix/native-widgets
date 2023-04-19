const { writeFileSync } = require("fs");
const { join } = require("path");
const extraDependencies = require("../../configs/e2e/native_dependencies.json");
const packageJson = require("../../../native-template/package.json");

packageJson.dependencies = { ...packageJson.dependencies, ...extraDependencies };
writeFileSync(join(__dirname, "../../../native-template/package.json"), JSON.stringify(packageJson));
