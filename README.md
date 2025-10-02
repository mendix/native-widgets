![Unit tests](https://github.com/mendix/native-widgets/actions/workflows/UnitTests.yml/badge.svg?branch=main)
![Mendix 9](https://img.shields.io/badge/mendix-9.0.5-brightgreen.svg)

# Native resources

A bundle of R&D Platform supported widgets & nanoflow actions for building native mobile apps.

Please visit the [Mendix Docs](https://docs.mendix.com/appstore/modules/native-mobile-resources) for more information on list of available native
widgets on Native Mobile Resources module.

## How to start?

-   Install pnpm via `npm i -g pnpm` or using your favorite package manager like `homebrew`

## Included nanoflow actions

| Category       | Action                                |
| :------------- | :------------------------------------ |
| Authentication | Biometric authentication              |
|                | Is biometric authentication supported |
| Camera         | Save to picture library               |
|                | Take picture                          |
|                | Take picture advanced                 |
| Clipboard      | Get clipboard content                 |
|                | Set clipboard content                 |
| Network        | Is cellular connection                |
|                | Is connected                          |
|                | Is wifi connection                    |
| Notifications  | Cancel all scheduled notifications    |
|                | Cancel schedule notification          |
|                | Display notification                  |
|                | Get push notification token           |
|                | Has notification permission           |
|                | Request notification permission       |
|                | Schedule notification                 |
|                | Set badge number                      |
| Platform       | Change status bar                     |
|                | Get device info                       |
|                | Hide keyboard                         |
|                | Open in app browser                   |
|                | Play sound                            |
|                | Vibrate                               |

## Documentation

Please visit the [Mendix Docs](https://docs.mendix.com/refguide/native-mobile) for more information on building native
mobile apps.

## Contributing

See [CONTRIBUTING.md](https://github.com/mendix/native-widgets/blob/master/CONTRIBUTING.md).

## Developing

### Prerequisites

In order to use our mono repo, please make sure you are using the LTS version of [Node.js](https://nodejs.org/en/download/).

As we are using [`node-gyp`](https://github.com/nodejs/node-gyp) in our dependencies, please make sure to [install the required dependencies](https://github.com/nodejs/node-gyp#installation) for this library according to your OS.

Execute `pnpm install` on the root folder of this repo.

## Manually releasing Native Mobile Resources (NMR)

Note: for an automated approach (preferred), see `scripts/release/README.md`.
Note: this applies to NMR for latest Studio Pro (currently 9.X)

-   With correct node version (see `.nvmrc`) in repo root, run `pnpm reinstall`.
-   Ensure your current git branch includes all changes intended to be released.
    -   Including updates to widgets' changelogs and semver version in `package.json` and `package.xml`.
-   Build all widgets in release mode; in root of repo run `pnpm release`.
-   Copy each widgets' `.mpk` to the NMR project's `/widgets` directory, overriding any existing `.mpk`s.
-   (conditional) If the widget is new, it needs to be listed on the NMR project page `NativeModileResources._WidgetExport`.
    -   Configure the widget with basic minimum requirements (e.g. datasource), enough to avoid any project errors.
-   Ensure monorepo's `mobile-resources-native` package has correct changelog and `package.json` version.
-   cd to `packages/jsActions/mobile-resources-native` and run `pnpm release`.
-   Delete contents of NMR project's `javascriptsource/nativemobileresources/actions`.
-   Copy-and-paste files and folders inside monorepo `packages/jsActions/mobile-resources-native/dist/` to NMR project's `javascriptsource/nativemobileresources/actions/`.
-   Update the version in NMR project's `themesource/nativemobileresources/.version`.
-   Commit any changes to NMR project and push using git.
-   Export the NMR project's module called "NativeMobileResources"; right-click the module then "export module package".
    -   Exclude everything inside `userlib/` and `resources/`.
-   Create a GitHub release (see previous releases for example release notes and title, etc.) and add the exported `.mpk`.
    -   By aggregating the widgets' changelogs and the `mobile-resources-native` package's changelog, you can create detailed release notes.
-   Create a Mendix Marketplace release and add the exported `.mpk`; follow the release-wizard, ensuring each field is correct.
    -   Make sure the target Mendix version is correct.
    -   Most of the time you just need to update the module's version, attach a `.mpk` and add release notes.

To release NMR for Studio Pro 8.X, most of the steps are the same, except take note of: `https://paper.dropbox.com/doc/Native-Content-Wiki--Bbd0Jfqo9nAEbmkpowVg5n3bAg-3h3CBZeVHXw8dJ1IY9xhJ#:uid=742445305119695634661853&h2=Update-NativeComponentsTestPro`.

## Raising problems/issues

-   We encourage everyone to open a Support ticket on [Mendix Support](https://support.mendix.com) in case of problems with widgets or scaffolding tools (Pluggable Widgets Generator or Pluggable Widgets Tools)

## Troubleshooting

1. If you are having problems with the GIT hooks, where it says that the command `npm` can not be found, try adding this file to the root of your user folder.

```bash
# ~/.huskyrc
# This loads nvm.sh and sets the correct PATH before running hook
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
