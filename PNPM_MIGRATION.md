# Migration from Yarn to Pnpm - Summary

This document outlines the successful migration from Yarn to Pnpm for the native-widgets monorepo.

## Benefits of the Migration

1. **Performance:** Pnpm is generally faster than Yarn, especially for large monorepos
2. **Disk Space:** Pnpm uses hard links and symlinks to save disk space
3. **Strict Dependencies:** Better peer dependency handling
4. **Active Development:** Pnpm has active development and regular updates

## Changes Made

### 1. Package Management Configuration

- **Removed Yarn-specific files:**
  - `.yarn/` directory and contents
  - `yarn.lock`
  - `.yarnrc.yml`

- **Created pnpm configuration files:**
  - `pnpm-workspace.yaml` - Defines workspace structure
  - Updated `.npmrc` with pnpm-specific settings

- **Updated `package.json`:**
  - Changed `packageManager` from `yarn@4.5.1` to `pnpm@9.15.0`
  - Replaced `resolutions` with `pnpm.overrides`
  - Updated `workspaces` format for pnpm compatibility
  - Converted all Yarn workspace commands to pnpm equivalents

### 2. Script Updates

**Root package.json scripts converted from Yarn to Pnpm:**
- `yarn workspaces foreach` → `pnpm -r`
- `yarn cache clean` → `pnpm store prune`
- `patch-package --use-yarn` → `patch-package`
- Various other script command updates

**Updated JavaScript files:**
- `scripts/validation/validate-versions-staged-files.js`
- `scripts/widget/buildWidgets.js`
- `scripts/test/e2e-native.js`

### 3. CI/CD Pipeline Updates

**GitHub Actions workflows updated:**
- `.github/workflows/UnitTests.yml`
- `.github/workflows/Build.yml`
- `.github/workflows/Release.yml`
- `.github/workflows/MarketplaceRelease.yml`
- `.github/workflows/NativePipeline.yml`

**Key changes in workflows:**
- Removed Yarn-specific setup and caching
- Added pnpm action setup with version 10.13.1
- Updated cache keys to use `pnpm-lock.yaml`
- Replaced Yarn workspace commands with pnpm equivalents

### 4. Documentation Updates

**Updated files:**
- `README.md` - Installation and usage instructions
- `CONTRIBUTING.md` - Development setup instructions

### 5. Configuration Files

**`.npmrc` updated with pnpm-specific settings:**
- `strict-peer-dependencies=false`
- `shamefully-hoist=true`
- Hoist patterns for eslint, prettier, and @types
- Workspace linking preferences

## Key Differences Between Yarn and Pnpm Commands

| Operation | Yarn | Pnpm |
|-----------|------|------|
| Install dependencies | `yarn` or `yarn install` | `pnpm install` |
| Run script in all workspaces | `yarn workspaces foreach --all run <script>` | `pnpm -r run <script>` |
| Run script with filtering | `yarn workspaces foreach --since run <script>` | `pnpm -r run <script> --filter=<pattern>` |
| Run script in specific workspace | `yarn workspace <name> run <script>` | `pnpm --filter=<name> run <script>` |
| Clear cache | `yarn cache clean` | `pnpm store prune` |

## Verification

The migration was tested by:
1. Successfully running `pnpm install` 
2. Executing `pnpm run lint:src` to verify script functionality
3. All packages (1666) were installed successfully
4. Workspace commands work as expected

## Local Development
   - Install pnpm globally: `npm install -g pnpm`
   - Remove local `node_modules` and run `pnpm install`