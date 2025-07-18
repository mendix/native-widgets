import { StructurePreviewProps, getColors } from "@mendix/piw-utils-internal";

import vewViewGlobeDark from "./assets/WebViewGlobe.dark.svg";
import vewViewGlobeLight from "./assets/WebViewGlobe.light.svg";

import { WebViewPreviewProps } from "../typings/WebViewProps";

export const getPreview = (values: WebViewPreviewProps, isDarkMode: boolean): StructurePreviewProps => {
    const colors = getColors(isDarkMode);
    return {
        type: "Container",
        borders: true,
        backgroundColor: colors.background.shade,
        children: [
            {
                type: "RowLayout",
                columnSize: "grow",
                padding: 12,
                children: [
                    {
                        type: "Container"
                    },
                    {
                        type: "Image",
                        document: decodeURIComponent(
                            (isDarkMode ? vewViewGlobeDark : vewViewGlobeLight).replace("data:image/svg+xml,", "")
                        ),
                        width: 30
                    },
                    {
                        type: "Container",
                        padding: 6,
                        children: [
                            {
                                type: "Text",
                                fontColor: colors.text.primary,
                                content: !values.content
                                    ? values.url
                                        ? `[${values.url}]`
                                        : "Configure your webpage"
                                    : "HTML Content"
                            }
                        ]
                    },
                    {
                        type: "Container"
                    }
                ]
            }
        ]
    };
};
