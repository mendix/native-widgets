/**
 * This file was generated from Carousel.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ListValue, ListWidgetValue } from "mendix";

export type LayoutEnum = "card" | "fullWidth";

export type ActiveSlideAlignmentEnum = "center" | "start";

export interface CarouselProps<Style> {
    name: string;
    style: Style[];
    contentSource: ListValue;
    content: ListWidgetValue;
    layout: LayoutEnum;
    showPagination: boolean;
    activeSlideAlignment: ActiveSlideAlignmentEnum;
}

export interface CarouselPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    contentSource: {} | { caption: string } | { type: string } | null;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    layout: LayoutEnum;
    showPagination: boolean;
    activeSlideAlignment: ActiveSlideAlignmentEnum;
}
