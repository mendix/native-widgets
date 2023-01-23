/**
 * This file was generated from PopupMenu.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue } from "mendix";

export type RenderModeEnum = "basic" | "custom";

export type ItemTypeEnum = "item" | "divider";

export type StyleClassEnum = "defaultStyle" | "primaryStyle" | "dangerStyle" | "customStyle";

export type AccessibleEnum = "yes" | "no";

export interface BasicItemsType {
    itemType: ItemTypeEnum;
    caption: string;
    action?: ActionValue;
    styleClass: StyleClassEnum;
    accessible: AccessibleEnum;
    screenReaderCaption?: DynamicValue<string>;
    screenReaderHint?: DynamicValue<string>;
}

export type CustomItemAccessibleEnum = "yes" | "no";

export interface CustomItemsType {
    content: ReactNode;
    action?: ActionValue;
    customItemAccessible: CustomItemAccessibleEnum;
    customItemScreenReaderCaption?: DynamicValue<string>;
    customItemScreenReaderHint?: DynamicValue<string>;
}

export interface BasicItemsPreviewType {
    itemType: ItemTypeEnum;
    caption: string;
    action: {} | null;
    styleClass: StyleClassEnum;
    accessible: AccessibleEnum;
    screenReaderCaption: string;
    screenReaderHint: string;
}

export interface CustomItemsPreviewType {
    content: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    action: {} | null;
    customItemAccessible: CustomItemAccessibleEnum;
    customItemScreenReaderCaption: string;
    customItemScreenReaderHint: string;
}

export interface PopupMenuProps<Style> {
    name: string;
    style: Style[];
    menuTriggerer?: ReactNode;
    renderMode: RenderModeEnum;
    basicItems: BasicItemsType[];
    customItems: CustomItemsType[];
}

export interface PopupMenuPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    menuTriggerer: { widgetCount: number; renderer: ComponentType<{ caption?: string }> };
    renderMode: RenderModeEnum;
    basicItems: BasicItemsPreviewType[];
    customItems: CustomItemsPreviewType[];
}
