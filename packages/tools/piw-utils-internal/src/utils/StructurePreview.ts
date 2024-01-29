import type { StructurePreviewProps, ContainerProps } from "../../src/typings/PageEditor";
import { getColors } from "../constants/Colors";

export const topBar = (
    title: string,
    content: StructurePreviewProps | StructurePreviewProps[],
    isDarkMode: boolean
): ContainerProps => {
    const colors = getColors(isDarkMode);
    return {
        type: "Container",
        borders: true,
        children: [
            {
                type: "Container",
                children: [
                    {
                        type: "Container",
                        backgroundColor: colors.background.topBar.standard,
                        children: [
                            {
                                type: "Container",
                                padding: 4,
                                children: [
                                    {
                                        type: "Text",
                                        fontColor: colors.text.primary,
                                        content: title
                                    }
                                ]
                            }
                        ]
                    },
                    ...(Array.isArray(content) ? content : [content])
                ]
            }
        ]
    };
};
