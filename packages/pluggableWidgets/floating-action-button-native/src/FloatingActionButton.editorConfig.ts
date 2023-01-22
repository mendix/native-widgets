import { ImageProps, ContainerProps, StructurePreviewProps } from "@mendix/piw-utils-internal";
import { Properties, hidePropertyIn } from "@mendix/pluggable-widgets-tools";
import { FloatingActionButtonPreviewProps } from "../typings/FloatingActionButtonProps";
import StructurePreviewFloatingActionButtonPrimarySVG from "./assets/StructurePreviewFloatingActionButtonPrimary.svg";
import StructurePreviewFloatingActionButtonPrimaryDarkSVG from "./assets/StructurePreviewFloatingActionButtonPrimaryDark.svg";

export const getPreview = (
    values: FloatingActionButtonPreviewProps,
    isDarkMode: boolean
): StructurePreviewProps | null => {
    const rowLayoutContainer: ContainerProps = { type: "Container", children: [] };
    const rowLayoutImage: ImageProps = {
        type: "Image",
        document: decodeURIComponent(
            (isDarkMode
                ? StructurePreviewFloatingActionButtonPrimaryDarkSVG
                : StructurePreviewFloatingActionButtonPrimarySVG
            ).replace("data:image/svg+xml,", "")
        ),
        width: 32,
        height: 32
    };

    return {
        type: "RowLayout",
        borders: false,
        padding: 8,
        columnSize: "grow",
        children:
            values.horizontalPosition === "left"
                ? [rowLayoutImage]
                : values.horizontalPosition === "center"
                ? [rowLayoutContainer, rowLayoutImage, rowLayoutContainer]
                : [rowLayoutContainer, rowLayoutImage]
    };
};

export function getProperties(values: FloatingActionButtonPreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
    }
    return defaultProperties;
}
