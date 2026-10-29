import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { ValueStatus } from "mendix";
import { ReactElement, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, LayoutChangeEvent, Platform } from "react-native";
import { Camera, useCameraDevice, useCameraPermission, type CameraRef } from "react-native-vision-camera";
import BarcodeMask from "./components/BarcodeMask";
import { DetectedCode, Size, UseScannerOutput } from "./scanners/types";
import { useIosScannerOutput } from "./scanners/useIosScannerOutput";

import { BarcodeScannerProps } from "../typings/BarcodeScannerProps";
import { BarcodeScannerStyle, defaultBarcodeScannerStyle } from "./ui/styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = BarcodeScannerProps<BarcodeScannerStyle>;

// ML Kit on Android can misread 1D barcodes (e.g. Code 39) on busy backgrounds for a single frame,
// so a value is only accepted after it is detected on this many consecutive reads.
const REQUIRED_CONSECUTIVE_READS_ANDROID = 3;
const SCAN_LOCK_DURATION_MS = 2000;

// iOS uses Apple's scanner from vision-camera core, Android uses Google ML Kit. The Android scanner package isn't
// linked on iOS and fails when loaded, so it is only required on Android. Keep this require directly behind the
// Platform.OS check: the widget build replaces Platform.OS per platform and drops the require from the iOS bundle.
const useScannerOutput: UseScannerOutput =
    Platform.OS === "android"
        ? require("./scanners/useAndroidScannerOutput").useAndroidScannerOutput
        : useIosScannerOutput;

type CodePositionInfo = {
    isWithinMask: boolean;
    distanceToMaskCenterSquared: number;
    overlapArea: number;
    overlapPercentage: number;
};

type OverlapInfo = {
    overlapArea: number;
    overlapPercentage: number;
};

type CandidateCode = {
    code: DetectedCode;
    isWithinMask: boolean;
    distanceToMaskCenterSquared: number;
    overlapArea: number;
    overlapPercentage: number;
};

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
    const cameraRef = useRef<CameraRef>(null);

    const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();

    // VisionCamera v5 no longer prompts implicitly when the session starts; it throws without permission
    useEffect(() => {
        if (!hasPermission && canRequestPermission) {
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

    // Resets the consecutive read counter (Android only)
    const resetConsecutiveReads = useCallback(() => {
        lastReadValueRef.current = null;
        consecutiveReadsRef.current = 0;
    }, []);

    // Starts a new scan: codes are accepted again after the configured scan delay,
    // and the consecutive read count starts from zero
    const resetScanState = useCallback(() => {
        scanStartTimeRef.current = Date.now() + props.scanDelay * 1000;
        resetConsecutiveReads();
    }, [props.scanDelay, resetConsecutiveReads]);

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
        (code: DetectedCode): CodePositionInfo => {
            if (!props.showMask) {
                return {
                    isWithinMask: true,
                    distanceToMaskCenterSquared: 0,
                    overlapArea: Number.MAX_SAFE_INTEGER,
                    overlapPercentage: 1
                };
            }

            const bounds = cameraViewDimensions ? code.getViewBounds() : undefined;
            if (!cameraViewDimensions || !bounds) {
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

            const { x: codeX, y: codeY, width: codeWidth, height: codeHeight } = bounds;

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

    const onCodesScanned = useCallback(
        (codes: DetectedCode[]) => {
            // Block if still in cooldown or the previous detection is still being handled
            if (isLockedRef.current || props.onDetect?.isExecuting) {
                return;
            }

            // Block until the camera is started and the scan delay has passed
            if (scanStartTimeRef.current === null || Date.now() < scanStartTimeRef.current) {
                return;
            }

            if (props.barcode.status !== ValueStatus.Available || codes.length === 0) {
                resetConsecutiveReads();
                return;
            }

            const candidates = codes
                .map(code => ({
                    code,
                    ...getCodePositionInfo(code)
                }))
                .filter(item => item.isWithinMask);

            if (candidates.length === 0) {
                resetConsecutiveReads();
                return;
            }

            const value = candidates.sort(compareCodesByPriority)[0].code.value;

            if (!value) {
                resetConsecutiveReads();
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

            // Reset consecutive reads counter after accepting a detection
            resetConsecutiveReads();

            // Lock further scans for 2 seconds
            isLockedRef.current = true;
            lockTimeoutRef.current = setTimeout(() => {
                isLockedRef.current = false;
            }, SCAN_LOCK_DURATION_MS);
        },
        [props.barcode, props.onDetect, getCodePositionInfo, resetConsecutiveReads]
    );

    const scannerOutput = useScannerOutput({ onCodesScanned, cameraRef, cameraViewDimensions });

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
                        ref={cameraRef}
                        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                        isActive
                        device={device}
                        outputs={scannerOutput.outputs}
                        constraints={scannerOutput.constraints}
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
