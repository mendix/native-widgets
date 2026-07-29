# Widget Storybook (on-device)

Storybook host app for developing native widgets on a simulator/emulator **without Mendix Studio
Pro, mxbuild, or a Mendix runtime**. Stories import widget source directly from
`packages/pluggableWidgets/*/src`, so a change to a widget shows up on Fast Refresh.

Currently set up for `intro-screen-native` as the first widget.

## Run it

```bash
cd storybook
npm install          # first time only
npm run storybook:android
# or: npm run storybook:ios   (needs `cd ios && pod install` first)
```

To start only the bundler against an already-installed app: `npm run storybook`.

## Why this is a separate app

It deliberately does **not** join the pnpm workspace (the root glob is `packages/**/*`, so a
top-level directory is excluded) and keeps its own `node_modules`.

`@storybook/react-native` pins peer versions that clash with the versions the repo pins for all 39
widgets:

| Storybook needs                        | Repo pins |
| -------------------------------------- | --------- |
| `react-native-reanimated` 4.5.1        | 3.19.5    |
| `react-native-safe-area-context` 5.8.0 | 5.7.0     |

Installing those into the workspace would fight `pnpm.overrides` and risk the other widgets'
builds. `react` (19.2.3) and `react-native` (0.84.1) match the repo exactly, so widget code runs
against the versions it targets.

## How widget code resolves

`metro.config.js` does three things:

1. **`watchFolders: [repoRoot]`** — lets Metro read widget sources above this directory.
2. **`nodeModulesPaths`** pinned to this app — so widget imports of e.g. `react-native` get this
   app's copy, not the repo's pnpm store. Hierarchical lookup stays **on**, because Storybook
   nests its own `@storybook/react` and has to walk up to find it.
3. **`extraNodeModules`** — maps what isn't installed here:
    - `mendix` → `mendix-stubs/` (see below)
    - `@mendix/piw-utils-internal`, `@mendix/piw-native-utils-internal` → the checkout's
      `packages/tools/*`, which ship a built `dist/`

### The `mendix` module

`mendix` is injected by the Mendix client at runtime and is not published to npm. Across all 39
widgets only **four** `mendix/*` runtime imports exist; everything else (`EditableValue`,
`DynamicValue`, `ActionValue`) is types-only and erased at compile time.

`mendix-stubs/` mirrors the real module's layout, so Metro appends subpaths correctly:

```
mendix-stubs/index.js                      → ValueStatus (the only runtime value widgets read)
mendix-stubs/components/native/Icon.js     → Icon
```

Widgets needing `mendix/components/native/Image` or `mendix/filters/builders` just need matching
files added here. `@mendix/pluggable-widgets-tools/test-config/__mocks__/` has Jest equivalents
worth copying from.

### Story fixtures

`stories/mendixValues.ts` builds the Mendix-shaped props (`dynamicValue`, `editableValue`,
`actionValue`). The repo's own builders in `@mendix/piw-utils-internal` were not reused: they call
`jest.fn()` 18 times and `jest` doesn't exist outside a test run. The story versions also make
`setValue` re-render, which is what lets a story drive the widget interactively — a test builder
doesn't need that.

## Adding a widget

1. Install its runtime deps here (check its `package.json` `dependencies`), at the same pinned
   versions the repo uses.
2. Add any missing `mendix/*` stub files.
3. Write `stories/<Widget>.stories.tsx`, importing from
   `../../packages/pluggableWidgets/<widget>/src/<Widget>`.

Widgets depending on `react-native-maps`, `react-native-video`, or other modules needing native
config will also need those linked into the host app's android/ios projects.

## Limitations

-   Story files live here, not in the widget packages, so a widget's published mpk stays clean — but
    stories aren't co-located with the code they exercise.
-   `.storybook/storybook.requires.ts` is generated and gitignored; the `storybook*` scripts
    regenerate it, so run those rather than bare `react-native start` after adding a story file.
-   This renders widgets, so it catches layout, styling, and interaction bugs. It is **not** a
    replacement for the Maestro e2e suite: no Mendix runtime means no real data round-trip, and
    full-app navigation is out of scope.
