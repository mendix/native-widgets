/**
 * This file was generated from Carousel.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties } from "react";
import { DynamicValue, ListValue, ListWidgetValue } from "mendix";

export type LayoutEnum = "card" | "fullWidth";

export type ActiveSlideAlignmentEnum = "center" | "start";

export type AccessibleEnum = "yes" | "no";

export interface CarouselProps<Style> {
    name: string;
    style: Style[];
    contentSource: ListValue;
    content: ListWidgetValue;
    layout: LayoutEnum;
    showPagination: boolean;
    activeSlideAlignment: ActiveSlideAlignmentEnum;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export interface CarouselPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    contentSource: {} | { type: string } | null;
    content: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    layout: LayoutEnum;
    showPagination: boolean;
    activeSlideAlignment: ActiveSlideAlignmentEnum;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}
