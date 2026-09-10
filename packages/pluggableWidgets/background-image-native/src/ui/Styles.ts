import { ViewStyle, ImageStyle } from "react-native";
import { Style } from "@mendix/piw-native-utils-internal";

interface CustomImageStyle extends ImageStyle {
    svgColor?: string;
}

export interface BackgroundImageStyle extends Style {
    container: ViewStyle;
    image: CustomImageStyle;
}

export const defaultBackgroundImageStyle: BackgroundImageStyle = {
    container: {},
    image: {}
};

export const NO_CONTENT_CONTAINER_STYLE = { flexGrow: 1, flexShrink: 1, flexBasis: "auto" as const };
