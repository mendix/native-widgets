/**
 * This file was generated from FloatingActionButton.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, NativeIcon } from "mendix";

export type HorizontalPositionEnum = "left" | "center" | "right";

export type VerticalPositionEnum = "top" | "bottom";

export type AccessibleEnum = "yes" | "no";

export type ButtonAccessibleEnum = "yes" | "no";

export interface SecondaryButtonsType {
    icon: DynamicValue<NativeIcon>;
    caption?: DynamicValue<string>;
    onClick?: ActionValue;
    buttonAccessible: ButtonAccessibleEnum;
    buttonScreenReaderCaption?: DynamicValue<string>;
}

export interface SecondaryButtonsPreviewType {
    icon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; } | null;
    caption: string;
    onClick: {} | null;
    buttonAccessible: ButtonAccessibleEnum;
    buttonScreenReaderCaption: string;
}

export interface FloatingActionButtonProps<Style> {
    name: string;
    style: Style[];
    icon?: DynamicValue<NativeIcon>;
    iconActive?: DynamicValue<NativeIcon>;
    horizontalPosition: HorizontalPositionEnum;
    verticalPosition: VerticalPositionEnum;
    onClick?: ActionValue;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    secondaryButtons: SecondaryButtonsType[];
}

export interface FloatingActionButtonPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    icon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; } | null;
    iconActive: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; } | null;
    horizontalPosition: HorizontalPositionEnum;
    verticalPosition: VerticalPositionEnum;
    onClick: {} | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    secondaryButtons: SecondaryButtonsPreviewType[];
}
