import type {
    GeolocationError,
    GeolocationOptions,
    GeolocationResponse,
    getCurrentPosition,
    requestAuthorization,
    watchPosition,
    clearWatch,
    stopObserving
} from "react-native-nitro-geolocation/src/compat";

type GeoError = GeolocationError;
type GeoPosition = GeolocationResponse;
type GeoOptions = GeolocationOptions;

type GeolocationServiceStatic = {
    getCurrentPosition: typeof getCurrentPosition;
    requestAuthorization: typeof requestAuthorization;
    watchPosition: typeof watchPosition;
    clearWatch: typeof clearWatch;
    stopObserving: typeof stopObserving;
};

export type { GeolocationServiceStatic, GeoError, GeoPosition, GeoOptions };
