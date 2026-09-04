import { TurboModuleRegistry } from "react-native";

export const NotifeeApiModule = {
    get isAvailable(): boolean {
        return !!TurboModuleRegistry.get("NotifeeApiModule");
    }
};
