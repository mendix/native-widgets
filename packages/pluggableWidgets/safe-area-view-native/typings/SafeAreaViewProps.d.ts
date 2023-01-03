/**
 * This file was generated from SafeAreaView.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { DynamicValue } from "mendix";

export type AccessibleEnum = "yes" | "no";

export interface SafeAreaViewProps<Style> {
    name: string;
    style: Style[];
    content?: ReactNode;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface SafeAreaViewPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    content: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
