/**
 * This file was generated from AppEvents.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue } from "mendix";

export type TimerTypeEnum = "once" | "interval";

export interface AppEventsProps<Style> {
    name: string;
    style: Style[];
    onLoadAction?: ActionValue;
    onUnloadAction?: ActionValue;
    onResumeAction?: ActionValue;
    onResumeTimeout: number;
    onOnlineAction?: ActionValue;
    onOnlineTimeout: number;
    onOfflineAction?: ActionValue;
    onOfflineTimeout: number;
    timerType: TimerTypeEnum;
    delayTime: number;
    onTimeoutAction?: ActionValue;
}

export interface AppEventsPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode?: "design" | "xray" | "structure";
    onLoadAction: {} | null;
    onUnloadAction: {} | null;
    onResumeAction: {} | null;
    onResumeTimeout: number | null;
    onOnlineAction: {} | null;
    onOnlineTimeout: number | null;
    onOfflineAction: {} | null;
    onOfflineTimeout: number | null;
    timerType: TimerTypeEnum;
    delayTime: number | null;
    onTimeoutAction: {} | null;
}
