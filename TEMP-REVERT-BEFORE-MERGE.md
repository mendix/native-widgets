# TEMPORARY: revert before merging the React Native 0.88 upgrade

To test the React Native 0.88 upgrade, `@mendix/pluggable-widgets-tools` is installed from a tarball packed from the
unreleased [`MxKevinBeqo/widgets-tools#moo/MOO-2499-rn-088`](https://github.com/MxKevinBeqo/widgets-tools/tree/moo/MOO-2499-rn-088)
branch (commit `0dc4f444`) instead of npm. Once a version of the tools with React Native 0.88 support is released, undo
the following and delete this file.

1. `package.json` → `pnpm.overrides`: set `@mendix/pluggable-widgets-tools` back to the released version (it was
   `11.12.0` before this change) instead of
   `file:temp-vendor/mendix-pluggable-widgets-tools-11.15.0-moo-2499-rn-088-0dc4f44.tgz`.
2. Delete the `temp-vendor/` folder.
3. `patches/@mendix__pluggable-widgets-tools.patch`:
    - Remove the `TEMPORARY` note at the top of the file.
    - Remove the `package.json` hunk. It widens `engines.node` from `^22.18.0` to `>=22.18.0`, because the tools refuse
      to run on the Node 24 this repo uses (`.nvmrc`). If the released version still says `^22.18.0`, raise it with the
      tools maintainers rather than keeping the hunk.
    - Regenerate the remaining hunks against the released version and drop any it already includes: the
      `rollup-plugin-collect-dependencies.mjs` copy fix, the `@shopify/flash-list` transform pattern, and the ts-jest
      `module: "preserve"` / `noEmitOnError: false` settings (the branch still uses `module: "commonjs"`, which
      TypeScript rejects together with the base config's `moduleResolution: "bundler"`).
4. Run `pnpm install` to update `pnpm-lock.yaml`.

## Why a tarball and not a git dependency

CI installs with `pnpm install --frozen-lockfile --ignore-scripts`. A git dependency only gets its compiled `dist/`
from its `prepack` script, which `--ignore-scripts` skips, so every widget build failed with
`Cannot find module '../dist/commands/audit.js'`. The tarball was made with `pnpm pack` in
`packages/pluggable-widgets-tools` of a clean checkout of that commit, so it ships `dist/` prebuilt like the npm package.
To pick up a newer commit of the branch, repack it the same way, replace the file and update the override.
