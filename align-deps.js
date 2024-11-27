const fs = require("fs");
const path = require("path");

// Read root package.json
const rootPackageJsonPath = path.join(process.cwd(), "package.json");
const rootPackageJson = require(rootPackageJsonPath);

// Get list of all dependencies in root package.json
const rootDeps = Object.assign(
    {},
    rootPackageJson.dependencies,
    rootPackageJson.devDependencies,
    rootPackageJson.resolutions || {}
);

// Define the path to the packages directory
const packagesPath = path.join(process.cwd(), "packages/pluggableWidgets");

// Set dry-run flag to true to print changes instead of making them
const dryRun = false;

// Find all sub-projects under packages/pluggableWidgets
const projects = fs.readdirSync(packagesPath).filter(file => {
    const filePath = path.join(packagesPath, file);
    return fs.lstatSync(filePath).isDirectory() && fs.existsSync(path.join(filePath, "package.json"));
});

projects.forEach(projectPath => {
    const packageJsonPath = path.join(packagesPath, projectPath, "package.json");

    // Read package.json of current package
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Get list of all dependencies in current package.json
    const pkgDeps = Object.assign({}, packageJson.dependencies, packageJson.devDependencies);

    // Loop through all dependencies in current package.json
    Object.keys(pkgDeps).forEach(depName => {
        // If dependency exists in root package.json, check if version needs to be updated
        if (rootDeps[depName]) {
            if (pkgDeps[depName] !== rootDeps[depName]) {
                if (!dryRun) {
                    if (packageJson.dependencies[depName]) {
                        packageJson.dependencies[depName] = rootDeps[depName];
                    } else if (packageJson.devDependencies[depName]) {
                        packageJson.devDependencies[depName] = rootDeps[depName];
                    }
                    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                    console.log(`Updated ${packageJsonPath}`);
                } else {
                    console.log(
                        `Would update ${packageJsonPath} dependency ${depName} from ${pkgDeps[depName]} to ${rootDeps[depName]}`
                    );
                }
            }
        }
    });
});
