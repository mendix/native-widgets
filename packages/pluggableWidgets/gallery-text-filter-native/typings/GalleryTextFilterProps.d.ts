/**
 * This file was generated from GalleryTextFilter.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type DefaultFilterEnum =
    | "contains"
    | "startsWith"
    | "endsWith"
    | "greater"
    | "greaterEqual"
    | "equal"
    | "notEqual"
    | "smaller"
    | "smallerEqual"
    | "empty"
    | "notEmpty";

export interface GalleryTextFilterProps<Style> {
    name: string;
    style: Style[];
    defaultValue?: DynamicValue<string>;
    defaultFilter: DefaultFilterEnum;
    placeholder?: DynamicValue<string>;
    delay: number;
    valueAttribute?: EditableValue<string>;
    onChange?: ActionValue;
}

export interface GalleryTextFilterPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    defaultValue: string;
    defaultFilter: DefaultFilterEnum;
    placeholder: string;
    delay: number | null;
    valueAttribute: string;
    onChange: {} | null;
}
