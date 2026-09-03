import { getNativeModule } from "mendix-native/native-modules";

export const NotifeeApiModule = {
    get isAvailable(): boolean {
        return !!getNativeModule("NotifeeApiModule");
    }
};
