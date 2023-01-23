/**
 * This file was generated from Rating.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, NativeImage } from "mendix";
import { Big } from "big.js";

export type AccessibleEnum = "yes" | "no";

export type AnimationEnum =
    | "pulse"
    | "bounce"
    | "flash"
    | "jello"
    | "rotate"
    | "rubberBand"
    | "shake"
    | "swing"
    | "tada"
    | "wobble"
    | "none";

export type EditableEnum = "default" | "never";

export interface RatingProps<Style> {
    name: string;
    style: Style[];
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    ratingAttribute: EditableValue<Big>;
    emptyIcon?: DynamicValue<NativeImage>;
    icon?: DynamicValue<NativeImage>;
    maximumValue: number;
    animation: AnimationEnum;
    editable: EditableEnum;
    onChange?: ActionValue;
}

export interface RatingPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
    ratingAttribute: string;
    emptyIcon: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    icon: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    maximumValue: number | null;
    animation: AnimationEnum;
    editable: EditableEnum;
    onChange: {} | null;
}
