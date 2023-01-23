import { StructurePreviewProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import barcodeScannerSvgDark from "./assets/BarcodeScanner.dark.svg";
import barcodeScannerSvgLight from "./assets/BarcodeScanner.light.svg";
import { BarcodeScannerPreviewProps } from "../typings/BarcodeScannerProps";

export function getPreview(_: BarcodeScannerPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return {
        type: "Image",
        document: decodeURIComponent(
            (isDarkMode ? barcodeScannerSvgDark : barcodeScannerSvgLight).replace("data:image/svg+xml,", "")
        ),
        width: 100
    };
}

export function getProperties(values: BarcodeScannerPreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}
