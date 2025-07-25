/**
 * This file was generated from VideoPlayer.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { DynamicValue } from "mendix";

export interface VideoPlayerProps<Style> {
    name: string;
    style: Style[];
    videoUrl: DynamicValue<string>;
    autoStart: boolean;
    muted: boolean;
    loop: boolean;
    aspectRatio: boolean;
    showControls: boolean;
}

export interface VideoPlayerPreviewProps {
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
    videoUrl: string;
    autoStart: boolean;
    muted: boolean;
    loop: boolean;
    aspectRatio: boolean;
    showControls: boolean;
}
