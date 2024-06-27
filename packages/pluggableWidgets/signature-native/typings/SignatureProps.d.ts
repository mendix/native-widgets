/**
 * This file was generated from Signature.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export interface SignatureProps<Style> {
    name: string;
    style: Style[];
    imageAttribute: EditableValue<string>;
    showButtons: boolean;
    buttonCaptionClear?: DynamicValue<string>;
    buttonCaptionSave?: DynamicValue<string>;
    onClear?: ActionValue;
    onSave?: ActionValue;
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
    imageAttribute: string;
    showButtons: boolean;
    buttonCaptionClear: string;
    buttonCaptionSave: string;
    onClear: {} | null;
    onSave: {} | null;
    onEnd: {} | null;
    onEmpty: {} | null;
}
