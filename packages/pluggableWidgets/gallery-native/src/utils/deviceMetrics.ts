import DeviceInfo from "react-native-device-info";

/**
 * Device metrics interface returned by useDeviceMetrics hook
 */
export interface DeviceMetrics {
    /** Whether the device has a notch (display cutout) */
    hasNotch: boolean;
    /** Whether the device is a tablet */
    isTablet: boolean;
    /** Device model identifier (e.g., "iPhone14,2") */
    deviceId: string;
}

/**
 * Hook providing device-specific metrics for layout decisions.
 * Wraps react-native-device-info to centralize device detection logic.
 *
 * @returns Device metrics including notch presence, tablet detection, and device ID
 * @example
 * ```tsx
 * const { hasNotch, isTablet } = useDeviceMetrics();
 * const columns = isTablet ? 4 : 2;
 * const bottomPadding = hasNotch ? 22 : 0;
 * ```
 */
export function useDeviceMetrics(): DeviceMetrics {
    return {
        hasNotch: DeviceInfo.hasNotch(),
        isTablet: DeviceInfo.isTablet(),
        deviceId: DeviceInfo.getDeviceId()
    };
}
