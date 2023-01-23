/**
 * This file was generated from QRCode.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { DynamicValue } from "mendix";

export type AccessibleEnum = "yes" | "no";

export interface QRCodeProps<Style> {
    name: string;
    style: Style[];
    value: DynamicValue<string>;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface QRCodePreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    value: string;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
