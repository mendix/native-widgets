# Changelog

All notable changes to this widget will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

-   We fixed an issue with @react-native-community/geolocation where Android devices had difficulty obtaining precise location data.

## [5.2.0] Nanoflow Commons - 2026-1-23

-   We've migrated from using @react-native-community/geolocation to react-native-permissions for handling location permissions.
-

## [5.1.6] Nanoflow Commons - 2025-12-05

### Fixed

-   Removed unintended native code files that were mistakenly included from node_modules in the previous release.

## [5.1.5] Nanoflow Commons - 2025-12-02

### Fixed

-   We've fixed isConnectedToServer succeeding without internet on offline apps when service worker is enabled.

## [5.1.4] Nanoflow Commons - 2025-11-18

### Fixed

-   Updated the react-native-firebase to v20.1.0. Ensure that the Native Template and Native Builder are updated accordingly.

## [5.1.3] Nanoflow Commons - 2025-9-24

### Fixed

-   We've fixed location permission issue on iOS.

### Changed

-   We've updated the minimum Mendix version to 10.21.

## [5.1.0] Nanoflow Commons - 2025-3-26

### Fixed

-   We've updated @react-native-community/geolocation to version 3.4.0 to resolve location-related issues.

## [5.0.0] Nanoflow Commons - 2024-12-3

### Changed

-   Updated @mendix/pluggable-widgets-tools from version v9.0.0 to v10.15.0.

### BREAKING

-   Updated react-native from version 0.73.8 to 0.75.4.
-   Updated react-native-device-info from version v11.1.0 to v13.0.0.
-   Updated react-native-localize from version v1.4.2 to v3.2.1.

## [4.0.4] Nanoflow Commons - 2024-8-8

-   We've added support for the token-based authentication with the SignIn action. This authentication method allows users to remain signed in until the expiration time of the token. You can read more about this behavior on this documentation page https://docs.mendix.com/refguide/session-management/#2-authentication-token

To enable it you can set the new SignIn action parameter `useAuthToken` to `true`.

## [4.0.3] Nanoflow Commons - 2024-3-19

### Fixed

-   We have fixed an issue in base64encode action.

## [4.0.2] Nanoflow Commons - 2024-1-17

### Removed

-   Removed the constant holding the version number from within the module.

## [4.0.1] Nanoflow Commons - 2023-10-13

### Fixed

-   Resolve studio warning CW9503

## [4.0.0] Nanoflow Commons - 2023-6-9

### Added

-   We changed the JS actions and widgets icons.

## [3.0.0] Native Mobile Resources - 2023-3-28

-   We made widgets compatible with React Native 0.70.7

## [2.6.1] Nanoflow Commons - 2022-9-23

### Fixed

-   We fixed issue with Base64 actions throwing error

## [2.6.0] Nanoflow Commons - 2022-8-31

### Breaking

-   We removed next actions:
    -   SetCookie (will be available in Web Actions module)
    -   ReadCookie (will be available in Web Actions module)
    -   SetFavicon (will be available in Web Actions module)
    -   ScrollToClass
    -   AddMilliseconds
    -   AddTime
-   "Is connected" action is renamed to "Is connected to server"
-   Parameter names are changed for next actions:
    -   Base64Decode
    -   Base64DecodeToImage
    -   Base64Encode
    -   GetStraightLineDistance
-   New "Enum_DistanceUnit" enum is introduce for GetStraightLineDistance action

## [2.5.0] Nanoflow Commons - 2022-7-25

### Added

-   We introduced a new set of actions:
    -   AddMilliseconds
    -   AddTime
    -   Base64Decode
    -   Base64DecodeToImage
    -   Base64Encode
    -   ClearLocalStorage
    -   FindObjectWithGUID
    -   GetCurrentLocation
    -   GetRemoteUrl
    -   GetStraightLineDistance
    -   IsConnected
    -   ReadCookie
    -   ScrollToClass
    -   SetCookie
    -   SetFavicon
    -   TimeBetween

## [2.4.0] Nanoflow Commons - 2022-6-28

### Added

-   We introduced a new [Clear cached session data] action to clear the cached session data from local storage.
-   We introdcued a new [Reload] action that reloads the app.

### Breaking

-   [Clear cached session data] action would only be compatible with Mendix client `9.14` or above.

## [2.3.1] Nanoflow Commons - 2022-3-22

### Fixed

-   Reduce module size by removing unused dependencies. This should speed up interaction with Team Server.

## [2.3.0] Nanoflow Commons - 2022-3-9

### Fixed

-   We fixed the timeout error while getting the current location.
-   We fixed a timeout issue while getting the current location with minimum accuracy.

### Breaking

-   iOS: We changed the library that uses [android.location API](https://developer.android.com/reference/android/location/package-summary), to the new library that uses the [Google Location Services API](https://developer.android.com/training/location/). Regarding this change, you should use `Request location permission` action before using `Get current location` and `Get current location with minimum accuracy` action.
-   Get current location with minimum accuracy: For good user experience, disable the nanoflow during action using property `Disabled during action` if you’re using `Call a nanoflow button` to run JS Action `Get current location with minimum accuracy`.

## [2.2.0] Nanoflow Commons - 2022-2-21

### Added

-   We introduce a new `Get current location with minimum accuracy` action to acquire more precise locations.
-   Dark theme icons for JS Actions

### Fixed

-   We fixed a bug where the `Speed` was not being defined while using `Get current location` action.
-   We removed some unwanted files from the module.

## [2.1.2] Nanoflow Commons - 2021-10-25

### Fixed

-   We fixed a problem with toggle sidebar action when executed in Native apps.
-   We removed some unwanted files from the module.

## [2.1.0] Nanoflow Commons - 2021-9-28

### Added

-   We added a toolbox tile image for all JS actions in Studio & Studio Pro.
