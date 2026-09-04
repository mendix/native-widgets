import { TurboModule, TurboModuleRegistry } from "react-native";

interface ImagePickerManagerSpec extends TurboModule {
    showImagePicker?: unknown;
}

export const ImagePickerManager = {
    /**
     * `react-native-image-picker` v3 dropped the legacy action-sheet API. Its native module is
     * only present pre-v3; use that as a version marker instead of duplicating this check at
     * every call site.
     */
    get version(): 2 | 4 {
        return TurboModuleRegistry.get<ImagePickerManagerSpec>("ImagePickerManager")?.showImagePicker ? 2 : 4;
    }
};
