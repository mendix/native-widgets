/**
 * This file was generated from ToggleButtons.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type EditableEnum = "default" | "never";

export type AccessibleEnum = "yes" | "no";

export interface ToggleButtonsProps<Style> {
    name: string;
    style: Style[];
    enum: EditableValue<string>;
    editable: EditableEnum;
    onChange?: ActionValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface ToggleButtonsPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    enum: string;
    editable: EditableEnum;
    onChange: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
