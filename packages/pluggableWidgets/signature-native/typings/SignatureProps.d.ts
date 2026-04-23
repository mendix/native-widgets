/**
 * This file was generated from Signature.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, ObjectItem } from "mendix";

export type SaveModeEnum = "attribute" | "directImage";

export interface SignatureProps<Style> {
    name: string;
    style: Style[];
    saveMode: SaveModeEnum;
    imageAttribute?: EditableValue<string>;
    imageObject?: DynamicValue<ObjectItem>;
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
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    saveMode: SaveModeEnum;
    imageAttribute: string;
    imageObject: {} | { type: string } | null;
    buttonCaptionClear: string;
    buttonCaptionSave: string;
    onClear: {} | null;
    onSave: {} | null;
    onEnd: {} | null;
    onEmpty: {} | null;
}
