/**
 * This file was generated from Feedback.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { DynamicValue, NativeImage } from "mendix";

export type AccessibleEnum = "yes" | "no";

export interface FeedbackProps<Style> {
    name: string;
    style: Style[];
    sprintrapp: string;
    allowScreenshot: boolean;
    logo?: DynamicValue<NativeImage>;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface FeedbackPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    sprintrapp: string;
    allowScreenshot: boolean;
    logo: { type: "static"; imageUrl: string; } | { type: "dynamic"; entity: string; } | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
