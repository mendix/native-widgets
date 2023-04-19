import { StructurePreviewProps } from "@mendix/piw-utils-internal";

import { RangeSliderPreviewProps } from "../typings/RangeSliderProps";
import rangeSliderSvgLight from "./assets/RangeSlider.light.svg";
import rangeSliderSvgDark from "./assets/RangeSlider.dark.svg";

export const getPreview = (_: RangeSliderPreviewProps, isDarkMode: boolean): StructurePreviewProps => ({
    type: "Image",
    document: decodeURIComponent(
        (isDarkMode ? rangeSliderSvgDark : rangeSliderSvgLight).replace("data:image/svg+xml,", "")
    ),
    width: 246
});
