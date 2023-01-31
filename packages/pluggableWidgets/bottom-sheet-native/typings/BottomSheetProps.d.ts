/**
 * This file was generated from BottomSheet.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, EditableValue } from "mendix";

export type TypeEnum = "modal" | "expanding";

export type ModalRenderingEnum = "basic" | "custom";

export type StyleClassEnum = "defaultStyle" | "primaryStyle" | "dangerStyle" | "customStyle";

export interface ItemsBasicType {
    caption: string;
    action?: ActionValue;
    styleClass: StyleClassEnum;
}

export interface ItemsBasicPreviewType {
    caption: string;
    action: {} | null;
    styleClass: StyleClassEnum;
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
}

export interface BottomSheetPreviewProps {
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
    type: TypeEnum;
    triggerAttribute: string;
    modalRendering: ModalRenderingEnum;
    itemsBasic: ItemsBasicPreviewType[];
    nativeImplementation: boolean;
    smallContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    largeContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    showFullscreenContent: boolean;
    fullscreenContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    onOpen: {} | null;
    onClose: {} | null;
    triggerAttributeChange: {} | null;
}
