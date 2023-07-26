import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";

import { SignaturePreviewProps } from "../typings/SignatureProps";

export const getPreview = (_: SignaturePreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar("Signature", [], isDarkMode);
