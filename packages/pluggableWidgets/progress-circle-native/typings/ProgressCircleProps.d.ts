/**
 * This file was generated from ProgressCircle.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { DynamicValue } from "mendix";
import { Big } from "big.js";

export type CircleTextEnum = "percentage" | "customText" | "none";

export interface ProgressCircleProps<Style> {
    name: string;
    style: Style[];
    progressValue: DynamicValue<Big>;
    minimumValue: DynamicValue<Big>;
    maximumValue: DynamicValue<Big>;
    circleText: CircleTextEnum;
    customText?: DynamicValue<string>;
}

export interface ProgressCirclePreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    progressValue: string;
    minimumValue: string;
    maximumValue: string;
    circleText: CircleTextEnum;
    customText: string;
}
