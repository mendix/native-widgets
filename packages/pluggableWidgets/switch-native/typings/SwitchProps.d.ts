/**
 * This file was generated from Switch.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type LabelOrientationEnum = "horizontal" | "vertical";

export interface SwitchProps<Style> {
    name: string;
    style: Style[];
    booleanAttribute: EditableValue<boolean>;
    onChange?: ActionValue;
    showLabel: boolean;
    label?: DynamicValue<string>;
    labelOrientation: LabelOrientationEnum;
}

export interface SwitchPreviewProps {
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
    booleanAttribute: string;
    onChange: {} | null;
    showLabel: boolean;
    label: string;
    labelOrientation: LabelOrientationEnum;
}
