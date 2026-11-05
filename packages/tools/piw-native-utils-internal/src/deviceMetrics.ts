export interface DeviceMetrics {
    // Sync properties (used by widgets)
    hasNotch: boolean;
    isTablet: boolean;
    // Async methods (used by JS Actions)
    getBatteryLevel: () => Promise<number>;
    getFontScale: () => Promise<number>;
    getFreeDiskStorage: () => Promise<number>;
    getTotalDiskCapacity: () => Promise<number>;
    getTotalMemory: () => Promise<number>;
    getCarrier: () => Promise<string>;
    getManufacturer: () => Promise<string>;
    getUserAgent: () => Promise<string>;
    getUniqueId: () => Promise<string>;
    isEmulator: () => Promise<boolean>;
    isLandscape: () => Promise<boolean>;
    // Sync methods (used by JS Actions)
    getApplicationName: () => string;
    getBrand: () => string;
    getBuildNumber: () => string | number;
    getBundleId: () => string;
    getDeviceId: () => string;
    getModel: () => string;
    getReadableVersion: () => string;
    getSystemName: () => string;
    getSystemVersion: () => string;
    getVersion: () => string;
}

export function useDeviceMetrics(): DeviceMetrics {
    // Lazy import - only loads react-native-device-info when this function is called
    // This prevents the module from being bundled during widget build
    const DeviceInfo = require("react-native-device-info").default;

    return {
        // Sync properties for immediate use (widgets)
        hasNotch: DeviceInfo.hasNotch(),
        isTablet: DeviceInfo.isTablet(),
        // Async methods - returned as functions for lazy evaluation
        getBatteryLevel: () => DeviceInfo.getBatteryLevel(),
        getFontScale: () => DeviceInfo.getFontScale(),
        getFreeDiskStorage: () => DeviceInfo.getFreeDiskStorage(),
        getTotalDiskCapacity: () => DeviceInfo.getTotalDiskCapacity(),
        getTotalMemory: () => DeviceInfo.getTotalMemory(),
        getCarrier: () => DeviceInfo.getCarrier(),
        getManufacturer: () => DeviceInfo.getManufacturer(),
        getUserAgent: () => DeviceInfo.getUserAgent(),
        getUniqueId: () => DeviceInfo.getUniqueId(),
        isEmulator: () => DeviceInfo.isEmulator(),
        isLandscape: () => DeviceInfo.isLandscape(),
        // Sync methods - returned as functions for consistency
        getApplicationName: () => DeviceInfo.getApplicationName(),
        getBrand: () => DeviceInfo.getBrand(),
        getBuildNumber: () => DeviceInfo.getBuildNumber(),
        getBundleId: () => DeviceInfo.getBundleId(),
        getDeviceId: () => DeviceInfo.getDeviceId(),
        getModel: () => DeviceInfo.getModel(),
        getReadableVersion: () => DeviceInfo.getReadableVersion(),
        getSystemName: () => DeviceInfo.getSystemName(),
        getSystemVersion: () => DeviceInfo.getSystemVersion(),
        getVersion: () => DeviceInfo.getVersion()
    };
}
