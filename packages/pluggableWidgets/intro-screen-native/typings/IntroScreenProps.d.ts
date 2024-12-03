/**
 * This file was generated from IntroScreen.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, EditableValue, NativeIcon } from "mendix";
import { Big } from "big.js";

export interface SlidesType {
    name: string;
    content: ReactNode;
}

export type ShowModeEnum = "fullscreen" | "popup";

export type ButtonPatternEnum = "all" | "nextDone" | "none";

export type SlideIndicatorsEnum = "between" | "above" | "never";

export interface SlidesPreviewType {
    name: string;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
}

export interface IntroScreenProps<Style> {
    name: string;
    style: Style[];
    slides: SlidesType[];
    showMode: ShowModeEnum;
    buttonPattern: ButtonPatternEnum;
    slideIndicators: SlideIndicatorsEnum;
    hideIndicatorLastSlide: boolean;
    identifier: string;
    skipCaption?: DynamicValue<string>;
    skipIcon?: DynamicValue<NativeIcon>;
    previousCaption?: DynamicValue<string>;
    previousIcon?: DynamicValue<NativeIcon>;
    nextCaption?: DynamicValue<string>;
    nextIcon?: DynamicValue<NativeIcon>;
    doneCaption?: DynamicValue<string>;
    doneIcon?: DynamicValue<NativeIcon>;
    activeSlideAttribute?: EditableValue<Big>;
    onSlideChange?: ActionValue;
    onDone?: ActionValue;
    onSkip?: ActionValue;
}

export interface IntroScreenPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    slides: SlidesPreviewType[];
    showMode: ShowModeEnum;
    buttonPattern: ButtonPatternEnum;
    slideIndicators: SlideIndicatorsEnum;
    hideIndicatorLastSlide: boolean;
    identifier: string;
    skipCaption: string;
    skipIcon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; iconUrl: string; } | { type: "icon"; iconClass: string; } | undefined;
    previousCaption: string;
    previousIcon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; iconUrl: string; } | { type: "icon"; iconClass: string; } | undefined;
    nextCaption: string;
    nextIcon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; iconUrl: string; } | { type: "icon"; iconClass: string; } | undefined;
    doneCaption: string;
    doneIcon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; iconUrl: string; } | { type: "icon"; iconClass: string; } | undefined;
    activeSlideAttribute: string;
    onSlideChange: {} | null;
    onDone: {} | null;
    onSkip: {} | null;
}
