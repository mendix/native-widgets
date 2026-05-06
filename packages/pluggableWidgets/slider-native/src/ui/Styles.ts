import { Style } from "@mendix/piw-native-utils-internal";
import { Platform, TextStyle, ViewStyle } from "react-native";

export interface SliderStyle extends Style {
    container: ViewStyle;
    track: ViewStyle;
    trackDisabled: ViewStyle;
    minimumTrack: ViewStyle;
    minimumTrackDisabled: ViewStyle;
    maximumTrack: ViewStyle;
    maximumTrackDisabled: ViewStyle;
    thumb: ViewStyle;
    thumbActive: ViewStyle;
    thumbDisabled: ViewStyle;
    validationMessage: TextStyle;
}

const blue = "rgb(0,122,255)";
const blueLighter = "rgba(0,122,255,0.3)";
const purple = "rgb(98,0,238)";
const purpleLighter = "rgba(98,0,238, 0.3)";
const purpleLightest = "rgba(98,0,238, 0.1)";

export const defaultSliderStyle: SliderStyle = {
    container: {},
    track: {
        height: 4,
        borderRadius: 2
    },
    trackDisabled: {
        height: 4,
        borderRadius: 2,
        ...Platform.select({
            ios: { opacity: 0.4 },
            android: {}
        })
    },
    minimumTrack: {
        backgroundColor: Platform.select({ ios: blue, android: purple })
    },
    minimumTrackDisabled: {
        backgroundColor: Platform.select({ ios: blue, android: "#AAA" })
    },
    maximumTrack: {
        backgroundColor: Platform.select({ ios: blueLighter, android: purpleLighter })
    },
    maximumTrackDisabled: {
        ...Platform.select({
            ios: { backgroundColor: blueLighter },
            android: { backgroundColor: "#EEE" }
        })
    },
    thumb: {
        ...Platform.select({
            ios: {
                height: 30,
                width: 30,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: "#DDDDDD",
                backgroundColor: "#FFFFFF",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 1,
                shadowOpacity: 0.2
            },
            android: {
                height: 12,
                width: 12,
                borderRadius: 12,
                backgroundColor: purple
            }
        })
    },
    thumbActive: {
        ...Platform.select({
            android: {
                height: 20,
                width: 20,
                borderRadius: 20,
                borderWidth: 5,
                borderColor: purpleLightest,
                backgroundColor: purple
            }
        })
    },
    thumbDisabled: {
        ...Platform.select({
            ios: {
                backgroundColor: "#FFF",
                shadowOpacity: 0.1,
                borderColor: "rgba(221,221,221,0.6)"
            },
            android: {
                elevation: 0,
                backgroundColor: "#AAA"
            }
        })
    },
    validationMessage: {
        color: "#ed1c24"
    }
};
