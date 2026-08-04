import { Style } from "@mendix/piw-native-utils-internal";
import { StyleSheet, ViewStyle } from "react-native";

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
        backgroundColor: "rgba(0, 0, 0, 0.6)"
    }
};

export const barcodeMaskStyles = StyleSheet.create({
    container: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        position: "absolute",
        height: "100%",
        width: "100%"
    },
    maskCenter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around"
    },
    mask: {
        position: "relative",
        maxHeight: "100%",
        maxWidth: "100%",
        zIndex: 99
    },
    svg: {
        position: "absolute",
        top: 0,
        left: 0
    }
});
