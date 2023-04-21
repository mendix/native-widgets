/**
 * This file was generated from BarChart.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { DynamicValue, ListValue, ListAttributeValue, ListExpressionValue } from "mendix";
import { Big } from "big.js";

export type PresentationEnum = "grouped" | "stacked";

export type DataSetEnum = "static" | "dynamic";

export interface BarSeriesType {
    dataSet: DataSetEnum;
    staticDataSource?: ListValue;
    dynamicDataSource?: ListValue;
    groupByAttribute?: ListAttributeValue<string | boolean | Date | Big>;
    staticSeriesName?: DynamicValue<string>;
    dynamicSeriesName?: ListExpressionValue<string>;
    staticXAttribute?: ListAttributeValue<Date | Big | string>;
    dynamicXAttribute?: ListAttributeValue<Date | Big | string>;
    staticYAttribute?: ListAttributeValue<Date | Big | string>;
    dynamicYAttribute?: ListAttributeValue<Date | Big | string>;
    staticCustomBarStyle: string;
    dynamicCustomBarStyle?: ListAttributeValue<string>;
}

export type SortOrderEnum = "ascending" | "descending";

export interface BarSeriesPreviewType {
    dataSet: DataSetEnum;
    staticDataSource: {} | { caption: string } | { type: string } | null;
    dynamicDataSource: {} | { caption: string } | { type: string } | null;
    groupByAttribute: string;
    staticSeriesName: string;
    dynamicSeriesName: string;
    staticXAttribute: string;
    dynamicXAttribute: string;
    staticYAttribute: string;
    dynamicYAttribute: string;
    staticCustomBarStyle: string;
    dynamicCustomBarStyle: string;
}

export interface BarChartProps<Style> {
    name: string;
    style: Style[];
    presentation: PresentationEnum;
    barSeries: BarSeriesType[];
    sortOrder: SortOrderEnum;
    showLabels: boolean;
    showLegend: boolean;
    xAxisLabel?: DynamicValue<string>;
    yAxisLabel?: DynamicValue<string>;
}

export interface BarChartPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    presentation: PresentationEnum;
    barSeries: BarSeriesPreviewType[];
    sortOrder: SortOrderEnum;
    showLabels: boolean;
    showLegend: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
}
