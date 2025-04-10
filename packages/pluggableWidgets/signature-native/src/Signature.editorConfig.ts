import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";
import { hidePropertiesIn, Properties } from "@mendix/pluggable-widgets-tools";

import { SignaturePreviewProps } from "../typings/SignatureProps";

export const getPreview = (_: SignaturePreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar("Signature", [], isDarkMode);

export function getProperties(values: SignaturePreviewProps, defaultProperties: Properties): Properties {
    if (!values.showButtons) {
        hidePropertiesIn(defaultProperties, values, ["buttonCaptionClear", "buttonCaptionSave"]);
    }
    return defaultProperties;
}
