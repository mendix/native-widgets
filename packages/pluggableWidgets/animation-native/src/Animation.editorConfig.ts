import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";
import { AnimationProps } from "../typings/AnimationProps";

export function getPreview(values: AnimationProps<any>, isDarkMode: boolean): StructurePreviewProps {
    const prettifyText = (text: string): string => text.replace(/([A-Z])/g, " $1").toLowerCase();
    const animationType =
        values.animationType === "in" ? "Entrance" : values.animationType === "attention" ? "Attention" : "Exit";
    const animation =
        values.animationType === "in"
            ? `${prettifyText(values.animationIn)}`
            : values.animationType === "attention"
            ? `${prettifyText(values.animationAttention)}`
            : `${prettifyText(values.animationOut)}`;

    const title =
        `${animationType} ${animation} ${values.duration}ms` + (values.delay ? `, delay ${values.delay}ms` : "");

    const content: StructurePreviewProps = {
        type: "DropZone",
        property: values.content as object
    };

    return topBar(title, content, isDarkMode);
}
