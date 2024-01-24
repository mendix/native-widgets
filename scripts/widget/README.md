# Mendix Widgets Build Script (`./buildWidgets.js`)

This repository serves as a mono repository for Mendix widgets, each residing in separate packages. The build script included in this repository is designed to facilitate the build process for Mendix widgets used within Mendix projects.

## Purpose

When running the build script, all widgets are built individually within their respective folders. The script's main functionality is to remove previously generated widget outputs and execute the build command. Subsequently, all resulting `.mpk` files are copied to a `dist` directory located at the root of the project.

## Usage

The script supports two parameters:

1. `--delete-dist`: Deletes the dist folders within each widget's directory. This is useful to prevent conflicts in case multiple versions of a widget are present in the same `dist` directory.
2. `--skip-build`: Skips the build process for widgets. This is helpful when there are already built widgets, and you want to avoid rebuilding them.

## Running the Script

To execute the script, use the following command in the main `package.json` file:

```bash
yarn build:widgets
```

This command runs the script without parameters, deleting `dist` folders, building widgets, and copying the resulting `.mpk` files to the `dist` directory at the project's root.

**Note:** Before running the script, ensure you have installed the required packages by running:

```bash
yarn install
```

This command installs the necessary dependencies for the project.
