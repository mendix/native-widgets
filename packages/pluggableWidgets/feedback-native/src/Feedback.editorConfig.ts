import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { FeedbackPreviewProps } from "../typings/FeedbackProps";

export const getPreview = (_: FeedbackPreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar("Feedback", [], isDarkMode);
