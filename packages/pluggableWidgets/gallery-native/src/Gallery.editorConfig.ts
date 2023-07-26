import {
    ContainerProps,
    DropZoneProps,
    RowLayoutProps,
    StructurePreviewProps,
    topBar,
    getColors
} from "@mendix/piw-utils-internal";
import { Problem, hidePropertyIn, Properties } from "@mendix/pluggable-widgets-tools";
import { GalleryPreviewProps } from "../typings/GalleryProps";

export function getProperties(values: GalleryPreviewProps, defaultProperties: Properties): Properties {
    if (values.pagination !== "buttons") {
        hidePropertyIn(defaultProperties, values, "loadMoreButtonCaption");
    }

    if (values.scrollDirection === "horizontal") {
        hidePropertyIn(defaultProperties, values, "pullDown");
        hidePropertyIn(defaultProperties, values, "tabletColumns");
        hidePropertyIn(defaultProperties, values, "phoneColumns");
    }

    if (values.filterList?.length === 0) {
        hidePropertyIn(defaultProperties, values, "filtersPlaceholder");
    }

    return defaultProperties;
}

export function check(values: GalleryPreviewProps): Problem[] {
    const errors: Problem[] = [];
    if (!values.phoneColumns || values.phoneColumns < 1) {
        errors.push({
            property: "phoneColumns",
            message: "The phone columns cannot be less than 1."
        });
    }
    if (!values.tabletColumns || values.tabletColumns < 1) {
        errors.push({
            property: "tabletColumns",
            message: "The tablet columns cannot be less than 1."
        });
    }
    if (!values.pageSize || values.pageSize < 1) {
        errors.push({
            property: "pageSize",
            message: "The page size cannot be less than 1."
        });
    }
    return errors;
}

export function getPreview(values: GalleryPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    const filterCaption = values.filterList.length > 0 ? "Place filter widgets here" : "Place widgets here";

    const filters = {
        type: "RowLayout",
        columnSize: "fixed",
        borders: true,
        children: [
            {
                type: "DropZone",
                property: values.filtersPlaceholder,
                placeholder: filterCaption
            } as DropZoneProps
        ]
    } as RowLayoutProps;

    const content = {
        type: "Container",
        borders: true,
        children: [
            {
                type: "RowLayout",
                columnSize: "fixed",
                children: [
                    {
                        type: "DropZone",
                        property: values.content,
                        placeholder: "Gallery item: Place widgets here"
                    } as DropZoneProps
                ]
            } as RowLayoutProps,
            {
                type: "RowLayout",
                columnSize: "grow",
                children: [
                    {
                        type: "Container",
                        grow: 1,
                        children: []
                    },
                    {
                        type: "Container",
                        grow: 0,
                        children: [
                            {
                                type: "Text",
                                content: `Tablet ${values.tabletColumns} ${getSingularPlural(
                                    "Column",
                                    values.tabletColumns!
                                )}, Phone ${values.phoneColumns} ${getSingularPlural("Column", values.phoneColumns!)}`,
                                fontColor: getColors(isDarkMode).text.secondary
                            }
                        ]
                    },
                    {
                        type: "Container",
                        grow: 1,
                        children: []
                    }
                ]
            } as RowLayoutProps
        ]
    } as ContainerProps;

    const footer = [
        {
            type: "RowLayout",
            columnSize: "fixed",
            borders: true,
            children: [
                {
                    type: "DropZone",
                    property: values.emptyPlaceholder,
                    placeholder: "No items placeholder: Place widgets here"
                } as DropZoneProps
            ]
        } as RowLayoutProps
    ];

    return topBar("Gallery", [...(values.filterList.length > 0 ? [filters] : []), content, ...footer], isDarkMode);
}

function getSingularPlural(word: string, elements: number): string {
    return elements > 1 ? word + "s" : word;
}
