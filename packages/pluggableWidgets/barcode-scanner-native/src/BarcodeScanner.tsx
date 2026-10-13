import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { ValueStatus } from "mendix";
import { ReactElement, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, LayoutChangeEvent, Platform } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import {
    useBarcodeScannerOutput,
    type Barcode,
    type TargetBarcodeFormat
} from "react-native-vision-camera-barcode-scanner";
import BarcodeMask from "./components/BarcodeMask";

import { BarcodeScannerProps } from "../typings/BarcodeScannerProps";
import { BarcodeScannerStyle, defaultBarcodeScannerStyle } from "./ui/styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = BarcodeScannerProps<BarcodeScannerStyle>;

// ML Kit on Android can misread 1D barcodes (e.g. Code 39) on busy backgrounds for a single frame,
// so a value is only accepted after it is detected on this many consecutive reads.
const REQUIRED_CONSECUTIVE_READS_ANDROID = 3;
const SCAN_LOCK_DURATION_MS = 2000;

const BARCODE_FORMATS: TargetBarcodeFormat[] = [
    "qr-code",
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
];

type Size = { width: number; height: number };

type CodePositionInfo = {
    isWithinMask: boolean;
    distanceToMaskCenterSquared: number;
    overlapArea: number;
    overlapPercentage: number;
};

type TransformedCoordinates = {
    codeX: number;
    codeY: number;
    codeWidth: number;
    codeHeight: number;
};

type OverlapInfo = {
    overlapArea: number;
    overlapPercentage: number;
};

type CandidateCode = {
    barcode: Barcode;
    isWithinMask: boolean;
    distanceToMaskCenterSquared: number;
    overlapArea: number;
    overlapPercentage: number;
};

/**
 * Transforms barcode coordinates from scanner buffer space to screen view space.
 * Handles platform-specific coordinate systems:
 * - iOS: Barcode coordinates are in sensor's native landscape space, need 90° rotation for portrait
 * - Android: ML Kit already rotates coordinates to match device orientation
 */
function transformCodeCoordinates(
    boundingBox: Barcode["boundingBox"],
    bufferResolution: Size,
    viewWidth: number,
    viewHeight: number
): TransformedCoordinates {
    const frameWidth = bufferResolution.width;
    const frameHeight = bufferResolution.height;
    const isPortrait = viewHeight > viewWidth;

    const left = boundingBox.left;
    const top = boundingBox.top;
    const right = boundingBox.right;
    const bottom = boundingBox.bottom;
    const codeFrameWidth = right - left;
    const codeFrameHeight = bottom - top;

    let codeX: number;
    let codeY: number;
    let codeWidth: number;
    let codeHeight: number;

    if (isPortrait && Platform.OS === "ios") {
        // iOS: barcode coordinates are in the sensor's native landscape space,
        // so we need a 90° rotation to map to portrait view coordinates.
        const scaleX = viewWidth / frameHeight;
        const scaleY = viewHeight / frameWidth;

        codeX = (frameHeight - top - codeFrameHeight) * scaleX;
        codeY = left * scaleY;
        codeWidth = codeFrameHeight * scaleX;
        codeHeight = codeFrameWidth * scaleY;
    } else if (isPortrait && Platform.OS === "android") {
        // Android: ML Kit already rotates barcode coordinates to match device orientation,
        // but buffer resolution still reports sensor landscape dimensions (e.g. 1920x1080).
        // Scale using the shorter dimension for X and longer for Y.
        const scaleX = viewWidth / Math.min(frameWidth, frameHeight);
        const scaleY = viewHeight / Math.max(frameWidth, frameHeight);

        codeX = left * scaleX;
        codeY = top * scaleY;
        codeWidth = codeFrameWidth * scaleX;
        codeHeight = codeFrameHeight * scaleY;
    } else {
        const scaleX = viewWidth / frameWidth;
        const scaleY = viewHeight / frameHeight;

        codeX = left * scaleX;
        codeY = top * scaleY;
        codeWidth = codeFrameWidth * scaleX;
        codeHeight = codeFrameHeight * scaleY;
    }

    return { codeX, codeY, codeWidth, codeHeight };
}

/**
 * Calculates the overlap between a barcode and the mask region.
 * Returns both the absolute overlap area and the percentage of the barcode that overlaps with the mask.
 */
function calculateOverlap(
    codeX: number,
    codeY: number,
    codeWidth: number,
    codeHeight: number,
    maskX: number,
    maskY: number,
    maskWidth: number,
    maskHeight: number
): OverlapInfo {
    const overlapLeft = Math.max(codeX, maskX);
    const overlapTop = Math.max(codeY, maskY);
    const overlapRight = Math.min(codeX + codeWidth, maskX + maskWidth);
    const overlapBottom = Math.min(codeY + codeHeight, maskY + maskHeight);

    const overlapWidth = Math.max(0, overlapRight - overlapLeft);
    const overlapHeight = Math.max(0, overlapBottom - overlapTop);

    const overlapArea = overlapWidth * overlapHeight;
    const barcodeArea = codeWidth * codeHeight;
    const overlapPercentage = barcodeArea > 0 ? overlapArea / barcodeArea : 0;

    return { overlapArea, overlapPercentage };
}

/**
 * Comparator function to select the best barcode when multiple codes are detected.
 * Priority: overlap percentage > overlap area > distance to mask center (squared).
 */
function compareCodesByPriority(a: CandidateCode, b: CandidateCode): number {
    if (b.overlapPercentage !== a.overlapPercentage) {
        return b.overlapPercentage - a.overlapPercentage;
    }

    if (b.overlapArea !== a.overlapArea) {
        return b.overlapArea - a.overlapArea;
    }

    return a.distanceToMaskCenterSquared - b.distanceToMaskCenterSquared;
}

export function BarcodeScanner(props: Props): ReactElement {
    const device = useCameraDevice("back");
    const [cameraViewDimensions, setCameraViewDimensions] = useState<Size | null>(null);

    const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();

    // VisionCamera v5 no longer prompts implicitly when the session starts; it throws without permission
    useEffect(() => {
        if (canRequestPermission) {
            requestPermission();
        }
    }, [canRequestPermission, requestPermission]);

    const styles = useMemo(() => flattenStyles(defaultBarcodeScannerStyle, props.style), [props.style]);

    // Ref to track the lock state
    const isLockedRef = useRef(false);
    // Timer that releases the lock, kept so it can be cleared when the widget unmounts
    const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Time from which detected codes may be accepted, null until the camera is started
    const scanStartTimeRef = useRef<number | null>(null);

    // Last detected value and how many consecutive reads returned it
    const lastReadValueRef = useRef<string | null>(null);
    const consecutiveReadsRef = useRef(0);

    // Starts a new scan: codes are accepted again after the configured scan delay,
    // and the consecutive read count starts from zero
    const resetScanState = useCallback(() => {
        scanStartTimeRef.current = Date.now() + props.scanDelay * 1000;
        lastReadValueRef.current = null;
        consecutiveReadsRef.current = 0;
    }, [props.scanDelay]);

    // Clear a pending lock timer when the widget unmounts
    useEffect(() => {
        return () => {
            if (lockTimeoutRef.current) {
                clearTimeout(lockTimeoutRef.current);
            }
        };
    }, []);

    const maskWidth = styles.mask.width || 280;
    const maskHeight = styles.mask.height || 260;

    const getCodePositionInfo = useCallback(
        (barcode: Barcode, bufferResolution: Size | undefined): CodePositionInfo => {
            if (!props.showMask) {
                return {
                    isWithinMask: true,
                    distanceToMaskCenterSquared: 0,
                    overlapArea: Number.MAX_SAFE_INTEGER,
                    overlapPercentage: 1
                };
            }

            if (!cameraViewDimensions || !bufferResolution) {
                return {
                    isWithinMask: false,
                    distanceToMaskCenterSquared: Number.MAX_SAFE_INTEGER,
                    overlapArea: 0,
                    overlapPercentage: 0
                };
            }

            const { width: viewWidth, height: viewHeight } = cameraViewDimensions;

            // Barcode mask coordinates in view space
            const maskX = (viewWidth - maskWidth) / 2;
            const maskY = (viewHeight - maskHeight) / 2;
            const maskCenterX = maskX + maskWidth / 2;
            const maskCenterY = maskY + maskHeight / 2;

            const { codeX, codeY, codeWidth, codeHeight } = transformCodeCoordinates(
                barcode.boundingBox,
                bufferResolution,
                viewWidth,
                viewHeight
            );

            const codeCenterX = codeX + codeWidth / 2;
            const codeCenterY = codeY + codeHeight / 2;

            const distanceToMaskCenterSquared =
                Math.pow(codeCenterX - maskCenterX, 2) + Math.pow(codeCenterY - maskCenterY, 2);

            const { overlapArea, overlapPercentage } = calculateOverlap(
                codeX,
                codeY,
                codeWidth,
                codeHeight,
                maskX,
                maskY,
                maskWidth,
                maskHeight
            );

            const isWithinMask =
                codeCenterX >= maskX &&
                codeCenterX <= maskX + maskWidth &&
                codeCenterY >= maskY &&
                codeCenterY <= maskY + maskHeight;

            return {
                isWithinMask,
                distanceToMaskCenterSquared,
                overlapArea,
                overlapPercentage
            };
        },
        [props.showMask, cameraViewDimensions, maskWidth, maskHeight]
    );

    // Read inside the scan callback to get the buffer resolution the scanner is actually using
    const scannerOutputRef = useRef<ReturnType<typeof useBarcodeScannerOutput> | null>(null);

    const onBarcodeScanned = useCallback(
        (barcodes: Barcode[]) => {
            // Block if still in cooldown or the previous detection is still being handled
            if (isLockedRef.current || props.onDetect?.isExecuting) {
                return;
            }

            // Block until the camera is started and the scan delay has passed
            if (scanStartTimeRef.current === null || Date.now() < scanStartTimeRef.current) {
                return;
            }

            if (props.barcode.status !== ValueStatus.Available || barcodes.length === 0) {
                return;
            }

            const bufferResolution = scannerOutputRef.current?.currentResolution;

            const candidates = barcodes
                .map(barcode => ({
                    barcode,
                    ...getCodePositionInfo(barcode, bufferResolution)
                }))
                .filter(item => item.isWithinMask);

            if (candidates.length === 0) {
                return;
            }

            const value = candidates.sort(compareCodesByPriority)[0].barcode.rawValue;

            if (!value) {
                return;
            }

            // Android only: accept the value after it was read on several consecutive reads,
            // a different value restarts the count
            if (Platform.OS === "android") {
                if (value === lastReadValueRef.current) {
                    consecutiveReadsRef.current += 1;
                } else {
                    lastReadValueRef.current = value;
                    consecutiveReadsRef.current = 1;
                }

                if (consecutiveReadsRef.current < REQUIRED_CONSECUTIVE_READS_ANDROID) {
                    return;
                }
            }

            if (value !== props.barcode.value) {
                props.barcode.setValue(value);
            }

            executeAction(props.onDetect);

            // Lock further scans for 2 seconds
            isLockedRef.current = true;
            setTimeout(() => {
                isLockedRef.current = false;
            }, SCAN_LOCK_DURATION_MS);
        },
        [props.barcode, props.onDetect, getCodePositionInfo]
    );

    const onScanError = useCallback((error: Error) => {
        console.warn("Barcode scanner error:", error);
    }, []);

    const scannerOutput = useBarcodeScannerOutput({
        barcodeFormats: BARCODE_FORMATS,
        // Full resolution so dense/patterned QR codes can be decoded
        outputResolution: "full",
        onBarcodeScanned,
        onError: onScanError
    });
    scannerOutputRef.current = scannerOutput;

    // The camera is ready, start the scan delay from now
    const handleCameraStarted = useCallback(() => {
        resetScanState();
    }, [resetScanState]);

    const handleCameraLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setCameraViewDimensions({ width, height });
    }, []);

    return (
        <View testID={props.name} style={styles.container}>
            {device && hasPermission && (
                <>
                    <Camera
                        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                        isActive
                        device={device}
                        outputs={[scannerOutput]}
                        onStarted={handleCameraStarted}
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
