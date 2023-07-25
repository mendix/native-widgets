import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { RepeaterPreviewProps } from "../typings/RepeaterProps";

export function getPreview(values: RepeaterPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return topBar(
        "Repeater",
        {
            type: "DropZone",
            placeholder: "Content",
            property: values.content
        },
        isDarkMode
    );
}
