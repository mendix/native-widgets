import { useCallback, useMemo } from "react";
import {
    CommonResolutions,
    isScannedCode,
    useObjectOutput,
    useVideoOutput,
    type ScannedObject,
    type ScannedObjectType
} from "react-native-vision-camera";

import { DetectedCode, ScannerOutput, ScannerOutputOptions } from "./types";

// Same code types as v4 on iOS (Apple AVFoundation): UPC-A is reported as EAN-13, and v4's "itf" was interleaved 2 of 5.
// Kept as a module constant because the object output is recreated whenever this array changes.
const OBJECT_TYPES: ScannedObjectType[] = [
    "qr",
    "aztec",
    "codabar",
    "code-39",
    "code-93",
    "code-128",
    "data-matrix",
    "ean-13",
    "ean-8",
    "upc-e",
    "pdf-417",
    "interleaved-2-of-5"
];

export function useIosScannerOutput({ onCodesScanned, cameraRef }: ScannerOutputOptions): ScannerOutput {
    const onObjectsScanned = useCallback(
        (objects: ScannedObject[]) => {
            const codes: DetectedCode[] = [];
            for (const object of objects) {
                if (!isScannedCode(object)) {
                    continue;
                }
                const value = object.value;
                if (!value) {
                    continue;
                }
                codes.push({
                    value,
                    getViewBounds: () => {
                        try {
                            // Converts from normalized camera space to view space, handling orientation and cropping natively
                            return cameraRef.current?.convertScannedObjectCoordinatesToViewCoordinates(object)
                                .boundingBox;
                        } catch {
                            // The preview isn't ready yet
                            return undefined;
                        }
                    }
                });
            }
            onCodesScanned(codes);
        },
        [onCodesScanned, cameraRef]
    );

    const objectOutput = useObjectOutput({ types: OBJECT_TYPES, onObjectsScanned });

    // Without a resolution target VisionCamera picks the first matching camera format, while v4 kept Apple's
    // default 1080p 30 fps setup that dense/patterned QR codes need. Only a created output can be used as
    // resolution bias, so a video output is added that never records.
    const resolutionOutput = useVideoOutput({ targetResolution: CommonResolutions.FHD_16_9, enableAudio: false });

    return useMemo(
        () => ({
            outputs: [objectOutput, resolutionOutput],
            constraints: [{ resolutionBias: resolutionOutput }, { fps: 30 }]
        }),
        [objectOutput, resolutionOutput]
    );
}
