/**
 * This file was generated from Image.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, NativeIcon, NativeImage } from "mendix";

export type DatasourceEnum = "image" | "imageUrl" | "icon";

export type ResizeModeEnum = "cover" | "contain" | "stretch" | "center";

export type WidthUnitEnum = "auto" | "points";

export type HeightUnitEnum = "auto" | "points";

export type AccessibleEnum = "yes" | "no";

export type OnClickTypeEnum = "action" | "enlarge";

export interface ImageProps<Style> {
    name: string;
    style: Style[];
    datasource: DatasourceEnum;
    imageObject?: DynamicValue<NativeImage>;
    defaultImageDynamic?: DynamicValue<NativeImage>;
    imageUrl?: DynamicValue<string>;
    imageIcon?: DynamicValue<NativeIcon>;
    isBackgroundImage: boolean;
    children?: ReactNode;
    resizeMode: ResizeModeEnum;
    opacity: number;
    widthUnit: WidthUnitEnum;
    customWidth: number;
    heightUnit: HeightUnitEnum;
    customHeight: number;
    iconSize: number;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
    onClickType: OnClickTypeEnum;
    onClick?: ActionValue;
}

export interface ImagePreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    datasource: DatasourceEnum;
    imageObject: { type: "static"; imageUrl: string; } | { type: "dynamic"; entity: string; } | null;
    defaultImageDynamic: { type: "static"; imageUrl: string; } | { type: "dynamic"; entity: string; } | null;
    imageUrl: string;
    imageIcon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; } | null;
    isBackgroundImage: boolean;
    children: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    resizeMode: ResizeModeEnum;
    opacity: number | null;
    widthUnit: WidthUnitEnum;
    customWidth: number | null;
    heightUnit: HeightUnitEnum;
    customHeight: number | null;
    iconSize: number | null;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
    onClickType: OnClickTypeEnum;
    onClick: {} | null;
}
