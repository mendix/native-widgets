import { DropZoneProps, StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { IntroScreenPreviewProps } from "../typings/IntroScreenProps";

export function getPreview(values: IntroScreenPreviewProps, isDarkMode: boolean): StructurePreviewProps {
    const content: StructurePreviewProps[] = values.slides.map<DropZoneProps>((value, index) => ({
        type: "DropZone",
        placeholder: `Slides/${index + 1}/Content`,
        property: value.content
    }));
    return topBar("Intro screen", content, isDarkMode);
}
