import { RowLayoutProps, StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import paginationSVG from "./assets/pagination.svg";

import { CarouselPreviewProps } from "../typings/CarouselProps";

export function getPreview(values: CarouselPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    const paginationImageRowLayout: RowLayoutProps = {
        type: "RowLayout",
        columnSize: "grow",
        padding: 4,
        children: [
            {
                type: "Container",
                grow: 1
            },
            {
                type: "Image",
                document: decodeURIComponent(paginationSVG.replace("data:image/svg+xml,", "")),
                width: 57
            },
            {
                type: "Container",
                grow: 1
            }
        ]
    };

    const content: StructurePreviewProps[] = [
        {
            type: "DropZone",
            placeholder: "Place content here",
            property: values.content
        },
        ...(values.showPagination ? [paginationImageRowLayout] : [])
    ];

    return topBar("Carousel", content, isDarkMode);
}
