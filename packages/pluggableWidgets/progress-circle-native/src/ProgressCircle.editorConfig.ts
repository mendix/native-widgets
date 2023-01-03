import { StructurePreviewProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import StructurePreviewSvg from "./assets/structure-preview.svg";
import StructurePreviewSvgDark from "./assets/structure-preview-dark.svg";
import { ProgressCirclePreviewProps } from "../typings/ProgressCircleProps";

export function getPreview(_: ProgressCirclePreviewProps, isDarkMode: boolean): StructurePreviewProps | null {
    return {
        type: "Image",
        document: decodeURIComponent(
            (isDarkMode ? StructurePreviewSvgDark : StructurePreviewSvg).replace("data:image/svg+xml,", "")
        ),
        height: 175,
        width: 175
    };
}

export function getProperties(values: ProgressCirclePreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}
