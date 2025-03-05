import type {
    AuthorizationLevel,
    AuthorizationResult,
    GeoError,
    GeoPosition,
    GeoOptions,
    getCurrentPosition,
    requestAuthorization,
    watchPosition,
    clearWatch,
    stopObserving
} from "@react-native-community/geolocation";

type GeolocationServiceStatic = {
    getCurrentPosition: typeof getCurrentPosition;
    requestAuthorization: typeof requestAuthorization;
    watchPosition: typeof watchPosition;
    clearWatch: typeof clearWatch;
    stopObserving: typeof stopObserving;
};

export type { GeolocationServiceStatic, AuthorizationLevel, AuthorizationResult, GeoError, GeoPosition, GeoOptions };
