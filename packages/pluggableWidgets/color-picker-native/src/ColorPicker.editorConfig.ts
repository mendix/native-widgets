import { StructurePreviewProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import { ColorPickerPreviewProps } from "../typings/ColorPickerProps";
import colorPickerSvgNoPreviewDark from "./assets/ColorPicker.nopreview.dark.svg";
import colorPickerSvgNoPreviewLight from "./assets/ColorPicker.nopreview.light.svg";
import colorPickerSvgPreviewDark from "./assets/ColorPicker.preview.dark.svg";
import colorPickerSvgPreviewLight from "./assets/ColorPicker.preview.light.svg";

export function getPreview(values: ColorPickerPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return {
        type: "Image",
        document: decodeURIComponent(
            (values.showPreview
                ? isDarkMode
                    ? colorPickerSvgPreviewDark
                    : colorPickerSvgPreviewLight
                : isDarkMode
                ? colorPickerSvgNoPreviewDark
                : colorPickerSvgNoPreviewLight
            ).replace("data:image/svg+xml,", "")
        ),
        width: 188
    };
}

export function getProperties(values: ColorPickerPreviewProps, defaultProperties: Properties): Properties {
    if (!values.showSaturation) {
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionSaturation");
    }

    if (!values.showLightness) {
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionBrightness");
    }

    if (!values.showAlpha) {
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionTransparency");
    }

    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionHue");
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionSaturation");
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionBrightness");
        hidePropertyIn(defaultProperties, values, "screenReaderCaptionTransparency");
    }

    return defaultProperties;
}
