import type { RefObject } from "react";
import type { CameraOutput, CameraRef, Constraint } from "react-native-vision-camera";

export type Size = { width: number; height: number };

// Rectangle in camera view space (dp)
export type ViewBounds = { x: number; y: number; width: number; height: number };

export type DetectedCode = {
    value: string;
    // Resolved lazily, only when the mask needs the code position. Undefined when it can't be determined yet.
    getViewBounds: () => ViewBounds | undefined;
};

export type ScannerOutputOptions = {
    onCodesScanned: (codes: DetectedCode[]) => void;
    cameraRef: RefObject<CameraRef | null>;
    cameraViewDimensions: Size | null;
};

export type ScannerOutput = {
    // Outputs to attach to the Camera, the first one is the scanner
    outputs: CameraOutput[];
    constraints: Constraint[];
};

export type UseScannerOutput = (options: ScannerOutputOptions) => ScannerOutput;
