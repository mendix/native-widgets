/**
 * This file was generated from Gallery.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, ListValue, ListActionValue, ListAttributeValue, ListWidgetValue } from "mendix";
import { Big } from "big.js";

export type ScrollDirectionEnum = "vertical" | "horizontal";

export type PaginationEnum = "virtualScrolling" | "buttons";

export interface FilterListType {
    filter: ListAttributeValue<string | Big | boolean | Date>;
}

export interface FilterListPreviewType {
    filter: string;
}

export interface GalleryProps<Style> {
    name: string;
    style: Style[];
    datasource: ListValue;
    content?: ListWidgetValue;
    scrollDirection: ScrollDirectionEnum;
    tabletColumns: number;
    phoneColumns: number;
    pageSize: number;
    pagination: PaginationEnum;
    loadMoreButtonCaption?: DynamicValue<string>;
    emptyPlaceholder?: ReactNode;
    onClick?: ListActionValue;
    pullDown?: ActionValue;
    filterList: FilterListType[];
    filtersPlaceholder?: ReactNode;
}

export interface GalleryPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    datasource: {} | { caption: string } | { type: string } | null;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    scrollDirection: ScrollDirectionEnum;
    tabletColumns: number | null;
    phoneColumns: number | null;
    pageSize: number | null;
    pagination: PaginationEnum;
    loadMoreButtonCaption: string;
    emptyPlaceholder: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    onClick: {} | null;
    pullDown: {} | null;
    filterList: FilterListPreviewType[];
    filtersPlaceholder: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
}
