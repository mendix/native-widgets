/**
 * This file was generated from Slider.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";
import { Big } from "big.js";

export type EditableEnum = "default" | "never";

export type AccessibleEnum = "yes" | "no";

export interface SliderProps<Style> {
    name: string;
    style: Style[];
    valueAttribute: EditableValue<Big>;
    editable: EditableEnum;
    minimumValue: DynamicValue<Big>;
    maximumValue: DynamicValue<Big>;
    stepSize: DynamicValue<Big>;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    onChange?: ActionValue;
}

export interface SliderPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    valueAttribute: string;
    editable: EditableEnum;
    minimumValue: string;
    maximumValue: string;
    stepSize: string;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
    onChange: {} | null;
}
