// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import Geolocation, { GeolocationStatic } from "@react-native-community/geolocation";

import type { GeolocationServiceStatic, AuthorizationResult } from "../../typings/Geolocation";

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * On the native platform a request for permission should be made before the `GetCurrentLocation` action would work.
 * @returns {Promise.<boolean>}
 */
export async function RequestLocationPermission(): Promise<boolean> {
    // BEGIN USER CODE

    let reactNativeModule: typeof import("react-native") | undefined;
    let geolocationModule:
        | Geolocation
        | GeolocationStatic
        | typeof import("react-native-geolocation-service")
        | undefined;

    const hasPermissionIOS = async (): Promise<boolean> => {
        const openSetting = (): void => {
            reactNativeModule?.Linking.openSettings().catch(() => {
                reactNativeModule?.Alert.alert("Unable to open settings.");
            });
        };

        return (geolocationModule as GeolocationServiceStatic)
            .requestAuthorization("whenInUse")
            .then((status: AuthorizationResult) => {
                if (status === "granted") {
                    return true;
                }

                if (status === "denied") {
                    reactNativeModule?.Alert.alert("Location permission denied.");
                }

                if (status === "disabled") {
                    reactNativeModule?.Alert.alert(
                        "Location Services must be enabled to determine your location.",
                        "",
                        [
                            { text: "Go to Settings", onPress: openSetting },
                            {
                                text: "Don't Use Location"
                            }
                        ]
                    );
                }

                return false;
            });
    };

    const hasPermissionAndroidFine = async (): Promise<boolean | undefined> => {
        if (typeof reactNativeModule?.Platform?.Version === "number" && reactNativeModule?.Platform?.Version < 23) {
            return true;
        }

        const androidLocationPermission = reactNativeModule?.PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

        if (!androidLocationPermission) {
            return false;
        }

        return reactNativeModule?.PermissionsAndroid.check(androidLocationPermission).then(hasPermission =>
            hasPermission
                ? true
                : reactNativeModule?.PermissionsAndroid?.request(androidLocationPermission).then(status => {
                      if (status === reactNativeModule?.PermissionsAndroid.RESULTS.GRANTED) {
                          return true;
                      }

                      if (status === reactNativeModule?.PermissionsAndroid.RESULTS.DENIED) {
                          reactNativeModule.ToastAndroid.show(
                              "Location permission denied by user.",
                              reactNativeModule.ToastAndroid.LONG
                          );
                      } else if (status === reactNativeModule?.PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                          reactNativeModule.ToastAndroid.show(
                              "Location permission revoked by user.",
                              reactNativeModule.ToastAndroid.LONG
                          );
                      }

                      return false;
                  })
        );
    };

    const hasPermissionAndroidCoarse = async (): Promise<boolean | undefined> => {
        if (typeof reactNativeModule?.Platform?.Version === "number" && reactNativeModule?.Platform?.Version < 23) {
            return true;
        }

        const androidLocationPermission = reactNativeModule?.PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

        if (!androidLocationPermission) {
            return false;
        }

        return reactNativeModule?.PermissionsAndroid.check(androidLocationPermission).then(hasPermission =>
            hasPermission
                ? true
                : reactNativeModule?.PermissionsAndroid?.request(androidLocationPermission).then(status => {
                      if (status === reactNativeModule?.PermissionsAndroid.RESULTS.GRANTED) {
                          return true;
                      }

                      if (status === reactNativeModule?.PermissionsAndroid.RESULTS.DENIED) {
                          reactNativeModule.ToastAndroid.show(
                              "Location permission denied by user.",
                              reactNativeModule.ToastAndroid.LONG
                          );
                      } else if (status === reactNativeModule?.PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                          reactNativeModule.ToastAndroid.show(
                              "Location permission revoked by user.",
                              reactNativeModule.ToastAndroid.LONG
                          );
                      }

                      return false;
                  })
        );
    };


    const hasLocationPermission = async (): Promise<boolean> => {
        if (reactNativeModule?.Platform.OS === "ios") {
            const hasPermission = await hasPermissionIOS();
            return hasPermission;
        }

        if (reactNativeModule?.Platform.OS === "android") {
            const hasPermission = await hasPermissionAndroidFine() || await  hasPermissionAndroidCoarse();
            return hasPermission ?? false;
        }

        return Promise.reject(new Error("Unsupported platform"));
    };

    const hasLocationPermissionForOldLibraryFine = async (): Promise<boolean | undefined> => {
        if (reactNativeModule?.Platform.OS === "android") {
            const locationPermission = reactNativeModule.PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

            return reactNativeModule.PermissionsAndroid.check(locationPermission).then(hasPermission =>
                hasPermission
                    ? true
                    : reactNativeModule?.PermissionsAndroid.request(locationPermission).then(
                          status => status === reactNativeModule?.PermissionsAndroid.RESULTS.GRANTED
                      )
            );
        } else if (geolocationModule && (geolocationModule as GeolocationStatic).requestAuthorization) {
            try {
                (geolocationModule as GeolocationStatic).requestAuthorization();
                return Promise.resolve(true);
            } catch (error) {
                return Promise.reject(error);
            }
        }

        return false;
    };
    const hasLocationPermissionForOldLibraryCoarse = async (): Promise<boolean | undefined> => {
        if (reactNativeModule?.Platform.OS === "android") {
            const locationPermission = reactNativeModule.PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

            return reactNativeModule.PermissionsAndroid.check(locationPermission).then(hasPermission =>
                hasPermission
                    ? true
                    : reactNativeModule?.PermissionsAndroid.request(locationPermission).then(
                          status => status === reactNativeModule?.PermissionsAndroid.RESULTS.GRANTED
                      )
            );
        } else if (geolocationModule && (geolocationModule as GeolocationStatic).requestAuthorization) {
            try {
                (geolocationModule as GeolocationStatic).requestAuthorization();
                return Promise.resolve(true);
            } catch (error) {
                return Promise.reject(error);
            }
        }

        return false;
    };

    if (navigator && navigator.product === "ReactNative") {
        reactNativeModule = require("react-native");

        if (!reactNativeModule) {
            return Promise.reject(new Error("React Native module could not be found"));
        }

        if (reactNativeModule.NativeModules.RNFusedLocation) {
            geolocationModule = (await import("react-native-geolocation-service")).default;
            return hasLocationPermission();
        } else if (reactNativeModule.NativeModules.RNCGeolocation) {
            geolocationModule = Geolocation;
            return (await hasLocationPermissionForOldLibraryFine() || await hasLocationPermissionForOldLibraryCoarse() ) ?? false;
        } else {
            return Promise.reject(new Error("Geolocation module could not be found"));
        }
    } else if (navigator && navigator.geolocation) {
        return Promise.reject(new Error("No permission request for location is required for web/hybrid platform"));
    } else {
        return Promise.reject(new Error("Geolocation module could not be found"));
    }

    // END USER CODE
}
