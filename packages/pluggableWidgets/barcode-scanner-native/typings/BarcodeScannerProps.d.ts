/**
 * This file was generated from BarcodeScanner.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type AccessibleEnum = "yes" | "no";

export interface BarcodeScannerProps<Style> {
    name: string;
    style: Style[];
    barcode: EditableValue<string>;
    showMask: boolean;
    showAnimatedLine: boolean;
    onDetect?: ActionValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface BarcodeScannerPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    barcode: string;
    showMask: boolean;
    showAnimatedLine: boolean;
    onDetect: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
