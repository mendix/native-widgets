/**
 * This file was generated from ProgressBar.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { DynamicValue } from "mendix";
import { Big } from "big.js";

export interface ProgressBarProps<Style> {
    name: string;
    style: Style[];
    minimumValue: DynamicValue<Big>;
    maximumValue: DynamicValue<Big>;
    progressValue: DynamicValue<Big>;
    showProgressCaption: boolean;
    showDefaultProgressCaption: boolean;
    progressCaption: DynamicValue<string>;
    useDefaulMendixColor: boolean;
    customColor: string;
}

export interface ProgressBarPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    minimumValue: string;
    maximumValue: string;
    progressValue: string;
    showProgressCaption: boolean;
    showDefaultProgressCaption: boolean;
    progressCaption: string;
    useDefaulMendixColor: boolean;
    customColor: string;
}
