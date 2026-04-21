/**
 * This file was generated from BackgroundImage.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { DynamicValue, NativeImage } from "mendix";
import { Big } from "big.js";

export type ResizeModeEnum = "cover" | "contain" | "stretch" | "center";

export interface BackgroundImageProps<Style> {
    name: string;
    style: Style[];
    image: DynamicValue<NativeImage>;
    defaultImage?: DynamicValue<NativeImage>;
    resizeMode: ResizeModeEnum;
    opacity: Big;
    content?: ReactNode;
}

export interface BackgroundImagePreviewProps {
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
    image: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    defaultImage: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    resizeMode: ResizeModeEnum;
    opacity: number | null;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
}
