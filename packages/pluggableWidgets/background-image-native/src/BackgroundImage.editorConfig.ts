import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { BackgroundImagePreviewProps } from "../typings/BackgroundImageProps";

export const getPreview = (values: BackgroundImagePreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar(
        "Background image",
        {
            type: "DropZone",
            property: values.content as object,
            placeholder: "Content"
        },
        isDarkMode
    );
