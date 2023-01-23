/**
 * This file was generated from Gallery.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, ListValue, ListActionValue, ListAttributeValue, ListWidgetValue } from "mendix";
import { Big } from "big.js";

export type ScrollDirectionEnum = "vertical" | "horizontal";

export type PaginationEnum = "virtualScrolling" | "buttons";

export type AccessibleEnum = "yes" | "no";

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
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    filterList: FilterListType[];
    filtersPlaceholder?: ReactNode;
}

export interface GalleryPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    datasource: {} | { type: string } | null;
    content: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    scrollDirection: ScrollDirectionEnum;
    tabletColumns: number | null;
    phoneColumns: number | null;
    pageSize: number | null;
    pagination: PaginationEnum;
    loadMoreButtonCaption: string;
    emptyPlaceholder: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    onClick: {} | null;
    pullDown: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
    filterList: FilterListPreviewType[];
    filtersPlaceholder: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
}
