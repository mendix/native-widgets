import { getNativeModule } from "mendix-native/native-modules";

interface ScheduleEASpec {
    checkPermission(callback: (isEnabled: boolean) => void): void;
}

export const ScheduleEA = {
    get isAvailable(): boolean {
        return !!getNativeModule<ScheduleEASpec>("ScheduleEA");
    },
    checkPermission(callback: (isEnabled: boolean) => void): void {
        getNativeModule<ScheduleEASpec>("ScheduleEA")!.checkPermission(callback);
    }
};
