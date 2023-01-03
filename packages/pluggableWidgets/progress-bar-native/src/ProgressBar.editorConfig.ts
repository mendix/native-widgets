import { StructurePreviewProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import { ProgressBarPreviewProps } from "../typings/ProgressBarProps";
import progressBarSvgLight from "./assets/ProgressBar.light.svg";
import progressBarSvgDark from "./assets/ProgressBar.dark.svg";

export function getPreview(_: ProgressBarPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return {
        type: "Image",
        document: decodeURIComponent(
            (isDarkMode ? progressBarSvgDark : progressBarSvgLight).replace("data:image/svg+xml,", "")
        ),
        width: 301
    };
}

export function getProperties(values: ProgressBarPreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}
