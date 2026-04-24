/**
 * This file was generated from Signature.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, NativeImage } from "mendix";

export interface SignatureProps<Style> {
    name: string;
    style: Style[];
    imageSource: DynamicValue<NativeImage>;
    hasSignatureAttribute?: EditableValue<boolean>;
    buttonCaptionClear?: DynamicValue<string>;
    buttonCaptionSave?: DynamicValue<string>;
    onClear?: ActionValue;
    onSignEndAction?: ActionValue;
    onEnd?: ActionValue;
    onEmpty?: ActionValue;
}

export interface SignaturePreviewProps {
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
    imageSource: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    hasSignatureAttribute: string;
    buttonCaptionClear: string;
    buttonCaptionSave: string;
    onClear: {} | null;
    onSignEndAction: {} | null;
    onEnd: {} | null;
    onEmpty: {} | null;
}
