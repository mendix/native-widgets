/**
 * This file was generated from ColorPicker.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue, EditableValue } from "mendix";
import { CSSProperties } from "react";

export type FormatEnum = "hex" | "hsl" | "hsv" | "rgb";

export interface ColorPickerProps<Style> {
    name: string;
    style: Style[];
    color: EditableValue<string>;
    format: FormatEnum;
    showPreview: boolean;
    showSaturation: boolean;
    showLightness: boolean;
    showAlpha: boolean;
    hueLabel?: DynamicValue<string>;
    saturationLabel?: DynamicValue<string>;
    lightnessLabel?: DynamicValue<string>;
    alphaLabel?: DynamicValue<string>;
    onChange?: ActionValue;
}

export interface ColorPickerPreviewProps {
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
    color: string;
    format: FormatEnum;
    showPreview: boolean;
    showSaturation: boolean;
    showLightness: boolean;
    showAlpha: boolean;
    hueLabel: string;
    saturationLabel: string;
    lightnessLabel: string;
    alphaLabel: string;
    onChange: {} | null;
}
