/**
 * This file was generated from ListViewSwipe.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue } from "mendix";

export type LeftRenderModeEnum = "disabled" | "buttons" | "archive" | "swipeOutReset" | "toggle";

export type RightRenderModeEnum = "disabled" | "buttons" | "archive" | "swipeOutReset" | "toggle";

export interface ListViewSwipeProps<Style> {
    name: string;
    style: Style[];
    content: ReactNode;
    left?: ReactNode;
    leftRenderMode: LeftRenderModeEnum;
    onSwipeLeft?: ActionValue;
    right?: ReactNode;
    rightRenderMode: RightRenderModeEnum;
    onSwipeRight?: ActionValue;
}

export interface ListViewSwipePreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    left: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    leftRenderMode: LeftRenderModeEnum;
    onSwipeLeft: {} | null;
    right: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    rightRenderMode: RightRenderModeEnum;
    onSwipeRight: {} | null;
}
