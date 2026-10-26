// Android only: react-native-vision-camera-barcode-scanner (Google ML Kit) creates its native object when it is
// loaded and isn't linked on iOS, so this file must only be required behind a Platform.OS === "android" check.
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CameraOutput } from "react-native-vision-camera";
import {
    useBarcodeScannerOutput,
    type Barcode,
    type TargetBarcodeFormat
} from "react-native-vision-camera-barcode-scanner";

import { ScannerOutput, ScannerOutputOptions, Size, ViewBounds } from "./types";
import { buildDetectedCodes } from "./utils";

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
 * Uses uniform cover scaling (like CSS object-fit: cover) to match VisionCamera's preview rendering.
 */
function toViewBounds(boundingBox: Barcode["boundingBox"], bufferResolution: Size, viewSize: Size): ViewBounds {
    const frameWidth = bufferResolution.width;
    const frameHeight = bufferResolution.height;
    const { width: viewWidth, height: viewHeight } = viewSize;
    const isPortrait = viewHeight > viewWidth;

    const codeFrameWidth = boundingBox.right - boundingBox.left;
    const codeFrameHeight = boundingBox.bottom - boundingBox.top;

    // Buffer resolution reports sensor landscape dimensions (e.g. 1920x1080) even in portrait.
    // In portrait, we need to use the swapped dimensions for aspect ratio calculation.
    const effectiveFrameWidth = isPortrait ? Math.min(frameWidth, frameHeight) : frameWidth;
    const effectiveFrameHeight = isPortrait ? Math.max(frameWidth, frameHeight) : frameHeight;

    // Use uniform cover scaling: scale factor is the maximum of width/height ratios
    // This ensures the frame fills the view completely, with one dimension cropped
    const scale = Math.max(viewWidth / effectiveFrameWidth, viewHeight / effectiveFrameHeight);

    // Calculate how much the scaled frame extends beyond the view (crop region)
    const scaledFrameWidth = effectiveFrameWidth * scale;
    const scaledFrameHeight = effectiveFrameHeight * scale;
    const cropOffsetX = (scaledFrameWidth - viewWidth) / 2;
    const cropOffsetY = (scaledFrameHeight - viewHeight) / 2;

    const result = {
        x: boundingBox.left * scale - cropOffsetX,
        y: boundingBox.top * scale - cropOffsetY,
        width: codeFrameWidth * scale,
        height: codeFrameHeight * scale
    };

    return result;
}

export function useAndroidScannerOutput({ onCodesScanned, cameraViewDimensions }: ScannerOutputOptions): ScannerOutput {
    // Read when resolving a code position to get the buffer resolution the scanner is actually using
    const scannerOutputRef = useRef<CameraOutput | null>(null);

    const onBarcodeScanned = useCallback(
        (barcodes: Barcode[]) => {
            const codes = buildDetectedCodes(
                barcodes,
                barcode => barcode.rawValue,
                barcode => () => {
                    const bufferResolution = scannerOutputRef.current?.currentResolution;
                    if (!bufferResolution || !cameraViewDimensions) {
                        return undefined;
                    }
                    return toViewBounds(barcode.boundingBox, bufferResolution, cameraViewDimensions);
                }
            );
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
