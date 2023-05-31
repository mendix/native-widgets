import { CSSProperties } from "react";

export type WidthUnitEnum = "percentage" | "pixels";

export type HeightUnitEnum = "percentageOfWidth" | "pixels" | "percentageOfParent";

export interface Dimensions {
    widthUnit: WidthUnitEnum;
    width: number | null;
    heightUnit: HeightUnitEnum;
    height: number | null;
}

export function getDimensions<T extends Dimensions>(props: T): CSSProperties {
    const style: CSSProperties = {};

    if (props.width) {
        style.width = props.widthUnit === "percentage" ? `${props.width}%` : `${props.width}px`;
    }

    if (props.height) {
        if (props.heightUnit === "percentageOfWidth" && props.width) {
            const ratio = (props.height / 100) * props.width;
            if (props.widthUnit === "percentage") {
                style.height = "auto";
                style.paddingBottom = `${ratio}%`;
            } else {
                style.height = `${ratio}px`;
            }
        } else if (props.heightUnit === "pixels") {
            style.height = `${props.height}px`;
        } else if (props.heightUnit === "percentageOfParent") {
            style.height = `${props.height}%`;
        }
    }

    return style;
}

/**
 * @example colorWithAlpha('#FF0000', 20) -> #FF000033
 * @param color Color in HEX format.
 * @param opacity The opacity of the color, must be between [0-100].
 * @returns 
 */
export function colorWithOpacity(color: string, opacity: number): string {
    const alpha = Math.round(Math.min(Math.max(opacity, 100), 0));
    const hexValue = alphaHexByPercent.get(opacity);
    if (!hexValue) {
        throw Error(`Structure preview error: Can't convert alpha value (${alpha}) to hex`);
    }
    return `${color}${hexValue}`;
}

const alphaHexByPercent = new Map([
    [100, "FF"],
    [99, "FC"],
    [98, "FA"],
    [97, "F7"],
    [96, "F5"],
    [95, "F2"],
    [94, "F0"],
    [93, "ED"],
    [92, "EB"],
    [91, "E8"],
    [90, "E6"],
    [89, "E3"],
    [88, "E0"],
    [87, "DE"],
    [86, "DB"],
    [85, "D9"],
    [84, "D6"],
    [83, "D4"],
    [82, "D1"],
    [81, "CF"],
    [80, "CC"],
    [79, "C9"],
    [78, "C7"],
    [77, "C4"],
    [76, "C2"],
    [75, "BF"],
    [74, "BD"],
    [73, "BA"],
    [72, "B8"],
    [71, "B5"],
    [70, "B3"],
    [69, "B0"],
    [68, "AD"],
    [67, "AB"],
    [66, "A8"],
    [65, "A6"],
    [64, "A3"],
    [63, "A1"],
    [62, "9E"],
    [61, "9C"],
    [60, "99"],
    [59, "96"],
    [58, "94"],
    [57, "91"],
    [56, "8F"],
    [55, "8C"],
    [54, "8A"],
    [53, "87"],
    [52, "85"],
    [51, "82"],
    [50, "80"],
    [49, "7D"],
    [48, "7A"],
    [47, "78"],
    [46, "75"],
    [45, "73"],
    [44, "70"],
    [43, "6E"],
    [42, "6B"],
    [41, "69"],
    [40, "66"],
    [39, "63"],
    [38, "61"],
    [37, "5E"],
    [36, "5C"],
    [35, "59"],
    [34, "57"],
    [33, "54"],
    [32, "52"],
    [31, "4F"],
    [30, "4D"],
    [29, "4A"],
    [28, "47"],
    [27, "45"],
    [26, "42"],
    [25, "40"],
    [24, "3D"],
    [23, "3B"],
    [22, "38"],
    [21, "36"],
    [20, "33"],
    [19, "30"],
    [18, "2E"],
    [17, "2B"],
    [16, "29"],
    [15, "26"],
    [14, "24"],
    [13, "21"],
    [12, "1F"],
    [11, "1C"],
    [10, "1A"],
    [9, "17"],
    [8, "14"],
    [7, "12"],
    [6, "0F"],
    [5, "0D"],
    [4, "0A"],
    [3, "08"],
    [2, "05"],
    [1, "03"],
    [0, "00"]
]);