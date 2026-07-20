import { Big } from "big.js";
import { Platform } from "react-native";
import { GeolocationResponse, LocationRequestOptions } from "react-native-nitro-geolocation";

export function buildLocationOptions(
    timeout: Big | undefined,
    maximumAge: Big | undefined,
    highAccuracy: boolean | undefined
): LocationRequestOptions {
    let timeoutNumber = timeout ? timeout.toNumber() : undefined;
    const maximumAgeNumber = maximumAge ? maximumAge.toNumber() : undefined;

    // If the timeout is 0 or undefined (empty), it causes a crash on iOS.
    // If the timeout is undefined (empty); we set timeout to 30 sec (default timeout)
    // If the timeout is 0; we set timeout to 1 hour (no timeout)
    if (Platform.OS === "ios") {
        if (timeoutNumber === undefined) {
            timeoutNumber = 30000;
        } else if (timeoutNumber === 0) {
            timeoutNumber = 3600000;
        }
    }

    return {
        timeout: timeoutNumber,
        maximumAge: maximumAgeNumber,
        accuracy: highAccuracy ? { android: "high", ios: "best" } : { android: "balanced", ios: "hundredMeters" }
    };
}

export function mapPositionToMxObject(mxObject: mendix.lib.MxObject, pos: GeolocationResponse): mendix.lib.MxObject {
    mxObject.set("Timestamp", new Date(pos.timestamp));
    mxObject.set("Latitude", new Big(pos.coords.latitude.toFixed(8)));
    mxObject.set("Longitude", new Big(pos.coords.longitude.toFixed(8)));
    mxObject.set("Accuracy", new Big(pos.coords.accuracy.toFixed(8)));
    if (pos.coords.altitude != null) {
        mxObject.set("Altitude", new Big(pos.coords.altitude.toFixed(8)));
    }
    if (pos.coords.altitudeAccuracy != null && pos.coords.altitudeAccuracy !== -1) {
        mxObject.set("AltitudeAccuracy", new Big(pos.coords.altitudeAccuracy.toFixed(8)));
    }
    if (pos.coords.heading != null && pos.coords.heading !== -1) {
        mxObject.set("Heading", new Big(pos.coords.heading.toFixed(8)));
    }
    if (pos.coords.speed != null && pos.coords.speed !== -1) {
        mxObject.set("Speed", new Big(pos.coords.speed.toFixed(8)));
    }
    return mxObject;
}
