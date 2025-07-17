/**
 * This file was generated from Badge.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue } from "mendix";

export interface BadgeProps<Style> {
    name: string;
    style: Style[];
    caption: DynamicValue<string>;
    onClick?: ActionValue;
}

export interface BadgePreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    caption: string;
    onClick: {} | null;
}
