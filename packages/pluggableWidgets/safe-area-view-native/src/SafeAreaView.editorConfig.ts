import { StructurePreviewProps } from "@mendix/piw-utils-internal";
import { hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";

import { SafeAreaViewPreviewProps } from "../typings/SafeAreaViewProps";

export function getPreview(values: SafeAreaViewPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    return {
        type: "Container",
        borders: true,
        children: [
            {
                type: "Container",
                backgroundColor: isDarkMode ? "#454545" : "#F5F5F5",
                children: [
                    {
                        type: "Container",
                        padding: 4,
                        children: [
                            {
                                type: "Text",
                                fontColor: isDarkMode ? "#DEDEDE" : "#6B707B",
                                content: "Safe area view"
                            }
                        ]
                    }
                ]
            },
            {
                type: "DropZone",
                placeholder: "Content",
                property: values.content
            }
        ]
    };
}

export function getProperties(values: SafeAreaViewPreviewProps, defaultProperties: Properties): Properties {
    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}
