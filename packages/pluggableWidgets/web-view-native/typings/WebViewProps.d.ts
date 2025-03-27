/**
 * This file was generated from WebView.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue } from "mendix";

export type RequestMethodEnum = "GET" | "POST";

export interface HeaderListType {
    headerName: DynamicValue<string>;
    headerValue: DynamicValue<string>;
}

export interface HeaderListPreviewType {
    headerName: string;
    headerValue: string;
}

export interface WebViewProps<Style> {
    name: string;
    style: Style[];
    url?: DynamicValue<string>;
    content?: DynamicValue<string>;
    onLoad?: ActionValue;
    onError?: ActionValue;
    onMessage?: ActionValue;
    onMessageInput?: EditableValue<string>;
    requestMethod: RequestMethodEnum;
    postBody?: DynamicValue<string>;
    headerList: HeaderListType[];
    userAgent: string;
    openLinksExternally: boolean;
}

export interface WebViewPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    url: string;
    content: string;
    onLoad: {} | null;
    onError: {} | null;
    onMessage: {} | null;
    onMessageInput: string;
    requestMethod: RequestMethodEnum;
    postBody: string;
    headerList: HeaderListPreviewType[];
    userAgent: string;
    openLinksExternally: boolean;
}
