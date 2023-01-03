/**
 * This file was generated from ActivityIndicator.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { DynamicValue } from "mendix";

export type AccessibleEnum = "yes" | "no";

export interface ActivityIndicatorProps<Style> {
    name: string;
    style: Style[];
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface ActivityIndicatorPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
