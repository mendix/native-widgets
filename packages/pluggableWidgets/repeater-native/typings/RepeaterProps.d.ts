/**
 * This file was generated from Repeater.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties } from "react";
import { DynamicValue, ListValue, ListWidgetValue } from "mendix";

export type AccessibleEnum = "yes" | "no";

export interface RepeaterProps<Style> {
    name: string;
    style: Style[];
    datasource: ListValue;
    content: ListWidgetValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface RepeaterPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    datasource: {} | { type: string } | null;
    content: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
