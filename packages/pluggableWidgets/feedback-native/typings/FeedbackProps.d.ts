/**
 * This file was generated from Feedback.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { DynamicValue, NativeImage } from "mendix";

export interface FeedbackProps<Style> {
    name: string;
    style: Style[];
    sprintrapp: string;
    allowScreenshot: boolean;
    logo?: DynamicValue<NativeImage>;
}

export interface FeedbackPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    sprintrapp: string;
    allowScreenshot: boolean;
    logo: { type: "static"; imageUrl: string; } | { type: "dynamic"; entity: string; } | null;
}
