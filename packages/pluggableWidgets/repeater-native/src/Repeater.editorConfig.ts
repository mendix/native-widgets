import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { RepeaterPreviewProps } from "../typings/RepeaterProps";

export const getPreview = (values: RepeaterPreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar(
        "Repeater",
        {
            type: "DropZone",
            placeholder: "Content",
            property: values.content
        },
        isDarkMode
    );
