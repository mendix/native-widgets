import { actionValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { fireEvent, render } from "@testing-library/react-native";
import { Platform } from "react-native";
import type { Props } from "../BarcodeScanner";

// The scanner implementation is chosen when the widget module loads, so switch to iOS before requiring it
Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
const { BarcodeScanner } = require("../BarcodeScanner") as typeof import("../BarcodeScanner");

type MockScannedObject = { value?: string; viewBounds?: { x: number; y: number; width: number; height: number } };

let mockOnObjectsScanned: ((objects: MockScannedObject[]) => void) | undefined;

jest.mock("react-native-vision-camera", () => {
    const { useImperativeHandle } = jest.requireActual("react");
    const { View } = jest.requireActual("react-native");
    return {
        Camera: ({ children, onStarted, ref, ...props }: any) => {
            useImperativeHandle(ref, () => ({
                convertScannedObjectCoordinatesToViewCoordinates: (object: MockScannedObject) => {
                    if (!object.viewBounds) {
                        throw new Error("Failed to transform the Scanned Object's coordinates");
                    }
                    return { boundingBox: object.viewBounds };
                }
            }));
            // Call onStarted to simulate camera being ready
            if (onStarted) {
                setTimeout(() => onStarted(), 0);
            }
            return (
                <View testID="camera" {...props}>
                    {children}
                </View>
            );
        },
        useCameraDevice: () => "mock-device",
        useCameraPermission: () => ({
            hasPermission: true,
            canRequestPermission: false,
            requestPermission: jest.fn()
        }),
        useObjectOutput: (options: any) => {
            mockOnObjectsScanned = options.onObjectsScanned;
            return "mockObjectOutput";
        },
        useVideoOutput: () => "mockResolutionOutput",
        CommonResolutions: { FHD_16_9: { width: 1080, height: 1920 } },
        isScannedCode: (object: object) => "value" in object
    };
});

// The ML Kit scanner isn't linked on iOS, loading it there crashes the app
jest.mock("react-native-vision-camera-barcode-scanner", () => {
    throw new Error("react-native-vision-camera-barcode-scanner must not be loaded on iOS");
});

jest.mock("../components/BarcodeMask", () => "BarcodeMask");

describe("BarcodeScanner (iOS)", () => {
    let defaultProps: Props;

    beforeEach(() => {
        jest.useFakeTimers();
        defaultProps = {
            showAnimatedLine: false,
            showMask: false,
            name: "barcode-scanner-test",
            style: [],
            barcode: new EditableValueBuilder<string>().build(),
            scanDelay: 0
        };
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it("renders with Apple's object output and a 1080p 30 fps camera format", () => {
        const component = render(<BarcodeScanner {...defaultProps} />);
        const camera = component.getByTestId("camera");
        expect(camera.props.outputs).toEqual(["mockObjectOutput", "mockResolutionOutput"]);
        expect(camera.props.constraints).toEqual([{ resolutionBias: "mockResolutionOutput" }, { fps: 30 }]);
    });

    it("sets a value and executes the onDetect action on the first read", () => {
        const onDetectAction = actionValue();
        render(<BarcodeScanner {...defaultProps} onDetect={onDetectAction} />);
        jest.runOnlyPendingTimers();

        mockOnObjectsScanned?.([{ value: "value" }]);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);

        // Further scans are locked for 2 seconds
        mockOnObjectsScanned?.([{ value: "value1" }]);
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(2000);
        mockOnObjectsScanned?.([{ value: "value1" }]);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value1");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(2);
    });

    it("ignores scanned objects that are not codes or have no value", () => {
        const onDetectAction = actionValue();
        render(<BarcodeScanner {...defaultProps} onDetect={onDetectAction} />);
        jest.runOnlyPendingTimers();

        mockOnObjectsScanned?.([{} as MockScannedObject, { value: undefined }, { value: "" }]);

        expect(defaultProps.barcode.setValue).not.toHaveBeenCalled();
        expect(onDetectAction.execute).not.toHaveBeenCalled();
    });

    it("only accepts codes inside the mask, using view coordinates from the camera", () => {
        const onDetectAction = actionValue();
        const component = render(<BarcodeScanner {...defaultProps} showMask onDetect={onDetectAction} />);
        jest.runOnlyPendingTimers();
        // Default mask is 280x260, centered: x 60..340, y 270..530
        fireEvent(component.getByTestId("camera"), "layout", { nativeEvent: { layout: { width: 400, height: 800 } } });

        mockOnObjectsScanned?.([
            { value: "outside", viewBounds: { x: 0, y: 0, width: 50, height: 50 } },
            { value: "no-preview-yet" }
        ]);
        expect(onDetectAction.execute).not.toHaveBeenCalled();

        mockOnObjectsScanned?.([
            { value: "outside", viewBounds: { x: 0, y: 0, width: 50, height: 50 } },
            { value: "inside", viewBounds: { x: 150, y: 350, width: 100, height: 100 } }
        ]);
        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("inside");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);
    });
});
