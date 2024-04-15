import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { SafeAreaViewPreviewProps } from "../typings/SafeAreaViewProps";

export function getPreview(values: SafeAreaViewPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return topBar(
        "Safe area view",
        {
            type: "DropZone",
            placeholder: "Content",
            property: values.content
        },
        isDarkMode
    );
}
