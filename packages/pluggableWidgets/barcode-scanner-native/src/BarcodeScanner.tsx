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

type CodePositionInfo = {
    isWithinMask: boolean;
    distanceToMaskCenter: number;
};

export function BarcodeScanner(props: Props): ReactElement {
    const device = useCameraDevice("back");

    const styles = useMemo(() => flattenStyles(defaultBarcodeScannerStyle, props.style), [props.style]);

    // Ref to track the lock state
    const isLockedRef = useRef(false);

    // State to track camera view dimensions
    const [cameraViewDimensions, setCameraViewDimensions] = useState<{ width: number; height: number } | null>(null);

    // Mask dimensions - should match the BarcodeMask component props
    const maskWidth = styles.mask.width || 280;
    const maskHeight = styles.mask.height || 260;

    /**
     * Calculates:
     * - Whether the code center lies inside the mask
     * - Distance of the code center from the mask center
     */
    const getCodePositionInfo = useCallback(
        (code: Code, scanFrame: CodeScannerFrame): CodePositionInfo => {
            // Preserve existing behavior:
            // If mask is hidden, allow all codes.
            if (!props.showMask) {
                return {
                    isWithinMask: true,
                    distanceToMaskCenter: 0
                };
            }

            // Preserve existing behavior:
            // If layout/frame data is unavailable, allow the code.
            if (!cameraViewDimensions || !code.frame) {
                return {
                    isWithinMask: true,
                    distanceToMaskCenter: Number.MAX_SAFE_INTEGER
                };
            }

            const { width: viewWidth, height: viewHeight } = cameraViewDimensions;
            const { width: frameWidth, height: frameHeight } = scanFrame;

            // Mask position (centered in camera view)
            const maskX = (viewWidth - maskWidth) / 2;
            const maskY = (viewHeight - maskHeight) / 2;

            const maskCenterX = maskX + maskWidth / 2;
            const maskCenterY = maskY + maskHeight / 2;

            // Scale factor from scanner frame space to view space
            const scaleX = viewWidth / frameWidth;
            const scaleY = viewHeight / frameHeight;

            // Convert code frame coordinates into view coordinates
            const codeX = code.frame.x * scaleX;
            const codeY = code.frame.y * scaleY;
            const codeWidth = code.frame.width * scaleX;
            const codeHeight = code.frame.height * scaleY;

            // Code center
            const codeCenterX = codeX + codeWidth / 2;
            const codeCenterY = codeY + codeHeight / 2;

            const isWithinMask =
                codeCenterX >= maskX &&
                codeCenterX <= maskX + maskWidth &&
                codeCenterY >= maskY &&
                codeCenterY <= maskY + maskHeight;

            // Squared distance (no need for Math.sqrt since we only compare values)
            const distanceToMaskCenter =
                Math.pow(codeCenterX - maskCenterX, 2) + Math.pow(codeCenterY - maskCenterY, 2);

            return {
                isWithinMask,
                distanceToMaskCenter
            };
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

            const candidates = codes
                .map(code => ({
                    code,
                    ...getCodePositionInfo(code, frame)
                }))
                .filter(item => item.isWithinMask);

            if (candidates.length === 0) {
                return;
            }

            // Prefer the code closest to the center of the mask
            const selectedCode = candidates.sort((a, b) => a.distanceToMaskCenter - b.distanceToMaskCenter)[0].code;

            if (!selectedCode.value) {
                return;
            }

            const { value } = selectedCode;

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
        [props.barcode, props.onDetect, getCodePositionInfo]
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
