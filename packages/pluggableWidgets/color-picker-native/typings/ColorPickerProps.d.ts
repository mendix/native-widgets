/**
 * This file was generated from ColorPicker.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type FormatEnum = "hex" | "hsl" | "hsv" | "rgb";

export type AccessibleEnum = "yes" | "no";

export interface ColorPickerProps<Style> {
    name: string;
    style: Style[];
    color: EditableValue<string>;
    format: FormatEnum;
    showPreview: boolean;
    showSaturation: boolean;
    showLightness: boolean;
    showAlpha: boolean;
    onChange?: ActionValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    screenReaderCaptionHue?: DynamicValue<string>;
    screenReaderCaptionSaturation?: DynamicValue<string>;
    screenReaderCaptionBrightness?: DynamicValue<string>;
    screenReaderCaptionTransparency?: DynamicValue<string>;
}

export interface ColorPickerPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    color: string;
    format: FormatEnum;
    showPreview: boolean;
    showSaturation: boolean;
    showLightness: boolean;
    showAlpha: boolean;
    onChange: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
    screenReaderCaptionHue: string;
    screenReaderCaptionSaturation: string;
    screenReaderCaptionBrightness: string;
    screenReaderCaptionTransparency: string;
}
