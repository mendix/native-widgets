# Changelog

All notable changes to this widget will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### BREAKING

-   We updated react-native-vision-camera from v4.7.3 to v5.2.3 and added react-native-vision-camera-barcode-scanner v5.2.3 for barcode scanning. This version requires Make It Native version 11.12.3 or above. Older versions of Make It Native cannot run this version of the widget.
-   For Native Template builds on iOS with push notifications enabled, Native Template version 19.1.8 or above is required.

### Added

-   We added a `scan delay` property that delays scanning by the specified number of seconds, giving the end user time to position the scanner over the code.

### Fixed

-   We fixed barcodes with patterned backgrounds not being scanned correctly on Android.

## [4.2.2] - 2025-12-23

-   We expanded the barcode-scanner configuration in Vision Camera to support all available `CodeType` formats, including QR, Aztec, Data Matrix, PDF-417, EAN, UPC, GS1 DataBar, ITF, and Code barcodes.
-   We updated react-native-vision-camera from version v4.7.1 to v4.7.3.

## [4.2.0] - 2025-10-7

-   We migrated to react-native-vision-camera from react-native-camera.

## [4.1.0] - 2024-12-3

### Changed

-   Updated @mendix/pluggable-widgets-tools from version v9.0.0 to v10.15.0.

## [4.0.0] - 2023-3-28

## BREAKING

-   We made the widget compatible with React Native 0.70.7

## [3.2.0] - 2022-02-21

### Added

-   Structure mode preview

## [3.1.0] - 2022-01-24

### Added

-   Dark theme icons for Tile and List view.

## [3.0.0] - 2021-09-28

### Added

-   We added a toolbox category and toolbox tile image for Studio & Studio Pro.
