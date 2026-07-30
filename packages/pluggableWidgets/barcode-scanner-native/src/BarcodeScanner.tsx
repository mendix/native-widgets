import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { ValueStatus } from "mendix";
import { ReactElement, useCallback, useMemo, useRef, useState } from "react";
import { View, LayoutChangeEvent } from "react-native";
import { Camera, useCodeScanner, Code, useCameraDevice, CodeScannerFrame } from "react-native-vision-camera";
import BarcodeMask from "@meksiabdou/react-native-barcode-mask";

import { BarcodeScannerProps } from "../typings/BarcodeScannerProps";
import { BarcodeScannerStyle, defaultBarcodeScannerStyle } from "./ui/styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = BarcodeScannerProps<BarcodeScannerStyle>;

export function BarcodeScanner(props: Props): ReactElement {
    const device = useCameraDevice("back");

    const styles = useMemo(() => flattenStyles(defaultBarcodeScannerStyle, props.style), [props.style]);

    // Ref to track the lock state
    const isLockedRef = useRef(false);

    // State to track camera view dimensions
    const [cameraViewDimensions, setCameraViewDimensions] = useState<{ width: number; height: number } | null>(null);

    // Mask dimensions - should match the BarcodeMask component props
    const maskWidth = 200;
    const maskHeight = 200;

    // Helper function to check if a code is within the mask bounds
    const isCodeInMaskBounds = useCallback(
        (code: Code, scanFrame: CodeScannerFrame): boolean => {
            // If mask is not shown, allow all codes
            if (!props.showMask) {
                return true;
            }

            // If we don't have camera view dimensions or code frame, allow it
            if (!cameraViewDimensions || !code.frame) {
                return true;
            }

            const { width: viewWidth, height: viewHeight } = cameraViewDimensions;
            const { width: frameWidth, height: frameHeight } = scanFrame;

            // Calculate the mask position (centered in the view)
            const maskX = (viewWidth - maskWidth) / 2;
            const maskY = (viewHeight - maskHeight) / 2;

            // Scale factor from scan frame to view dimensions
            const scaleX = viewWidth / frameWidth;
            const scaleY = viewHeight / frameHeight;

            // Convert code frame coordinates from scan frame space to view space
            const codeX = code.frame.x * scaleX;
            const codeY = code.frame.y * scaleY;
            const codeWidth = code.frame.width * scaleX;
            const codeHeight = code.frame.height * scaleY;

            // Calculate the center of the code
            const codeCenterX = codeX + codeWidth / 2;
            const codeCenterY = codeY + codeHeight / 2;

            // Check if the center of the code is within the mask bounds
            const isWithinMask =
                codeCenterX >= maskX &&
                codeCenterX <= maskX + maskWidth &&
                codeCenterY >= maskY &&
                codeCenterY <= maskY + maskHeight;

            return isWithinMask;
        },
        [props.showMask, cameraViewDimensions, maskWidth, maskHeight]
    );

    const onCodeScanned = useCallback(
        (codes: Code[], frame: CodeScannerFrame) => {
            // Block if still in cooldown
            if (isLockedRef.current) {
                return;
            }

            if (props.barcode.status !== ValueStatus.Available || codes.length === 0) {
                return;
            }

            // Filter codes to only those within the mask bounds
            const codesInMask = codes.filter(code => isCodeInMaskBounds(code, frame));

            if (codesInMask.length === 0 || !codesInMask[0].value) {
                return;
            }

            const { value } = codesInMask[0];
            if (value !== props.barcode.value) {
                props.barcode.setValue(value);
            }

            executeAction(props.onDetect);

            // Lock further scans for 2 seconds
            isLockedRef.current = true;
            setTimeout(() => {
                isLockedRef.current = false;
            }, 2000);
        },
        [props.barcode, props.onDetect, isCodeInMaskBounds]
    );

    const codeScanner = useCodeScanner({
        codeTypes: [
            "qr",
            "aztec",
            "codabar",
            "code-39",
            "code-93",
            "code-128",
            "data-matrix",
            "ean-13",
            "ean-8",
            "upc-a",
            "upc-e",
            "pdf-417",
            "itf"
        ],
        onCodeScanned
    });

    const handleCameraLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setCameraViewDimensions({ width, height });
    }, []);

    return (
        <View style={styles.container}>
            {device && (
                <>
                    <Camera
                        testID={props.name}
                        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                        audio={false}
                        isActive
                        device={device}
                        codeScanner={codeScanner}
                        onLayout={handleCameraLayout}
                    />
                    {props.showMask && (
                        <BarcodeMask
                            edgeColor={styles.mask.color}
                            width={maskWidth}
                            height={maskHeight}
                            backgroundColor={styles.mask.backgroundColor}
                            showAnimatedLine={props.showAnimatedLine}
                        />
                    )}
                </>
            )}
        </View>
    );
}
