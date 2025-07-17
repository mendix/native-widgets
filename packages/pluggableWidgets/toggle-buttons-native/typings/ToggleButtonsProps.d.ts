/**
 * This file was generated from ToggleButtons.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue } from "mendix";

export type EditableEnum = "default" | "never";

export interface ToggleButtonsProps<Style> {
    name: string;
    style: Style[];
    enum: EditableValue<string>;
    editable: EditableEnum;
    onChange?: ActionValue;
}

export interface ToggleButtonsPreviewProps {
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
    enum: string;
    editable: EditableEnum;
    onChange: {} | null;
}
