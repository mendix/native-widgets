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
    titleSendFeedback?: DynamicValue<string>;
    titleSending?: DynamicValue<string>;
    titleResult?: DynamicValue<string>;
    labelFeedbackInput?: DynamicValue<string>;
    placeholderFeedback?: DynamicValue<string>;
    labelIncludeScreenshot?: DynamicValue<string>;
    buttonCancel?: DynamicValue<string>;
    buttonSend?: DynamicValue<string>;
    buttonOk?: DynamicValue<string>;
    accessibilityLabelFeedbackButton?: DynamicValue<string>;
    messageSuccess?: DynamicValue<string>;
    messageError?: DynamicValue<string>;
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
    logo: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    titleSendFeedback: string;
    titleSending: string;
    titleResult: string;
    labelFeedbackInput: string;
    placeholderFeedback: string;
    labelIncludeScreenshot: string;
    buttonCancel: string;
    buttonSend: string;
    buttonOk: string;
    accessibilityLabelFeedbackButton: string;
    messageSuccess: string;
    messageError: string;
}
