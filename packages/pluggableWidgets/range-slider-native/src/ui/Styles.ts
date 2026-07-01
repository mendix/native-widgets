import { Style } from "@mendix/piw-native-utils-internal";
import { TextStyle, ViewStyle } from "react-native";

export interface RangeSliderStyle extends Style {
    container: ViewStyle;
    track: ViewStyle;
    trackDisabled: ViewStyle;
    highlight: ViewStyle;
    highlightDisabled: ViewStyle;
    marker: ViewStyle;
    markerActive: ViewStyle;
    markerDisabled: ViewStyle;
    validationMessage: TextStyle;
}

const blue = "rgb(30, 76, 231)";

const trackBase: ViewStyle = {
    height: 4,
    borderRadius: 2
};

const thumbBase: ViewStyle = {
    height: 30,
    width: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 1,
    shadowOpacity: 0.2,
    elevation: 3
};

export const defaultRangeSliderStyle: RangeSliderStyle = {
    container: {},
    track: trackBase,
    trackDisabled: { ...trackBase, opacity: 0.4 },
    highlight: { backgroundColor: blue },
    highlightDisabled: { backgroundColor: blue },
    marker: thumbBase,
    markerActive: { ...thumbBase, backgroundColor: blue },
    markerDisabled: thumbBase,
    validationMessage: { color: "#ed1c24" }
};
