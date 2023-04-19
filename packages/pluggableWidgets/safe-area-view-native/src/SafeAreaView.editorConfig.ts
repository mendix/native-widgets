import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { SafeAreaViewPreviewProps } from "../typings/SafeAreaViewProps";

export const getPreview = (values: SafeAreaViewPreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar(
        "Safe area view",
        {
            type: "DropZone",
            placeholder: "Content",
            property: values.content
        },
        isDarkMode
    );
