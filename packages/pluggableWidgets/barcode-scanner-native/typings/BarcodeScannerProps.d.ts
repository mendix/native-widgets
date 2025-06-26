/**
 * This file was generated from BarcodeScanner.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue } from "mendix";

export interface BarcodeScannerProps<Style> {
    name: string;
    style: Style[];
    barcode: EditableValue<string>;
    showMask: boolean;
    showAnimatedLine: boolean;
    onDetect?: ActionValue;
}

export interface BarcodeScannerPreviewProps {
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
    barcode: string;
    showMask: boolean;
    showAnimatedLine: boolean;
    onDetect: {} | null;
}
