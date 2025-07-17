/**
 * This file was generated from Notifications.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue } from "mendix";

export interface ActionsType {
    name: string;
    onReceive?: ActionValue;
    onOpen?: ActionValue;
}

export interface ActionsPreviewType {
    name: string;
    onReceive: {} | null;
    onOpen: {} | null;
}

export interface NotificationsProps<Style> {
    name: string;
    style: Style[];
    actions: ActionsType[];
    guid?: EditableValue<string>;
    title?: EditableValue<string>;
    subtitle?: EditableValue<string>;
    body?: EditableValue<string>;
    action?: EditableValue<string>;
}

export interface NotificationsPreviewProps {
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
    actions: ActionsPreviewType[];
    guid: string;
    title: string;
    subtitle: string;
    body: string;
    action: string;
}
