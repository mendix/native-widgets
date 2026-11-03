# TEMPORARY: revert before merging the React Native 0.88 upgrade

To test the React Native 0.88 upgrade, `mendix-native` is installed from a tarball in `temp-vendor/`, packed from the
unreleased [`mendix/mendix-native#moo/MOO-2500-rn-0.88`](https://github.com/mendix/mendix-native/tree/moo/MOO-2500-rn-0.88)
branch (commit `76aba2e`, version 0.6.2), instead of the
[v0.6.0 release](https://github.com/mendix/mendix-native/releases/tag/v0.6.0) that `video-player-native`,
`mobile-resources-native` and `nanoflow-actions-native` depend on.

Once a version of `mendix-native` with React Native 0.88 support is released, undo the following and delete this file.

1. `package.json` → `pnpm.overrides`: remove the `mendix-native` override, and point the `mendix-native` dependency of
   the three packages above at the new release.
2. Delete the `temp-vendor/` folder.
3. Run `pnpm install` to update `pnpm-lock.yaml`.

## Why a tarball and not a git dependency

CI installs with `pnpm install --frozen-lockfile --ignore-scripts`. A git dependency only gets its compiled output from
its `prepare` script, which `--ignore-scripts` skips. The tarball ships the compiled `lib/` prebuilt, like the published
package. To pick up a newer commit of the branch, repack it from a clean checkout of that commit with
`yarn install --immutable`, `yarn prepare` and `yarn pack` (the same steps as its release workflow), replace the file
and update the override.
