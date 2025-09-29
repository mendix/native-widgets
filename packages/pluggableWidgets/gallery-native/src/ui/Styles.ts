import { ColorValue, TextStyle, ViewStyle } from "react-native";

export interface TouchableStyleProps {
    rippleColor?: ColorValue;
    borderless?: boolean;
    radius?: number;
    foreground?: boolean;
}

export interface TouchableStyle extends ViewStyle, TouchableStyleProps {}

export interface GalleryStyle {
    container?: ViewStyle;
    emptyPlaceholder?: ViewStyle;
    firstItem?: ViewStyle;
    lastItem?: ViewStyle;
    listContainer?: ViewStyle;
    list?: ViewStyle;
    listItem?: ViewStyle;
    loadMoreButtonContainer?: ViewStyle;
    loadMoreButtonPressableContainer?: TouchableStyle;
    loadMoreButtonCaption?: TextStyle;
}

export const defaultGalleryStyle: GalleryStyle = {
    listItem: { flexGrow: 1 },
    loadMoreButtonContainer: {
        alignSelf: "stretch"
    },
    loadMoreButtonPressableContainer: {
        borderWidth: 1,
        borderStyle: "solid",
        rippleColor: "rgba(0, 0, 0, 0.2)",
        borderColor: "#264AE5",
        backgroundColor: "#264AE5",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,

        minWidth: 48,
        minHeight: 48,
        paddingVertical: 8,
        paddingHorizontal: 8
    },
    loadMoreButtonCaption: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
        lineHeight: 14
    },
    listContainer: {
        paddingBottom: 250
    }
};
