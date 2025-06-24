/**
 * This file was generated from FloatingActionButton.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, NativeIcon } from "mendix";

export type HorizontalPositionEnum = "left" | "center" | "right";

export type VerticalPositionEnum = "top" | "bottom";

export interface SecondaryButtonsType {
    icon: DynamicValue<NativeIcon>;
    caption?: DynamicValue<string>;
    onClick?: ActionValue;
}

export interface SecondaryButtonsPreviewType {
    icon:
        | { type: "glyph"; iconClass: string }
        | { type: "image"; imageUrl: string; iconUrl: string }
        | { type: "icon"; iconClass: string }
        | undefined;
    caption: string;
    onClick: {} | null;
}

export interface FloatingActionButtonProps<Style> {
    name: string;
    style: Style[];
    icon?: DynamicValue<NativeIcon>;
    iconActive?: DynamicValue<NativeIcon>;
    horizontalPosition: HorizontalPositionEnum;
    verticalPosition: VerticalPositionEnum;
    onClick?: ActionValue;
    secondaryButtons: SecondaryButtonsType[];
}

export interface FloatingActionButtonPreviewProps {
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
    icon:
        | { type: "glyph"; iconClass: string }
        | { type: "image"; imageUrl: string; iconUrl: string }
        | { type: "icon"; iconClass: string }
        | undefined;
    iconActive:
        | { type: "glyph"; iconClass: string }
        | { type: "image"; imageUrl: string; iconUrl: string }
        | { type: "icon"; iconClass: string }
        | undefined;
    horizontalPosition: HorizontalPositionEnum;
    verticalPosition: VerticalPositionEnum;
    onClick: {} | null;
    secondaryButtons: SecondaryButtonsPreviewType[];
}
