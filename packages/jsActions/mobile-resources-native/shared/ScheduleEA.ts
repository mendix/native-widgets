import { TurboModule, TurboModuleRegistry } from "react-native";

interface ScheduleEASpec extends TurboModule {
    checkPermission(callback: (isEnabled: boolean) => void): void;
}

export const ScheduleEA = {
    get isAvailable(): boolean {
        return !!TurboModuleRegistry.get<ScheduleEASpec>("ScheduleEA");
    },
    checkPermission(callback: (isEnabled: boolean) => void): void {
        TurboModuleRegistry.get<ScheduleEASpec>("ScheduleEA")!.checkPermission(callback);
    }
};
