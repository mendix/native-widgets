import { Style } from "@mendix/piw-native-utils-internal";
import { ViewStyle } from "react-native";

export interface BarcodeScannerStyle extends Style {
    container: ViewStyle;
    mask: {
        color?: string;
        width?: number;
        height?: number;
        backgroundColor?: string;
    };
}

export const defaultBarcodeScannerStyle: BarcodeScannerStyle = {
    container: {
        flex: 1,
        minHeight: 100,
        flexDirection: "column"
    },
    mask: {
        color: "#62B1F6",
        width: 200,
        height: 200,
        backgroundColor: "rgba(0, 0, 0, 0.6)"
    },
    cameraWrapper: {
        flex: 1,
        position: "relative"
    },
    camera: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    flashToggle: {
        position: "absolute",
        alignSelf: "center",
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center"
    }
};
