/**
 * This file was generated from BackgroundGradient.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue } from "mendix";
import { Big } from "big.js";

export interface ColorListType {
    color: string;
    offset: Big;
}

export interface ColorListPreviewType {
    color: string;
    offset: number | null;
}

export interface BackgroundGradientProps<Style> {
    name: string;
    style: Style[];
    colorList: ColorListType[];
    content: ReactNode;
    onClick?: ActionValue;
}

export interface BackgroundGradientPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    colorList: ColorListPreviewType[];
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    onClick: {} | null;
}
