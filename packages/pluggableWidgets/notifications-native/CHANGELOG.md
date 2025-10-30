# Changelog

All notable changes to this widget will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## BREAKING

-   Updated the react-native-firebase to v20.1.0. Ensure that the Native Template and Native Builder are updated accordingly.

## [5.0.0] - 2025-7-7

-   The widget has been migrated to notifee.

## [4.1.0] - 2024-12-3

### Changed

-   Updated @mendix/pluggable-widgets-tools from version v9.0.0 to v10.15.0.

## [4.0.0] - 2023-3-28

## BREAKING

-   We made the widget compatible with React Native 0.70.7

## [3.2.2] - 2022-11-10

### Fixed

-   We fixed an issue where push notifications do not work on Android 12. This change may break your native app unless you update it to the latest version. Ensure that your native template depends on the same version.

## [3.2.1] - 2022-04-13

### Fixed

-   We fixed an issue that occurred on Android devices when using the Make it Native app to preview a page containing the Notifications widget.

## [3.2.0] - 2022-04-07

### Added

-   Structure mode preview

## [3.1.1] - 2022-03-09

### Fixed

-   We fixed the 'On open' action being triggered twice when tapping a notification while the app was in a background or quit state.

## [3.1.0] - 2022-01-24

### Added

-   Dark theme icons for Tile and List view.

## [3.0.0] - 2021-09-28

### Added

-   We added a toolbox category and toolbox tile image for Studio & Studio Pro.

## [2.1.0] - 2021-08-26

### Added

-   Handle local notification "On open" actions. Note: local notification's do not handle "On receive" actions, despite being able to configure these in Studio Pro.

### Fixed

-   A configured "Actions" property will receive the correct value; a concatenation of matching action names.
