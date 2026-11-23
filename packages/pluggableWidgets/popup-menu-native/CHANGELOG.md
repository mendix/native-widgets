# Changelog

All notable changes to this widget will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

-   The menu is now presented through the shared MxMenu component instead of react-native-material-menu, which has been removed as a dependency. The style keys, the four item style classes and the ripple colour keep working as before.
-   Screen readers now treat the popup as a menu with menu items, report whether the menu is open on the trigger, and return focus to the trigger when the menu closes.
-   Items no longer crash the app when a style sets a font size of 0.
-   On iOS an item now dims and shows the ripple colour as its background while it is pressed, the same as on the drop-down. Before it used the default highlight of a touchable.

## [4.1.1] - 2026-9-2

### Changed

-   We pinned react-native-material-menu to 1.2.0.
-   Updated react-native from version v0.84.1 to v0.88.0.

## [4.0.1] - 2026-1-19

-   We fixed an iOS issue where native Popup Menu icons were not tappable and failed to open the menu.

## [4.0.0] - 2024-12-3

### Changed

-   Updated @mendix/pluggable-widgets-tools from version v9.0.0 to v10.15.0.

### BREAKING

-   We've renamed renderMode property to popupRenderMode in order to avoid conflicts with a newly introduced renderMode system option. To use the new version of the widget, update its property in Studio Pro.

## [3.0.0] - 2023-3-28

### Added

-   Added id for testing

## BREAKING

-   We made the widget compatible with React Native 0.70.7

## [2.2.0] - 2022-04-07

### Added

-   Structure mode preview

## [2.1.0] - 2022-01-24

### Added

-   Dark theme icons for Tile and List view.

## [2.0.0] - 2021-09-28

### Added

-   We added a toolbox category and toolbox tile image for Studio & Studio Pro.
