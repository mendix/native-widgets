/**
 * This file was generated from GalleryTextFilter.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type DefaultFilterEnum = "contains" | "startsWith" | "endsWith" | "greater" | "greaterEqual" | "equal" | "notEqual" | "smaller" | "smallerEqual" | "empty" | "notEmpty";

export type AccessibleEnum = "yes" | "no";

export interface GalleryTextFilterProps<Style> {
    name: string;
    style: Style[];
    defaultValue?: DynamicValue<string>;
    defaultFilter: DefaultFilterEnum;
    placeholder?: DynamicValue<string>;
    delay: number;
    valueAttribute?: EditableValue<string>;
    onChange?: ActionValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface GalleryTextFilterPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    defaultValue: string;
    defaultFilter: DefaultFilterEnum;
    placeholder: string;
    delay: number | null;
    valueAttribute: string;
    onChange: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
