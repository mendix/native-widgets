export interface DeviceMetrics {
    hasNotch: boolean;
    isTablet: boolean;
    deviceId: string;
}

export function useDeviceMetrics(): DeviceMetrics {
    // Lazy import - only loads react-native-device-info when this function is called
    // This prevents the module from being bundled during widget build
    const DeviceInfo = require("react-native-device-info").default;

    return {
        hasNotch: DeviceInfo.hasNotch(),
        isTablet: DeviceInfo.isTablet(),
        deviceId: DeviceInfo.getDeviceId()
    };
}
