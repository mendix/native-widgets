/**
 * This file was generated from BottomSheet.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type TypeEnum = "modal" | "expanding";

export type ModalRenderingEnum = "basic" | "custom";

export type StyleClassEnum = "defaultStyle" | "primaryStyle" | "dangerStyle" | "customStyle";

export type ModalAccessibleEnum = "yes" | "no";

export interface ItemsBasicType {
    caption: string;
    action?: ActionValue;
    styleClass: StyleClassEnum;
    modalAccessible: ModalAccessibleEnum;
    modalScreenReaderCaption?: DynamicValue<string>;
    modalScreenReaderHint?: DynamicValue<string>;
}

export type AccessibleEnum = "yes" | "no";

export interface ItemsBasicPreviewType {
    caption: string;
    action: {} | null;
    styleClass: StyleClassEnum;
    modalAccessible: ModalAccessibleEnum;
    modalScreenReaderCaption: string;
    modalScreenReaderHint: string;
}

export interface BottomSheetProps<Style> {
    name: string;
    style: Style[];
    type: TypeEnum;
    triggerAttribute?: EditableValue<boolean>;
    modalRendering: ModalRenderingEnum;
    itemsBasic: ItemsBasicType[];
    nativeImplementation: boolean;
    smallContent?: ReactNode;
    largeContent?: ReactNode;
    showFullscreenContent: boolean;
    fullscreenContent?: ReactNode;
    onOpen?: ActionValue;
    onClose?: ActionValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface BottomSheetPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    type: TypeEnum;
    triggerAttribute: string;
    modalRendering: ModalRenderingEnum;
    itemsBasic: ItemsBasicPreviewType[];
    nativeImplementation: boolean;
    smallContent: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    largeContent: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    showFullscreenContent: boolean;
    fullscreenContent: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    onOpen: {} | null;
    onClose: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
