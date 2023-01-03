import { RowLayoutProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import StructurePreviewQRCodeSVG from "./assets/StructurePreviewQRCode.svg";
import StructurePreviewQRCodeDarkSVG from "./assets/StructurePreviewQRCodeDark.svg";
import { QRCodePreviewProps } from "../typings/QRCodeProps";

export const getPreview = (_: QRCodePreviewProps, isDarkMode: boolean): RowLayoutProps => ({
    type: "RowLayout",
    borders: false,
    padding: 8,
    columnSize: "grow",
    children: [
        {
            type: "Image",
            document: decodeURIComponent(
                (isDarkMode ? StructurePreviewQRCodeDarkSVG : StructurePreviewQRCodeSVG).replace(
                    "data:image/svg+xml,",
                    ""
                )
            ),
            width: 48,
            height: 48
        }
    ]
});

export function getProperties(values: QRCodePreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}
