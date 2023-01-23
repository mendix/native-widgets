/**
 * This file was generated from RadioButtons.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type OrientationEnum = "vertical" | "horizontal";

export type AccessibleEnum = "yes" | "no";

export interface RadioButtonsProps<Style> {
    name: string;
    style: Style[];
    orientation: OrientationEnum;
    enum: EditableValue<string>;
    showLabel: boolean;
    label?: DynamicValue<string>;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    onChange?: ActionValue;
}

export interface RadioButtonsPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    orientation: OrientationEnum;
    enum: string;
    showLabel: boolean;
    label: string;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
    onChange: {} | null;
}
