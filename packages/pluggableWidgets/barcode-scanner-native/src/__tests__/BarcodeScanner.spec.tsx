// __tests__/BarcodeScanner.spec.tsx
import { actionValue, EditableValueBuilder } from "@mendix/piw-utils-internal";
import { render } from "@testing-library/react-native";
import { View } from "react-native";
import { BarcodeScanner, Props } from "../BarcodeScanner";
import { defaultBarcodeScannerStyle } from "../ui/styles";

let mockOnBarcodeScanned: ((barcodes: Array<{ rawValue: string }>) => void) | undefined;

jest.mock("react-native-vision-camera", () => ({
    Camera: ({ children, onStarted, ...props }: any) => {
        // Call onStarted to simulate camera being ready
        if (onStarted) {
            setTimeout(() => onStarted(), 0);
        }
        return <View {...props}>{children}</View>;
    },
    useCameraDevice: () => "mock-device",
    useCameraPermission: () => ({
        hasPermission: true,
        canRequestPermission: false,
        requestPermission: jest.fn()
    })
}));

jest.mock("react-native-vision-camera-barcode-scanner", () => ({
    useBarcodeScannerOutput: (options: any) => {
        mockOnBarcodeScanned = options.onBarcodeScanned;
        return "mockScannerOutput";
    }
}));

jest.mock("../components/BarcodeMask", () => "BarcodeMask");

describe("BarcodeScanner", () => {
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

    it("renders", () => {
        const component = render(<BarcodeScanner {...defaultProps} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with mask", () => {
        const component = render(<BarcodeScanner {...defaultProps} showMask />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("renders with mask with animated line", () => {
        const component = render(<BarcodeScanner {...defaultProps} showMask showAnimatedLine />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    it("sets a value and executes the onDetect action when a new barcode is scanned", () => {
        const onDetectAction = actionValue();
        render(<BarcodeScanner {...defaultProps} onDetect={onDetectAction} />);

        // Wait for camera start and advance time past scan delay
        jest.runOnlyPendingTimers();

        // Simulate scanning (3 consecutive reads required on Android)
        mockOnBarcodeScanned?.([{ rawValue: "value" }]);
        mockOnBarcodeScanned?.([{ rawValue: "value" }]);
        mockOnBarcodeScanned?.([{ rawValue: "value" }]);
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(1);

        // Another scan
        mockOnBarcodeScanned?.([{ rawValue: "value1" }]);
        mockOnBarcodeScanned?.([{ rawValue: "value1" }]);
        mockOnBarcodeScanned?.([{ rawValue: "value1" }]);
        jest.advanceTimersByTime(2000);

        expect(defaultProps.barcode.setValue).toHaveBeenCalledWith("value1");
        expect(onDetectAction.execute).toHaveBeenCalledTimes(2);
    });

    it("preserves expected style key set", () => {
        const keys = Object.keys(defaultBarcodeScannerStyle).sort();
        expect(keys).toEqual(["container", "mask"]);
    });

    it("preserves expected mask style key set", () => {
        const keys = Object.keys(defaultBarcodeScannerStyle.mask).sort();
        expect(keys).toEqual(["backgroundColor", "color"]);
    });
});
