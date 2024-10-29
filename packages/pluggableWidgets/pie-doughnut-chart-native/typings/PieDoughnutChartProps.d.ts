/**
 * This file was generated from PieDoughnutChart.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ListValue, ListAttributeValue } from "mendix";
import { Big } from "big.js";

export type PresentationEnum = "pie" | "doughnut";

export interface SeriesType {
    dataSource: ListValue;
    XAttribute: ListAttributeValue<Date | string>;
    YAttribute: ListAttributeValue<Big>;
    sliceStylingKey?: ListAttributeValue<string>;
}

export type SortOrderEnum = "ascending" | "descending";

export interface SeriesPreviewType {
    dataSource: {} | { caption: string } | { type: string } | null;
    XAttribute: string;
    YAttribute: string;
    sliceStylingKey: string;
}

export interface PieDoughnutChartProps<Style> {
    name: string;
    style: Style[];
    presentation: PresentationEnum;
    series: SeriesType[];
    sortOrder: SortOrderEnum;
    showLabels: boolean;
}

export interface PieDoughnutChartPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    presentation: PresentationEnum;
    series: SeriesPreviewType[];
    sortOrder: SortOrderEnum;
    showLabels: boolean;
}
