import { ValueStatus, DynamicValue, NativeIcon, NativeImage } from "mendix";
import { Dispatch, SetStateAction } from "react";
import { Image as RNImage, ImageURISource, Platform } from "react-native";
import { DatasourceEnum } from "../../typings/ImageProps";
import { DimensionsType } from "../components/ImageIconSVG";
import { calculateSvgDimensions } from "./svgUtils";
export declare interface GlyphIcon {
    readonly type: "glyph";
    readonly iconClass: string;
}
export declare interface NativeImageIcon {
    readonly type: "image";
    readonly iconUrl: Readonly<ImageURISource | string>;
}

export type CustomImageProps = ImageURISource | GlyphIcon | NativeImageIcon | number | string | undefined;
export declare interface CustomImageObjectProps {
    type: string | undefined;
    image: CustomImageProps;
}

function getBundledAssetSource(value: NativeImage | Readonly<ImageURISource | string> | undefined): number | undefined {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "object" && value && "uri" in value && typeof value.uri === "number") {
        return value.uri;
    }

    return undefined;
}

export async function convertImageProps(
    datasource: DatasourceEnum,
    imageIcon: DynamicValue<NativeIcon> | undefined,
    imageObject: DynamicValue<NativeImage> | undefined,
    imageUrl: DynamicValue<string> | undefined,
    defaultImageDynamic: DynamicValue<NativeImage> | undefined
): Promise<CustomImageObjectProps> {
    const fallback: CustomImageObjectProps = {
        type: undefined,
        image: undefined
    };
    switch (datasource) {
        case "image": {
            const imageSource =
                imageObject?.status === ValueStatus.Available
                    ? imageObject
                    : imageObject?.status === ValueStatus.Unavailable &&
                      defaultImageDynamic?.status === ValueStatus.Available
                    ? defaultImageDynamic
                    : null;

            if (!imageSource) {
                return fallback;
            }

            const imageValue = imageSource.value;
            const bundledAssetSource = getBundledAssetSource(imageValue);

            if (bundledAssetSource) {
                return {
                    type: "staticImage",
                    image: bundledAssetSource
                };
            }

            if (typeof imageValue === "string") {
                return {
                    type: "staticSVG", // Static image SVG
                    image: imageValue
                };
            } else if (typeof imageValue === "object" && imageValue?.uri && imageValue?.name?.endsWith(".svg")) {
                return {
                    type: "dynamicSVG", // Dynamic image SVG
                    image: (Platform.OS === "android" ? "file:///" : "") + imageValue.uri
                };
            } else if (typeof imageValue === "object" && imageValue?.uri) {
                return {
                    type: "dynamicImage", // Dynamic image
                    image: {
                        ...imageValue,
                        uri: (Platform.OS === "android" ? "file:///" : "") + imageValue.uri
                    }
                };
            }
            return fallback;
        }
        case "imageUrl":
            if (imageUrl?.status === ValueStatus.Available) {
                if (imageUrl.value?.endsWith(".svg")) {
                    return {
                        type: "staticSVG",
                        image: await (await fetch(imageUrl.value as string)).text()
                    };
                }
                return {
                    type: "dynamicImage",
                    image: { uri: imageUrl.value }
                };
            }
            return fallback;
        case "icon": {
            if (imageIcon?.status === ValueStatus.Available) {
                if (imageIcon.value?.type === "glyph") {
                    return {
                        type: "icon",
                        image: imageIcon.value
                    };
                }
                if (imageIcon.value?.type === "image") {
                    const bundledAssetSource = getBundledAssetSource(imageIcon.value.iconUrl);

                    return {
                        type: "staticImage",
                        image: bundledAssetSource ?? imageIcon.value.iconUrl
                    };
                }
            }
            return fallback;
        }
        default:
            return fallback;
    }
}

export function getImageDimensions(source: CustomImageObjectProps): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        switch (source?.type) {
            case "staticImage": {
                const resolvedAssetSource = RNImage.resolveAssetSource(source?.image as ImageURISource | number);
                const width = resolvedAssetSource?.width ?? 0;
                const height = resolvedAssetSource?.height ?? 0;

                resolve({
                    width,
                    height
                });
                break;
            }
            case "dynamicImage":
                const uri = (source?.image as ImageURISource)?.uri as string;
                if (uri) {
                    RNImage.getSize(
                        uri,
                        (width, height) => {
                            resolve({ width, height });
                        },
                        reject
                    );
                } else {
                    resolve({ width: 0, height: 0 });
                }
                break;
            case "staticSVG":
                resolve(calculateSvgDimensions(source.image as string));
                break;
            case "dynamicSVG":
                resolve({ width: 0, height: 0 });
                break;
            default:
                resolve({ width: 0, height: 0 });
                break;
        }
    });
}

export function onLayoutSetDimensions(
    width: number,
    height: number,
    setDimensions: Dispatch<SetStateAction<DimensionsType | undefined>>,
    initialDimensions?: DimensionsType
): void {
    const optimumDimensions = getScaledDimensions(width, height, initialDimensions);
    if (optimumDimensions) {
        setDimensions(optimumDimensions);
    }
}

export function getScaledDimensions(
    width: number,
    height: number,
    initialDimensions?: DimensionsType
): DimensionsType | undefined {
    if (initialDimensions?.width && initialDimensions?.height) {
        let newWidth;
        let newHeight;
        const heightScale = height ? height / initialDimensions.height : 1;
        const widthScale = width ? width / initialDimensions.width : 1;

        if (widthScale < heightScale) {
            newWidth = widthScale < 1 ? width : initialDimensions.width;
            newHeight = widthScale < 1 ? initialDimensions.height * widthScale : initialDimensions.height;
        } else if (widthScale > heightScale) {
            newWidth = heightScale < 1 ? initialDimensions.width * heightScale : initialDimensions.width;
            newHeight = heightScale < 1 ? height : initialDimensions.height;
        } else {
            // If scales are equal
            newWidth = widthScale < 1 ? initialDimensions.width * widthScale : initialDimensions.width;
            newHeight = heightScale < 1 ? initialDimensions.height * heightScale : initialDimensions.height;
        }

        return {
            width: newWidth,
            height: newHeight
        };
    }
}
