import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";
import { hidePropertiesIn, Properties } from "@mendix/pluggable-widgets-tools";

import { SignaturePreviewProps } from "../typings/SignatureProps";

export const getPreview = (_: SignaturePreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar("Signature", [], isDarkMode);

export function getProperties(values: SignaturePreviewProps, defaultProperties: Properties): Properties {
    if (values.saveMode === "attribute") {
        hidePropertiesIn(defaultProperties, values, ["imageSource"]);
    }

    if (values.saveMode === "directImage") {
        hidePropertiesIn(defaultProperties, values, ["imageAttribute"]);
    }

    return defaultProperties;
}
