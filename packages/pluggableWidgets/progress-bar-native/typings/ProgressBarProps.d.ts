/**
 * This file was generated from ProgressBar.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { DynamicValue } from "mendix";
import { Big } from "big.js";

export type AccessibleEnum = "yes" | "no";

export interface ProgressBarProps<Style> {
    name: string;
    style: Style[];
    progressValue: DynamicValue<Big>;
    minimumValue: DynamicValue<Big>;
    maximumValue: DynamicValue<Big>;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface ProgressBarPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    progressValue: string;
    minimumValue: string;
    maximumValue: string;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
