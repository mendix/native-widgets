import { StructurePreviewProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import { SliderPreviewProps } from "../typings/SliderProps";
import sliderSvgLight from "./assets/Slider.light.svg";
import sliderSvgDark from "./assets/Slider.dark.svg";

export function getPreview(_: SliderPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return {
        type: "Image",
        document: decodeURIComponent((isDarkMode ? sliderSvgDark : sliderSvgLight).replace("data:image/svg+xml,", "")),
        width: 246
    };
}

export function getProperties(values: SliderPreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}
