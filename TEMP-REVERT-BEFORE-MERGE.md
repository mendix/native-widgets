# TEMPORARY: revert before merging the React Native 0.88 upgrade

To test the React Native 0.88 upgrade, two dependencies are installed from tarballs in `temp-vendor/`, packed from
unreleased branches:

-   `@mendix/pluggable-widgets-tools` from
    [`MxKevinBeqo/widgets-tools#moo/MOO-2499-rn-088`](https://github.com/MxKevinBeqo/widgets-tools/tree/moo/MOO-2499-rn-088)
    (commit `bfb3b44`), instead of npm.
-   `mendix-native` from [`mendix/mendix-native#moo/MOO-2500-rn-0.88`](https://github.com/mendix/mendix-native/tree/moo/MOO-2500-rn-0.88)
    (commit `76aba2e`, version 0.6.2), instead of the
    [v0.6.0 release](https://github.com/mendix/mendix-native/releases/tag/v0.6.0) that `video-player-native`,
    `mobile-resources-native` and `nanoflow-actions-native` depend on.

Once versions with React Native 0.88 support are released, undo the following and delete this file.

1. `package.json` → `pnpm.overrides`:
    - Set `@mendix/pluggable-widgets-tools` back to the released version (it was `11.12.0` before this change) instead
      of `file:temp-vendor/mendix-pluggable-widgets-tools-11.15.0-moo-2499-rn-088-bfb3b44.tgz`.
    - Remove the `mendix-native` override, and point the `mendix-native` dependency of the three packages above at the
      new release.
2. Delete the `temp-vendor/` folder.
3. Run `pnpm install` to update `pnpm-lock.yaml`.

## Why tarballs and not git dependencies

CI installs with `pnpm install --frozen-lockfile --ignore-scripts`. A git dependency only gets its compiled output from
its `prepare`/`prepack` script, which `--ignore-scripts` skips, so every widget build failed with
`Cannot find module '../dist/commands/audit.js'`. The tarballs ship their compiled output prebuilt, like the published
packages. To pick up a newer commit of a branch, repack it from a clean checkout of that commit, replace the file and
update the override:

-   widgets-tools: `pnpm install --frozen-lockfile`, then `pnpm pack` in `packages/pluggable-widgets-tools`.
-   mendix-native: `yarn install --immutable`, `yarn prepare` and `yarn pack`, the same steps as its release workflow.
