import { TextStyle, ViewStyle } from "react-native";

export interface ModalItemsStyle {
    container?: ModalItemContainerStyle;
    defaultStyle?: TextStyle;
    primaryStyle?: TextStyle;
    dangerStyle?: TextStyle;
    customStyle?: TextStyle;
}

export interface ModalItemContainerStyle extends ViewStyle {
    rippleColor?: string;
}

export interface BottomSheetStyle {
    container: ViewStyle;
    containerWhenExpandedFullscreen: ViewStyle;
    modal: ViewStyle;
    modalItems: ModalItemsStyle;
}
