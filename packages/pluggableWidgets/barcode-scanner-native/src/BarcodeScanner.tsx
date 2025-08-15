import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { ValueStatus } from "mendix";
import { createElement, ReactElement, useMemo } from "react";
import { View } from "react-native";
import { Camera, useCodeScanner, Code, useCameraDevice } from "react-native-vision-camera";
import BarcodeMask from "react-native-barcode-mask";

import { BarcodeScannerProps } from "../typings/BarcodeScannerProps";
import { BarcodeScannerStyle, defaultBarcodeScannerStyle } from "./ui/styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = BarcodeScannerProps<BarcodeScannerStyle>;

export function BarcodeScanner(props: Props): ReactElement {
    const device = useCameraDevice("back");

    const styles = useMemo(() => flattenStyles(defaultBarcodeScannerStyle, props.style), [props.style]);

    const codeScanner = useCodeScanner({
        codeTypes: ["ean-13", "qr", "aztec", "codabar", "code-128", "data-matrix"],
        onCodeScanned: (codes: Code[]) => {
            if (props.barcode.status !== ValueStatus.Available || codes.length === 0 || !codes[0].value) {
                return;
            }
            const { value } = codes[0];

            if (value !== props.barcode.value) {
                props.barcode.setValue(value);
            }
            executeAction(props.onDetect);
        }
    });

    return (
        <View style={styles.container}>
            {device && (
                <Camera
                    testID={props.name}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                    audio={false}
                    isActive
                    device={device}
                    codeScanner={codeScanner}
                >
                    {props.showMask && (
                        <BarcodeMask
                            edgeColor={styles.mask.color}
                            width={styles.mask.width}
                            height={styles.mask.height}
                            backgroundColor={styles.mask.backgroundColor}
                            showAnimatedLine={props.showAnimatedLine}
                        />
                    )}
                </Camera>
            )}
        </View>
    );
}
