import { TurboModule, TurboModuleRegistry } from "react-native";

interface FirebaseMessagingModuleSpec extends TurboModule {
    hasPermission(): Promise<number>;
}

export const RNFBMessagingModule = {
    get isAvailable(): boolean {
        return !!TurboModuleRegistry.get<FirebaseMessagingModuleSpec>("RNFBMessagingModule");
    },
    hasPermission(): Promise<number> {
        return TurboModuleRegistry.get<FirebaseMessagingModuleSpec>("RNFBMessagingModule")!.hasPermission();
    }
};
