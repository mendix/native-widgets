import DeviceInfo from "react-native-device-info";

export interface DeviceMetrics {
    hasNotch: boolean;
    isTablet: boolean;
    deviceId: string;
}

export function useDeviceMetrics(): DeviceMetrics {
    return {
        hasNotch: DeviceInfo.hasNotch(),
        isTablet: DeviceInfo.isTablet(),
        deviceId: DeviceInfo.getDeviceId()
    };
}
