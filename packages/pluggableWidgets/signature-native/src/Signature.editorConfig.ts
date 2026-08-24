import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";
import { Problem } from "@mendix/pluggable-widgets-tools";

import { SignaturePreviewProps } from "../typings/SignatureProps";

export const getPreview = (_: SignaturePreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar("Signature", [], isDarkMode);

export function check(values: SignaturePreviewProps): Problem[] {
    const errors: Problem[] = [];

    if (values.imageSource !== null && values.imageSource.type === "static") {
        errors.push({
            property: "imageSource",
            severity: "error",
            message: "Image Source must be a dynamic (entity) image. Static images cannot be uploaded to."
        });
    }

    return errors;
}
