import { StructurePreviewProps, getColors } from "@mendix/piw-utils-internal";
import { GalleryTextFilterPreviewProps } from "../typings/GalleryTextFilterProps";

export function getPreview(values: GalleryTextFilterPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    const colors = getColors(isDarkMode);
    return {
        type: "Container",
        backgroundColor: colors.background.topBar.standard,
        children: [
            {
                type: "Container",
                borders: true,
                padding: 8,
                borderRadius: 6,
                children: [
                    {
                        type: "Text",
                        content: values.placeholder,
                        fontColor: colors.text.primary
                    }
                ]
            }
        ]
    };
}
