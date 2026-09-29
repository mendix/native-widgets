# Stories

Stories live here rather than inside the packages they cover, so a widget's published `.mpk` stays
free of Storybook files.

## Layout

The directories mirror the repo's own `packages/` layout, so a story's path says what it covers:

```
stories/
├── shared/                                  # harnesses and fixtures, no stories of their own
│   ├── mendixValues.ts                      # stand-ins for Mendix prop values (widgets)
│   ├── ActionRunner.tsx                     # button-per-case runner (JS actions)
│   └── mxStub.ts                            # stand-in for the `mx` client global
├── pluggableWidgets/
│   └── <widget-package-name>/               # e.g. intro-screen-native
│       └── <Component>.stories.tsx
└── jsActions/
    └── <action-package-name>/               # e.g. nanoflow-actions-native
        └── <Group>.stories.tsx              # one file per action group in the package's src/
```

`.storybook/main.ts` globs `../stories/**/*.stories.*` recursively, so a new directory needs no
config change — but `npm run storybook-generate` must be re-run for Storybook to see new files.

## Adding a story

1. Put the file under the directory matching the package it covers, creating it if needed.
2. Give it a `title`. The title, not the path, decides where the story lands in the Storybook
   sidebar, so the two have to be kept in step by hand. Existing groupings are `Widgets/<Component>`
   for pluggable widgets and `Nanoflow Commons/<Group>` for the nanoflow actions.
3. Re-run `npm run storybook-generate` (or `npm run storybook`, which does it first).

## Two things worth knowing before you write one

**Every story module is evaluated at app startup.** Storybook RN registers stories through
`require.context`, so a module-scope import that throws takes the whole Storybook down rather than
failing its own story. Anything that might not be linked — a native module in particular — belongs
inside a function, not at the top of the file. The `ActionRunner` cases do this deliberately.

**Widgets and JS actions need different harnesses.** A widget renders, so it needs prop values:
`shared/mendixValues.ts`. A JS action is an async function with nothing to look at, so it gets a
button and a result log instead: `shared/ActionRunner.tsx`, plus `shared/mxStub.ts` for the `mx`
client global those actions call into.
