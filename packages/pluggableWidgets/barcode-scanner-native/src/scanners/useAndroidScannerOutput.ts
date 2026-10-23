// Android only: react-native-vision-camera-barcode-scanner (Google ML Kit) creates its native object when it is
// loaded and isn't linked on iOS, so this file must only be required behind a Platform.OS === "android" check.
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CameraOutput } from "react-native-vision-camera";
import {
    useBarcodeScannerOutput,
    type Barcode,
    type TargetBarcodeFormat
} from "react-native-vision-camera-barcode-scanner";

import { DetectedCode, ScannerOutput, ScannerOutputOptions, Size, ViewBounds } from "./types";

// Kept as a module constant because the scanner output is recreated whenever this array changes.
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

/**
 * Transforms barcode coordinates from scanner buffer space to screen view space.
 * ML Kit already rotates coordinates to match device orientation.
 */
function toViewBounds(boundingBox: Barcode["boundingBox"], bufferResolution: Size, viewSize: Size): ViewBounds {
    const frameWidth = bufferResolution.width;
    const frameHeight = bufferResolution.height;
    const { width: viewWidth, height: viewHeight } = viewSize;
    const isPortrait = viewHeight > viewWidth;

    const codeFrameWidth = boundingBox.right - boundingBox.left;
    const codeFrameHeight = boundingBox.bottom - boundingBox.top;

    // Buffer resolution still reports sensor landscape dimensions (e.g. 1920x1080) in portrait,
    // so scale using the shorter dimension for X and longer for Y.
    const scaleX = isPortrait ? viewWidth / Math.min(frameWidth, frameHeight) : viewWidth / frameWidth;
    const scaleY = isPortrait ? viewHeight / Math.max(frameWidth, frameHeight) : viewHeight / frameHeight;

    return {
        x: boundingBox.left * scaleX,
        y: boundingBox.top * scaleY,
        width: codeFrameWidth * scaleX,
        height: codeFrameHeight * scaleY
    };
}

export function useAndroidScannerOutput({ onCodesScanned, cameraViewDimensions }: ScannerOutputOptions): ScannerOutput {
    // Read when resolving a code position to get the buffer resolution the scanner is actually using
    const scannerOutputRef = useRef<CameraOutput | null>(null);

    const onBarcodeScanned = useCallback(
        (barcodes: Barcode[]) => {
            const codes: DetectedCode[] = [];
            for (const barcode of barcodes) {
                const value = barcode.rawValue;
                if (!value) {
                    continue;
                }
                codes.push({
                    value,
                    getViewBounds: () => {
                        const bufferResolution = scannerOutputRef.current?.currentResolution;
                        if (!bufferResolution || !cameraViewDimensions) {
                            return undefined;
                        }
                        return toViewBounds(barcode.boundingBox, bufferResolution, cameraViewDimensions);
                    }
                });
            }
            onCodesScanned(codes);
        },
        [onCodesScanned, cameraViewDimensions]
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
    useEffect(() => {
        scannerOutputRef.current = scannerOutput;
    }, [scannerOutput]);

    return useMemo(() => ({ outputs: [scannerOutput], constraints: [] }), [scannerOutput]);
}
