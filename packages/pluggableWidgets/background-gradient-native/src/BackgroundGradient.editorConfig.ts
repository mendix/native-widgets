import { StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";
import { BackgroundGradientPreviewProps } from "../typings/BackgroundGradientProps";
import { Problem } from "@mendix/pluggable-widgets-tools";

export const getPreview = (values: BackgroundGradientPreviewProps, isDarkMode: boolean): StructurePreviewProps =>
    topBar(
        "Background gradient",
        {
            type: "DropZone",
            property: values.content as object,
            placeholder: "Configure your background gradient ( Content )"
        },
        isDarkMode
    );

function checkTwoDecimalDigits(number: number): boolean {
    return number?.toString().length < 5;
}

export const check = (values: BackgroundGradientPreviewProps): Problem[] => {
    const errors: Problem[] = [];
    const { colorList } = values;

    if (colorList && colorList.some(item => !item.color)) {
        errors.push({
            message: "Please specify a color for each color stop."
        });
    }

    if (colorList && colorList.some(item => item.offset! > 1 || item.offset! < 0)) {
        errors.push({
            property: "colorList",
            message: "Color offset should be between 0.0 and 1.0"
        });
    } else if (colorList && colorList.some(item => !checkTwoDecimalDigits(item.offset || 0))) {
        errors.push({
            property: "colorList",
            message: "The offset is limited to 2 decimal places"
        });
    }

    return errors;
};
