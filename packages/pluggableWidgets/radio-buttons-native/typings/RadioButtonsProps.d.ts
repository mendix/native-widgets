/**
 * This file was generated from RadioButtons.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type OrientationEnum = "vertical" | "horizontal";

export interface RadioButtonsProps<Style> {
    name: string;
    style: Style[];
    orientation: OrientationEnum;
    enum: EditableValue<string>;
    showLabel: boolean;
    label?: DynamicValue<string>;
    onChange?: ActionValue;
}

export interface RadioButtonsPreviewProps {
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
    orientation: OrientationEnum;
    enum: string;
    showLabel: boolean;
    label: string;
    onChange: {} | null;
}
